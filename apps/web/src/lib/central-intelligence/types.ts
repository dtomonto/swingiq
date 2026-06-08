// ============================================================
// CentralIntelligenceOS — Type vocabulary
// ------------------------------------------------------------
// Framework-agnostic data shapes for the platform intelligence brain:
// ethical user memory (six layers), profile-completion, valid-session
// counting, Founding Fathers campaign status, and the recommendations
// engine. Pure types only — no React, no DOM, no secrets.
// ============================================================

import type { SportId } from '@swingiq/core';

// ── Memory layers ─────────────────────────────────────────────
// Every stored memory belongs to exactly one layer. The layer drives
// visibility, retention, and where the memory may be surfaced.

export type MemoryLayer =
  | 'user' // private to one user — coaching, dashboards, resume
  | 'sport' // sport-specific patterns for the user (golf ≠ tennis)
  | 'session' // a single practice/analysis session
  | 'longitudinal' // aggregated user history across time (trends)
  | 'aggregate' // anonymized, privacy-protected product intelligence
  | 'governance'; // admin-only compliance/consent/audit logs

/** Where a memory may be read. Enforced by the access helpers. */
export type VisibilityScope = 'private' | 'admin' | 'anonymized';

/** Why we are allowed to keep this memory (privacy purpose binding). */
export type ConsentBasis =
  | 'service' // required to operate the feature the user asked for
  | 'personalization' // improves the user's own experience
  | 'product_improvement' // anonymized/aggregated product learning
  | 'legal'; // retained to meet a legal/compliance obligation

export type MemoryType =
  | 'identity'
  | 'profile'
  | 'sport_profile'
  | 'equipment'
  | 'session'
  | 'coaching'
  | 'recurring_issue'
  | 'goal'
  | 'constraint'
  | 'preference'
  | 'usage'
  | 'consent'
  | 'governance';

export interface UserMemory {
  id: string;
  userId: string;
  layer: MemoryLayer;
  memoryType: MemoryType;
  sport: SportId | null;
  title: string;
  summary: string;
  /** Optional structured payload (kept small; never raw media). */
  data?: Record<string, unknown>;
  sourceType: 'session' | 'profile' | 'equipment' | 'note' | 'system' | 'admin';
  sourceId: string | null;
  /** 0–1 confidence the memory is accurate (e.g. derived vs stated). */
  confidence: number;
  /** 0–1 how important this is for future coaching (drives recall ordering). */
  importance: number;
  visibility: VisibilityScope;
  consentBasis: ConsentBasis;
  createdAt: string;
  updatedAt: string;
  /** ISO date after which the memory should be purged, or null to keep. */
  expiresAt: string | null;
}

// ── Profile completion ────────────────────────────────────────

export type ProfileFieldKind = 'text' | 'choice' | 'number' | 'equipment';

/** A single required-or-optional profile field, declared as data. */
export interface ProfileFieldSpec {
  /** Storage key (golf: GolferProfileInput key; else sportProfiles[sport] key). */
  key: string;
  label: string;
  kind: ProfileFieldKind;
  /** Required fields gate "profile complete"; optional ones add polish. */
  required: boolean;
  /** Short why-it-matters line shown in prompts (coaching value). */
  why: string;
}

export interface ProfileCompletion {
  sport: SportId | null;
  completionPercent: number;
  completed: boolean;
  /** Required fields still missing, ordered by coaching value. */
  missingRequiredFields: ProfileFieldSpec[];
  /** Optional fields still missing (nice-to-have). */
  missingOptionalFields: ProfileFieldSpec[];
  /** The single highest-value next field to ask for (progressive profiling). */
  nextPrompt: ProfileFieldSpec | null;
  /** When the profile first crossed the complete threshold (ISO), if known. */
  completedAt: string | null;
}

// ── Valid sessions ────────────────────────────────────────────

export type SessionSource =
  | 'manual'
  | 'video'
  | 'image'
  | 'launch_monitor'
  | 'simulator'
  | 'practice';

export interface SessionValidity {
  valid: boolean;
  /** Why it does (or does not) count, for transparency in the admin view. */
  reason: string;
  source: SessionSource;
}

/** A normalized, source-agnostic view of one recorded session. */
export interface SessionSummaryForMemory {
  id: string;
  sport: SportId;
  source: SessionSource;
  date: string;
  /** One-line plain-English summary used to seed coaching memory. */
  headline: string;
  primaryIssue: string | null;
  score: number | null;
  shotCount: number;
}

// ── Founding Fathers campaign ─────────────────────────────────

export type FoundingCampaignStatus =
  | 'not_started' // no profile, no sessions
  | 'profile_incomplete' // has begun but profile not complete
  | 'profile_complete_sessions_needed' // profile done, < required sessions
  | 'qualified' // both conditions met
  | 'waitlisted_after_1000' // qualified-eligible but the 1000 spots are gone
  | 'disqualified'; // abuse/fraud handling only

/** The user's own progress — computed locally, never trusts the client for #. */
export interface FoundingUserProgress {
  profileCompleted: boolean;
  profileCompletionPercent: number;
  validSessionCount: number;
  requiredSessions: number;
  /** True when both local conditions are met (eligible to CLAIM a number). */
  eligible: boolean;
  status: FoundingCampaignStatus;
  /** Server-assigned, tamper-proof. Null until claimed + confirmed. */
  memberNumber: number | null;
  qualifiedAt: string | null;
}

/** Public, privacy-safe campaign progress (no individual data). */
export interface FoundingCampaignProgress {
  qualifiedCount: number;
  requiredCount: number;
  remaining: number;
  full: boolean;
  membershipTiersEnabled: boolean;
  /** Why tiers are (or aren't) unlocked — for honest admin display. */
  membershipUnlockReason: string;
}

// ── Recommendations engine ────────────────────────────────────

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type RecommendationArea =
  | 'onboarding'
  | 'profile'
  | 'sessions'
  | 'coaching'
  | 'retention'
  | 'growth'
  | 'content'
  | 'product'
  | 'data_governance';

export type RecommendationStatus = 'open' | 'in_progress' | 'done' | 'dismissed';

export interface IntelligenceRecommendation {
  id: string;
  title: string;
  rationale: string;
  expectedImpact: string;
  priority: RecommendationPriority;
  area: RecommendationArea;
  /** Which user segment this targets (e.g. "profile complete, < 10 sessions"). */
  segment: string;
  suggestedImplementation: string;
  status: RecommendationStatus;
}

// ── Aggregate (anonymized) product intelligence ───────────────

export interface AggregateBucket {
  label: string;
  count: number;
  /** Percent of the cohort, 0–100. Suppressed when below the cohort threshold. */
  percent: number;
}

export interface AggregateDistribution {
  dimension: string;
  total: number;
  /** Empty when the cohort is too small to anonymize safely. */
  buckets: AggregateBucket[];
  suppressed: boolean;
}
