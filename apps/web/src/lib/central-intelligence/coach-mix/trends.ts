// ============================================================
// CentralIntelligenceOS — Coach Mix: Trend Intelligence
// ------------------------------------------------------------
// Turn PRIVACY-SAFE aggregates (which faults are most common, which
// drills get abandoned, which styles complete more practice) into
// concrete recommendations: what drills/videos to create, what to
// promote, and how to adjust the coach mix.
//
// HONEST BY DESIGN: this reasons over AGGREGATES the caller provides.
// It never touches individual records, and it suppresses any cohort
// smaller than the CIOS k-anonymity threshold (AGGREGATE_MIN_COHORT)
// so a small group can't be re-identified. With no real data wired,
// the admin sees clearly-labelled sample input.
// ============================================================

import { AGGREGATE_MIN_COHORT } from '@/lib/central-intelligence';
import type { StyleTag } from './types';

/** Aggregate, anonymized signals — never individual records. */
export interface TrendInput {
  /** faultId → how many athletes show it as a top issue. */
  faultFrequency: Record<string, number>;
  /** faultId → how many still show it AFTER a retest (unresolved). */
  repeatedAfterRetest: Record<string, number>;
  /** drillId → { started, abandoned } counts. */
  drillEngagement: Record<string, { started: number; abandoned: number }>;
  /** style tag → { plansStarted, plansCompleted } counts. */
  completionByStyle: Partial<Record<StyleTag, { plansStarted: number; plansCompleted: number }>>;
}

export interface TrendSuggestion {
  /** Short, plain-English recommendation. */
  suggestion: string;
  /** Why — the aggregate signal behind it. */
  reason: string;
  /** Cohort size the signal is based on (for transparency). */
  cohort: number;
}

export interface TrendRecommendations {
  drillsToCreate: TrendSuggestion[];
  drillsToPromote: TrendSuggestion[];
  videosToProduce: TrendSuggestion[];
  mixAdjustments: TrendSuggestion[];
  dashboardImprovements: TrendSuggestion[];
  /** True when every cohort was below the privacy threshold (nothing shown). */
  suppressedForPrivacy: boolean;
}

function humanize(id: string): string {
  return id.replace(/_/g, ' ');
}

/**
 * Analyze aggregates into recommendations. Deterministic. Any cohort below
 * AGGREGATE_MIN_COHORT is dropped (k-anonymity), so weak/identifying signals
 * never drive a recommendation.
 */
export function analyzeTrends(input: TrendInput): TrendRecommendations {
  const min = AGGREGATE_MIN_COHORT;
  let anyCohortSeen = false;
  let anyCohortKept = false;

  const seen = (n: number) => {
    if (n > 0) anyCohortSeen = true;
    if (n >= min) {
      anyCohortKept = true;
      return true;
    }
    return false;
  };

  // Most common faults → produce a video + ensure strong drills exist.
  const faultsByFreq = Object.entries(input.faultFrequency)
    .filter(([, n]) => seen(n))
    .sort((a, b) => b[1] - a[1]);

  const videosToProduce: TrendSuggestion[] = faultsByFreq.slice(0, 3).map(([fault, n]) => ({
    suggestion: `Produce an original "${humanize(fault)}" instructional video.`,
    reason: `${humanize(fault)} is one of the most common top issues right now.`,
    cohort: n,
  }));

  // Faults that recur after a retest → the current fix isn't landing.
  const drillsToCreate: TrendSuggestion[] = Object.entries(input.repeatedAfterRetest)
    .filter(([, n]) => seen(n))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([fault, n]) => ({
      suggestion: `Create a sharper drill for "${humanize(fault)}" — the current fix isn't sticking.`,
      reason: `${humanize(fault)} keeps reappearing after athletes retest it.`,
      cohort: n,
    }));

  // Drills with low abandonment → promote them.
  const drillsToPromote: TrendSuggestion[] = Object.entries(input.drillEngagement)
    .filter(([, e]) => seen(e.started) && e.started > 0)
    .map(([drill, e]) => ({ drill, rate: e.abandoned / e.started, started: e.started }))
    .filter((d) => d.rate <= 0.25)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3)
    .map((d) => ({
      suggestion: `Promote "${humanize(d.drill)}" — athletes stick with it.`,
      reason: `Only ${Math.round(d.rate * 100)}% abandon it (low drop-off).`,
      cohort: d.started,
    }));

  // High-abandonment drills → a dashboard/mix signal that it's too hard.
  const dashboardImprovements: TrendSuggestion[] = Object.entries(input.drillEngagement)
    .filter(([, e]) => seen(e.started) && e.started > 0)
    .map(([drill, e]) => ({ drill, rate: e.abandoned / e.started, started: e.started }))
    .filter((d) => d.rate >= 0.6)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map((d) => ({
      suggestion: `Lead "${humanize(d.drill)}" with a simpler feel cue, or swap it on the dashboard.`,
      reason: `${Math.round(d.rate * 100)}% of athletes abandon it — likely too technical.`,
      cohort: d.started,
    }));

  // Completion by style → which teaching voice is landing.
  const mixAdjustments: TrendSuggestion[] = (
    Object.entries(input.completionByStyle) as [StyleTag, { plansStarted: number; plansCompleted: number }][]
  )
    .filter(([, c]) => seen(c.plansStarted) && c.plansStarted > 0)
    .map(([style, c]) => ({ style, rate: c.plansCompleted / c.plansStarted, started: c.plansStarted }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map((c, i) => ({
      suggestion:
        i === 0
          ? `Lean mixes slightly toward "${c.style}" — it drives the most completed practice.`
          : `"${c.style}" completes at ${Math.round(c.rate * 100)}% — keep it in the blend.`,
      reason: `${Math.round(c.rate * 100)}% of athletes on a ${c.style} plan finish it.`,
      cohort: c.started,
    }));

  return {
    drillsToCreate,
    drillsToPromote,
    videosToProduce,
    mixAdjustments,
    dashboardImprovements,
    suppressedForPrivacy: anyCohortSeen && !anyCohortKept,
  };
}

/**
 * A pluggable source of REAL privacy-safe aggregates. Wire this to an
 * analytics/aggregate backend later; `load()` returns `null` until then.
 */
export interface TrendAggregateSource {
  load(): TrendInput | null;
}

/**
 * Resolve the aggregates to analyze: the real source when it has data,
 * otherwise the clearly-labelled sample. `isSample` lets the UI stay honest
 * about which it's showing.
 */
export function resolveTrendInput(source?: TrendAggregateSource | null): {
  input: TrendInput;
  isSample: boolean;
} {
  const real = source?.load() ?? null;
  if (real) return { input: real, isSample: false };
  return { input: sampleTrendInput(), isSample: true };
}

/** Clearly-labelled SAMPLE aggregate so the admin panel works before real data is wired. */
export function sampleTrendInput(): TrendInput {
  return {
    faultFrequency: { early_extension: 142, over_the_top: 121, slice: 98, casting: 64 },
    repeatedAfterRetest: { early_extension: 53, slice: 41, over_the_top: 28 },
    drillEngagement: {
      'pump drill': { started: 120, abandoned: 18 },
      'wall drill': { started: 90, abandoned: 22 },
      'tour pro shallowing sequence': { started: 80, abandoned: 61 },
    },
    completionByStyle: {
      'Athletic Rotation': { plansStarted: 110, plansCompleted: 79 },
      'Structured Fundamentals': { plansStarted: 95, plansCompleted: 52 },
      'Technical Precision': { plansStarted: 70, plansCompleted: 31 },
    },
  };
}
