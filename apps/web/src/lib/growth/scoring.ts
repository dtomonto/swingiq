// ============================================================
// GrowthOS — Priority scoring (ICE + strategic fit + urgency)
// ------------------------------------------------------------
// One scoring model used everywhere (strategy, campaigns, CRO,
// experiments, recommendations) so leadership can compare apples to
// apples. Pure functions, no side effects.
// ============================================================

import type { PriorityInputs, Scale } from './types';

const SCALE_VALUE: Record<Scale, number> = { low: 1, medium: 2, high: 3 };

/**
 * Returns a 0–100 priority score.
 *
 * Higher impact / confidence / strategic-fit / urgency push it up; higher
 * effort pulls it down. Effort is inverted (high effort = low contribution)
 * so "high impact, low effort" wins — the classic growth heuristic.
 *
 * Optional inputs (strategicFit, urgency) default to "medium" so partial
 * records still score sensibly.
 */
export function priorityScore(p: PriorityInputs): number {
  const impact = SCALE_VALUE[p.impact];
  const confidence = SCALE_VALUE[p.confidence];
  const effort = SCALE_VALUE[p.effort];
  const strategicFit = SCALE_VALUE[p.strategicFit ?? 'medium'];
  const urgency = SCALE_VALUE[p.urgency ?? 'medium'];

  // Invert effort: 3 (high) -> 1, 1 (low) -> 3.
  const effortInverted = 4 - effort;

  // Weighted blend, normalised to 0..100.
  // Weights: impact 0.30, confidence 0.20, effort 0.20, fit 0.15, urgency 0.15.
  const weighted =
    impact * 0.3 +
    confidence * 0.2 +
    effortInverted * 0.2 +
    strategicFit * 0.15 +
    urgency * 0.15;

  // weighted ranges 1..3 -> map to 0..100.
  return Math.round(((weighted - 1) / 2) * 100);
}

export type PriorityBand = 'critical' | 'high' | 'medium' | 'low';

export function priorityBand(score: number): PriorityBand {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

/** Sort helper: highest priority first. */
export function byPriorityDesc(a: PriorityInputs, b: PriorityInputs): number {
  return priorityScore(b) - priorityScore(a);
}
