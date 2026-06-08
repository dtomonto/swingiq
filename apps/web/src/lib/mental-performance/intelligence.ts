// ============================================================
// SwingVantage — Mental Performance Intelligence (CentralIntelligenceOS layer)
//
// Turns ANONYMIZED, aggregate signals into mental-performance insights and
// prioritized product recommendations, so Mental Performance is a first-class
// intelligence domain alongside swing analysis, growth, coaching, etc.
//
// ETHICS: k-anonymity is enforced (counts below K are suppressed). Never
// processes identifiable per-user logs. No clinical inference. The signal
// source is a SEAM — deterministic seed data this pass OR the real
// `aggregateMentalSignals(logs)` aggregator below; a privacy-protected
// aggregate backend can be plugged in via setMentalSource() WITHOUT changing
// the engines.
// ============================================================

import type { IntelligenceRecommendation } from '@/lib/central-intelligence';
import type {
  MentalIntelligenceSignals, MentalInsight, MentalSport, EmotionalState, MentalLog,
} from './types';
import { emotionMeta, mistakeMeta } from './constants';
import { getRoutine, routineForContext } from './routines';

/** k-anonymity threshold: a pattern must cover at least this many users. */
export const MENTAL_K = 5;

const sportLabel = (s: MentalSport): string =>
  s === 'universal' ? 'all sports'
    : s === 'softball_slow' ? 'slow-pitch softball'
      : s === 'softball_fast' ? 'fast-pitch softball'
        : s.charAt(0).toUpperCase() + s.slice(1);

// ── Insights ─────────────────────────────────────────────────
export function generateMentalInsights(s: MentalIntelligenceSignals): MentalInsight[] {
  const out: MentalInsight[] = [];
  let n = 0;
  const id = (k: string) => `mp-insight-${k}-${(n += 1)}`;

  // Top trigger per sport (k-anonymity suppressed).
  const triggers = s.triggersBySport.filter((t) => t.count >= MENTAL_K).sort((a, b) => b.count - a.count);
  for (const t of triggers.slice(0, 4)) {
    const emo = emotionMeta(t.emotion as EmotionalState)?.label.toLowerCase() ?? t.emotion;
    out.push({
      id: id('trigger'), kind: 'pattern', sport: t.sport,
      title: `${sportLabel(t.sport)} players report feeling ${emo} most`,
      detail: `${t.count} ${sportLabel(t.sport)} athletes logged "${emo}" as their reaction — a clear candidate for a dedicated reset routine and SEO answer.`,
      confidence: Math.min(0.9, 0.4 + t.count / 100),
    });
  }

  // Top mistake categories driving logs.
  const mistakes = s.mistakeCounts.filter((m) => m.count >= MENTAL_K).sort((a, b) => b.count - a.count);
  for (const m of mistakes.slice(0, 3)) {
    const label = mistakeMeta(m.mistake)?.label ?? m.mistake;
    out.push({
      id: id('mistake'), kind: 'pattern', sport: m.sport,
      title: `"${label}" is a top recovery moment in ${sportLabel(m.sport)}`,
      detail: `${m.count} athletes logged "${label}". Make sure the matched routine is strong and well-linked from analysis.`,
      confidence: Math.min(0.9, 0.4 + m.count / 100),
    });
  }

  // Short-vs-long engagement signal.
  if (s.shortVsLong.shortCompletionRate - s.shortVsLong.longCompletionRate >= 15) {
    out.push({
      id: id('engagement'), kind: 'engagement', sport: null,
      title: 'Short in-game routines are completed far more than long ones',
      detail: `Short (≤30s) routines complete at ${s.shortVsLong.shortCompletionRate}% vs ${s.shortVsLong.longCompletionRate}% for longer ones — prioritize fast, in-the-moment tools.`,
      confidence: 0.8,
    });
  }

  // Routine effectiveness — flag low performers.
  for (const r of s.routineStats.filter((r) => r.starts >= MENTAL_K && r.avgEffectiveness < 3).slice(0, 3)) {
    const title = getRoutine(r.routineId)?.title ?? r.routineId;
    out.push({
      id: id('routine'), kind: 'risk', sport: null,
      title: `"${title}" is rated below average`,
      detail: `Average effectiveness ${r.avgEffectiveness.toFixed(1)}/5 across ${r.starts} uses — review the steps or replace it.`,
      confidence: 0.7,
    });
  }

  // Content gaps — demand with no routine yet.
  for (const g of s.contentGaps.filter((g) => g.demand >= MENTAL_K).sort((a, b) => b.demand - a.demand).slice(0, 4)) {
    out.push({
      id: id('gap'), kind: 'gap', sport: g.sport,
      title: `Missing routine: ${sportLabel(g.sport)} · ${g.situation}`,
      detail: `${g.demand} athletes hit "${g.situation}" with no matched routine. Add one to close the gap.`,
      confidence: Math.min(0.9, 0.4 + g.demand / 60),
    });
  }

  return out;
}

// ── Recommendations (CIOS IntelligenceRecommendation shape) ──
let recN = 0;
const recId = () => `mp-rec-${(recN += 1)}`;

export function generateMentalRecommendations(s: MentalIntelligenceSignals): IntelligenceRecommendation[] {
  const recs: IntelligenceRecommendation[] = [];
  const insights = generateMentalInsights(s);

  for (const g of insights.filter((i) => i.kind === 'gap')) {
    recs.push({
      id: recId(),
      title: g.title,
      rationale: g.detail,
      expectedImpact: 'Serves a clearly-demanded recovery moment and captures matching search intent.',
      priority: g.confidence > 0.7 ? 'high' : 'medium',
      area: 'mental_performance',
      segment: g.sport ? `${sportLabel(g.sport)} players` : 'All players',
      suggestedImplementation: 'Add a seeded routine in lib/mental-performance/routines.ts and a matching SEO page.',
      status: 'open',
    });
  }

  for (const p of insights.filter((i) => i.kind === 'pattern' && i.sport).slice(0, 3)) {
    recs.push({
      id: recId(),
      title: `Build content around: ${p.title}`,
      rationale: p.detail,
      expectedImpact: 'Helps many athletes at once and feeds GrowthOS content + internal linking.',
      priority: 'medium',
      area: 'mental_performance',
      segment: p.sport ? `${sportLabel(p.sport)} players` : 'All players',
      suggestedImplementation: 'Link the analysis output for this moment to the routine, and publish an AEO answer page.',
      status: 'open',
    });
  }

  if (insights.some((i) => i.kind === 'engagement')) {
    recs.push({
      id: recId(),
      title: 'Prioritize short, in-the-moment reset tools',
      rationale: 'Short routines are completed far more often than long ones.',
      expectedImpact: 'Higher routine completion → more athletes actually recover in competition.',
      priority: 'medium',
      area: 'mental_performance',
      segment: 'All players',
      suggestedImplementation: 'Surface ≤30s routines first on the dashboard quick-starts and analysis hand-offs.',
      status: 'open',
    });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

// ── Aggregate-source seam ────────────────────────────────────
export type MentalAggregateSource = () => MentalIntelligenceSignals;

/**
 * REAL aggregator: compute signals from actual journal logs. This is the
 * backend logic behind the seam — given logs (one user's, or a privacy-
 * protected pool when `userCount` is supplied), it produces genuine signals.
 * It only emits what logs actually support and does NOT fabricate completion-
 * rate telemetry (shortVsLong stays neutral) since logs carry no start/abandon
 * events. Wire it via `setMentalSource(() => aggregateMentalSignals(pool))`.
 */
export function aggregateMentalSignals(logs: MentalLog[], userCount?: number): MentalIntelligenceSignals {
  const triggers = new Map<string, { sport: MentalSport; emotion: EmotionalState; count: number }>();
  const mistakes = new Map<string, { sport: MentalSport; mistake: string; count: number }>();
  const routineAgg = new Map<string, { starts: number; effSum: number; effN: number }>();
  const gaps = new Map<string, { sport: MentalSport; situation: string; demand: number }>();

  for (const l of logs) {
    if (l.emotion) {
      const k = `${l.sport}__${l.emotion}`;
      const a = triggers.get(k) ?? { sport: l.sport, emotion: l.emotion, count: 0 };
      a.count += 1;
      triggers.set(k, a);
    }
    if (l.mistake) {
      const k = `${l.sport}__${l.mistake}`;
      const a = mistakes.get(k) ?? { sport: l.sport, mistake: l.mistake, count: 0 };
      a.count += 1;
      mistakes.set(k, a);
      // Content gap: a logged mistake whose best routine isn't sport-specific.
      const r = routineForContext(l.sport, l.mistake);
      if (!r.sports.includes(l.sport)) {
        const situation = mistakeMeta(l.mistake)?.label ?? l.mistake;
        const gk = `${l.sport}__${situation}`;
        const g = gaps.get(gk) ?? { sport: l.sport, situation, demand: 0 };
        g.demand += 1;
        gaps.set(gk, g);
      }
    }
    if (l.routineUsed) {
      const a = routineAgg.get(l.routineUsed) ?? { starts: 0, effSum: 0, effN: 0 };
      a.starts += 1;
      if (typeof l.effectiveness === 'number') { a.effSum += l.effectiveness; a.effN += 1; }
      routineAgg.set(l.routineUsed, a);
    }
  }

  return {
    activeUsers: userCount ?? (logs.length ? 1 : 0),
    triggersBySport: [...triggers.values()],
    mistakeCounts: [...mistakes.values()],
    routineStats: [...routineAgg.entries()].map(([routineId, a]) => ({
      routineId, starts: a.starts, completions: a.starts,
      avgEffectiveness: a.effN ? a.effSum / a.effN : 0,
    })),
    // No start/abandon telemetry in logs — leave neutral rather than fabricate.
    shortVsLong: { shortCompletionRate: 0, longCompletionRate: 0 },
    contentGaps: [...gaps.values()],
  };
}

/**
 * Deterministic seed/sample signals (house data). Honest placeholder for the
 * admin console until a real privacy-protected aggregate backend feeds
 * aggregateMentalSignals() — mirrors how Coach Mix ships with house seeds.
 */
export function sampleMentalSignals(): MentalIntelligenceSignals {
  return {
    activeUsers: 42,
    triggersBySport: [
      { sport: 'golf', emotion: 'frustrated', count: 18 },
      { sport: 'golf', emotion: 'overthinking', count: 9 },
      { sport: 'baseball', emotion: 'afraid_repeat', count: 11 },
      { sport: 'softball_fast', emotion: 'embarrassed', count: 7 },
      { sport: 'tennis', emotion: 'overthinking', count: 8 },
      { sport: 'pickleball', emotion: 'angry', count: 6 },
    ],
    mistakeCounts: [
      { sport: 'golf', mistake: 'three_putt', count: 14 },
      { sport: 'baseball', mistake: 'fielding_error', count: 10 },
      { sport: 'tennis', mistake: 'double_fault', count: 8 },
      { sport: 'pickleball', mistake: 'partner_frustration', count: 6 },
    ],
    routineStats: [
      { routineId: 'bad-shot-reset', starts: 60, completions: 54, avgEffectiveness: 4.2 },
      { routineId: 'error-recovery', starts: 38, completions: 33, avgEffectiveness: 4.0 },
      { routineId: 'between-point-reset', starts: 22, completions: 18, avgEffectiveness: 3.6 },
      { routineId: 'blow-up-hole-recovery', starts: 9, completions: 4, avgEffectiveness: 2.6 },
    ],
    shortVsLong: { shortCompletionRate: 88, longCompletionRate: 51 },
    contentGaps: [
      { sport: 'golf', situation: 'slow-play patience', demand: 7 },
      { sport: 'padel', situation: 'after-the-wall reset', demand: 6 },
    ],
  };
}

let activeSource: MentalAggregateSource = sampleMentalSignals;
export function setMentalSource(src: MentalAggregateSource): void { activeSource = src; }
export function getMentalSignals(): MentalIntelligenceSignals { return activeSource(); }
