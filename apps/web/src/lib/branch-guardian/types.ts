// ============================================================
// BranchGuardianOS — data model (PURE, isomorphic)
// ------------------------------------------------------------
// The enums + shapes shared by the snapshot reader, the scoring engine, the
// recommendation deriver, the safe-command generator, the server generator and
// the admin UI. This module is PURE — no node:fs, no env, no React — so it is
// fully unit-testable and safe to import from both server and client.
//
// Design notes (mirrors lib/security-os + lib/command-center):
//   • The git inventory is produced OUT-OF-BAND by scripts/scan-branches.mjs
//     and committed as JSON. The app NEVER shells out to git (production has no
//     .git and a read-only FS). The engine reads that snapshot and degrades
//     honestly when a value is missing (null = "couldn't read", never faked).
//   • Scores + recommendations are produced DETERMINISTICALLY from the
//     snapshot, so the same input yields the same ids — the basis for owner
//     state (reviewed / snoozed / cleanup-approved) surviving re-scans.
//   • NOTHING in this module (or anywhere in the app) executes git. Cleanup is
//     emitted as copy-paste COMMAND TEXT with a safety label; the operator runs
//     it themselves after an explicit approval step.
// ============================================================

// ── Raw snapshot shapes (must match scripts/scan-branches.mjs output) ────────

export interface SnapshotDirty {
  modified: number;
  untracked: number;
  untrackedRisky: { path: string; kind: string }[];
}

export interface SnapshotBranch {
  name: string;
  lastCommitISO: string | null;
  author: string;
  subject: string;
  sha: string | null;
  /** Upstream short name (e.g. "origin/master") or null when unpublished. */
  upstream: string | null;
  /** True when the configured upstream was deleted on the remote ("[gone]"). */
  upstreamGone: boolean;
  /** Commits on this branch not on main. null = couldn't compute. */
  aheadOfMain: number | null;
  /** Commits on main not on this branch. null = couldn't compute. */
  behindMain: number | null;
  merged: boolean;
  isCurrent: boolean;
  hasWorktree: boolean;
  worktreePath: string | null;
}

export interface SnapshotWorktree {
  /** Repo-relative path ("." for the primary worktree). */
  path: string;
  /** Checked-out branch, or null when detached. */
  branch: string | null;
  head: string | null;
  isPrimary: boolean;
  isCurrent: boolean;
  locked: boolean;
  /** git reported this worktree as prunable (its admin files are stale). */
  prunable: boolean;
  /** The working-tree directory no longer exists on disk. */
  missingPath: boolean;
  /** null = status couldn't be read (e.g. missing path). */
  dirty: SnapshotDirty | null;
}

export interface SnapshotStash {
  ref: string;
  subject: string;
}

export interface BranchGuardianSnapshot {
  schemaVersion: number;
  generatedAt: string;
  /** False when the source wasn't a git repo (empty snapshot). */
  git: boolean;
  note?: string;
  repoRoot?: string;
  mainBranch: string | null;
  currentBranch: string | null;
  inProgressOp: string | null;
  currentDirty: SnapshotDirty | null;
  branches: SnapshotBranch[];
  remoteBranches: string[];
  remoteBranchCount: number;
  worktrees: SnapshotWorktree[];
  stashes: SnapshotStash[];
  stashCount: number;
}

// ── Classification ───────────────────────────────────────────────────────────

export type BranchType =
  | 'main'
  | 'feature'
  | 'fix'
  | 'chore'
  | 'hotfix'
  | 'experiment'
  | 'release'
  | 'docs'
  | 'refactor'
  | 'backup'
  | 'integration'
  | 'other';

export const BRANCH_TYPE_LABEL: Record<BranchType, string> = {
  main: 'Main',
  feature: 'Feature',
  fix: 'Fix',
  chore: 'Chore',
  hotfix: 'Hotfix',
  experiment: 'Experiment',
  release: 'Release',
  docs: 'Docs',
  refactor: 'Refactor',
  backup: 'Backup',
  integration: 'Integration',
  other: 'Other',
};

/** Headline status for a branch (highest-precedence single label). */
export type BranchStatus =
  | 'protected'
  | 'current'
  | 'merged'
  | 'diverged'
  | 'active'
  | 'stale'
  | 'abandoned';

export const BRANCH_STATUS_LABEL: Record<BranchStatus, string> = {
  protected: 'Protected',
  current: 'Current',
  merged: 'Merged',
  diverged: 'Diverged',
  active: 'Active',
  stale: 'Stale',
  abandoned: 'Abandoned',
};

export type RiskLevel = 'low' | 'medium' | 'high';

export const RISK_LABEL: Record<RiskLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };

// ── Health scoring ───────────────────────────────────────────────────────────

export type HealthBand = 'excellent' | 'healthy' | 'attention' | 'stale' | 'high_risk';

export const HEALTH_BAND_LABEL: Record<HealthBand, string> = {
  excellent: 'Clean & active',
  healthy: 'Mostly healthy',
  attention: 'Needs attention',
  stale: 'Stale / risky',
  high_risk: 'High risk',
};

/** One transparent contribution to a health score (positive or negative). */
export interface HealthFactor {
  label: string;
  delta: number;
}

export interface HealthScore {
  /** 0–100. */
  value: number;
  band: HealthBand;
  /** Ordered, signed reasons the score landed where it did. */
  factors: HealthFactor[];
}

// ── Scored entities (what the dashboard renders) ─────────────────────────────

export interface ScoredBranch extends SnapshotBranch {
  type: BranchType;
  status: BranchStatus;
  isProtected: boolean;
  /** Days since the last commit (null when the date couldn't be read). */
  ageDays: number | null;
  conformsToNaming: boolean;
  namingReason: string;
  risk: RiskLevel;
  health: HealthScore;
  /** One-line plain-English next step. */
  suggestedAction: string;
}

export interface ScoredWorktree extends SnapshotWorktree {
  ageDays: number | null;
  risk: RiskLevel;
  health: HealthScore;
  suggestedAction: string;
  /** True when the checked-out branch is no longer in the snapshot. */
  branchMissing: boolean;
}

export type CleanlinessBand = HealthBand;

export interface RepoCleanlinessScore {
  /** 0–100 weighted roll-up of branch + worktree hygiene. */
  value: number;
  band: CleanlinessBand;
  factors: HealthFactor[];
  counts: {
    branches: number;
    activeBranches: number;
    staleBranches: number;
    mergedEligible: number;
    worktrees: number;
    worktreesNeedingReview: number;
    highRiskBranches: number;
    riskyUntracked: number;
    stashes: number;
  };
}

// ── Safe command generation ──────────────────────────────────────────────────

export type CommandSafety = 'read-only' | 'dry-run' | 'caution' | 'destructive';

export const COMMAND_SAFETY_LABEL: Record<CommandSafety, string> = {
  'read-only': 'Safe (read-only)',
  'dry-run': 'Dry run',
  caution: 'Caution',
  destructive: 'Destructive — approval required',
};

export interface CommandSuggestion {
  label: string;
  command: string;
  safety: CommandSafety;
  note?: string;
}

// ── Recommendations ──────────────────────────────────────────────────────────

export type RecommendationKind =
  | 'merged_cleanup'
  | 'stale_branch'
  | 'abandoned_branch'
  | 'diverged_branch'
  | 'no_upstream'
  | 'upstream_gone'
  | 'naming_violation'
  | 'risky_untracked'
  | 'dirty_worktree'
  | 'missing_worktree'
  | 'prunable_worktree'
  | 'in_progress_op'
  | 'stash_backlog';

export type RecSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const REC_SEVERITY_RANK: Record<RecSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export const REC_SEVERITY_LABEL: Record<RecSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

/** Overall safety class of acting on a recommendation. */
export type RecSafety = 'safe' | 'cautionary' | 'high_risk';

export const REC_SAFETY_LABEL: Record<RecSafety, string> = {
  safe: 'Safe',
  cautionary: 'Cautionary',
  high_risk: 'High risk',
};

export interface RelatedLink {
  label: string;
  href: string;
}

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  severity: RecSeverity;
  /** Priority for ranking (higher = sooner). */
  priority: number;
  safety: RecSafety;
  /** Whether acting requires an explicit operator approval (destructive). */
  approvalRequired: boolean;
  /** What the recommendation is about. */
  target: { type: 'branch' | 'worktree' | 'repo' | 'stash'; name: string };
  reason: string;
  evidence: string[];
  /** Recovery / backup guidance shown BEFORE any cleanup command. */
  recovery: string[];
  /** Generated copy-paste commands, labelled by safety. Never executed. */
  commands: CommandSuggestion[];
  relatedLinks: RelatedLink[];
}

// ── Settings (persisted client-side) ─────────────────────────────────────────

export interface BranchGuardianSettings {
  /** A branch with no commits for this many days is "stale". */
  staleBranchDays: number;
  /** A stale branch untouched for this many days is "abandoned". */
  abandonedBranchDays: number;
  /** A worktree untouched/idle this many days is flagged for review. */
  staleWorktreeDays: number;
  /** Commits-behind-main beyond which a branch is "far behind" / diverged. */
  behindMainThreshold: number;
  /** Override the snapshot's detected main branch (blank = use detected). */
  mainBranchOverride: string;
  /** Glob-ish protected branch patterns (in addition to the always-on set). */
  protectedPatterns: string[];
  /** Include remote-only branches in the inventory views. */
  includeRemote: boolean;
  /** Surface experiment/* branches in stale/abandoned flags. */
  includeExperimental: boolean;
  /** How many audit entries to retain locally. */
  auditLogRetention: number;
}

export const DEFAULT_SETTINGS: BranchGuardianSettings = {
  staleBranchDays: 14,
  abandonedBranchDays: 45,
  staleWorktreeDays: 14,
  behindMainThreshold: 30,
  mainBranchOverride: '',
  protectedPatterns: [],
  includeRemote: true,
  includeExperimental: true,
  auditLogRetention: 500,
};

/** Branch name prefixes that are ALWAYS protected (never deletion candidates). */
export const ALWAYS_PROTECTED: string[] = [
  'main',
  'master',
  'production',
  'staging',
  'develop',
  'release/*',
  'hotfix/*',
];

/** The conventional branch prefixes BranchGuardianOS recommends. */
export const NAMING_PREFIXES: BranchType[] = [
  'feature',
  'fix',
  'chore',
  'hotfix',
  'experiment',
  'release',
  'docs',
  'refactor',
];

// ── Owner state (client-side overlay) ────────────────────────────────────────

export type RecStatus = 'open' | 'reviewed' | 'snoozed' | 'cleanup_approved' | 'dismissed';

export const REC_STATUS_LABEL: Record<RecStatus, string> = {
  open: 'Open',
  reviewed: 'Reviewed',
  snoozed: 'Snoozed',
  cleanup_approved: 'Cleanup approved',
  dismissed: 'Dismissed',
};

export interface RecOverride {
  status: RecStatus;
  note?: string;
  /** ISO date-time a snooze expires (status reverts to open after). */
  snoozedUntil?: string;
  updatedAt: string;
}

export type RecOverrideMap = Record<string, RecOverride>;

// ── Audit log (BranchGuardian-specific events) ───────────────────────────────

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  /** Machine action key, e.g. 'scan.run', 'rec.reviewed', 'command.copy'. */
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  severity: AuditSeverity;
  metadata?: Record<string, unknown>;
}

export const AUDIT_CAP = 1000;

export interface ScoreHistoryPoint {
  at: string;
  cleanliness: number;
  staleBranches: number;
  worktreesNeedingReview: number;
  highRisk: number;
}
