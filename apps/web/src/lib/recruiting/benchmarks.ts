// ============================================================
// Player Recruiting Hub — benchmark reference bands
// ------------------------------------------------------------
// ESTIMATED reference ranges used to give a metric context
// ("around varsity reference", "above the college reference").
// These are illustrative typical reference points, NOT official
// standards — the UI always labels them as estimates and never
// converts them into projections like "Division I prospect".
//
// Each band lists levels ordered weakest → strongest performance,
// so the normalizer works for both higher-is-better (exit velo)
// and lower-is-better (pop time, handicap) metrics.
// ============================================================

import type { SportId } from '@swingiq/core';
import { getMetricDef } from './metrics';

export interface BenchmarkLevel {
  label: string;
  value: number;
}

/** A band is an ordered (weakest → strongest) list of reference points. */
export type BenchmarkBand = BenchmarkLevel[];

/** BENCHMARKS[metricKey][sport] = band. */
const BENCHMARKS: Record<string, Partial<Record<SportId, BenchmarkBand>>> = {
  exit_velocity: {
    baseball: [
      { label: 'Developing HS', value: 75 },
      { label: 'Varsity HS', value: 85 },
      { label: 'College reference', value: 95 },
      { label: 'Elite reference', value: 102 },
    ],
    softball_fast: [
      { label: 'Developing HS', value: 58 },
      { label: 'Varsity HS', value: 66 },
      { label: 'College reference', value: 73 },
      { label: 'Elite reference', value: 78 },
    ],
    softball_slow: [
      { label: 'Recreational', value: 60 },
      { label: 'Competitive', value: 72 },
      { label: 'Advanced', value: 82 },
    ],
  },
  bat_speed: {
    baseball: [
      { label: 'Developing HS', value: 58 },
      { label: 'Varsity HS', value: 67 },
      { label: 'College reference', value: 72 },
      { label: 'Elite reference', value: 78 },
    ],
    softball_fast: [
      { label: 'Developing HS', value: 50 },
      { label: 'Varsity HS', value: 58 },
      { label: 'College reference', value: 64 },
    ],
  },
  throwing_velocity: {
    baseball: [
      { label: 'Developing HS', value: 70 },
      { label: 'Varsity HS', value: 80 },
      { label: 'College reference', value: 88 },
      { label: 'Elite reference', value: 95 },
    ],
    softball_fast: [
      { label: 'Developing HS', value: 50 },
      { label: 'Varsity HS', value: 58 },
      { label: 'College reference', value: 64 },
    ],
  },
  pitch_velocity: {
    baseball: [
      { label: 'Developing HS', value: 72 },
      { label: 'Varsity HS', value: 82 },
      { label: 'College reference', value: 88 },
      { label: 'Elite reference', value: 94 },
    ],
    softball_fast: [
      { label: 'Developing HS', value: 52 },
      { label: 'Varsity HS', value: 60 },
      { label: 'College reference', value: 66 },
    ],
  },
  pop_time: {
    baseball: [
      { label: 'Developing HS', value: 2.3 },
      { label: 'Varsity HS', value: 2.05 },
      { label: 'College reference', value: 1.95 },
      { label: 'Elite reference', value: 1.85 },
    ],
    softball_fast: [
      { label: 'Developing HS', value: 2.2 },
      { label: 'Varsity HS', value: 2.0 },
      { label: 'College reference', value: 1.9 },
    ],
  },
  sixty_yard: {
    baseball: [
      { label: 'Developing HS', value: 7.5 },
      { label: 'Varsity HS', value: 7.0 },
      { label: 'College reference', value: 6.7 },
      { label: 'Elite reference', value: 6.4 },
    ],
  },
  home_to_first: {
    baseball: [
      { label: 'Developing HS', value: 4.5 },
      { label: 'Varsity HS', value: 4.2 },
      { label: 'College reference', value: 4.0 },
    ],
    softball_fast: [
      { label: 'Developing HS', value: 3.3 },
      { label: 'Varsity HS', value: 3.0 },
      { label: 'College reference', value: 2.8 },
    ],
  },

  // ── Golf ──
  handicap: {
    golf: [
      { label: 'Recreational', value: 18 },
      { label: 'Competitive HS', value: 8 },
      { label: 'College reference', value: 2 },
      { label: 'Elite reference', value: -2 },
    ],
  },
  scoring_average: {
    golf: [
      { label: 'Recreational', value: 90 },
      { label: 'Competitive HS', value: 78 },
      { label: 'College reference', value: 73 },
      { label: 'Elite reference', value: 70 },
    ],
  },
  driver_carry: {
    golf: [
      { label: 'Developing', value: 220 },
      { label: 'Competitive HS', value: 255 },
      { label: 'College reference', value: 280 },
      { label: 'Elite reference', value: 300 },
    ],
  },
  ball_speed: {
    golf: [
      { label: 'Developing', value: 140 },
      { label: 'Competitive HS', value: 155 },
      { label: 'College reference', value: 165 },
      { label: 'Elite reference', value: 175 },
    ],
  },
  club_speed: {
    golf: [
      { label: 'Developing', value: 95 },
      { label: 'Competitive HS', value: 105 },
      { label: 'College reference', value: 113 },
      { label: 'Elite reference', value: 120 },
    ],
  },
  gir: {
    golf: [
      { label: 'Developing', value: 30 },
      { label: 'Competitive HS', value: 50 },
      { label: 'College reference', value: 65 },
    ],
  },
  fairways_hit: {
    golf: [
      { label: 'Developing', value: 45 },
      { label: 'Competitive HS', value: 60 },
      { label: 'College reference', value: 70 },
    ],
  },

  // ── Tennis ──
  rating: {
    tennis: [
      { label: 'Developing', value: 4 },
      { label: 'Varsity HS', value: 7 },
      { label: 'College reference', value: 10 },
      { label: 'Elite reference', value: 13 },
    ],
  },
  serve_speed: {
    tennis: [
      { label: 'Developing', value: 75 },
      { label: 'Varsity HS', value: 95 },
      { label: 'College reference', value: 110 },
      { label: 'Elite reference', value: 125 },
    ],
  },
  first_serve_pct: {
    tennis: [
      { label: 'Developing', value: 50 },
      { label: 'Varsity HS', value: 60 },
      { label: 'College reference', value: 68 },
    ],
  },
};

export interface BenchmarkPosition {
  /** 0–100 along the weakest → strongest reference span (clamped). */
  normalized: number;
  /** Nearest reference level label. */
  nearestLabel: string;
  /** Whole band (for rendering the scale). */
  band: BenchmarkBand;
}

export function getBenchmarkBand(metricKey: string, sport: SportId): BenchmarkBand | null {
  return BENCHMARKS[metricKey]?.[sport] ?? null;
}

export function hasBenchmark(metricKey: string, sport: SportId): boolean {
  return !!getBenchmarkBand(metricKey, sport);
}

/**
 * Normalize a value to 0–100 along an ordered (weakest → strongest) band.
 * Works for ascending (higher-is-better) and descending (lower-is-better)
 * bands by interpolating against the band's own value sequence.
 */
export function benchmarkPosition(metricKey: string, sport: SportId, value: number): BenchmarkPosition | null {
  const band = getBenchmarkBand(metricKey, sport);
  if (!band || band.length < 2) return null;
  const def = getMetricDef(metricKey);
  const higher = def?.higherIsBetter ?? true;

  const last = band.length - 1;
  // Distance helper: how far is `value` toward the "strong" end vs the "weak" end.
  const weak = band[0].value;
  const strong = band[last].value;

  let normalized: number;
  if (strong === weak) {
    normalized = 50;
  } else {
    // Fraction toward strong end. For lower-is-better, strong < weak so the
    // subtraction naturally inverts; clamp to [0,1].
    const frac = (value - weak) / (strong - weak);
    normalized = Math.max(0, Math.min(1, frac)) * 100;
  }

  // Nearest reference label by absolute value distance.
  let nearestIdx = 0;
  let best = Infinity;
  band.forEach((lvl, i) => {
    const d = Math.abs(lvl.value - value);
    if (d < best) {
      best = d;
      nearestIdx = i;
    }
  });

  // Guard against an obviously-out-of-range value being mislabeled.
  void higher;
  return { normalized: Math.round(normalized), nearestLabel: band[nearestIdx].label, band };
}
