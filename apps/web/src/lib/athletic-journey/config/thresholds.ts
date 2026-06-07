// ============================================================
// SwingVantage — Athletic Journey: tuning thresholds
// ------------------------------------------------------------
// Every "magic number" the engine reasons with, named and
// documented in ONE place (mirrors lib/agi/config/thresholds).
// Scores are 0–100; confidences/coverage are 0–1; stage orders 0–10.
// ============================================================

export const JOURNEY_THRESHOLDS = {
  /** Number of stages per sport (G0..G10 / T0..T10). */
  stageCount: 11,
  maxOrder: 10,

  /** How much each *source* contributes to the blended stage order. */
  sourceWeights: {
    rating: 0.5,
    selfReport: 0.3,
    performance: 0.2,
  },

  /** Confidence each source can carry on its own. */
  sourceConfidence: {
    rating: { verified: 0.95, imported: 0.8, coach_entered: 0.75, self_reported: 0.55, estimated: 0.4 },
    selfReport: 0.45, // self-report is intentionally capped low
    performance: 0.8,
  },

  /** Stage-order guardrails so elite/pro are never claimed cheaply. */
  guards: {
    /** Above this order requires real competitive evidence. */
    eliteOrder: 9,
    /** Pro tier (order 10) requires verified competitive evidence. */
    proOrder: 10,
    /** Without competitive evidence, classification is capped here. */
    nonCompetitiveCap: 8,
    /** Without a verified/competition signal, cap stays here for elite. */
    unverifiedEliteCap: 8,
  },

  /** Confidence banding from the 0..1 composite confidence score. */
  confidenceBands: { high: 0.72, medium: 0.5, low: 0.3 },

  /** A category needs at least this confidence to count as "covered". */
  categoryCoveredAt: 0.25,

  /** Strength = category score at/above this. Gap = at/below gapBelow. */
  strengthAt: 68,
  gapBelow: 55,

  /** Rating alignment: |ratingOrder - perfOrder| within this = aligned. */
  alignmentBand: 1.1,

  /** Momentum sub-weights (sum 1.0). */
  momentum: {
    weights: {
      recency: 0.22,
      practiceVolume: 0.18,
      uploads: 0.14,
      drills: 0.12,
      competitions: 0.1,
      streak: 0.1,
      trend: 0.08,
      recommendations: 0.06,
    },
    bands: { inactive: 20, low: 40, building: 60, strong: 80 }, // upper bounds
    /** Activity older than this many days decays recency to 0. */
    recencyWindowDays: 21,
    /** Saturation points — value at which a driver hits 100. */
    saturation: {
      practiceSessions: 12,
      uploads: 9,
      drills: 15,
      competitions: 5,
      streakDays: 14,
      recommendations: 6,
    },
  },

  /** Regression risk: flagged when inactive this long with a prior history. */
  regression: { inactiveDays: 21 },

  /** Performance index → stage order is deliberately conservative:
   *  video/technique quality is not the same as competitive stage. */
  performanceOrder: {
    /** A 0..100 perf index maps across this order span (compressed). */
    minOrder: 1,
    maxOrder: 8,
  },
} as const;

export const JOURNEY_VERSION = 'athletic-journey-1.0.0';

export const JOURNEY_DISCLAIMER =
  'Your Athletic Journey is a development guide, not a verified ranking. Stage estimates ' +
  'blend your profile, ratings, videos, logged play, and practice — single-camera video ' +
  'is an estimate, not a lab measurement, and self-reported data is labeled as such. ' +
  'Nothing here guarantees a competitive outcome, and none of it is medical advice.';
