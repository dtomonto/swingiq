// ============================================================
// securityOS — data model (PURE, isomorphic)
// ------------------------------------------------------------
// The enums + shapes shared by the scoring engine, the posture-check
// catalog, the findings/recommendation derivers, the server generator and
// the admin UI. This module is PURE — no node:fs, no env, no React — so it
// is fully unit-testable and safe to import from both server and client.
//
// Design notes (mirrors lib/command-center):
//   • A SecurityScore + Findings + Recommendations are produced
//     DETERMINISTICALLY from a PostureInput, so the same input always
//     yields the same ids (the basis for owner-state dedupe across scans).
//   • Owner state (finding status / notes / risk-acceptance) is NOT stored
//     here — it lives client-side (localStorage, useSecurityOS) and is
//     merged onto a Finding to form a FindingView. This keeps generation a
//     stateless pure function and works in production's read-only FS.
//   • Honesty-first: a check whose signal can't be read resolves to
//     `unknown` — it is EXCLUDED from the score and instead lowers a
//     visible confidence figure. Nothing is ever silently assumed-pass.
// ============================================================

// ── Score categories (weighted) ─────────────────────────────────────────────

export type ScoreCategoryId =
  | 'identity_access'
  | 'application_security'
  | 'data_protection'
  | 'ai_security'
  | 'infrastructure'
  | 'monitoring_ir'
  | 'secure_dev_lifecycle';

export interface ScoreCategoryMeta {
  id: ScoreCategoryId;
  label: string;
  /** Default weight (percent). The seven defaults sum to 100. */
  weight: number;
  blurb: string;
}

/** Default category weights — match the securityOS spec exactly. */
export const SCORE_CATEGORIES: ScoreCategoryMeta[] = [
  { id: 'identity_access', label: 'Identity & Access', weight: 20, blurb: 'Who can get into the admin area and how access is enforced.' },
  { id: 'application_security', label: 'Application Security', weight: 20, blurb: 'Abuse protection, security headers, rate limiting and input handling.' },
  { id: 'data_protection', label: 'Data Protection', weight: 15, blurb: 'How user data and secrets are stored, isolated and minimized.' },
  { id: 'ai_security', label: 'AI Security', weight: 15, blurb: 'Prompt-injection, output safety, AI cost abuse and data leakage.' },
  { id: 'infrastructure', label: 'Infrastructure & Deployment', weight: 10, blurb: 'Transport security, environment separation and deploy hygiene.' },
  { id: 'monitoring_ir', label: 'Monitoring & Incident Response', weight: 10, blurb: 'Audit trails, security event logging and incident readiness.' },
  { id: 'secure_dev_lifecycle', label: 'Secure Development Lifecycle', weight: 10, blurb: 'Dependency, secret and static-analysis scanning in CI; security test coverage.' },
];

export const CATEGORY_LABEL: Record<ScoreCategoryId, string> = Object.fromEntries(
  SCORE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<ScoreCategoryId, string>;

export const DEFAULT_WEIGHTS: Record<ScoreCategoryId, number> = Object.fromEntries(
  SCORE_CATEGORIES.map((c) => [c.id, c.weight]),
) as Record<ScoreCategoryId, number>;

// ── Severity, risk + check results ──────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  informational: 4,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  informational: 'Info',
};

/** How a single posture check resolved against the live signal. */
export type CheckResult = 'pass' | 'partial' | 'fail' | 'unknown';

/** Numeric value a resolved check contributes to its category score. */
export const RESULT_VALUE: Record<Exclude<CheckResult, 'unknown'>, number> = {
  pass: 100,
  partial: 50,
  fail: 0,
};

export type Level = 'low' | 'medium' | 'high';
export type Effort = 'S' | 'M' | 'L' | 'XL';

/** Operator-facing risk domain — drives the dashboard tiles. */
export type RiskDomain =
  | 'Authentication'
  | 'Authorization'
  | 'API'
  | 'Database'
  | 'Dependencies'
  | 'Secrets'
  | 'AI'
  | 'Uploads'
  | 'Privacy'
  | 'Logging'
  | 'Backups'
  | 'Incident Readiness'
  | 'Compliance'
  | 'Headers';

/** Security framework references for a check/finding. */
export interface FrameworkMapping {
  owaspTop10?: string;
  owaspAsvs?: string;
  owaspLlm?: string;
  nistSsdf?: string;
}

// ── Posture checks (static catalog) ─────────────────────────────────────────

/**
 * Plain, server-gathered signals. Every field is a primitive so the
 * evaluator stays PURE and unit-testable. `null` means "couldn't read"
 * → the dependent check(s) resolve to `unknown`.
 */
export interface PostureInput {
  /** ISO date-time of the scan. */
  now: string;
  adminAllowlist: boolean;
  adminSecret: boolean;
  adminRoles: boolean;
  supabaseAuth: boolean;
  rlsApplied: boolean | null;
  rateLimiter: boolean;
  cspHeaders: boolean | null;
  hstsHeaders: boolean | null;
  aiConfigured: boolean;
  aiBudgetKillSwitch: boolean;
  aiPromptInjectionTests: boolean | null;
  adminAuditLog: boolean;
  incidentRunbook: boolean | null;
  secretScanCi: boolean | null;
  depScanCi: boolean | null;
  sastCi: boolean | null;
  securityTests: boolean | null;
  productionEnv: boolean;
  auditAccessToken: boolean;
  /** Open audit-robot findings (P0/P1/P2) joined in as findings. */
  openAuditFindings: number;
}

/** A single static posture-check definition + its pure evaluator. */
export interface PostureCheck {
  id: string;
  category: ScoreCategoryId;
  riskDomain: RiskDomain;
  title: string;
  description: string;
  /** Severity of the resulting finding when this check FAILS. */
  severity: Severity;
  /** Relative weight within its category (default 1). */
  weight: number;
  frameworks: FrameworkMapping;
  businessImpact: string;
  whatCouldHappen: string;
  recommendedFix: string;
  stepByStepActions: string[];
  effort: Effort;
  canClaudeFix: boolean;
  needsCredentials: boolean;
  /** Fix belongs in CI/CD. */
  addToCi?: boolean;
  /** Pure evaluation of the gathered signals → result + grounded evidence. */
  evaluate: (i: PostureInput) => { result: CheckResult; evidence: string[] };
}

/** A check after evaluation against a PostureInput. */
export interface EvaluatedCheck extends Omit<PostureCheck, 'evaluate'> {
  result: CheckResult;
  evidence: string[];
}

// ── Score output ────────────────────────────────────────────────────────────

export type ScoreBand = 'critical' | 'at_risk' | 'fair' | 'good' | 'strong';

export const BAND_LABEL: Record<ScoreBand, string> = {
  critical: 'Critical exposure',
  at_risk: 'At risk',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

export type MaturityLevel = 'Initial' | 'Developing' | 'Defined' | 'Managed' | 'Optimized';

export interface CategoryScore {
  id: ScoreCategoryId;
  label: string;
  weight: number;
  /** 0–100 from resolved checks (unknowns excluded). null = all unknown. */
  score: number | null;
  /** Resolved checks ÷ total checks in the category (0–1). */
  confidence: number;
  checks: EvaluatedCheck[];
}

export interface SecurityScore {
  /** 0–100 weighted overall. */
  overall: number;
  band: ScoreBand;
  maturity: MaturityLevel;
  /** 0–100 — share of all checks that produced a real (non-unknown) signal. */
  confidence: number;
  categories: CategoryScore[];
  counts: Record<Severity, number>;
  generatedAt: string;
}

/** A single historical score sample (persisted client-side). */
export interface ScoreHistoryPoint {
  at: string;
  overall: number;
  confidence: number;
  critical: number;
  high: number;
}

// ── Findings ────────────────────────────────────────────────────────────────

export type FindingStatus =
  | 'new'
  | 'triaged'
  | 'in_progress'
  | 'needs_review'
  | 'accepted_risk'
  | 'resolved'
  | 'false_positive'
  | 'deferred';

export const FINDING_STATUS_LABEL: Record<FindingStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  in_progress: 'In Progress',
  needs_review: 'Needs Review',
  accepted_risk: 'Accepted Risk',
  resolved: 'Resolved',
  false_positive: 'False Positive',
  deferred: 'Deferred',
};

/** Statuses that count as "open" (still demanding attention). */
export const OPEN_FINDING_STATUSES: FindingStatus[] = ['new', 'triaged', 'in_progress', 'needs_review'];

export type FindingSource =
  | 'posture-scan'
  | 'audit-robot'
  | 'manual'
  | 'dependency-scan'
  | 'secret-scan'
  | 'sast'
  | 'ai-redteam'
  | 'demo';

export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  category: ScoreCategoryId;
  riskDomain: RiskDomain;
  source: FindingSource;
  severity: Severity;
  likelihood: Level;
  impact: Level;
  /** 0–100 composite of severity × likelihood × impact. */
  riskScore: number;
  affectedArea: string;
  evidence: string[];
  recommendedFix: string;
  businessImpact: string;
  technicalImpact: string;
  frameworks: FrameworkMapping;
  effort: Effort;
  canClaudeFix: boolean;
  needsCredentials: boolean;
  addToCi?: boolean;
  recurrenceRisk: Level;
  stepByStepActions: string[];
  createdAt: string;
  /** ISO date the fix is recommended by (derived from severity + settings). */
  dueDate: string;
  isSeed?: boolean;
}

/** Owner state persisted client-side and merged onto a SecurityFinding. */
export interface FindingOverride {
  status: FindingStatus;
  note?: string;
  acceptedRiskJustification?: string;
  resolvedAt?: string;
  updatedAt: string;
}

export type FindingOverrideMap = Record<string, FindingOverride>;

/** A finding with the owner overlay applied (what the UI renders). */
export interface FindingView extends SecurityFinding {
  status: FindingStatus;
  note?: string;
  acceptedRiskJustification?: string;
  resolvedAt?: string;
  /** Open + past its due date. */
  overdue: boolean;
}

// ── Recommendations ─────────────────────────────────────────────────────────

export type RecommendationBucket =
  | 'do_today'
  | 'this_week'
  | 'monitor'
  | 'needs_manual_setup'
  | 'waiting_on_credentials';

export const BUCKET_LABEL: Record<RecommendationBucket, string> = {
  do_today: 'Do Today',
  this_week: 'This Week',
  monitor: 'Monitor',
  needs_manual_setup: 'Needs Manual Setup',
  waiting_on_credentials: 'Waiting on Credentials',
};

export type PriorityBand = 'critical' | 'high' | 'medium' | 'low';

export interface RelatedLink {
  label: string;
  href: string;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  summary: string;
  category: ScoreCategoryId;
  riskDomain: RiskDomain;
  priorityScore: number;
  priorityBand: PriorityBand;
  bucket: RecommendationBucket;
  effort: Effort;
  /** 0–100 confidence the recommendation is well-founded. */
  confidence: number;
  whyItMatters: string;
  whatCouldHappen: string;
  businessImpact: string;
  stepByStepActions: string[];
  canClaudeFix: boolean;
  needsCredentials: boolean;
  addToCi: boolean;
  relatedFindingId?: string;
  relatedLinks: RelatedLink[];
  dueDate: string;
  isSeed?: boolean;
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface SecuritySettings {
  /** Per-category weights (percent). Normalized at scoring time. */
  weights: Record<ScoreCategoryId, number>;
  /** Alert when the overall score drops by at least this many points. */
  scoreDropAlert: number;
  /** Days-to-due by severity for derived findings. */
  dueDays: Record<Severity, number>;
  /** How many security audit-log entries to retain locally. */
  auditLogRetention: number;
  /** Strictness for AI-security checks (strict treats partial as fail). */
  aiStrictness: 'standard' | 'strict';
  /** Fill empty states with clearly-labelled demo findings. */
  includeSeedData: boolean;
}

export const DEFAULT_SETTINGS: SecuritySettings = {
  weights: { ...DEFAULT_WEIGHTS },
  scoreDropAlert: 5,
  dueDays: { critical: 1, high: 3, medium: 7, low: 21, informational: 30 },
  auditLogRetention: 500,
  aiStrictness: 'standard',
  includeSeedData: true,
};

// ── Security audit log (security-specific events) ───────────────────────────

export type SecurityAuditSeverity = 'info' | 'warning' | 'critical';

export interface SecurityAuditEntry {
  id: string;
  at: string;
  actor: string;
  /** Machine action key, e.g. 'finding.status', 'risk.accept', 'scan.run'. */
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  severity: SecurityAuditSeverity;
  /** Redacted metadata (secrets/keys stripped before persistence). */
  metadata?: Record<string, unknown>;
}

export const SECURITY_AUDIT_CAP = 1000;
