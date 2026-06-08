// ============================================================
// SwingVantage — Mental Performance: type vocabulary
//
// The single data model for the emotion-management / mistake-recovery
// pillar. Pure types only — no React, no DOM, no secrets. Mirrors the
// BodySync philosophy: a self-contained, local-first, consent-gated layer
// that never touches the main Zustand store.
//
// SAFETY: this is performance coaching, NOT therapy or clinical mental-
// health care (see constants.ts NON_MEDICAL_DISCLAIMER + crisis.ts).
// ============================================================

import type { SportId } from '@swingiq/core';

/** Every sport plus a sport-agnostic bucket for universal routines/plans. */
export type MentalSport = SportId | 'universal';

// ── Emotional states (athlete-friendly, never clinical) ──────
// These are competitive/performance emotions, deliberately phrased as
// transient sport reactions — never diagnoses.
export type EmotionalState =
  | 'frustrated'
  | 'angry'
  | 'embarrassed'
  | 'nervous'
  | 'distracted'
  | 'rushed'
  | 'overthinking'
  | 'defeated'
  | 'afraid_repeat'
  | 'too_excited'
  | 'too_cautious'
  | 'calm_uncertain';

/** Broad emotional family — drives which kind of reset the coach prefers. */
export type EmotionFamily = 'frustration' | 'fear' | 'arousal_high' | 'arousal_low' | 'mixed';

/**
 * How a mistake happened, for racket/court sports especially. The coach's
 * response branches on this:
 *  - forced: opponent created the pressure → tactical acceptance + adjust.
 *  - unforced: athlete had control → calm diagnosis + simple correction.
 *  - strategic: wrong shot selection → pattern recognition.
 *  - emotional: frustration changed execution → nervous-system reset.
 */
export type ErrorClass = 'forced' | 'unforced' | 'strategic' | 'emotional';

/** Mistake/event id — catalog lives in constants.ts MISTAKE_CATEGORIES. */
export type MistakeCategory = string;

// ── Routines ─────────────────────────────────────────────────
export type RoutineType =
  | 'reset' // post-mistake reset
  | 'pre_performance' // first tee / pre-game / pre-match
  | 'between' // between point / pitch / shot / hole
  | 'post_error' // dedicated error recovery
  | 'reflection' // post-session
  | 'meditation' // on-course / on-field calm + focus
  | 'confidence'; // rebuild belief

export type RoutineLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

export interface MentalRoutine {
  /** Stable, unique id — equals `slug`. */
  id: string;
  /** Situation slug used in the URL, e.g. 'bad-shot-reset'. */
  slug: string;
  /**
   * Every sport this routine serves. One routine can cover a whole family
   * (e.g. 'error-recovery' → baseball + both softball codes) so shared content
   * isn't triplicated. 'universal' routines apply to every sport.
   */
  sports: MentalSport[];
  title: string;
  /** Human-readable situation label, e.g. 'After a bad tee shot'. */
  situation: string;
  durationSeconds: number;
  level: RoutineLevel;
  routineType: RoutineType;
  goal: string;
  steps: string[];
  breathPattern: string;
  selfTalkCue: string;
  physicalAnchor: string;
  reflectionPrompt: string;
  whenToUse: string;
  howToPractice: string;
  /** Non-alarming safety note, or null. */
  safetyNote: string | null;
  /** Mistake-category ids + fault keywords this routine answers (for matching). */
  appliesTo: string[];
  tags: string[];
}

// ── Coach (deterministic, keyless) ───────────────────────────
export type CoachTone = 'calm' | 'direct' | 'encouraging' | 'tactical';

export type CoachMode =
  | 'reset' // in-the-moment reset
  | 'reflect' // post-session reflection
  | 'plan' // build a training block
  | 'confidence' // confidence rebuild
  | 'pre_game' // competition preparation
  | 'parent_coach'; // guidance for a parent/coach

export type CoachWhen = 'just_now' | 'last_play' | 'earlier' | 'before_play';

export interface CoachInput {
  sport: MentalSport;
  mistake?: MistakeCategory | null;
  emotion?: EmotionalState | null;
  when?: CoachWhen;
  /** Did it affect the next play/shot/point/swing? */
  affectedNext?: boolean;
  mode?: CoachMode;
  /** Optional free text — screened for crisis/medical language before use. */
  freeText?: string;
}

export type CoachResponseKind = 'coaching' | 'crisis' | 'medical_redirect';

export interface CoachDrill {
  name: string;
  how: string;
}

export interface CoachResponse {
  kind: CoachResponseKind;
  /** The recommended reset routine (null for crisis/medical redirect). */
  routine: MentalRoutine | null;
  /** Short, non-pathologizing explanation of what happened mentally. */
  whatHappened: string;
  /** Sport-specific next-action cue. */
  nextActionCue: string;
  selfTalk: string;
  breathPattern: string;
  visualization: string | null;
  drill: CoachDrill | null;
  reflectionPrompt: string;
  /** A recommendation for future training. */
  futureTraining: string;
  errorClass: ErrorClass | null;
  tone: CoachTone;
  disclaimer: string;
  /** Present when kind is 'crisis' or 'medical_redirect'. */
  safety?: CrisisReferral;
}

// ── Safety ───────────────────────────────────────────────────
export type CrisisSeverity = 'none' | 'support' | 'urgent';

export interface CrisisResource {
  label: string;
  detail: string;
  contact: string;
}

export interface CrisisReferral {
  flagged: boolean;
  severity: CrisisSeverity;
  heading: string;
  message: string;
  resources: CrisisResource[];
}

// ── Player mental profile (lives in the mental store, not main profile) ──
export type ResetStyle = 'breath' | 'physical' | 'verbal' | 'visual';
export type SelfTalkPreference = 'short_cue' | 'detailed';

export interface MentalProfile {
  preferredResetStyle: ResetStyle | null;
  preferredTone: CoachTone | null;
  commonTriggers: EmotionalState[];
  sportFocus: MentalSport | null;
  /** 1–5, higher = more comfortable under pressure. */
  pressureComfort: number | null;
  /** 1–5, higher = more confident. */
  confidence: number | null;
  /** 1–5, higher = better focus. */
  focus: number | null;
  /** 1–5, higher = recovers faster from a mistake. */
  recoverySpeed: number | null;
  selfTalkPreference: SelfTalkPreference | null;
  notes: string;
  updatedAt: string | null;
}

// ── Journal log (consent-gated storage) ──────────────────────
export type SessionType = 'practice' | 'competition' | 'casual' | 'lesson';

export interface MentalLog {
  id: string;
  /** ISO datetime. */
  date: string;
  sport: MentalSport;
  sessionType: SessionType | null;
  mistake: MistakeCategory | null;
  emotion: EmotionalState | null;
  /** 1–5 emotional intensity. */
  intensity: number | null;
  /** 1–5, higher = recovered faster. */
  recoverySpeed: number | null;
  whatIDidNext: string;
  whatWorked: string;
  whatDidnt: string;
  nextTimeCue: string;
  /** 1–5. */
  confidence: number | null;
  focus: number | null;
  composure: number | null;
  /** Routine id used, if any. */
  routineUsed: string | null;
  /** 1–5 rating of the routine's effectiveness. */
  effectiveness: number | null;
  reflection: string;
}

// ── Journal insights (derived) ───────────────────────────────
export interface MentalJournalInsights {
  total: number;
  topTriggers: Array<{ emotion: EmotionalState; count: number }>;
  topMistakes: Array<{ mistake: MistakeCategory; count: number }>;
  fastestRecovery: Array<{ context: string; avg: number }>;
  slowestRecovery: Array<{ context: string; avg: number }>;
  composureTrend: TrendPoint[];
  confidenceTrend: TrendPoint[];
  pressureReadiness: number | null; // 0–100 rollup, or null when too little data
  headline: string;
}

export interface TrendPoint {
  date: string;
  value: number;
}

// ── Training plans ───────────────────────────────────────────
export interface PlanDay {
  day: number;
  title: string;
  skillFocus: string;
  exercise: string;
  sportApplication: string;
  reflectionPrompt: string;
  progressMarker: string;
  routineId: string | null;
}

export type PlanType =
  | 'reset_7'
  | 'composure_14'
  | 'confidence_30'
  | 'tournament'
  | 'pre_round'
  | 'game_day'
  | 'match_day'
  | 'pressure'
  | 'mistake_recovery'
  | 'parent_coach';

export interface TrainingPlan {
  id: string;
  title: string;
  slug: string;
  sport: MentalSport;
  durationDays: number;
  level: RoutineLevel;
  goal: string;
  planType: PlanType;
  summary: string;
  days: PlanDay[];
}

export interface PlanAssignment {
  id: string;
  planId: string;
  status: 'active' | 'completed' | 'abandoned';
  startDate: string;
  currentDay: number;
  completedDays: number[];
  completionDate: string | null;
  createdAt: string;
}

// ── CentralIntelligenceOS — Mental Performance Intelligence ───
/**
 * Anonymized, aggregate signals (k-anonymity enforced upstream). Fed by the
 * MentalAggregateSource seam — deterministic seed data this pass, a real
 * backend later. NEVER contains identifiable per-user data.
 */
export interface MentalIntelligenceSignals {
  /** Distinct users who have logged at least one mental moment. */
  activeUsers: number;
  /** Emotional triggers by sport (anonymized counts). */
  triggersBySport: Array<{ sport: MentalSport; emotion: EmotionalState; count: number }>;
  /** Mistake categories driving logs (anonymized counts). */
  mistakeCounts: Array<{ sport: MentalSport; mistake: MistakeCategory; count: number }>;
  /** Routine completions + helpfulness. */
  routineStats: Array<{
    routineId: string;
    starts: number;
    completions: number;
    avgEffectiveness: number; // 1–5
  }>;
  /** Preference signal: are short (≤30s) routines completed more than long ones? */
  shortVsLong: { shortCompletionRate: number; longCompletionRate: number };
  /** Sport+situation combos that have logs but no routine yet (content gaps). */
  contentGaps: Array<{ sport: MentalSport; situation: string; demand: number }>;
}

export interface MentalInsight {
  id: string;
  kind: 'pattern' | 'gap' | 'engagement' | 'trend' | 'risk';
  sport: MentalSport | null;
  title: string;
  detail: string;
  /** 0–1. */
  confidence: number;
}

// ── GrowthOS — Mental Performance opportunities ──────────────
export type MentalOpportunityType =
  | 'seo_page'
  | 'aeo_answer'
  | 'blog'
  | 'social'
  | 'internal_link'
  | 'email'
  | 'tutorial';

export interface MentalGrowthOpportunity {
  id: string;
  opportunityType: MentalOpportunityType;
  sport: MentalSport;
  keywordCluster: string;
  recommendedAsset: string;
  rationale: string;
  /** 0–100. */
  priorityScore: number;
  status: 'open' | 'in_progress' | 'done' | 'dismissed';
}

// ── Persisted state (self-contained local-first store) ───────
export interface MentalSettings {
  /** Master switch — the user opts in before anything personalizes. */
  enabled: boolean;
  consentedAt: string | null;
  /** Separate, explicit consent to STORE journal logs (data minimization). */
  storeLogs: boolean;
  /**
   * Separate, explicit opt-in to contribute ANONYMIZED, aggregate-only signals
   * (sport, emotion, mistake category, routine used + effectiveness — never
   * free text, never identity) so the platform can improve routines for
   * everyone. OFF by default. Gates the telemetry pipe (telemetry.ts).
   */
  shareAnonymousInsights: boolean;
  preferredTone: CoachTone | null;
  /** Last situation the coach answered, to resume context. */
  lastSituation: string | null;
}

export interface MentalState {
  version: 1;
  settings: MentalSettings;
  profile: MentalProfile;
  logs: MentalLog[];
  planAssignments: PlanAssignment[];
}

export type { SportId };
