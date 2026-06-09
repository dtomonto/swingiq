// ============================================================
// BranchGuardianOS — health scoring engine (PURE / deterministic)
// ------------------------------------------------------------
// Turns the raw git snapshot into scored branches, scored worktrees and an
// overall Git Cleanliness Score. PURE: no fs, no env, no React — feed it
// snapshot records + a scoring context, get transparent 0–100 scores with a
// signed factor breakdown so every number traces to a real signal.
//
// Scores are intentionally "lower = needs attention" so the clutter we want the
// operator to clean up (merged-but-undeleted, stale, abandoned, risky) sinks to
// the top of the recommendations.
// ============================================================

import type {
  BranchType,
  BranchStatus,
  HealthBand,
  HealthFactor,
  HealthScore,
  RepoCleanlinessScore,
  RiskLevel,
  ScoredBranch,
  ScoredWorktree,
  SnapshotBranch,
  SnapshotWorktree,
  BranchGuardianSnapshot,
  BranchGuardianSettings,
} from './types';
import { validateBranchName } from './naming';
import { isProtectedBranch } from './protected';

export interface ScoreContext {
  now: string;
  mainBranch: string | null;
  settings: BranchGuardianSettings;
  /** Local branch names present in the snapshot (for "branch missing" checks). */
  branchByName: Map<string, SnapshotBranch>;
  /** Snapshot worktrees (so a branch can find its own working-tree status). */
  worktrees: SnapshotWorktree[];
}

const DAY_MS = 86_400_000;

/** Whole days between an ISO date and now; null when the date is unreadable. */
export function daysSince(iso: string | null, now: string): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  const ref = Date.parse(now);
  if (!Number.isFinite(then) || !Number.isFinite(ref)) return null;
  return Math.max(0, Math.floor((ref - then) / DAY_MS));
}

/** Health band from a 0–100 value (shared by branches, worktrees, repo). */
export function healthBand(value: number): HealthBand {
  if (value >= 90) return 'excellent';
  if (value >= 70) return 'healthy';
  if (value >= 50) return 'attention';
  if (value >= 25) return 'stale';
  return 'high_risk';
}

/** Clamp + assemble a HealthScore from a base of 100 minus factors. */
function assemble(factors: HealthFactor[]): HealthScore {
  const value = Math.max(0, Math.min(100, 100 + factors.reduce((s, f) => s + f.delta, 0)));
  return { value, band: healthBand(value), factors };
}

// ── Branch scoring ───────────────────────────────────────────────────────────

/** Headline status (highest-precedence single label) for a branch. */
function branchStatus(
  b: SnapshotBranch,
  type: BranchType,
  isProtected: boolean,
  ageDays: number | null,
  ctx: ScoreContext,
): BranchStatus {
  if (isProtected || type === 'main') return b.isCurrent ? 'current' : 'protected';
  if (b.isCurrent) return 'current';
  if (b.merged) return 'merged';
  const { staleBranchDays, abandonedBranchDays, behindMainThreshold } = ctx.settings;
  if (ageDays !== null && ageDays >= abandonedBranchDays) return 'abandoned';
  if ((b.behindMain ?? 0) >= behindMainThreshold && (b.aheadOfMain ?? 0) > 0) return 'diverged';
  if (ageDays !== null && ageDays >= staleBranchDays) return 'stale';
  return 'active';
}

export function scoreBranch(b: SnapshotBranch, ctx: ScoreContext): ScoredBranch {
  const type = validateBranchName(b.name, ctx.mainBranch).type;
  const naming = validateBranchName(b.name, ctx.mainBranch);
  const isProtected = isProtectedBranch(b.name, ctx.mainBranch, ctx.settings.protectedPatterns);
  const ageDays = daysSince(b.lastCommitISO, ctx.now);
  const status = branchStatus(b, type, isProtected, ageDays, ctx);
  const { staleBranchDays, abandonedBranchDays, behindMainThreshold } = ctx.settings;

  const factors: HealthFactor[] = [];

  // Freshness.
  if (ageDays === null) {
    factors.push({ label: 'Last-commit date unreadable', delta: -5 });
  } else if (ageDays > abandonedBranchDays) {
    factors.push({ label: `Untouched ${ageDays}d (abandoned threshold ${abandonedBranchDays}d)`, delta: -35 });
  } else if (ageDays > staleBranchDays) {
    factors.push({ label: `Untouched ${ageDays}d (stale threshold ${staleBranchDays}d)`, delta: -18 });
  } else if (ageDays > 7) {
    factors.push({ label: `Last commit ${ageDays}d ago`, delta: -4 });
  }

  // Merged-but-undeleted clutter (never for protected/main).
  if (b.merged && !isProtected && type !== 'main' && !b.isCurrent) {
    factors.push({ label: 'Already merged into main — clutter until deleted', delta: -15 });
  }

  // Behind main / divergence.
  const behind = b.behindMain ?? 0;
  const ahead = b.aheadOfMain ?? 0;
  if (!isProtected && type !== 'main') {
    if (behind > behindMainThreshold * 2) {
      factors.push({ label: `${behind} commits behind main — heavy rebase`, delta: -22 });
    } else if (behind > behindMainThreshold) {
      factors.push({ label: `${behind} commits behind main`, delta: -12 });
    }
    if (behind > behindMainThreshold && ahead > 0) {
      factors.push({ label: 'Diverged from main (ahead & far behind)', delta: -8 });
    }
  }

  // Publishing / loss risk.
  if (!isProtected && type !== 'main') {
    if (!b.upstream && ahead > 0) {
      factors.push({ label: 'Unpublished work (no upstream remote)', delta: -10 });
    } else if (b.upstreamGone) {
      factors.push({ label: 'Upstream was deleted on the remote ([gone])', delta: -8 });
    }
  }

  // Naming convention (advisory; never for main).
  if (type !== 'main' && !naming.conforms) {
    factors.push({ label: 'Name does not follow the convention', delta: -8 });
  }

  // Dirty / risky working tree (when this branch has a worktree in the snapshot).
  const ownWt = b.worktreePath ? findWorktreeForBranch(b.name, ctx) : null;
  if (ownWt?.dirty) {
    if (ownWt.dirty.untrackedRisky.length > 0) {
      factors.push({ label: `${ownWt.dirty.untrackedRisky.length} risky untracked file(s) in its worktree`, delta: -25 });
    }
    if (ownWt.dirty.modified > 0) {
      factors.push({ label: `${ownWt.dirty.modified} uncommitted change(s) in its worktree`, delta: -8 });
    }
  }

  const health = assemble(factors);
  const risk = branchRisk(status, health, ownWt, isProtected, ageDays, ctx);

  return {
    ...b,
    type,
    status,
    isProtected,
    ageDays,
    conformsToNaming: naming.conforms,
    namingReason: naming.reason,
    risk,
    health,
    suggestedAction: branchAction(status, b, isProtected, type, ownWt, naming.conforms),
  };
}

function branchRisk(
  status: BranchStatus,
  health: HealthScore,
  ownWt: SnapshotWorktree | null,
  isProtected: boolean,
  ageDays: number | null,
  ctx: ScoreContext,
): RiskLevel {
  if (isProtected) return 'low';
  if (ownWt?.dirty && ownWt.dirty.untrackedRisky.length > 0) return 'high';
  if (status === 'abandoned' && (ownWt?.dirty?.modified ?? 0) > 0) return 'high';
  if (health.band === 'high_risk') return 'high';
  if (status === 'stale' || status === 'abandoned' || status === 'diverged') return 'medium';
  if (ageDays !== null && ageDays >= ctx.settings.staleBranchDays) return 'medium';
  if (health.band === 'stale' || health.band === 'attention') return 'medium';
  return 'low';
}

function branchAction(
  status: BranchStatus,
  b: SnapshotBranch,
  isProtected: boolean,
  type: BranchType,
  ownWt: SnapshotWorktree | null,
  conforms: boolean,
): string {
  if (isProtected || type === 'main') return 'Protected — keep.';
  if (ownWt?.dirty && (ownWt.dirty.modified > 0 || ownWt.dirty.untrackedRisky.length > 0)) {
    return 'Review/commit working-tree changes before any cleanup.';
  }
  if (b.merged) return 'Merged into main — safe to delete after confirmation.';
  if (status === 'abandoned') return 'Looks abandoned — back up, then archive or delete.';
  if (status === 'diverged') return 'Rebase onto main before continuing.';
  if (status === 'stale') return 'Stale — finish, publish, or archive.';
  if (!b.upstream && (b.aheadOfMain ?? 0) > 0) return 'Publish to a remote or document the work.';
  if (!conforms) return 'Rename to match the branch convention.';
  return 'Active — no action needed.';
}

/** Look up the snapshot worktree a branch is checked out in (if any). */
function findWorktreeForBranch(name: string, ctx: ScoreContext): SnapshotWorktree | null {
  // The branch record only stores worktreePath; the worktree records carry the
  // dirty status. We re-find by branch name via the context snapshot worktrees.
  return ctx.worktrees?.find((w) => w.branch === name) ?? null;
}

// ── Worktree scoring ─────────────────────────────────────────────────────────

export function scoreWorktree(w: SnapshotWorktree, ctx: ScoreContext): ScoredWorktree {
  const branchRec = w.branch ? ctx.branchByName.get(w.branch) ?? null : null;
  const ageDays = daysSince(branchRec?.lastCommitISO ?? null, ctx.now);
  const branchMissing = Boolean(w.branch) && !ctx.branchByName.has(w.branch as string);
  const { staleWorktreeDays } = ctx.settings;

  const factors: HealthFactor[] = [];

  if (w.missingPath) factors.push({ label: 'Working-tree directory no longer exists on disk', delta: -60 });
  if (w.prunable) factors.push({ label: 'git reports this worktree as prunable (stale admin files)', delta: -40 });
  if (branchMissing) factors.push({ label: `Checked-out branch "${w.branch}" is gone`, delta: -25 });
  if (!w.branch && !w.isPrimary) factors.push({ label: 'Detached HEAD (no branch)', delta: -15 });

  if (w.dirty) {
    if (w.dirty.untrackedRisky.length > 0) {
      factors.push({ label: `${w.dirty.untrackedRisky.length} risky untracked file(s)`, delta: -30 });
    }
    if (w.dirty.modified > 0) factors.push({ label: `${w.dirty.modified} uncommitted change(s)`, delta: -10 });
  }

  if (!w.isPrimary && !w.isCurrent && ageDays !== null) {
    if (ageDays > staleWorktreeDays * 3) factors.push({ label: `Idle ${ageDays}d`, delta: -20 });
    else if (ageDays > staleWorktreeDays) factors.push({ label: `Idle ${ageDays}d (review threshold ${staleWorktreeDays}d)`, delta: -10 });
  }

  const health = assemble(factors);
  const risk: RiskLevel =
    w.missingPath || w.prunable || (w.dirty?.untrackedRisky.length ?? 0) > 0
      ? 'high'
      : branchMissing || (w.dirty?.modified ?? 0) > 0 || health.band === 'stale' || health.band === 'attention'
        ? 'medium'
        : 'low';

  return {
    ...w,
    ageDays,
    branchMissing,
    risk,
    health,
    suggestedAction: worktreeAction(w, branchMissing, ageDays, ctx),
  };
}

function worktreeAction(
  w: SnapshotWorktree,
  branchMissing: boolean,
  ageDays: number | null,
  ctx: ScoreContext,
): string {
  if (w.isPrimary) return 'Primary worktree — keep.';
  if (w.missingPath || w.prunable) return 'Stale metadata — prune after review (dry-run first).';
  if (w.dirty && (w.dirty.modified > 0 || w.dirty.untrackedRisky.length > 0)) {
    return 'Has uncommitted work — commit/stash before removing.';
  }
  if (branchMissing) return 'Branch is gone — review, then remove the worktree.';
  if (ageDays !== null && ageDays > ctx.settings.staleWorktreeDays) return 'Idle — archive notes, then consider removing.';
  return 'Active — no action needed.';
}

// ── Repo cleanliness roll-up ─────────────────────────────────────────────────

export function computeRepoCleanliness(
  branches: ScoredBranch[],
  worktrees: ScoredWorktree[],
  snapshot: BranchGuardianSnapshot,
): RepoCleanlinessScore {
  const factors: HealthFactor[] = [];

  const nonProtected = branches.filter((b) => !b.isProtected && b.type !== 'main');
  const branchAvg = avg(nonProtected.map((b) => b.health.value), 100);
  const worktreeAvg = avg(worktrees.map((w) => w.health.value), 100);

  let value = Math.round(0.6 * branchAvg + 0.4 * worktreeAvg);
  factors.push({ label: `Branch hygiene avg ${Math.round(branchAvg)} (${nonProtected.length} working branches)`, delta: 0 });
  factors.push({ label: `Worktree hygiene avg ${Math.round(worktreeAvg)} (${worktrees.length} worktrees)`, delta: 0 });

  if (snapshot.inProgressOp) {
    value -= 5;
    factors.push({ label: `An in-progress ${snapshot.inProgressOp} is open`, delta: -5 });
  }
  const riskyUntracked = countRiskyUntracked(worktrees, snapshot);
  if (riskyUntracked > 0) {
    value -= 10;
    factors.push({ label: `${riskyUntracked} risky untracked file(s) across worktrees`, delta: -10 });
  }
  if (snapshot.stashCount > 10) {
    value -= 5;
    factors.push({ label: `${snapshot.stashCount} stashes piling up`, delta: -5 });
  }
  value = Math.max(0, Math.min(100, value));

  const mergedEligible = branches.filter((b) => b.merged && !b.isProtected && b.type !== 'main' && !b.isCurrent).length;
  const staleBranches = branches.filter((b) => b.status === 'stale' || b.status === 'abandoned').length;
  const activeBranches = branches.filter((b) => b.status === 'active' || b.status === 'current').length;
  const worktreesNeedingReview = worktrees.filter((w) => !w.isPrimary && (w.risk !== 'low' || w.missingPath || w.prunable)).length;
  const highRiskBranches = branches.filter((b) => b.risk === 'high').length;

  return {
    value,
    band: healthBand(value),
    factors,
    counts: {
      branches: branches.length,
      activeBranches,
      staleBranches,
      mergedEligible,
      worktrees: worktrees.length,
      worktreesNeedingReview,
      highRiskBranches,
      riskyUntracked,
      stashes: snapshot.stashCount,
    },
  };
}

function countRiskyUntracked(worktrees: ScoredWorktree[], snapshot: BranchGuardianSnapshot): number {
  let n = worktrees.reduce((s, w) => s + (w.dirty?.untrackedRisky.length ?? 0), 0);
  // currentDirty mirrors the primary worktree; avoid double counting if a
  // primary worktree record already includes it.
  if (!worktrees.some((w) => w.isPrimary) && snapshot.currentDirty) {
    n += snapshot.currentDirty.untrackedRisky.length;
  }
  return n;
}

function avg(nums: number[], fallback: number): number {
  if (nums.length === 0) return fallback;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
