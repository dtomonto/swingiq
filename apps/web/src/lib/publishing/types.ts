// ============================================================
// PublishingOS — core data model (shared types)
// ------------------------------------------------------------
// One vocabulary for the whole publishing layer: every admin decision that can
// become a live product change is a `PublishableEntity` that moves through a
// status lifecycle, accumulates `PublishEvent`s (audit trail), is gated by a
// `PublishValidationResult`, and — when it needs a real deploy — is carried by a
// `PublishJob`.
//
// These types are PURE (no IO, no React, no node:fs) so they import safely from
// both server and client code and are trivially unit-testable. The durable
// store (./store) and the service (./service) build on top of them.
// ============================================================

/** The lifecycle a publishable decision moves through. */
export type PublishStatus =
  | 'draft' // being authored / not yet submitted
  | 'review' // submitted, awaiting human review
  | 'validated' // passed validation, ready to publish
  | 'scheduled' // approved, will go live at `scheduledFor`
  | 'published' // live on the public surface
  | 'archived' // intentionally retired (not public)
  | 'failed' // a publish/deploy attempt failed
  | 'rolled_back'; // reverted to a previous version

/** How a given change physically reaches production. */
export type PublishMode =
  | 'instant' // durable DB override — flips live immediately
  | 'deploy_backed' // requires a Git commit/PR + deploy to go live
  | 'hybrid'; // some fields instant, some deploy-backed

/** Blast-radius classification — drives the confirmation depth required. */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Outcome of the pre-publish validation pass. */
export type ValidationStatus = 'unknown' | 'passed' | 'warnings' | 'failed';

/** Deploy-backed pipeline state (instant publishes stay `none`). */
export type DeploymentStatus =
  | 'none'
  | 'queued'
  | 'building'
  | 'deploying'
  | 'live'
  | 'failed';

/**
 * The kinds of product surface PublishingOS can control. Adding a new
 * publishable area = add a member here + a registry entry (./entity-registry)
 * + a validator branch (./validation). Nothing else needs to change.
 */
export type PublishEntityType =
  | 'update' // public /updates changelog entry
  | 'dev-update' // /dev-updates engineering log entry
  | 'seo-page' // SEO / AEO / GEO page
  | 'blog-post' // /blog article
  | 'milestone' // milestone authority page
  | 'library-video' // public /learn training video
  | 'homepage-module' // homepage section copy/config/order
  | 'sport-config' // per-sport product configuration
  | 'feature-flag' // runtime feature flag
  | 'announcement' // internal/public announcement
  | 'nav-item' // navigation copy
  | 'trust-copy' // trust / privacy / legal copy
  | 'roadmap-entry'; // public roadmap entry

/** The action being recorded against an entity (also the PublishEvent verb). */
export type PublishAction =
  | 'create'
  | 'edit'
  | 'submit_review'
  | 'validate'
  | 'schedule'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'rollback'
  | 'retry'
  | 'fail';

/** A single validation check result (passes are kept for the checklist UI). */
export interface ValidationCheck {
  id: string;
  label: string;
  level: 'error' | 'warning' | 'info';
  passed: boolean;
  /** Plain-English detail shown when the check is relevant. */
  detail?: string;
}

export interface PublishValidationResult {
  status: ValidationStatus;
  /** True only when there are zero error-level failures. */
  ok: boolean;
  checks: ValidationCheck[];
  errors: string[];
  warnings: string[];
  /** 0–100 advisory content-quality score where applicable. */
  qualityScore?: number;
  checkedAt: string;
}

/**
 * The canonical publishable record. `content`/`config`/`seo` are intentionally
 * loose JSON bags — the typed shape lives in each surface's own module; here we
 * only need to persist, version, validate and route it.
 */
export interface PublishableEntity {
  id: string;
  entityType: PublishEntityType;
  /** Stable id of the underlying domain object (e.g. update id, page slug). */
  entityId: string;
  title: string;
  slug?: string;
  status: PublishStatus;
  publishMode: PublishMode;
  riskLevel: RiskLevel;

  content?: Record<string, unknown>;
  config?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  metadata?: Record<string, unknown>;

  createdBy?: string;
  updatedBy?: string;
  reviewedBy?: string;
  publishedBy?: string;

  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  publishedAt?: string;
  scheduledFor?: string;

  version: number;
  previousVersionId?: string;
  rollbackTargetId?: string;

  validationStatus: ValidationStatus;
  validationErrors?: string[];

  deploymentStatus: DeploymentStatus;
  deploymentId?: string;

  /** Where the live value is read from / written to. */
  source?: string;
  destination?: string;

  affectedRoutes?: string[];
  affectedComponents?: string[];
  cacheTags?: string[];
  notes?: string;
}

/** Immutable audit-trail entry — one per state change. */
export interface PublishEvent {
  id: string;
  publishableEntityId: string;
  entityType: PublishEntityType;
  eventType: PublishAction;
  actorId?: string;
  actorEmail?: string;
  fromStatus?: PublishStatus;
  toStatus?: PublishStatus;
  version?: number;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** A deploy-backed publish pipeline record (Git → deploy → live). */
export interface PublishJob {
  id: string;
  publishableEntityId: string;
  jobType: 'git_commit' | 'git_pr' | 'deploy' | 'revalidate';
  publishMode: PublishMode;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  branch?: string;
  commitSha?: string;
  pullRequestUrl?: string;
  deploymentUrl?: string;
  deploymentId?: string;
  deploymentStatus?: DeploymentStatus;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * A durable "publish-state override" — the production-safe replacement for the
 * file-backed overrides. It records that a given (entityType, entityId) should
 * be treated as published or draft, regardless of the base status baked into
 * the git-tracked registry. Public read paths merge these on top of base state.
 */
export interface PublishOverride {
  id: string; // `${entityType}:${entityId}`
  entityType: PublishEntityType;
  entityId: string;
  published: boolean;
  actorEmail?: string;
  updatedAt: string;
}
