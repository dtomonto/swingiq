// ============================================================
// SwingVantage — AGI: insight→action→outcome loop (recommendation #21)
// ------------------------------------------------------------
// The engine proposes a keystone, the athlete commits to it, and progress.ts
// measures whether that capability actually moved. This closes the loop: it
// judges whether acting on the insight HELPED, and reranks insights so a focus
// that's working is reinforced and one that isn't responding is de-prioritised
// in favour of a different approach — the engine learns what helps THIS athlete.
//
// Pure + deterministic; reads only the commitment + progress report (both
// computed elsewhere). No storage, no side effects.
// ============================================================

import type { AgiCommitment } from './commitment';
import { isRetestDue } from './commitment';
import type { CapabilityId, Insight, ProgressReport } from './types';

export type CommitmentOutcome = 'improving' | 'flat' | 'declining' | 'too_early' | 'none';

/** Points of capability movement that count as a real improvement/decline. */
const MEANINGFUL_DELTA = 3;

export interface CommitmentOutcomeResult {
  outcome: CommitmentOutcome;
  capability: CapabilityId | null;
  /** Score delta on the committed capability since the baseline, if known. */
  delta: number | null;
  /** Multiplier applied to the committed insight's leverage (reinforcement). */
  rerankFactor: number;
  message: string;
}

/**
 * Did acting on the committed keystone help? Compares the commitment against the
 * progress report's delta for that capability.
 */
export function assessCommitmentOutcome(
  commitment: AgiCommitment | null,
  progress: ProgressReport | null,
  nowIso: string = new Date().toISOString(),
): CommitmentOutcomeResult {
  if (!commitment) {
    return { outcome: 'none', capability: null, delta: null, rerankFactor: 1, message: 'No active commitment to evaluate.' };
  }

  const d = progress?.deltas.find((x) => x.capability === commitment.capability) ?? null;
  if (!d || d.delta === null) {
    const tooEarly = !isRetestDue(commitment, nowIso);
    return {
      outcome: tooEarly ? 'too_early' : 'none',
      capability: commitment.capability,
      delta: null,
      rerankFactor: 1,
      message: tooEarly
        ? `Keep working ${commitment.name} — we'll measure whether it's moving at your retest.`
        : `No measurable change in ${commitment.name} yet — log another session so we can judge it.`,
    };
  }

  if (d.delta >= MEANINGFUL_DELTA) {
    return {
      outcome: 'improving',
      capability: commitment.capability,
      delta: d.delta,
      rerankFactor: 1.25, // reinforce — it's working, keep the focus
      message: `${commitment.name} is up ${d.delta} since you committed — the work is paying off. Stay on it.`,
    };
  }
  if (d.delta <= -MEANINGFUL_DELTA) {
    return {
      outcome: 'declining',
      capability: commitment.capability,
      delta: d.delta,
      rerankFactor: 0.8, // this approach isn't responding — make room for a different one
      message: `${commitment.name} slipped ${Math.abs(d.delta)} despite the focus — time to try a different approach.`,
    };
  }
  return {
    outcome: 'flat',
    capability: commitment.capability,
    delta: d.delta,
    rerankFactor: isRetestDue(commitment, nowIso) ? 0.9 : 1,
    message: `${commitment.name} is holding steady — give it a few more focused sessions before changing tack.`,
  };
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Rerank insights using the outcome signal: scale the committed capability's
 * insight leverage by the rerankFactor, then re-sort by leverage. A working
 * focus rises; a non-responding one makes room for alternatives.
 */
export function rerankInsightsByOutcome(insights: Insight[], outcome: CommitmentOutcomeResult): Insight[] {
  if (!outcome.capability || outcome.rerankFactor === 1) return insights;
  return insights
    .map((i) =>
      i.capability === outcome.capability ? { ...i, leverage: clamp01(i.leverage * outcome.rerankFactor) } : i,
    )
    .sort((a, b) => b.leverage - a.leverage);
}
