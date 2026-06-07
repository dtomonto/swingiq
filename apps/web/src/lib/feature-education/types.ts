// ============================================================
// SwingVantage — Feature Education Engine: Domain Types & Schemas
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This file is the "dictionary" for the system that keeps every
//   feature taught. It defines the *Feature Registry* record (the
//   source of truth for what features exist and which learning
//   materials cover them), every kind of generated *education asset*
//   (tutorial, manual, how-to, admin guide, FAQ, troubleshooting,
//   onboarding, in-app help, video brief, release note, support doc,
//   SEO article, course module), plus the *quality score*, *security
//   scan*, *version*, *drift* and *content-gap* records.
//
//   Everything else in lib/feature-education speaks these shapes. We
//   keep them in one file so the data model is reviewable at a glance,
//   and attach Zod schemas to the records that cross a trust boundary
//   (API input) so bad data is rejected early.
//
// DESIGN RULES (mirrors lib/video-studio + lib/agents):
//   - Structured data first, UI copy second.
//   - Deterministic by default; an LLM is an OPTIONAL enhancer.
//   - Honest by design: an asset is only "grounded" when it points at
//     real routes/components/evidence; otherwise it is flagged
//     needsHumanReview rather than published.
// ============================================================

import { z } from 'zod';

// ── Shared vocabulary ─────────────────────────────────────────

/**
 * How a detected change is classified (spec §1). Drives which assets a
 * feature warrants and how it is reviewed.
 */
export const FEATURE_CATEGORIES = [
  'new-feature',
  'enhancement',
  'ui-change',
  'workflow-change',
  'admin-capability',
  'user-setting',
  'backend-api',
  'monetization',
  'account-auth',
  'analytics-reporting',
  'security-privacy',
  'support-troubleshooting',
  'deprecated',
  'removed',
] as const;
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

/** Who a feature (and its docs) is for (spec §13 role-based docs). */
export const FEATURE_AUDIENCES = [
  'all',
  'new-user',
  'returning-user',
  'power-user',
  'admin',
  'support',
  'developer',
  'coach',
  'parent',
  'enterprise',
] as const;
export type FeatureAudience = (typeof FEATURE_AUDIENCES)[number];

/** Lifecycle of a feature in the registry. */
export const FEATURE_STATUSES = ['draft', 'active', 'beta', 'deprecated', 'removed'] as const;
export type FeatureStatus = (typeof FEATURE_STATUSES)[number];

/** Every kind of learning asset the engine can produce (spec §3/§4/§10/§11/§14/§15). */
export const ASSET_TYPES = [
  'tutorial', // plain-language user tutorial
  'manual', // formal product manual entry
  'how-to', // task-based "how to accomplish X"
  'admin-guide', // admin setup/operations
  'faq', // likely Q&A
  'troubleshooting', // error/empty-state recovery
  'onboarding', // first-run walkthrough
  'in-app-help', // tooltip / contextual helper recommendation
  'video-brief', // video tutorial script + storyboard (→ Video Studio)
  'release-note', // polished "what changed" entry
  'support-enablement', // internal support summary + macros
  'seo-article', // public, search-optimized help page
  'course-module', // internal academy lesson/module
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

/** Publishing workflow states (spec §8). */
export const ASSET_STATUSES = [
  'detected',
  'draft',
  'needs-review',
  'approved',
  'published',
  'updated',
  'deprecated',
  'archived',
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

/** Where an asset may be surfaced. Gates security scanning. */
export const ASSET_VISIBILITIES = ['public', 'user', 'admin', 'support', 'internal'] as const;
export type AssetVisibility = (typeof ASSET_VISIBILITIES)[number];

/** Where an approved asset can be published (spec §8). */
export const PUBLISH_TARGETS = [
  'help-center',
  'in-app',
  'academy',
  'updates',
  'dev-updates',
  'seo',
  'support-macros',
  'video-studio',
  'internal-kb',
] as const;
export type PublishTarget = (typeof PUBLISH_TARGETS)[number];

/** Quality dimensions every asset is scored on (spec §6). */
export const QUALITY_DIMENSIONS = [
  'accuracy',
  'completeness',
  'clarity',
  'usefulness',
  'stepQuality',
  'technicalCorrectness',
  'brand',
  'accessibility',
  'seo',
  'internalLinks',
  'coverage',
  'supportReadiness',
  'releaseReadiness',
] as const;
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// ── §2 Feature Registry ───────────────────────────────────────

/** A single piece of grounding evidence (anti-hallucination, spec §26). */
export interface FeatureEvidence {
  kind: 'route' | 'component' | 'api' | 'db' | 'flag' | 'nav' | 'copy' | 'commit' | 'trailer';
  /** Path / id / sha that proves this feature is real. */
  ref: string;
  detail?: string;
}

/** Per-asset coverage state, summarised onto the feature for the matrix. */
export interface CoverageEntry {
  status: 'missing' | 'draft' | 'needs-review' | 'approved' | 'published' | 'stale';
  assetId?: string;
  /** Quality score 0–100 if generated. */
  score?: number;
  updatedAt?: string;
}

export type CoverageMatrix = Partial<Record<AssetType, CoverageEntry>>;

/**
 * The Feature Registry record — the source of truth for what features
 * exist, who they're for, what they touch, and which learning materials
 * cover them (spec §2).
 */
export interface FeatureRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: FeatureCategory;
  audiences: FeatureAudience[];
  status: FeatureStatus;
  /** What the feature touches — used for grounding + drift. */
  routes: string[];
  components: string[];
  apiEndpoints: string[];
  dbTables: string[];
  permissions: string[];
  adminControls: string[];
  featureFlags: string[];
  owner: string;
  releaseVersion?: string;
  sport?: string;
  /** Detection provenance: commit shas / 'manual' / 'route-scan'. */
  detectedFrom: string[];
  evidence: FeatureEvidence[];
  /** 0–100 — how sure detection is that this is a real, distinct feature. */
  confidence: number;
  /** True for low-confidence or sensitive features awaiting human review. */
  needsHumanReview: boolean;
  /** Education coverage by asset type. */
  coverage: CoverageMatrix;
  /** Stable hash of routes+components+flags so drift can detect change. */
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
}

// ── §3/§4 Education Assets ─────────────────────────────────────

export interface AssetSection {
  heading: string;
  /** Paragraphs or bullet lines. */
  body: string[];
}

export interface AssetStep {
  title: string;
  detail: string;
}

export interface AssetFaq {
  q: string;
  a: string;
}

export interface AssetSeo {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
  /** Recommended schema types, e.g. 'HowTo', 'FAQPage'. */
  schema: string[];
  /** Answer-engine / generative-engine direct answer. */
  aeoAnswer: string;
}

/** In-app help recommendation (spec §9). */
export interface InAppHelpSpec {
  route: string;
  placement:
    | 'tooltip'
    | 'inline'
    | 'empty-state'
    | 'checklist'
    | 'learn-more'
    | 'announcement'
    | 'help-drawer';
  /** Optional CSS selector / element id the help attaches to. */
  targetSelector?: string;
  headline: string;
  body: string;
  learnMoreHref?: string;
}

/** A generated learning asset for a feature. */
export interface EducationAsset {
  id: string;
  featureId: string;
  type: AssetType;
  audience: FeatureAudience;
  title: string;
  slug: string;
  summary: string;
  /** The structured body — every asset has sections. */
  sections: AssetSection[];
  /** Optional structured extras (set by the relevant generator). */
  steps?: AssetStep[];
  faqs?: AssetFaq[];
  seo?: AssetSeo;
  /** Link to a Video Studio creative brief (for type 'video-brief'). */
  videoBriefId?: string;
  inAppHelp?: InAppHelpSpec;
  visibility: AssetVisibility;
  status: AssetStatus;
  quality?: QualityScore;
  security?: SecurityScanResult;
  version: number;
  sourceCommit?: string;
  generator: 'deterministic' | 'llm-enhanced';
  /** Real refs this asset was built from (anti-hallucination). */
  groundedIn: FeatureEvidence[];
  needsHumanReview: boolean;
  publishTarget?: PublishTarget;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── §6 Quality scores ─────────────────────────────────────────

export interface QualityScore {
  dimensions: Record<QualityDimension, number>;
  /** 0–100 weighted blend. */
  overall: number;
  passed: boolean;
  threshold: number;
  /** Plain-English notes: why it failed or what to improve. */
  reasons: string[];
}

// ── §12 Security / privacy scan ────────────────────────────────

export interface SecurityFinding {
  type:
    | 'secret'
    | 'env-var'
    | 'internal-url'
    | 'admin-only'
    | 'pii'
    | 'auth-logic'
    | 'developer-detail';
  severity: 'block' | 'warn';
  /** The matched fragment (already truncated; never the full secret). */
  excerpt: string;
  reason: string;
}

export interface SecurityScanResult {
  findings: SecurityFinding[];
  /** False when a `block` finding is present and the asset is public. */
  safeToPublishPublicly: boolean;
  scannedAt: string;
}

// ── §19 Versioning / audit trail ───────────────────────────────

export interface AssetVersion {
  id: string;
  assetId: string;
  featureId: string;
  version: number;
  changeReason: string;
  status: AssetStatus;
  /** Full snapshot so any version can be rolled back. */
  snapshot: EducationAsset;
  actor: string;
  createdAt: string;
  isCurrent: boolean;
}

// ── §7 Drift detection ─────────────────────────────────────────

export const DRIFT_KINDS = [
  'route-removed',
  'route-changed',
  'component-removed',
  'flag-changed',
  'copy-changed',
  'schema-changed',
  'stale-age',
  'uncovered',
] as const;
export type DriftKind = (typeof DRIFT_KINDS)[number];

export interface DriftFinding {
  id: string;
  featureId: string;
  assetId?: string;
  kind: DriftKind;
  detail: string;
  proposedAction: 'regenerate' | 'review' | 'retire' | 'update-links';
  severity: RiskLevel;
  createdAt: string;
}

// ── §17 Content gaps ───────────────────────────────────────────

export interface ContentGap {
  featureId: string;
  featureName: string;
  /** Asset types with no coverage at all. */
  missing: AssetType[];
  /** Asset types that exist but are low-quality or stale. */
  weak: AssetType[];
  /** 0–100 by audience reach, support burden and feature importance. */
  priorityScore: number;
  reasons: string[];
}

// ── §19/§23 Audit log ──────────────────────────────────────────

export const FEE_AUDIT_ACTIONS = [
  'scan',
  'feature_detected',
  'feature_updated',
  'package_generated',
  'asset_generated',
  'asset_regenerated',
  'asset_approved',
  'asset_rejected',
  'asset_published',
  'asset_unpublished',
  'asset_archived',
  'drift_detected',
  'review_requested',
  'security_flagged',
] as const;
export type FeeAuditAction = (typeof FEE_AUDIT_ACTIONS)[number];

export interface FeeAuditLog {
  id: string;
  action: FeeAuditAction;
  /** 'system' for automated runs, or an admin identifier. */
  actor: string;
  targetId: string;
  summary: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

// ── Small shared helpers (no I/O) ──────────────────────────────

/** Slugify a label into a stable id fragment. */
export function slugify(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[/\\]+/g, '-') // path separators → hyphen (admin/seo → admin-seo)
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '');
}

/** Build an audit log entry (mirrors video-studio makeAuditLog). */
export function makeFeeAudit(
  action: FeeAuditAction,
  targetId: string,
  summary: string,
  opts: { actor?: string; detail?: Record<string, unknown>; now?: Date } = {},
): FeeAuditLog {
  const now = opts.now ?? new Date();
  return {
    id: `feeaudit_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    actor: opts.actor ?? 'system',
    targetId,
    summary,
    detail: opts.detail,
    createdAt: now.toISOString(),
  };
}

// ── Display labels (UI convenience) ────────────────────────────

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  'new-feature': 'New feature',
  enhancement: 'Enhancement',
  'ui-change': 'UI change',
  'workflow-change': 'Workflow change',
  'admin-capability': 'Admin capability',
  'user-setting': 'User setting',
  'backend-api': 'Backend / API',
  monetization: 'Monetization',
  'account-auth': 'Account / auth',
  'analytics-reporting': 'Analytics / reporting',
  'security-privacy': 'Security / privacy',
  'support-troubleshooting': 'Support / troubleshooting',
  deprecated: 'Deprecated',
  removed: 'Removed',
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  tutorial: 'User tutorial',
  manual: 'Manual entry',
  'how-to': 'How-to guide',
  'admin-guide': 'Admin guide',
  faq: 'FAQ',
  troubleshooting: 'Troubleshooting',
  onboarding: 'Onboarding walkthrough',
  'in-app-help': 'In-app help',
  'video-brief': 'Video script',
  'release-note': 'Release note',
  'support-enablement': 'Support enablement',
  'seo-article': 'SEO help article',
  'course-module': 'Academy module',
};

/** Default visibility per asset type — gates the security scanner. */
export const DEFAULT_VISIBILITY: Record<AssetType, AssetVisibility> = {
  tutorial: 'user',
  manual: 'user',
  'how-to': 'user',
  'admin-guide': 'admin',
  faq: 'public',
  troubleshooting: 'user',
  onboarding: 'user',
  'in-app-help': 'user',
  'video-brief': 'user',
  'release-note': 'public',
  'support-enablement': 'support',
  'seo-article': 'public',
  'course-module': 'internal',
};

// ============================================================
// Zod schemas — only for data that crosses a trust boundary
// (API input). Internal shapes stay as plain interfaces above.
// ============================================================

export const AssetTypeSchema = z.enum(ASSET_TYPES);
export const FeatureCategorySchema = z.enum(FEATURE_CATEGORIES);
export const FeatureAudienceSchema = z.enum(FEATURE_AUDIENCES);
export const PublishTargetSchema = z.enum(PUBLISH_TARGETS);

/** API: run the scanner. */
export const ScanRequestSchema = z.object({
  /** Re-detect from this many recent commits (script path), best-effort. */
  limit: z.number().int().min(1).max(2000).optional(),
});
export type ScanRequest = z.infer<typeof ScanRequestSchema>;

/** API: generate (or regenerate) an education package / asset. */
export const GenerateRequestSchema = z.object({
  featureId: z.string().min(1).max(160),
  /** Limit to specific asset types; omit to generate the full warranted set. */
  types: z.array(AssetTypeSchema).max(ASSET_TYPES.length).optional(),
  /** Try the optional LLM enhancer (falls back to deterministic). */
  enhance: z.boolean().optional(),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/** API: review decision on an asset. */
export const ReviewRequestSchema = z.object({
  assetId: z.string().min(1).max(160),
  decision: z.enum(['approve', 'reject', 'regenerate']),
  note: z.string().max(500).optional(),
});
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;

/** API: publish an approved asset to a target. */
export const PublishRequestSchema = z.object({
  assetId: z.string().min(1).max(160),
  target: PublishTargetSchema.optional(),
});
export type PublishRequest = z.infer<typeof PublishRequestSchema>;
