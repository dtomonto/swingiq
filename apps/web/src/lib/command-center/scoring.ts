// ============================================================
// Today's Command Center — transparent priority scoring (PURE)
// ------------------------------------------------------------
// One small, extensible scoring function so every recommendation can
// show WHY it got its priority. The formula is intentionally simple and
// additive:
//
//   priority_score =
//       impact + urgency + confidence + affectedUsers + strategic + risk
//     − effortPenalty
//
// then clamped to 1–100 and bucketed into a band.
// ============================================================

import type { Effort, PriorityBand, ScoreBreakdown, ScoreFactors } from './types';

/** Effort → score penalty. Bigger jobs are slightly de-prioritized. */
export const EFFORT_PENALTY: Record<Effort, number> = {
  S: 2,
  M: 6,
  L: 12,
  XL: 18,
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Bucket a 1–100 score into its band. */
export function priorityBand(score: number): PriorityBand {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Compute the final score + band from raw factors. Each factor is clamped
 * to its documented range so a buggy rule can never blow past 100.
 */
export function scoreRecommendation(factors: ScoreFactors): ScoreBreakdown {
  const impact = clamp(factors.impact, 0, 25);
  const urgency = clamp(factors.urgency, 0, 20);
  const confidence = clamp(factors.confidence, 0, 15);
  const affectedUsers = clamp(factors.affectedUsers, 0, 15);
  const strategic = clamp(factors.strategic, 0, 15);
  const risk = clamp(factors.risk, 0, 20);
  const effortPenalty = clamp(factors.effortPenalty, 0, 20);

  const raw = impact + urgency + confidence + affectedUsers + strategic + risk - effortPenalty;
  const score = clamp(Math.round(raw), 1, 100);

  return {
    impact,
    urgency,
    confidence,
    affectedUsers,
    strategic,
    risk,
    effortPenalty,
    score,
    band: priorityBand(score),
  };
}

/** Human-readable one-liner explaining the dominant scoring drivers. */
export function explainScore(b: ScoreBreakdown): string {
  const parts: { label: string; value: number }[] = [
    { label: 'impact', value: b.impact },
    { label: 'risk if ignored', value: b.risk },
    { label: 'urgency', value: b.urgency },
    { label: 'affected users', value: b.affectedUsers },
    { label: 'strategic fit', value: b.strategic },
    { label: 'confidence', value: b.confidence },
  ];
  const top = parts
    .filter((p) => p.value > 0)
    .sort((a, b2) => b2.value - a.value)
    .slice(0, 3)
    .map((p) => p.label);
  const effort = b.effortPenalty >= 12 ? ' (discounted for high effort)' : '';
  return `Scored ${b.score}/100 — driven mostly by ${top.join(', ')}${effort}.`;
}
