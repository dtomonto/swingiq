// ============================================================
// SwingVantage — Agent: Churn-Risk Scoring — Types
// ------------------------------------------------------------
// The deterministic "who is about to leave" signal. Pure data
// shapes shared by the engine, the dispatch agent (which acts on
// the risk), and the UI. No React, no DOM, no AI.
//
// HONESTY: every score is additive from named drivers the user's
// own data supports. There is no hidden model and no invented
// number — `drivers` always explains exactly why the score is
// what it is.
// ============================================================

import type { ConfidenceLevel } from '../types';

/** Risk bands, coarsest-to-finest action urgency. */
export type ChurnBand = 'safe' | 'watch' | 'at_risk' | 'critical';

/** A stable id for each thing that can raise (or lower) risk. */
export type ChurnDriverId =
  | 'recency'
  | 'frequency_decline'
  | 'shallow_engagement'
  | 'progress_declining'
  | 'progress_plateau'
  | 'negative_sentiment'
  | 'stalled_plan'
  | 'low_readiness';

/** A single named contribution to the score (positive = raises risk). */
export interface ChurnDriver {
  id: ChurnDriverId;
  /** Points added to the 0–100 risk score (can be 0 when only informational). */
  weight: number;
  /** Plain-English reason, grounded in the user's data. */
  reason: string;
}

/** How the dispatch agent should act on this risk. */
export interface ChurnIntervention {
  /** Higher = reach out sooner. 0 = do nothing. */
  urgency: 0 | 1 | 2 | 3;
  /** Suggested first channel (the dispatch agent makes the final call). */
  channelHint: 'none' | 'in_app' | 'email' | 'push';
  /** The emotional angle the win-back message should take. */
  angle:
    | 'none'
    | 'gentle_restart'
    | 'celebrate_progress'
    | 'protect_streak'
    | 'one_small_step'
    | 'check_in';
}

/** Optional behavioural signals the engine cannot read from AgentContext. */
export interface ChurnSignals {
  /** Recent Daily Note feel ratings (1–5), newest first. */
  recentFeels?: number[];
  /** How many recent notes carried a frustration/negative fault tag. */
  frustrationNotes?: number;
  /** BodySync readiness (0–100) when available, else null. */
  readiness?: number | null;
}

/** The full, explainable churn read for one user + sport. */
export interface ChurnRisk {
  /** 0–100. Higher = more likely to lapse. */
  score: number;
  band: ChurnBand;
  /** Ordered, highest-weight first. Always non-empty when score > 0. */
  drivers: ChurnDriver[];
  /** Things working in the user's favour (shown to soften the message). */
  protectiveFactors: string[];
  intervention: ChurnIntervention;
  /** How much data backs this read. */
  confidence: ConfidenceLevel;
  /** ISO timestamp the read was computed. */
  computedAt: string;
}
