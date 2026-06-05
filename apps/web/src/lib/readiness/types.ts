// ============================================================
// SwingVantage — Readiness Engine: Types
// ------------------------------------------------------------
// Two transparent, deterministic guidance scores:
//   - ReadinessScore: are you set up to train well right now?
//   - GameReadyScore: how ready does your swing look for competition?
//
// HONESTY: these are guidance, not certainty. Every point carries a
// plain-language factor, a safety override beats any score, and the
// bands are deliberately non-clinical ("building → sharp").
// ============================================================

import type { TrendDirection } from '@/lib/agents';
import type { RetestOutcome } from '@/lib/retest';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Honest, non-clinical score bands. */
export type ScoreBand = 'building' | 'developing' | 'solid' | 'sharp';

/** One transparent contribution to a score. */
export interface ScoreFactor {
  label: string;
  /** Signed contribution, shown so the score is never a black box. */
  contribution: number;
}

export interface TransparentScore {
  /** 0–100 guidance score. */
  score: number;
  band: ScoreBand;
  headline: string;
  factors: ScoreFactor[];
  /** A safety note that overrides the number (e.g. flagged discomfort). */
  caution: string | null;
  /** Always present — reminds the user this is guidance, not a measurement. */
  basis: string;
}

/**
 * The shared signal set both scores read from. All of it is already produced
 * by existing systems (agent context, retest engine, progress memory, the
 * DrillMatch feedback loop) — the engine only weighs it.
 */
export interface PerformanceSignals {
  /** Consecutive practice days (0 if none). */
  practiceStreakDays: number;
  sessionsLogged: number;
  hasActivePlan: boolean;
  planCompleted: boolean;
  daysSinceLastActivity: number | null;
  /** Confidence of the most recent analysis/retest, if known. */
  analysisConfidence: ConfidenceLevel | null;
  trendDirection: TrendDirection;
  /** Outcome of the most recent completed retest, if any. */
  latestRetestOutcome: RetestOutcome | null;
  /** True when the user flagged pain/discomfort (drill verdict or practice log). */
  painFlag: boolean;
  /** How many distinct issues keep recurring. */
  recurringFaultCount: number;
}
