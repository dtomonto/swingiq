// ============================================================
// SwingVantage — BodySync: Health-Performance Intelligence types
//
// The single, vendor-neutral data model for the health/wearable layer.
// Everything from a manual check-in to an Apple Watch HRV sample normalizes
// into these shapes, so the scoring/coaching engines never depend on any one
// device or provider.
//
// PRIVACY: this layer is consent-gated and minimization-first. We store
// normalized summaries + the user's own check-ins, never raw device payloads
// in Phase 1. SwingVantage is NOT a medical device (see constants.ts).
// ============================================================

import type { SportId } from '@swingiq/core';

// ── Providers + connections ──────────────────────────────────
export type HealthProviderId =
  | 'manual'
  | 'apple_health'
  | 'apple_watch'
  | 'google_fit'
  | 'health_connect'
  | 'garmin'
  | 'whoop'
  | 'oura'
  | 'fitbit'
  | 'polar'
  | 'samsung_health';

/** How a provider's data realistically reaches a web-first app. */
export type IntegrationMethod =
  | 'manual' // user-entered
  | 'oauth' // server-side OAuth partner API (Garmin/WHOOP/Oura/Fitbit/Polar)
  | 'companion_app' // native iOS/Android wrapper bridges HealthKit/Health Connect
  | 'health_connect' // Android Health Connect aggregation
  | 'file_import' // Apple Health export.zip / Google Takeout
  | 'shortcuts'; // iOS Shortcuts automation POSTing to our API

export type ConnectionStatus =
  | 'not_connected'
  | 'manual' // active via manual entry
  | 'connected'
  | 'syncing'
  | 'error'
  | 'coming_soon'; // adapter exists, credentials/app not yet available

export interface HealthConnection {
  provider: HealthProviderId;
  status: ConnectionStatus;
  method: IntegrationMethod;
  connectedAt: string | null;
  lastSyncAt: string | null;
  /** Non-sensitive, user-facing note (never a token). */
  note?: string;
}

// ── Permission scopes (granular consent) ─────────────────────
export type HealthCategory = 'recovery' | 'activity' | 'cardio' | 'mobility' | 'wellness';

/** Per-category consent. Absent/false = SwingVantage may not use that data. */
export type HealthPermissions = Record<HealthCategory, boolean>;

// ── Normalized metric model (the extensible pipeline target) ──
export type MetricType =
  // recovery / readiness
  | 'sleep_duration' | 'sleep_quality' | 'resting_hr' | 'hrv' | 'recovery_score'
  | 'readiness_score' | 'respiratory_rate' | 'spo2' | 'body_temp_deviation'
  // activity / load
  | 'steps' | 'active_calories' | 'total_calories' | 'exercise_minutes'
  | 'training_load' | 'acute_load' | 'chronic_load' | 'intensity_minutes' | 'cardio_load'
  // cardio
  | 'heart_rate' | 'max_hr' | 'vo2max' | 'cardio_recovery'
  // mobility
  | 'walking_steadiness' | 'gait' | 'balance' | 'mobility_score' | 'range_of_motion';

export type Confidence = 'low' | 'moderate' | 'high';

/**
 * One normalized sample. Whether it came from a watch, a ring, or a manual
 * entry, it lands here. `rawRef` points to an external blob if/when we ever
 * keep one (we don't in Phase 1).
 */
export interface HealthMetricSample {
  provider: HealthProviderId;
  device?: string;
  category: HealthCategory;
  metricType: MetricType;
  value: number;
  unit: string;
  confidence: Confidence;
  /** Aggregation window (e.g. a night of sleep). */
  windowStart?: string;
  windowEnd?: string;
  timestamp: string;
  rawRef?: string | null;
}

// ── Manual wellness check-in (Phase 1 primary input) ─────────
export type BodyRegion =
  | 'neck' | 'shoulder' | 'elbow' | 'wrist' | 'forearm' | 'upper_back'
  | 'lower_back' | 'hip' | 'groin' | 'hamstring' | 'knee' | 'ankle' | 'foot' | 'other';

/**
 * Subjective scales are 1–5 and parent-friendly. Direction is documented per
 * field: "higher better" vs "higher worse". `null` = not answered.
 */
export interface ManualCheckin {
  id: string;
  date: string; // YYYY-MM-DD (one canonical check-in per day; latest wins)
  createdAt: string;
  sleepHours: number | null; // actual hours slept
  sleepQuality: number | null; // 1–5, higher better
  energy: number | null; // 1–5, higher better
  soreness: number | null; // 1–5, higher = MORE sore
  pain: number | null; // 1–5, higher = MORE pain
  painAreas: BodyRegion[];
  stress: number | null; // 1–5, higher = MORE stressed
  hydration: number | null; // 1–5, higher better
  mentalFocus: number | null; // 1–5, higher better
  warmupQuality: number | null; // 1–5, higher better
  practiceIntensity: number | null; // 0–5 (planned/recent), higher = harder
  illness: boolean;
  travelFatigue: boolean;
  alcohol: boolean;
  notes: string;
}

/** Per-user objective baselines (manually set or learned from history). */
export interface HealthBaselines {
  restingHr: number | null;
  hrv: number | null;
  sleepHours: number | null;
  updatedAt: string | null;
}

// ── Derived scores ───────────────────────────────────────────
export interface ScoreResult {
  /** 0–100. Higher = better (more ready / more recovered / more opportunity). */
  score: number;
  confidence: Confidence;
  /** Plain-English contributors, signed for transparency. */
  contributors: Array<{ label: string; impact: number }>;
  /** Inputs we wanted but didn't have (drives the confidence + honesty). */
  missing: string[];
}

export type ReadinessZone = 'green' | 'yellow' | 'orange' | 'red';

export interface InjuryRiskFlag {
  level: 'none' | 'watch' | 'elevated';
  reasons: string[];
  regions: BodyRegion[];
}

export interface ReadinessAssessment {
  date: string;
  zone: ReadinessZone;
  readiness: ScoreResult;
  recovery: ScoreResult;
  trainingLoad: ScoreResult; // higher score = MORE load accumulated
  performanceOpportunity: ScoreResult;
  injuryRisk: InjuryRiskFlag;
  confidence: Confidence;
  /** One-line plain-English headline. */
  summary: string;
}

// ── Health-aware coaching output ─────────────────────────────
export type SessionType =
  | 'recovery' | 'mobility' | 'light_technical' | 'technical'
  | 'full_practice' | 'speed_power' | 'performance';

export interface CoachingRecommendation {
  zone: ReadinessZone;
  sessionType: SessionType;
  durationMinutes: number;
  /** 0–100 cap on intended effort/speed for the day. */
  intensityCap: number;
  warmup: string;
  drillDifficulty: 'easy' | 'moderate' | 'hard';
  volume: 'minimal' | 'reduced' | 'normal' | 'extended';
  restRecommended: boolean;
  recoveryNote: string;
  injuryNote: string | null;
  confidence: Confidence;
  /** Plain-English reasons the AI adjusted today's plan. */
  explanation: string[];
  /** Sport-specific cues (rotational load, shoulder/elbow, walking fatigue…). */
  sportNotes: string[];
}

// ── Insights / correlations ──────────────────────────────────
export type InsightKind =
  | 'correlation' | 'trend' | 'risk' | 'opportunity' | 'pattern' | 'coaching_change';

export interface HealthInsight {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  confidence: Confidence;
  category: HealthCategory | 'performance';
  createdAt: string;
}

// ── Provider catalog descriptor (the connector framework) ────
export interface ProviderDescriptor {
  id: HealthProviderId;
  name: string;
  method: IntegrationMethod;
  status: ConnectionStatus;
  /** Which normalized categories this provider can supply. */
  categories: HealthCategory[];
  /** Honest, user-facing "how this connects" line. */
  howItConnects: string;
  /** Whether real connection needs server-side credentials (Phase 2+). */
  requiresCredentials: boolean;
  icon: string; // emoji, keeps it dependency-free + premium-feeling
}

// ── BodySync persisted state (self-contained store) ──────────
export interface BodySyncSettings {
  /** Master switch: BodySync only influences coaching when the user opts in. */
  enabled: boolean;
  /** User accepted the consent + non-medical disclaimer. */
  consentedAt: string | null;
  /** Optional cycle tracking, off by default, enhanced-privacy. */
  cycleTrackingEnabled: boolean;
  /** Let a parent/coach see high-level readiness only. */
  shareReadinessWithCoach: boolean;
}

export interface BodySyncState {
  version: 1;
  settings: BodySyncSettings;
  permissions: HealthPermissions;
  connections: HealthConnection[];
  checkins: ManualCheckin[];
  baselines: HealthBaselines;
}

export type { SportId };
