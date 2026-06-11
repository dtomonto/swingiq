// ============================================================
// SignalRadar OS — domain model (PURE, isomorphic)
// ------------------------------------------------------------
// SignalRadar OS is SwingVantage's internal radar for public digital
// signals: brand mentions, demand questions, competitor movement, SEO
// opportunities, reputation risk, partnership leads and sport demand.
//
// This file is the single typed contract shared by the engine (pure),
// the server adapters and the admin UI. It must stay free of any
// server-only / browser-only imports so both jest and the client can
// import it. `import type { SportId }` is erased at compile time, so it
// adds NO runtime dependency on @swingiq/core (important for jest).
//
// Honesty rule (house rule #2 — never fabricate): every signal records
// HOW it arrived (`collectionMethod`) and HOW it was classified
// (`classification.method`). Demo/seed signals are explicitly flagged.
// ============================================================

import type { SportId } from '@swingiq/core';

// ── Sport tagging ───────────────────────────────────────────
// A signal's sport is one of the 7 canonical SwingVantage sports, or
// 'multi_sport' / 'unknown'. We reuse the canonical SportId type for
// the real sports (type-only) and widen it for the two meta values.
export type SignalSport = SportId | 'multi_sport' | 'unknown';

// ── Where signals come from ─────────────────────────────────
export type SignalSourceType =
  | 'search'
  | 'rss'
  | 'google_alerts'
  | 'reddit'
  | 'youtube'
  | 'blog_news'
  | 'backlink'
  | 'social'
  | 'competitor'
  | 'ai_answer_engine'
  | 'support'
  | 'analytics'
  | 'search_console'
  | 'manual'
  | 'csv'
  | 'webhook';

/** How a signal physically arrived — the honesty label on every record. */
export type CollectionMethod =
  | 'manual' // typed/pasted by the operator
  | 'import_google_alerts'
  | 'import_rss'
  | 'import_csv'
  | 'webhook'
  | 'adapter' // fetched by an automated adapter (future)
  | 'demo'; // sample data, never real

// ── Classification dimensions ───────────────────────────────
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed' | 'unknown';

export type SignalIntent =
  | 'brand_mention'
  | 'product_question'
  | 'support_issue'
  | 'feature_request'
  | 'bug_report'
  | 'purchase_comparison'
  | 'coaching_need'
  | 'seo_content_opportunity'
  | 'backlink_opportunity'
  | 'partnership_opportunity'
  | 'creator_opportunity'
  | 'competitive_intel'
  | 'reputation_risk'
  | 'press_media'
  | 'spam_noise';

export type AudienceType =
  | 'recreational_athlete'
  | 'parent'
  | 'coach'
  | 'team_league'
  | 'sports_tech_buyer'
  | 'blogger_media'
  | 'creator'
  | 'competitor'
  | 'unknown';

export type Urgency = 'critical' | 'high' | 'medium' | 'low';

export type OpportunityType =
  | 'reply_respond'
  | 'create_content'
  | 'build_feature'
  | 'fix_bug'
  | 'improve_onboarding'
  | 'improve_trust'
  | 'improve_landing'
  | 'add_faq'
  | 'contact_creator'
  | 'pursue_backlink'
  | 'monitor_only'
  | 'ignore_archive';

/** How a classification was produced (honesty label). */
export type ClassificationMethod = 'rules' | 'ai' | 'manual_override';

export interface SignalClassification {
  sentiment: Sentiment;
  intent: SignalIntent;
  audience: AudienceType;
  sport: SignalSport;
  urgency: Urgency;
  opportunity: OpportunityType;
  /** Brand / sport / competitor terms that matched in the text. */
  brandTermsMatched: string[];
  sportTermsMatched: string[];
  competitorTermsMatched: string[];
  /** Short human-readable rationale for why it was classified this way. */
  rationale: string[];
  method: ClassificationMethod;
}

export interface SignalScores {
  /** 0–100 — how confident the classifier is in its own labels. */
  confidence: number;
  /** 0–100 — composite "act on this" score. */
  priority: number;
  /** 0–100 — how trustworthy/authoritative the source is. */
  sourceReliability: number;
  /** 0–100 — how relevant to SwingVantage this signal is. */
  relevance: number;
  /** Transparent breakdown of the priority contributors (label → points). */
  priorityFactors: { label: string; points: number }[];
}

// ── Signal lifecycle ────────────────────────────────────────
export type SignalStatus =
  | 'new'
  | 'reviewed'
  | 'in_progress'
  | 'responded'
  | 'converted_task'
  | 'converted_content'
  | 'converted_product'
  | 'converted_partnership'
  | 'converted_reputation'
  | 'archived'
  | 'ignored';

/** A normalized signal — the shared shape every adapter produces. */
export interface NormalizedSignal {
  id: string;
  sourceAdapterId: string;
  sourceType: SignalSourceType;
  sourceName: string;
  collectionMethod: CollectionMethod;
  sourceUrl?: string;
  sourceDomain?: string;
  title?: string;
  rawText: string;
  cleanText: string;
  authorName?: string;
  authorUrl?: string;
  /** When the underlying content was published (if known). */
  publishedAt?: string;
  /** When SignalRadar discovered it. */
  discoveredAt: string;
  language?: string;
  linkedUrls: string[];
  /** True for sample/demo data — never a real mention. */
  isSeed?: boolean;
}

/** A fully-processed signal: normalized + classified + scored + lifecycle. */
export interface Signal extends NormalizedSignal {
  classification: SignalClassification;
  scores: SignalScores;
  status: SignalStatus;
  /** Stable grouping key used for dedup + clustering. */
  fingerprint: string;
  assignedTo?: string;
  reviewedAt?: string;
  archivedAt?: string;
  ignoredReason?: string;
  /** Free-text operator notes (most recent last). */
  notes: SignalNote[];
  createdAt: string;
  updatedAt: string;
  /** True when read from the durable webhook-ingest store (not local yet). */
  ingested?: boolean;
}

export interface SignalNote {
  id: string;
  at: string;
  author: string;
  body: string;
}

// ── Inputs ──────────────────────────────────────────────────
/** Raw, minimally-structured input a human or importer provides. */
export interface RawSignalInput {
  sourceType: SignalSourceType;
  collectionMethod: CollectionMethod;
  sourceName?: string;
  sourceUrl?: string;
  title?: string;
  text: string;
  authorName?: string;
  authorUrl?: string;
  publishedAt?: string;
  discoveredAt?: string;
  /** Optional operator hint for sport (overrides the classifier). */
  sportHint?: SignalSport;
}

// ── Configuration (operator-tunable) ────────────────────────
export interface ScoringWeights {
  directBrandMention: number;
  hasLink: number;
  sentimentRisk: number;
  sourceAuthority: number;
  audienceRelevance: number;
  recency: number;
  demandSignal: number;
  competitorMention: number;
  sportMapped: number;
}

export interface SignalRadarConfig {
  brandTerms: string[];
  brandMisspellings: string[];
  domainTerms: string[];
  oldBrandTerms: string[];
  founderHandles: string[];
  /** Per-sport keyword lists used to tag a signal's sport. */
  sportTerms: Partial<Record<SignalSport, string[]>>;
  /** Generic demand keywords (AI swing analysis, upload video, etc.). */
  demandTerms: string[];
  opportunityTerms: string[];
  riskTerms: string[];
  spamTerms: string[];
  weights: ScoringWeights;
  /** When false, the rules classifier is the only path (default). */
  aiClassificationEnabled: boolean;
  /** Minimum severity a notification must reach to fire as an alert. */
  alertMinSeverity: NotificationSeverity;
  /** Notification kinds the operator has muted (won't fire as alerts). */
  mutedAlertKinds: SignalNotificationKind[];
  /** RSS/Atom feed URLs the scheduled poller collects from (keyless). */
  feedSources: string[];
}

// ── Adapter framework ───────────────────────────────────────
export type AdapterConfigState =
  | 'active' // enabled + configured + healthy
  | 'configured_disabled' // configured but switched off
  | 'missing_credentials' // needs an env var/key
  | 'manual_only' // works only via human import (keyless)
  | 'placeholder' // future-ready scaffold, collects nothing yet
  | 'failing' // last run errored
  | 'healthy'; // ran cleanly

/**
 * How an adapter collects:
 *  - 'manual'    — operator types/pastes a single signal (keyless, live)
 *  - 'import'    — operator pastes a digest/feed/CSV we parse (keyless, live)
 *  - 'automated' — would fetch on a schedule; scaffolded, needs credentials
 */
export type AdapterMode = 'manual' | 'import' | 'automated';

export interface AdapterDef {
  id: string;
  name: string;
  sourceType: SignalSourceType;
  mode: AdapterMode;
  /** One-line description shown in admin. */
  blurb: string;
  /** Env var NAMES this adapter would need (never values). */
  envVars: string[];
  /** True if the adapter can produce real signals with NO key (manual/import). */
  keyless: boolean;
  /** Copy-paste setup guidance surfaced in the admin UI. */
  setupInstructions: string;
  /** Dedup strategy description (transparency). */
  dedupeStrategy: string;
}

export interface AdapterStatus {
  id: string;
  name: string;
  sourceType: SignalSourceType;
  blurb: string;
  envVars: string[];
  keyless: boolean;
  setupInstructions: string;
  dedupeStrategy: string;
  /** Resolved live state — booleans only, NEVER secret values. */
  state: AdapterConfigState;
  /** True when at least one required env var is set. */
  hasCredentials: boolean;
  lastRunAt?: string;
  lastResultCount?: number;
  lastError?: string;
}

// ── Competitor watch ────────────────────────────────────────
export interface CompetitorDef {
  id: string;
  name: string;
  category: string;
  /** Operator-defined match terms (name variants). */
  terms: string[];
  enabled: boolean;
}

export interface CompetitorInsight {
  competitorId: string;
  competitorName: string;
  signalCount: number;
  sentimentBreakdown: Record<Sentiment, number>;
  /** Recurring complaint themes mined from competitor signals. */
  weaknesses: string[];
  /** Positioning angles SwingVantage can press. */
  positioningAngles: string[];
}

// ── AI answer-engine visibility ─────────────────────────────
export interface AiVisibilityTest {
  id: string;
  query: string;
  platform: string; // e.g. 'ChatGPT', 'Perplexity', 'Google AI Overview'
  resultSummary: string;
  swingVantageAppeared: boolean | null;
  competitorsMentioned: string[];
  recommendedPage: string;
  priority: number;
  lastTestedAt?: string;
  notes: string;
  status: 'untested' | 'tested' | 'action_needed' | 'resolved';
}

// ── Conversion workflows ────────────────────────────────────
export type ConversionKind =
  | 'content_idea'
  | 'product_feedback'
  | 'partnership_lead'
  | 'support_response'
  | 'reputation_risk';

export interface SignalConversion {
  id: string;
  kind: ConversionKind;
  signalId: string;
  signalSummary: string;
  createdAt: string;
  createdBy: string;
  status: 'open' | 'in_progress' | 'done' | 'dropped';
  /** Free-form payload — shape depends on `kind` (see engine/conversions). */
  fields: Record<string, string>;
}

// ── Notifications ───────────────────────────────────────────
export type SignalNotificationKind =
  | 'high_priority'
  | 'negative_mention'
  | 'high_authority_mention'
  | 'backlink_opportunity'
  | 'competitor_comparison'
  | 'bug_complaint'
  | 'repeated_confusion'
  | 'sport_spike'
  | 'adapter_failure';

export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SignalNotification {
  id: string;
  kind: SignalNotificationKind;
  severity: NotificationSeverity;
  title: string;
  detail: string;
  signalId?: string;
}

// ── Clustering ──────────────────────────────────────────────
export interface SignalCluster {
  id: string;
  /** Human label for the theme (e.g. "People asking for free golf analysis"). */
  theme: string;
  signalIds: string[];
  size: number;
  topSport: SignalSport;
  topIntent: SignalIntent;
}

// ── Dashboard roll-up ───────────────────────────────────────
export interface DistributionBucket {
  key: string;
  label: string;
  count: number;
}

export interface SignalDashboard {
  totals: {
    all: number;
    newCount: number;
    highPriority: number;
    negativeRisk: number;
    seoOpportunities: number;
    productFeedback: number;
    backlinkOpportunities: number;
    partnershipLeads: number;
  };
  needsAttention: Signal[];
  bySource: DistributionBucket[];
  bySentiment: DistributionBucket[];
  bySport: DistributionBucket[];
  byIntent: DistributionBucket[];
  byPriority: DistributionBucket[];
  topDomains: DistributionBucket[];
  clusters: SignalCluster[];
  notifications: SignalNotification[];
}

// ── Automated-collection status ─────────────────────────────
/**
 * Live on/off status of the automated-collection pieces — booleans + a
 * count only, NEVER secret values. Drives the admin Automation panel.
 */
export interface AutomationStatus {
  /** Durable store present (Supabase service role) — the gate for persistence. */
  storeEnabled: boolean;
  /** SIGNALRADAR_WEBHOOK_SECRET is set → webhook ingest accepts posts. */
  webhookConfigured: boolean;
  /** CRON_SECRET is set → an external scheduler can drive the feed cron. */
  cronConfigured: boolean;
  /** Number of valid feeds in the SIGNALRADAR_FEEDS deploy env. */
  envFeedCount: number;
}
