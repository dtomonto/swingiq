// ============================================================
// BranchGuardianOS — recommendation engine (PURE / deterministic)
// ------------------------------------------------------------
// Turns scored branches + worktrees + the snapshot into a ranked list of
// NON-DESTRUCTIVE cleanup recommendations. Every recommendation explains the
// reason, cites grounded evidence, leads with recovery/backup guidance, and
// carries copy-paste command text labelled by safety. Destructive actions are
// marked approvalRequired so the UI gates them behind an explicit confirm —
// nothing is ever executed by the app.
//
// PURE: feed it scored entities, get the same recommendations + ids every time
// (the basis for owner state — reviewed/snoozed/approved — surviving re-scans).
// ============================================================

import type {
  BranchGuardianSnapshot,
  BranchGuardianSettings,
  Recommendation,
  RecSeverity,
  ScoredBranch,
  ScoredWorktree,
} from './types';
import { REC_SEVERITY_RANK } from './types';
import {
  mergedCleanupCommands,
  unmergedCleanupCommands,
  rebaseCommands,
  publishCommands,
  remotePruneCommands,
  worktreeCleanupCommands,
  stashWorkCommands,
  stashInspectCommands,
  inspectionCommands,
} from './commands';

const SECURITY_LINK = { label: 'Review in securityOS', href: '/admin/security-os' };
const GUARDIAN_LINK = { label: 'BranchGuardianOS', href: '/admin/branch-guardian' };

const SEVERITY_BASE: Record<RecSeverity, number> = {
  critical: 100,
  high: 80,
  medium: 55,
  low: 30,
  info: 15,
};

const RECOVERY_GENERIC = [
  'Confirm the branch is not protected and not tied to active work.',
  'If unsure, make a backup branch first: git branch backup/<name> <name>.',
  'Or archive a patch: git diff main...<name> > <name>-backup.patch.',
];

export interface DeriveContext {
  snapshot: BranchGuardianSnapshot;
  settings: BranchGuardianSettings;
}

export function deriveRecommendations(
  branches: ScoredBranch[],
  worktrees: ScoredWorktree[],
  ctx: DeriveContext,
): Recommendation[] {
  const out: Recommendation[] = [];
  const { snapshot, settings } = ctx;

  // ── In-progress operation (top priority — finish or abort) ────────────────
  if (snapshot.inProgressOp) {
    out.push({
      id: 'op:in-progress',
      kind: 'in_progress_op',
      title: `An in-progress ${snapshot.inProgressOp} is open — finish or abort it`,
      severity: 'high',
      priority: SEVERITY_BASE.high + 10,
      safety: 'cautionary',
      approvalRequired: false,
      target: { type: 'repo', name: snapshot.currentBranch ?? 'repo' },
      reason: `Git is mid-${snapshot.inProgressOp}. Leaving it half-done risks confusing commits or accidental loss on the next switch.`,
      evidence: [`git reports an in-progress ${snapshot.inProgressOp} on ${snapshot.currentBranch ?? 'the current branch'}`],
      recovery: ['Inspect with git status before deciding.', 'You can usually abort safely (e.g. git rebase --abort / git merge --abort / git cherry-pick --abort).'],
      commands: [
        { label: 'See where you are', command: 'git status', safety: 'read-only' },
        { label: `Abort the ${snapshot.inProgressOp}`, command: `git ${snapshot.inProgressOp} --abort`, safety: 'caution', note: 'Returns to the pre-operation state.' },
      ],
      relatedLinks: [GUARDIAN_LINK],
    });
  }

  // ── Per-branch rules ──────────────────────────────────────────────────────
  for (const b of branches) {
    if (b.isProtected || b.type === 'main') continue;

    const hasOwnWork = b.hasWorktree && (() => {
      const wt = worktrees.find((w) => w.branch === b.name);
      return Boolean(wt?.dirty && (wt.dirty.modified > 0 || wt.dirty.untrackedRisky.length > 0));
    })();

    // Merged → eligible for safe deletion.
    if (b.merged && !b.isCurrent) {
      out.push({
        id: `branch:merged:${b.name}`,
        kind: 'merged_cleanup',
        title: `"${b.name}" is merged into ${snapshot.mainBranch} — safe to delete`,
        severity: 'low',
        priority: SEVERITY_BASE.low + 8,
        safety: 'safe',
        approvalRequired: true,
        target: { type: 'branch', name: b.name },
        reason: 'The branch is fully merged into main, so deleting it loses no work — it just reduces clutter.',
        evidence: [
          `Appears in "git branch --merged ${snapshot.mainBranch}"`,
          b.lastCommitISO ? `Last commit ${b.ageDays}d ago` : 'Last-commit date unreadable',
        ],
        recovery: ['Re-confirm merged status first (command below). git branch -d refuses if not fully merged.'],
        commands: mergedCleanupCommands(b.name),
        relatedLinks: [GUARDIAN_LINK],
      });
      continue; // merged supersedes stale/diverged for the same branch
    }

    // Working-tree changes block cleanup → surface first.
    if (hasOwnWork) {
      out.push({
        id: `branch:dirty-work:${b.name}`,
        kind: 'dirty_worktree',
        title: `"${b.name}" has uncommitted work — review before switching priorities`,
        severity: b.ageDays !== null && b.ageDays >= settings.staleBranchDays ? 'medium' : 'low',
        priority: SEVERITY_BASE.medium,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'branch', name: b.name },
        reason: 'Its worktree has changes that are not committed. Switching or cleaning up now could lose them.',
        evidence: [`Uncommitted changes in ${b.worktreePath ?? 'its worktree'}`, b.ageDays !== null ? `Untouched ${b.ageDays}d` : 'age unknown'],
        recovery: ['Commit or stash the work before any cleanup.'],
        commands: stashWorkCommands(`backup before cleanup of ${b.name}`),
        relatedLinks: [GUARDIAN_LINK],
      });
    }

    // Abandoned (older than abandoned threshold).
    if (b.status === 'abandoned') {
      const risky = hasOwnWork;
      out.push({
        id: `branch:abandoned:${b.name}`,
        kind: 'abandoned_branch',
        title: `"${b.name}" looks abandoned — back up, then archive or delete`,
        severity: risky ? 'high' : 'medium',
        priority: SEVERITY_BASE[risky ? 'high' : 'medium'],
        safety: risky ? 'high_risk' : 'cautionary',
        approvalRequired: true,
        target: { type: 'branch', name: b.name },
        reason: `No commits for ${b.ageDays}d and not merged. It may hold an unfinished idea worth archiving before cleanup.`,
        evidence: [
          `Untouched ${b.ageDays}d (abandoned threshold ${settings.abandonedBranchDays}d)`,
          b.upstream ? `Published to ${b.upstream}` : 'No upstream — work exists only locally',
          `${b.aheadOfMain ?? '?'} ahead / ${b.behindMain ?? '?'} behind main`,
        ],
        recovery: RECOVERY_GENERIC,
        commands: unmergedCleanupCommands(b.name),
        relatedLinks: [GUARDIAN_LINK],
      });
      continue;
    }

    // Stale (older than stale threshold, not abandoned).
    if (b.status === 'stale' && (settings.includeExperimental || b.type !== 'experiment')) {
      out.push({
        id: `branch:stale:${b.name}`,
        kind: 'stale_branch',
        title: `"${b.name}" is stale — finish, publish, or archive`,
        severity: 'low',
        priority: SEVERITY_BASE.low + 3,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'branch', name: b.name },
        reason: `No activity for ${b.ageDays}d. Stale branches accumulate merge debt and obscure what's actually in flight.`,
        evidence: [`Untouched ${b.ageDays}d (stale threshold ${settings.staleBranchDays}d)`, `${b.aheadOfMain ?? '?'} ahead / ${b.behindMain ?? '?'} behind main`],
        recovery: ['Review with the commands below before deciding to finish or archive.'],
        commands: inspectionCommands(b.name),
        relatedLinks: [GUARDIAN_LINK],
      });
    }

    // Diverged / far behind main.
    if (b.status === 'diverged' || (b.behindMain ?? 0) > settings.behindMainThreshold) {
      out.push({
        id: `branch:behind:${b.name}`,
        kind: 'diverged_branch',
        title: `"${b.name}" is ${b.behindMain} commits behind main — rebase before continuing`,
        severity: 'medium',
        priority: SEVERITY_BASE.medium - 5,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'branch', name: b.name },
        reason: 'A branch far behind main accumulates conflict risk; rebasing now is cheaper than at merge time.',
        evidence: [`${b.behindMain} behind / ${b.aheadOfMain} ahead of main`],
        recovery: ['Back up before rebasing (rebase rewrites history).'],
        commands: rebaseCommands(b.name),
        relatedLinks: [GUARDIAN_LINK],
      });
    }

    // No upstream but has work → publishing/loss risk.
    // (abandoned branches already `continue`d above, so they're excluded here.)
    if (!b.upstream && (b.aheadOfMain ?? 0) > 0) {
      out.push({
        id: `branch:no-upstream:${b.name}`,
        kind: 'no_upstream',
        title: `"${b.name}" has no upstream remote — publish or document it`,
        severity: 'low',
        priority: SEVERITY_BASE.low,
        safety: 'safe',
        approvalRequired: false,
        target: { type: 'branch', name: b.name },
        reason: 'Unpublished work exists only on this machine — a disk failure would lose it.',
        evidence: [`${b.aheadOfMain} commit(s) ahead of main, no upstream set`],
        recovery: ['Publishing is non-destructive; it just creates the remote branch.'],
        commands: publishCommands(b.name),
        relatedLinks: [GUARDIAN_LINK],
      });
    } else if (b.upstreamGone) {
      out.push({
        id: `branch:upstream-gone:${b.name}`,
        kind: 'upstream_gone',
        title: `"${b.name}"'s upstream was deleted on the remote`,
        severity: 'low',
        priority: SEVERITY_BASE.low - 3,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'branch', name: b.name },
        reason: 'The remote branch this tracked is gone (often after a merge). Confirm whether the local copy is still needed.',
        evidence: ['Upstream tracking shows [gone]'],
        recovery: ['Pruning only removes the stale remote-tracking ref, not your local branch.'],
        commands: remotePruneCommands(),
        relatedLinks: [GUARDIAN_LINK],
      });
    }

    // Naming convention.
    if (!b.conformsToNaming) {
      out.push({
        id: `branch:naming:${b.name}`,
        kind: 'naming_violation',
        title: `"${b.name}" does not match the branch naming convention`,
        severity: 'info',
        priority: SEVERITY_BASE.info,
        safety: 'safe',
        approvalRequired: false,
        target: { type: 'branch', name: b.name },
        reason: b.namingReason,
        evidence: [b.namingReason],
        recovery: ['Renaming is safe and local until you re-push.'],
        commands: [
          { label: 'Rename (example)', command: `git branch -m ${b.name} feature/<scope>-<description>`, safety: 'caution', note: 'Adjust the target name to fit the work.' },
        ],
        relatedLinks: [GUARDIAN_LINK],
      });
    }
  }

  // ── Risky untracked files (feeds securityOS too) ──────────────────────────
  const riskyByWorktree = worktrees
    .map((w) => ({ w, risky: w.dirty?.untrackedRisky ?? [] }))
    .filter((x) => x.risky.length > 0);
  for (const { w, risky } of riskyByWorktree) {
    out.push({
      id: `wt:risky-untracked:${w.path}`,
      kind: 'risky_untracked',
      title: `Risky untracked file(s) in worktree ${w.path} — review before cleanup`,
      severity: 'high',
      priority: SEVERITY_BASE.high + 5,
      safety: 'high_risk',
      approvalRequired: false,
      target: { type: 'worktree', name: w.path },
      reason: 'Untracked files that look like secrets (.env, keys, dumps, logs) could be committed by accident or leak. They are shown by path only — never by content.',
      evidence: risky.map((r) => `${r.kind}: ${r.path}`),
      recovery: ['Confirm these belong in .gitignore. Never commit secret material; rotate anything that may have leaked.'],
      commands: [
        { label: 'See untracked files', command: `git -C ${w.path === '.' ? '.' : w.path} status --short`, safety: 'read-only' },
        { label: 'Ignore a path', command: 'echo "<path>" >> .gitignore', safety: 'caution', note: 'Adjust <path>; then commit the .gitignore change.' },
      ],
      relatedLinks: [SECURITY_LINK, GUARDIAN_LINK],
    });
  }

  // ── Worktree rules ────────────────────────────────────────────────────────
  for (const w of worktrees) {
    if (w.isPrimary) continue;

    if (w.missingPath || w.prunable) {
      out.push({
        id: `wt:prunable:${w.path}`,
        kind: w.missingPath ? 'missing_worktree' : 'prunable_worktree',
        title: w.missingPath
          ? `Worktree ${w.path} points to a missing directory`
          : `Worktree ${w.path} is prunable (stale admin files)`,
        severity: 'medium',
        priority: SEVERITY_BASE.medium - 8,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'worktree', name: w.path },
        reason: w.missingPath
          ? 'The working-tree directory no longer exists, but git still tracks it. Pruning clears only the bookkeeping.'
          : 'git flagged this worktree as prunable. Pruning removes stale admin files, not your branches.',
        evidence: [w.missingPath ? 'Directory does not exist on disk' : 'git worktree list reports prunable', `Branch: ${w.branch ?? 'detached'}`],
        recovery: ['git worktree prune is safe for already-missing worktrees; dry-run first.'],
        commands: worktreeCleanupCommands(w.path, true),
        relatedLinks: [GUARDIAN_LINK],
      });
      continue;
    }

    const idle = w.ageDays !== null && w.ageDays > ctxStaleWt(settings);
    const dirty = w.dirty && (w.dirty.modified > 0 || w.dirty.untrackedRisky.length > 0);
    if (w.branchMissing) {
      out.push({
        id: `wt:branch-gone:${w.path}`,
        kind: 'missing_worktree',
        title: `Worktree ${w.path} points to a branch that no longer exists`,
        severity: 'medium',
        priority: SEVERITY_BASE.medium - 6,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'worktree', name: w.path },
        reason: 'The checked-out branch is gone from the snapshot. Review whether any local work remains, then remove the worktree.',
        evidence: [`Branch "${w.branch}" not found among local branches`],
        recovery: ['Check the working tree for uncommitted work before removing.'],
        commands: worktreeCleanupCommands(w.path, false),
        relatedLinks: [GUARDIAN_LINK],
      });
    } else if (idle && !dirty) {
      out.push({
        id: `wt:idle:${w.path}`,
        kind: 'dirty_worktree',
        title: `Worktree ${w.path} has been idle ${w.ageDays}d — consider archiving`,
        severity: 'low',
        priority: SEVERITY_BASE.low - 2,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'worktree', name: w.path },
        reason: 'An idle experiment worktree adds confusion. Archive any notes, then consider removing it.',
        evidence: [`Idle ${w.ageDays}d (review threshold ${ctxStaleWt(settings)}d)`, `Branch: ${w.branch ?? 'detached'}`],
        recovery: ['Confirm it is clean before removing.'],
        commands: worktreeCleanupCommands(w.path, false),
        relatedLinks: [GUARDIAN_LINK],
      });
    } else if (dirty) {
      out.push({
        id: `wt:dirty:${w.path}`,
        kind: 'dirty_worktree',
        title: `Worktree ${w.path} has uncommitted changes`,
        severity: 'medium',
        priority: SEVERITY_BASE.medium - 10,
        safety: 'cautionary',
        approvalRequired: false,
        target: { type: 'worktree', name: w.path },
        reason: 'Uncommitted changes in a secondary worktree are easy to forget and lose.',
        evidence: [`${w.dirty?.modified ?? 0} uncommitted change(s)`, `Branch: ${w.branch ?? 'detached'}`],
        recovery: ['Commit or stash before removing the worktree.'],
        commands: stashWorkCommands(`backup ${w.path}`),
        relatedLinks: [GUARDIAN_LINK],
      });
    }
  }

  // ── Duplicate / overlapping worktrees (conservative heuristic) ────────────
  const dup = findOverlappingWorktrees(worktrees);
  if (dup) {
    out.push({
      id: `wt:overlap:${dup.a}+${dup.b}`,
      kind: 'dirty_worktree',
      title: 'Multiple worktrees appear to cover similar work — consider consolidating',
      severity: 'info',
      priority: SEVERITY_BASE.info,
      safety: 'safe',
      approvalRequired: false,
      target: { type: 'worktree', name: `${dup.a} / ${dup.b}` },
      reason: 'Two active worktrees share several name tokens, which often means duplicated or competing effort.',
      evidence: [`${dup.a} and ${dup.b} share: ${dup.shared.join(', ')}`],
      recovery: ['Decide which worktree is canonical; archive the other after backing up.'],
      commands: [{ label: 'List all worktrees', command: 'git worktree list', safety: 'read-only' }],
      relatedLinks: [GUARDIAN_LINK],
    });
  }

  // ── Stash backlog ─────────────────────────────────────────────────────────
  if (snapshot.stashCount > 8) {
    out.push({
      id: 'repo:stash-backlog',
      kind: 'stash_backlog',
      title: `${snapshot.stashCount} stashes are piling up — review and clear`,
      severity: 'low',
      priority: SEVERITY_BASE.low - 5,
      safety: 'cautionary',
      approvalRequired: false,
      target: { type: 'stash', name: 'stash list' },
      reason: 'A large stash backlog hides work and grows the repo. Review and either apply or drop each.',
      evidence: [`${snapshot.stashCount} entries in git stash list`],
      recovery: ['Inspect each stash before dropping; dropping is not recoverable.'],
      commands: stashInspectCommands(),
      relatedLinks: [GUARDIAN_LINK],
    });
  }

  // ── Remote pruning (monitor) ──────────────────────────────────────────────
  const goneCount = branches.filter((b) => b.upstreamGone).length;
  if (goneCount >= 2) {
    out.push({
      id: 'repo:remote-prune',
      kind: 'upstream_gone',
      title: `${goneCount} branches track deleted remotes — prune stale refs`,
      severity: 'info',
      priority: SEVERITY_BASE.info - 2,
      safety: 'cautionary',
      approvalRequired: false,
      target: { type: 'repo', name: 'origin' },
      reason: 'Several local branches track upstreams that no longer exist. Pruning tidies the remote-tracking refs.',
      evidence: [`${goneCount} branches with [gone] upstreams`],
      recovery: ['Pruning never deletes local branches — only stale remote-tracking refs.'],
      commands: remotePruneCommands(),
      relatedLinks: [GUARDIAN_LINK],
    });
  }

  return rankRecommendations(out);
}

function ctxStaleWt(settings: BranchGuardianSettings): number {
  return settings.staleWorktreeDays;
}

/** Sort by priority desc, then severity, then id (stable + deterministic). */
export function rankRecommendations(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort(
    (a, b) =>
      b.priority - a.priority ||
      REC_SEVERITY_RANK[a.severity] - REC_SEVERITY_RANK[b.severity] ||
      a.id.localeCompare(b.id),
  );
}

export interface RecommendationCounts {
  total: number;
  bySeverity: Record<RecSeverity, number>;
  destructive: number;
  doToday: number;
}

export function summarizeRecommendations(recs: Recommendation[]): RecommendationCounts {
  const bySeverity: Record<RecSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  let destructive = 0;
  let doToday = 0;
  for (const r of recs) {
    bySeverity[r.severity] += 1;
    if (r.approvalRequired || r.commands.some((c) => c.safety === 'destructive')) destructive += 1;
    if (r.severity === 'critical' || r.severity === 'high') doToday += 1;
  }
  return { total: recs.length, bySeverity, destructive, doToday };
}

// ── helpers ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set(['feature', 'fix', 'chore', 'hotfix', 'experiment', 'release', 'docs', 'refactor', 'agent', 'wt', 'os', 'the', 'and']);

/** Find the first pair of non-primary worktrees sharing ≥2 meaningful tokens. */
function findOverlappingWorktrees(
  worktrees: ScoredWorktree[],
): { a: string; b: string; shared: string[] } | null {
  const items = worktrees
    .filter((w) => !w.isPrimary && w.branch)
    .map((w) => ({ path: w.path, tokens: tokenize(w.branch as string) }));
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const shared = items[i].tokens.filter((t) => items[j].tokens.includes(t));
      if (shared.length >= 2) return { a: items[i].path, b: items[j].path, shared };
    }
  }
  return null;
}

function tokenize(name: string): string[] {
  return Array.from(
    new Set(
      name
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3 && !STOPWORDS.has(t)),
    ),
  );
}
