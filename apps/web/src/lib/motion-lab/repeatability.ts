// ============================================================
// SwingIQ — Motion Lab: Repeatability (cross-session consistency)
// ------------------------------------------------------------
// The per-clip `repeatability` metric is honestly NULL on a single
// motion — consistency can only be judged across reps. This engine
// computes it from MULTIPLE analysed sessions of the same sport+motion:
// for each metric it measures how tightly the values cluster (coefficient
// of variation) and turns that into a 0–100 consistency.
//
// "Consistency separates good players from great ones" — but it needs a
// sample, so this stays honest about needing 3+ sessions and degrades to
// an unavailable result below that.
//
// Pure + unit-tested in __tests__/repeatability.test.ts.
// ============================================================

import type { MotionSession, MotionBasis } from './types';

/** Minimum sessions before consistency means anything. */
export const MIN_SESSIONS_FOR_REPEATABILITY = 3;

/** Coefficient of variation at/above which consistency reads 0. */
const CV_FLOOR = 0.4;

export interface MetricConsistency {
  id: string;
  name: string;
  /** Coefficient of variation (std / |mean|). */
  cv: number;
  /** 0–100 — higher = more repeatable. */
  consistency: number;
  /** Number of sessions that contributed a value. */
  n: number;
}

export interface RepeatabilityResult {
  available: boolean;
  sessionCount: number;
  /** 0–100 overall repeatability (null when not enough sessions). */
  score: number | null;
  perMetric: MetricConsistency[];
  mostConsistent: MetricConsistency | null;
  leastConsistent: MetricConsistency | null;
  summary: string;
  basis: MotionBasis;
  confidence: number;
}

function mean(v: number[]): number {
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}

function std(v: number[], m: number): number {
  if (v.length < 2) return 0;
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function unavailable(sessionCount: number): RepeatabilityResult {
  return {
    available: false,
    sessionCount,
    score: null,
    perMetric: [],
    mostConsistent: null,
    leastConsistent: null,
    summary: `Analyse at least ${MIN_SESSIONS_FOR_REPEATABILITY} motions of the same type to unlock a repeatability read (you have ${sessionCount}).`,
    basis: 'placeholder',
    confidence: 0,
  };
}

/**
 * Compute repeatability across sessions (expects same sport+motion). Never
 * throws. Returns an honest unavailable result below the session threshold.
 */
export function computeRepeatability(sessions: MotionSession[]): RepeatabilityResult {
  const n = sessions.length;
  if (n < MIN_SESSIONS_FOR_REPEATABILITY) return unavailable(n);

  // Gather each metric's values across sessions (id → {name, values}).
  const byId = new Map<string, { name: string; values: number[] }>();
  for (const s of sessions) {
    for (const m of s.metrics) {
      if (m.value == null) continue;
      const entry = byId.get(m.id) ?? { name: m.name, values: [] };
      entry.values.push(m.value);
      byId.set(m.id, entry);
    }
  }

  const perMetric: MetricConsistency[] = [];
  for (const [id, { name, values }] of byId) {
    // Need enough samples and a non-trivial mean for CV to be meaningful.
    if (values.length < MIN_SESSIONS_FOR_REPEATABILITY) continue;
    const m = mean(values);
    if (Math.abs(m) < 0.5) continue; // near-zero mean → CV is unstable, skip
    const cv = std(values, m) / Math.abs(m);
    const consistency = Math.round(clamp(100 * (1 - cv / CV_FLOOR), 0, 100));
    perMetric.push({ id, name, cv: +cv.toFixed(3), consistency, n: values.length });
  }

  if (perMetric.length === 0) return unavailable(n);

  const score = Math.round(mean(perMetric.map((p) => p.consistency)));
  const sorted = [...perMetric].sort((a, b) => b.consistency - a.consistency);
  const mostConsistent = sorted[0];
  const leastConsistent = sorted[sorted.length - 1];

  // Confidence grows with sample size (capped) and the sessions' own basis.
  const sampleConf = clamp((n - MIN_SESSIONS_FOR_REPEATABILITY + 1) / 5, 0.3, 1);
  const measured = sessions.every((s) => s.poseTrack.basis === 'measured');
  const basis: MotionBasis = measured ? 'measured' : 'estimated';

  const summary =
    score >= 75
      ? `Strong consistency across ${n} sessions — your ${mostConsistent.name.toLowerCase()} is especially repeatable. Repeatable mechanics are what hold up under pressure.`
      : score >= 50
        ? `Moderate consistency across ${n} sessions. Your least repeatable piece is ${leastConsistent.name.toLowerCase()} — groove it with slow, identical reps.`
        : `Your mechanics vary noticeably across ${n} sessions, especially ${leastConsistent.name.toLowerCase()}. Slow down and rebuild one identical rep at a time before adding speed.`;

  return {
    available: true,
    sessionCount: n,
    score,
    perMetric: sorted,
    mostConsistent,
    leastConsistent,
    summary,
    basis,
    confidence: +sampleConf.toFixed(2),
  };
}
