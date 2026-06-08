// ============================================================
// CentralIntelligenceOS — Anonymized aggregate intelligence (pure)
// ------------------------------------------------------------
// Privacy-aware aggregation. Distributions are only ever returned when
// the cohort is large enough to prevent re-identification (k-anonymity
// guard, AGGREGATE_MIN_COHORT). Below that the bucket set is suppressed
// and `suppressed: true` is surfaced so the UI shows "not enough data
// to anonymize safely" instead of a revealing small count.
//
// No raw personal records ever leave this layer — only counts/percents.
// ============================================================

import type { AggregateBucket, AggregateDistribution } from './types';
import { AGGREGATE_MIN_COHORT } from './config';

/**
 * Build an anonymized distribution over a dimension. Each input is one user's
 * value for the dimension (e.g. their skill level). Cohorts smaller than the
 * minimum are suppressed entirely.
 */
export function buildDistribution(
  dimension: string,
  values: Array<string | null | undefined>,
  opts: { minCohort?: number } = {},
): AggregateDistribution {
  const minCohort = opts.minCohort ?? AGGREGATE_MIN_COHORT;
  const clean = values.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  const total = clean.length;

  if (total < minCohort) {
    return { dimension, total, buckets: [], suppressed: true };
  }

  const counts = new Map<string, number>();
  for (const v of clean) counts.set(v, (counts.get(v) ?? 0) + 1);

  const buckets: AggregateBucket[] = Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  return { dimension, total, buckets, suppressed: false };
}

/**
 * A simple funnel with per-step retention. Steps must be passed largest-first
 * (e.g. registered → profile started → profile complete → first session →
 * qualified). Returns each step with its conversion from the previous step.
 */
export interface FunnelStep {
  label: string;
  count: number;
  /** Conversion from the previous step, 0–100 (100 for the first step). */
  conversionFromPrev: number;
  /** Conversion from the top of the funnel, 0–100. */
  conversionFromTop: number;
}

export function buildFunnel(steps: Array<{ label: string; count: number }>): FunnelStep[] {
  const top = steps[0]?.count ?? 0;
  return steps.map((step, i) => {
    const prev = i === 0 ? step.count : steps[i - 1].count;
    return {
      label: step.label,
      count: step.count,
      conversionFromPrev: prev > 0 ? Math.round((step.count / prev) * 100) : 0,
      conversionFromTop: top > 0 ? Math.round((step.count / top) * 100) : 0,
    };
  });
}

/** The biggest single drop-off in a funnel (where to focus first). */
export function biggestDropOff(funnel: FunnelStep[]): { from: string; to: string; lostPercent: number } | null {
  let worst: { from: string; to: string; lostPercent: number } | null = null;
  for (let i = 1; i < funnel.length; i += 1) {
    const lost = 100 - funnel[i].conversionFromPrev;
    if (!worst || lost > worst.lostPercent) {
      worst = { from: funnel[i - 1].label, to: funnel[i].label, lostPercent: lost };
    }
  }
  return worst;
}
