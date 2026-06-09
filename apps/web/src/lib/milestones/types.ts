// ============================================================
// SwingVantage Milestone Authority System — data model (PURE, isomorphic)
// ------------------------------------------------------------
// The enums + shapes shared by the catalog, the trigger engine, the Authority
// Impact scorer, the content generator, the public page builders, the server
// evaluator and the Admin Milestone Center. PURE — no node:fs, no env, no React
// — so it is fully unit-testable and safe to import from server + client.
//
// Truthfulness is built into the model:
//   • A milestone is only `earned` when a REAL metric meets its trigger.
//   • A trigger whose metric can't be read resolves to `needs_data_source`
//     and can NEVER auto-earn or auto-publish.
//   • Public pages exist only for admin-APPROVED, earned milestones (the
//     committed published registry) — never for drafts or estimates.
// ============================================================

// ── Categories (15, user-facing) ────────────────────────────────────────────

export type MilestoneCategory =
  | 'Platform Growth'
  | 'Swing Analysis'
  | 'Sport Coverage'
  | 'Practice Plans'
  | 'Retesting and Improvement'
  | 'Coaching Intelligence'
  | 'Education and Guides'
  | 'Product Development'
  | 'Technical Performance'
  | 'Trust and Privacy'
  | 'Community Signals'
  | 'Search and Authority'
  | 'Global Access'
  | 'Admin and Operations'
  | 'User Success';

export const MILESTONE_CATEGORIES: MilestoneCategory[] = [
  'Platform Growth', 'Swing Analysis', 'Sport Coverage', 'Practice Plans',
  'Retesting and Improvement', 'Coaching Intelligence', 'Education and Guides',
  'Product Development', 'Technical Performance', 'Trust and Privacy',
  'Community Signals', 'Search and Authority', 'Global Access',
  'Admin and Operations', 'User Success',
];

// ── Triggers ────────────────────────────────────────────────────────────────

/** Every metric a milestone can be triggered by (superset of the spec list). */
export type TriggerType =
  | 'total_visitors'
  | 'registered_users'
  | 'swing_uploads'
  | 'swing_analyses'
  | 'sport_analyses'
  | 'retests_completed'
  | 'drill_plans_generated'
  | 'active_sports_count'
  | 'multi_sport_users'
  | 'sample_report_views'
  | 'guide_views'
  | 'published_guides'
  | 'mechanics_pages'
  | 'faq_clusters'
  | 'faq_count'
  | 'methodology_pages'
  | 'organic_clicks'
  | 'search_impressions'
  | 'indexed_pages'
  | 'backlinks'
  | 'keyword_rankings'
  | 'update_count'
  | 'content_count'
  | 'video_tutorials'
  | 'curated_drill_recommendations'
  | 'trend_based_drills'
  | 'coach_style_configs'
  | 'countries_with_visitors'
  | 'multilingual_pages'
  | 'user_feedback_count'
  | 'improvement_patterns'
  | 'parent_coach_pages'
  | 'team_facility_pages'
  | 'uptime_percentage'
  | 'page_speed_good'
  | 'accessibility_improvements'
  | 'feature_flag'
  | 'admin_manual'
  | 'system_quality';

export type TriggerOperator = 'gte' | 'gt' | 'eq' | 'lte';

export interface MilestoneTrigger {
  type: TriggerType;
  operator: TriggerOperator;
  value: number;
  /** For sport_analyses / feature_flag: which sport / flag key the metric reads. */
  key?: string;
  /** Optional window note (e.g. "30 days") — informational. */
  window?: string;
}

/** How a trigger metric is sourced — drives the honest "needs data source" path. */
export type DataSourceTier =
  | 'live' // cross-user counts via getPlatformMetrics (needs service role)
  | 'registry' // derived from committed registries (guides/updates/sports/locales)
  | 'feature' // a boolean capability/feature flag that is true today
  | 'admin_manual' // only an admin can attest it
  | 'needs_data_source'; // no in-app source yet (analytics/Search Console/backlinks)

// ── Definition (the catalog entry) ──────────────────────────────────────────

export interface MilestoneDefinition {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  category: MilestoneCategory;
  subcategory?: string;
  trigger: MilestoneTrigger;
  /** Dedicated-page editorial angle (from the spec). */
  pageAngle: string;
  /** Why this milestone strengthens authority (from the spec). */
  authorityPurpose: string;
  relatedSport?: string;
  relatedFeature?: string;
  relatedPersona?: string;
  /** Internal-link target paths to seed the recommender. */
  relatedPages?: string[];
  // ── Optional SEO overrides (admin-editable; otherwise derived) ──
  seoTitle?: string;
  metaDescription?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  schemaType?: 'Article';
}

// ── Evaluation (definition × live metric snapshot) ──────────────────────────

export type MilestoneStatus = 'earned' | 'in_progress' | 'needs_data_source' | 'not_started';

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  earned: 'Earned',
  in_progress: 'In progress',
  needs_data_source: 'Needs data source',
  not_started: 'Not started',
};

/** The live metric snapshot the engine evaluates against. */
export interface MetricSnapshot {
  now: string;
  /** Live cross-user counts (null when the service role is not configured). */
  live: {
    registeredUsers: number | null;
    swingAnalyses: number | null;
    sessions: number | null;
    community: number | null;
    activeSports: number;
    sportSessions: Record<string, number>;
  };
  /** Registry-derived counts (always available). */
  registry: {
    publishedGuides: number;
    updateCount: number;
    contentCount: number;
    videoTutorials: number;
    activeSports: number;
    multilingualPages: number;
    methodologyPages: number;
    mechanicsPages: number;
    faqClusters: number;
    parentCoachPages: number;
    teamFacilityPages: number;
  };
  /** Boolean feature/capability flags that are true today. */
  features: Record<string, boolean>;
}

export interface EvaluatedMilestone {
  definition: MilestoneDefinition;
  status: MilestoneStatus;
  dataSource: DataSourceTier;
  /** The current measured value (null when needs_data_source). */
  currentValue: number | null;
  targetValue: number;
  /** 0–100 progress toward the trigger (null when needs_data_source). */
  progressPct: number | null;
  authority: AuthorityScore;
  /** Honest one-line explanation of the status. */
  rationale: string;
}

// ── Authority Impact Score ──────────────────────────────────────────────────

export type AuthorityBand =
  | 'strategic' // 90–100
  | 'high_value' // 75–89
  | 'supporting' // 50–74
  | 'low_priority' // 25–49
  | 'do_not_publish'; // 0–24

export const AUTHORITY_BAND_LABEL: Record<AuthorityBand, string> = {
  strategic: 'Strategic Authority Milestone',
  high_value: 'High-Value Milestone',
  supporting: 'Supporting Authority Milestone',
  low_priority: 'Low Priority / Needs Better Angle',
  do_not_publish: 'Do Not Publish Yet',
};

export interface AuthorityScore {
  value: number;
  band: AuthorityBand;
  factors: { label: string; delta: number }[];
}

// ── Generated content (admin-reviewable draft) ──────────────────────────────

export interface MilestoneFaq {
  q: string;
  a: string;
}

export interface MilestoneContentDraft {
  seoTitle: string;
  metaDescription: string;
  summary: string;
  whatItMeans: string;
  howUsersBenefit: string;
  educationalContext: string;
  relatedFeatureContext: string;
  faqs: MilestoneFaq[];
  internalLinkSuggestions: { href: string; label: string }[];
  shareSnippet: string;
  updateCardCopy: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
}

// ── Published public registry (committed → drives /milestones + sitemap) ─────

export interface PublishedMilestone {
  slug: string;
  /** Must match a catalog id. */
  definitionId: string;
  /** Verified metric reached, in plain words (e.g. "7 sports live"). */
  verifiedMetric: string;
  /** ISO date the milestone was achieved/approved. */
  achievedAt: string;
  /** Admin-approved + index control. */
  noindex?: boolean;
  /** Optional SEO/content overrides committed by the admin. */
  seoTitle?: string;
  metaDescription?: string;
  /** Optional hand-edited body paragraphs (otherwise generated). */
  body?: string[];
}

// ── Owner state (client localStorage overlay) ───────────────────────────────

export type EditorialStatus = 'open' | 'approved' | 'rejected' | 'snoozed';

export const EDITORIAL_STATUS_LABEL: Record<EditorialStatus, string> = {
  open: 'Open',
  approved: 'Approved',
  rejected: 'Rejected',
  snoozed: 'Snoozed',
};

export interface MilestoneOverride {
  status: EditorialStatus;
  /** Admin chose to surface a card on /updates. */
  updateCardEnabled?: boolean;
  /** Admin chose to create a dedicated public page. */
  dedicatedPageEnabled?: boolean;
  noindex?: boolean;
  /** Admin-attested current value (for admin_manual / overrides). */
  verifiedValueOverride?: number;
  seoTitle?: string;
  metaDescription?: string;
  note?: string;
  updatedAt: string;
}

export type MilestoneOverrideMap = Record<string, MilestoneOverride>;

// ── Audit log ───────────────────────────────────────────────────────────────

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  severity: AuditSeverity;
  metadata?: Record<string, unknown>;
}

export const AUDIT_CAP = 1000;
