// ============================================================
// SwingVantage — DrillMatch: outcome-weighted effectiveness (#24)
// ------------------------------------------------------------
// The feedback loop already records "did this drill help?" verdicts, but the
// matcher only read the LATEST one — so a drill the user said helped eight
// times ranked the same as one they helped once. This aggregates the FULL
// history (recency- and sample-weighted) so drills that CONSISTENTLY move the
// needle rise, and a drill that has repeatedly failed sinks.
//
// Calibrated so a single record reproduces the old fixed nudge exactly (no
// behaviour change until there's real history); 2+ consistent records amplify.
// Pure + deterministic.
// ============================================================

import type { DrillFeedbackRecord, DrillFeedbackValue } from './types';
import { FEEDBACK_WEIGHTS } from './feedback';

/** Newest record full weight; each older one decays. */
const RECENCY_DECAY = 0.7;
/** Max extra multiplier from a large, consistent sample. */
const MAX_SAMPLE_BONUS = 0.6;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export interface DrillEffectiveness {
  n: number;
  helped: number;
  noChange: number;
  hurt: number;
  /** Most-recorded verdict, or null when there's no history. */
  dominant: DrillFeedbackValue | null;
  /** -1..1 net effectiveness (recency-weighted mean of +1/0/-1). */
  effectiveness: number;
  /** The score nudge for the matcher (== FEEDBACK_WEIGHTS for n=1; amplified for consistent history). */
  nudge: number;
}

const EMPTY: DrillEffectiveness = {
  n: 0, helped: 0, noChange: 0, hurt: 0, dominant: null, effectiveness: 0, nudge: 0,
};

const VALUE_UNIT: Record<DrillFeedbackValue, number> = { helped: 1, no_change: 0, hurt: -1 };

/** Aggregate a drill's feedback history into stats + a sample-aware score nudge. */
export function drillEffectiveness(records: DrillFeedbackRecord[]): DrillEffectiveness {
  if (records.length === 0) return EMPTY;

  const sorted = [...records].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  const counts: Record<DrillFeedbackValue, number> = { helped: 0, no_change: 0, hurt: 0 };

  let weightSum = 0;
  let nudgeContrib = 0;
  let unitContrib = 0;
  sorted.forEach((r, k) => {
    const w = Math.pow(RECENCY_DECAY, k);
    weightSum += w;
    nudgeContrib += FEEDBACK_WEIGHTS[r.value] * w;
    unitContrib += VALUE_UNIT[r.value] * w;
    counts[r.value]++;
  });

  const n = records.length;
  const weightedNudge = nudgeContrib / weightSum; // == FEEDBACK_WEIGHTS[value] when n === 1
  const effectiveness = +(unitContrib / weightSum).toFixed(3);

  const dominant = (Object.keys(counts) as DrillFeedbackValue[]).reduce((a, b) =>
    counts[b] > counts[a] ? b : a,
  );

  // Agreement: 1 when unanimous, 0 when evenly split across the 3 verdicts.
  const agreement = clamp((Math.max(...Object.values(counts)) / n - 1 / 3) / (2 / 3), 0, 1);
  const sampleBonus = clamp((n - 1) / 4, 0, 1) * MAX_SAMPLE_BONUS * agreement;

  return {
    n,
    helped: counts.helped,
    noChange: counts.no_change,
    hurt: counts.hurt,
    dominant,
    effectiveness,
    nudge: Math.round(weightedNudge * (1 + sampleBonus)),
  };
}
