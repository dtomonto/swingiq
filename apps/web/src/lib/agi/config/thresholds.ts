// ============================================================
// SwingVantage — AGI: Tuning thresholds (single source of truth)
// ------------------------------------------------------------
// Every "magic number" the engine reasons with, named and documented in ONE
// place so it can be tuned (eventually from outcome data — see docs/audit R13)
// without hunting through reasoning/trust/worldModel. The golden-athlete eval
// (`npm run eval:agi`) guards against a tuning change that degrades output.
// Scores are 0–100; confidences/coverage are 0–1.
// ============================================================

export const AGI_THRESHOLDS = {
  /** Score bands (worldModel.scoreBand). */
  band: { sharp: 80, solid: 60, developing: 40 },

  /** A model is "thin" (copy softened, confidence capped) below either bound. */
  thin: { maxSessions: 3, minCoverage: 0.35, cappedConfidence: 0.5 },

  /** Keystone = weakest capability; only flagged a keystone below maxScore. */
  keystone: { maxScore: 68, weaknessDenominator: 60 },

  /** Strength insight only for capabilities at/above this score. */
  strength: { minScore: 70 },

  /** Capability trajectory direction band (|Δ| within this = flat). */
  trajectory: { flatBand: 3 },

  /** Imbalance insight: min per-sport score gap to flag. */
  imbalance: { minGap: 15 },

  /** Consistency insight: needs this many sessions + this much score scatter. */
  consistency: { minSessions: 3, minStdev: 8 },

  /** Recurring-fault insight: a fault must recur in at least this many sessions. */
  recurring: { minSessions: 2 },

  /** Plateau insight: needs this many tracked points to call a stall. */
  plateau: { minPoints: 3 },

  /** Trust grade (trust.gradeModel). */
  trust: {
    weights: { coverage: 45, basis: 30, depth: 15, breadth: 10 },
    /** Below this average basis rank (0–4), nudge a 2-camera measured capture. */
    basisEstimateCutoff: 3.5,
    /** Sessions for full depth credit. */
    depthFullAt: 6,
    grade: { A: 80, B: 60, C: 40 },
  },
} as const;
