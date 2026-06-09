// ============================================================
// BranchGuardianOS — pure scan assembly (ISOMORPHIC)
// ------------------------------------------------------------
// Takes a raw git snapshot + operator settings and produces the full scored
// scan result: scored branches + worktrees, the Git Cleanliness Score, ranked
// recommendations and freshness. PURE — no fs, no env, no React — so the SAME
// function runs server-side (generate.server.ts) AND client-side (the dashboard
// re-runs it when the operator changes thresholds, so settings are live).
// ============================================================

import { scoreBranch, scoreWorktree, computeRepoCleanliness, type ScoreContext } from './scoring';
import { deriveRecommendations, summarizeRecommendations, type RecommendationCounts } from './recommendations';
import { DEFAULT_SETTINGS } from './types';
import type {
  BranchGuardianSettings,
  BranchGuardianSnapshot,
  Recommendation,
  RepoCleanlinessScore,
  ScoredBranch,
  ScoredWorktree,
  SnapshotBranch,
} from './types';

export interface SnapshotFreshness {
  generatedAt: string | null;
  /** Whole hours since the snapshot was generated; null when unknown. */
  ageHours: number | null;
  /** True when older than the warn threshold (default 30 days). */
  stale: boolean;
}

/** How old the snapshot is, for the "as of" / staleness banner. PURE. */
export function snapshotFreshness(
  snapshot: BranchGuardianSnapshot,
  now: Date = new Date(),
  warnDays = 30,
): SnapshotFreshness {
  if (!snapshot.generatedAt) return { generatedAt: null, ageHours: null, stale: true };
  const then = Date.parse(snapshot.generatedAt);
  if (!Number.isFinite(then)) return { generatedAt: snapshot.generatedAt, ageHours: null, stale: true };
  const ageHours = Math.max(0, Math.floor((now.getTime() - then) / 3_600_000));
  return { generatedAt: snapshot.generatedAt, ageHours, stale: ageHours > warnDays * 24 };
}

export interface BranchGuardianScanResult {
  generatedAt: string;
  snapshotFreshness: SnapshotFreshness;
  isGitRepo: boolean;
  mainBranch: string | null;
  currentBranch: string | null;
  inProgressOp: string | null;
  cleanliness: RepoCleanlinessScore;
  branches: ScoredBranch[];
  worktrees: ScoredWorktree[];
  recommendations: Recommendation[];
  recommendationCounts: RecommendationCounts;
  remoteBranchCount: number;
  stashCount: number;
}

/** Score a snapshot into the full scan result. PURE + deterministic. */
export function scanSnapshot(
  snapshot: BranchGuardianSnapshot,
  settings: BranchGuardianSettings = DEFAULT_SETTINGS,
  now: Date = new Date(),
): BranchGuardianScanResult {
  const nowIso = now.toISOString();
  const mainBranch = settings.mainBranchOverride.trim() || snapshot.mainBranch;

  const branchByName = new Map<string, SnapshotBranch>(snapshot.branches.map((b) => [b.name, b]));
  const ctx: ScoreContext = { now: nowIso, mainBranch, settings, branchByName, worktrees: snapshot.worktrees };

  const branches = snapshot.branches.map((b) => scoreBranch(b, ctx));
  const worktrees = snapshot.worktrees.map((w) => scoreWorktree(w, ctx));
  const cleanliness = computeRepoCleanliness(branches, worktrees, snapshot);
  const recommendations = deriveRecommendations(branches, worktrees, { snapshot, settings });

  return {
    generatedAt: nowIso,
    snapshotFreshness: snapshotFreshness(snapshot, now),
    isGitRepo: snapshot.git,
    mainBranch,
    currentBranch: snapshot.currentBranch,
    inProgressOp: snapshot.inProgressOp,
    cleanliness,
    branches,
    worktrees,
    recommendations,
    recommendationCounts: summarizeRecommendations(recommendations),
    remoteBranchCount: snapshot.remoteBranchCount,
    stashCount: snapshot.stashCount,
  };
}
