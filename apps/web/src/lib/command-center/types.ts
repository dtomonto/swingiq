// ============================================================
// Today's Command Center (DailyActionIntelligenceOS) — data model
// ------------------------------------------------------------
// The recommendation model + enums shared by the engine, the scoring
// layer, the server generator and the admin UI. This module is PURE
// (no node:fs, no React) so it is fully unit-testable and safe to import
// from both server and client.
//
// Design notes:
//   • A Recommendation is produced deterministically from live signals,
//     so the same id is regenerated every scan (the basis for dedupe).
//   • Owner state (in-progress / completed / snoozed / dismissed / notes)
//     is NOT stored here — it lives client-side (localStorage) and is
//     merged onto a Recommendation to form a RecommendationView. This
//     keeps generation a stateless pure function and works in production
//     where the runtime filesystem is read-only.
// ============================================================

/** Lifecycle of a single recommendation (engine + owner overlay). */
export type RecommendationStatus =
  | 'new'
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'dismissed'
  | 'snoozed'
  | 'blocked';

/** What kind of work the recommendation represents. */
export type RecommendationType =
  | 'data_gap'
  | 'feature_readiness'
  | 'ai_quality'
  | 'user_onboarding'
  | 'seo_growth'
  | 'content_gap'
  | 'tutorial_gap'
  | 'analytics_gap'
  | 'product_quality'
  | 'conversion'
  | 'retention'
  | 'security'
  | 'performance'
  | 'documentation'
  | 'admin_configuration'
  | 'testing'
  | 'monetization'
  | 'user_feedback'
  | 'system_health';

/** Operator-facing grouping (drives filters + colour). */
export type RecommendationCategory =
  | 'Product'
  | 'Data'
  | 'AI'
  | 'Growth'
  | 'SEO'
  | 'Content'
  | 'User Experience'
  | 'Admin Operations'
  | 'Engineering'
  | 'Analytics'
  | 'Documentation'
  | 'Security'
  | 'Performance'
  | 'Monetization';

/** T-shirt effort sizing. */
export type Effort = 'S' | 'M' | 'L' | 'XL';

/** Low / medium / high qualitative scales. */
export type Level = 'low' | 'medium' | 'high';

/** Which internal engine produced the recommendation. */
export type SourceEngine =
  | 'data-gap'
  | 'feature-readiness'
  | 'audit'
  | 'setup'
  | 'sport-coverage'
  | 'analytics'
  | 'central-intelligence'
  | 'growth-os'
  | 'branch-guardian'
  | 'security-os'
  | 'baseline';

/** Priority band derived from the numeric score. */
export type PriorityBand = 'critical' | 'high' | 'medium' | 'low';

/**
 * Transparent scoring inputs. Every recommendation carries its raw factors
 * so the UI can show WHY a priority was assigned. All factors are additive
 * except `effortPenalty`, which is subtracted.
 */
export interface ScoreFactors {
  /** Business / user / AI / growth impact. 0–25. */
  impact: number;
  /** How time-sensitive it is. 0–20. */
  urgency: number;
  /** How sure the system is the signal is real. 0–15. */
  confidence: number;
  /** Breadth / frequency of affected users. 0–15. */
  affectedUsers: number;
  /** Strategic importance to the roadmap. 0–15. */
  strategic: number;
  /** Cost of ignoring it. 0–20. */
  risk: number;
  /** Effort drag, subtracted from the total. 0–20. */
  effortPenalty: number;
}

/** The computed score + a human-readable breakdown. */
export interface ScoreBreakdown extends ScoreFactors {
  /** Final 1–100 score (clamped). */
  score: number;
  band: PriorityBand;
}

export interface RelatedLink {
  label: string;
  href: string;
}

/**
 * A single prioritized "to do today" recommendation. Deterministically
 * generated — the same underlying signal always yields the same `id`.
 */
export interface Recommendation {
  id: string;
  title: string;
  summary: string;
  recommendationType: RecommendationType;
  category: RecommendationCategory;
  relatedFeature?: string;
  relatedSport?: string;
  relatedSystem?: string;
  priorityScore: number;
  priorityBand: PriorityBand;
  scoreBreakdown: ScoreBreakdown;
  urgency: Level;
  impact: Level;
  effort: Effort;
  /** 0–100 confidence the recommendation is well-founded. */
  confidence: number;
  /** ISO date-time the scan produced this. */
  generatedAt: string;
  /** ISO date the work is recommended to be done by. */
  dueDate: string;
  /** Concrete, grounded evidence lines (never invented metrics). */
  evidence: string[];
  /** Why this matters, in one or two sentences. */
  reason: string;
  /** What data is missing / weak (when applicable). */
  missingData?: string;
  /** The specific data that needs collecting (when applicable). */
  requiredData?: string[];
  /** How to complete it, in prose. */
  howToComplete: string;
  /** Ordered, concrete steps. */
  stepByStepActions: string[];
  expectedOutcome: string;
  riskIfIgnored: string;
  /** How the app/admin knows the task is done. */
  completionCriteria: string;
  sourceEngine: SourceEngine;
  relatedLinks: RelatedLink[];
  /**
   * True for initial/config recommendations surfaced when live analytics
   * are thin. Labelled in the UI so seeds are never mistaken for measured
   * analytics.
   */
  isSeed?: boolean;
}

/** Owner state persisted client-side and merged onto a Recommendation. */
export interface OverrideRecord {
  status: 'in_progress' | 'completed' | 'dismissed' | 'snoozed';
  /** ISO date-time the snooze expires (status reverts to active after). */
  snoozedUntil?: string;
  note?: string;
  dismissedReason?: string;
  completedAt?: string;
  /** Priority score when the owner acted — used to detect a worsening reopen. */
  scoreAtAction?: number;
  updatedAt: string;
}

export type OverrideMap = Record<string, OverrideRecord>;

/** A recommendation with the owner's overlay applied (what the UI renders). */
export interface RecommendationView extends Recommendation {
  status: RecommendationStatus;
  note?: string;
  snoozedUntil?: string;
  completedAt?: string;
  dismissedReason?: string;
  /**
   * True when a previously-completed recommendation's score has risen
   * meaningfully since it was completed (the underlying issue got worse).
   */
  reopened?: boolean;
}

/** Admin-configurable engine behaviour (persisted client-side). */
export interface CommandCenterSettings {
  /** Cap the number of active recommendations shown in the Today list. */
  maxPerDay: number;
  /** Hide low-band recommendations from the Today list. */
  hideLowPriority: boolean;
  /** Default snooze length in days. */
  defaultSnoozeDays: number;
  /** Only alert (executive summary) at or above this score. */
  alertThreshold: number;
  /** Recommendation types the owner has switched off. */
  disabledTypes: RecommendationType[];
  /** Whether to include the always-on baseline/seed recommendations. */
  includeBaseline: boolean;
}

export const DEFAULT_SETTINGS: CommandCenterSettings = {
  maxPerDay: 12,
  hideLowPriority: false,
  defaultSnoozeDays: 3,
  alertThreshold: 70,
  disabledTypes: [],
  includeBaseline: true,
};

// ── Display helpers ─────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<RecommendationType, string> = {
  data_gap: 'Data gap',
  feature_readiness: 'Feature readiness',
  ai_quality: 'AI quality',
  user_onboarding: 'Onboarding',
  seo_growth: 'SEO / growth',
  content_gap: 'Content gap',
  tutorial_gap: 'Tutorial gap',
  analytics_gap: 'Analytics gap',
  product_quality: 'Product quality',
  conversion: 'Conversion',
  retention: 'Retention',
  security: 'Security',
  performance: 'Performance',
  documentation: 'Documentation',
  admin_configuration: 'Admin config',
  testing: 'Testing',
  monetization: 'Monetization',
  user_feedback: 'User feedback',
  system_health: 'System health',
};

/** Which category a type rolls up to (used when a rule doesn't override it). */
export const TYPE_CATEGORY: Record<RecommendationType, RecommendationCategory> = {
  data_gap: 'Data',
  feature_readiness: 'Product',
  ai_quality: 'AI',
  user_onboarding: 'User Experience',
  seo_growth: 'SEO',
  content_gap: 'Content',
  tutorial_gap: 'Documentation',
  analytics_gap: 'Analytics',
  product_quality: 'Product',
  conversion: 'Growth',
  retention: 'Growth',
  security: 'Security',
  performance: 'Performance',
  documentation: 'Documentation',
  admin_configuration: 'Admin Operations',
  testing: 'Engineering',
  monetization: 'Monetization',
  user_feedback: 'Data',
  system_health: 'Engineering',
};

export const BAND_LABELS: Record<PriorityBand, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** Statuses considered "actionable" (eligible for the Today list & focus). */
export const ACTIONABLE_STATUSES: RecommendationStatus[] = ['new', 'active', 'in_progress'];
