// ============================================================
// SwingIQ — Motion Lab: Comparison Engine
// ------------------------------------------------------------
// Compares two analysed sessions metric-by-metric. "Improvement" is
// judged by each metric's normalized quality score (direction-aware),
// while the raw-value delta is surfaced for transparency.
// ============================================================

import type { MotionSession, MotionComparison, MetricDelta, ComparisonHighlight } from './types';

/**
 * Cross-session changes in the structured reads (kinetic chain + temporal) that
 * the flat metric-delta list doesn't cover. base = before, compare = after.
 */
function buildHighlights(base: MotionSession, compare: MotionSession): ComparisonHighlight[] {
  const out: ComparisonHighlight[] = [];
  const add = (
    id: string,
    label: string,
    b: number | null | undefined,
    a: number | null | undefined,
    betterHigher: boolean,
    fmt: (v: number) => string,
    upNote: string,
    downNote: string,
  ) => {
    if (b == null || a == null) return;
    const direction: ComparisonHighlight['direction'] = Math.abs(a - b) < 1e-6 ? 'flat' : a > b ? 'up' : 'down';
    const improved = direction === 'flat' ? null : betterHigher ? a > b : a < b;
    out.push({
      id,
      label,
      before: fmt(b),
      after: fmt(a),
      direction,
      improved,
      note: direction === 'flat' ? 'About the same.' : improved ? upNote : downNote,
    });
  };

  const score = (v: number) => `${Math.round(v)}/100`;
  add('sequence', 'Kinetic sequence', base.kineticChain?.sequenceQuality, compare.kineticChain?.sequenceQuality, true, score,
    'Firing order is more ground-up.', 'Firing order slipped out of sequence.');
  add('contact_stability', 'Contact stability', base.temporal?.contactWindowStability, compare.temporal?.contactWindowStability, true, score,
    'Steadier through the strike.', 'More body drift through the strike.');
  add('deceleration', 'Deceleration control', base.temporal?.decelerationControl, compare.temporal?.decelerationControl, true, score,
    'More controlled finish.', 'Less controlled finish.');

  // Tempo: direction isn't universally "better/worse", so report it neutrally.
  const tb = base.temporal?.tempoRatio;
  const ta = compare.temporal?.tempoRatio;
  if (tb != null && ta != null && Math.abs(ta - tb) >= 0.3) {
    out.push({
      id: 'tempo',
      label: 'Tempo (back:through)',
      before: `${tb}:1`,
      after: `${ta}:1`,
      direction: ta > tb ? 'up' : 'down',
      improved: null,
      note: 'Tempo shifted — aim for a smooth, repeatable rhythm.',
    });
  }
  return out;
}

export function compareSessions(base: MotionSession, compare: MotionSession): MotionComparison {
  const beforeById = new Map(base.metrics.map((m) => [m.id, m]));
  const metricDeltas: MetricDelta[] = [];

  for (const after of compare.metrics) {
    const before = beforeById.get(after.id);
    if (!before) continue;
    const bv = before.value;
    const av = after.value;
    const delta = bv != null && av != null ? +(av - bv).toFixed(2) : null;
    const improved =
      before.normalizedScore != null && after.normalizedScore != null
        ? after.normalizedScore > before.normalizedScore
        : null;
    metricDeltas.push({
      id: after.id,
      name: after.name,
      unit: after.unit,
      before: bv,
      after: av,
      delta,
      improved,
    });
  }

  // rank by normalized-score change for biggest improvement/regression
  const scoreChange = (d: MetricDelta): number => {
    const b = base.metrics.find((m) => m.id === d.id)?.normalizedScore ?? null;
    const a = compare.metrics.find((m) => m.id === d.id)?.normalizedScore ?? null;
    return b != null && a != null ? a - b : 0;
  };

  const ranked = [...metricDeltas].sort((x, y) => scoreChange(y) - scoreChange(x));
  const biggestImprovement = ranked.find((d) => scoreChange(d) > 0) ?? null;
  const biggestRegression = [...ranked].reverse().find((d) => scoreChange(d) < 0) ?? null;

  const overallDelta = compare.scoreboard.overall - base.scoreboard.overall;

  let recommendation: string;
  if (overallDelta >= 4) {
    recommendation = `Nice progress — overall up ${overallDelta} points.${
      biggestImprovement ? ` Your ${biggestImprovement.name.toLowerCase()} clearly improved.` : ''
    } Keep the same focus and re-test in a week.`;
  } else if (overallDelta <= -4) {
    recommendation = `Overall dipped ${Math.abs(overallDelta)} points — normal day-to-day variation.${
      biggestRegression ? ` Watch your ${biggestRegression.name.toLowerCase()}.` : ''
    } Return to slow drill work before full speed.`;
  } else {
    recommendation = `About the same overall (${overallDelta >= 0 ? '+' : ''}${overallDelta}). ${
      biggestImprovement ? `Small win in ${biggestImprovement.name.toLowerCase()}. ` : ''
    }Stay patient — mechanical change shows up over weeks, not single sessions.`;
  }

  return {
    baseId: base.id,
    compareId: compare.id,
    overallDelta,
    metricDeltas,
    biggestImprovement,
    biggestRegression,
    highlights: buildHighlights(base, compare),
    recommendation,
  };
}
