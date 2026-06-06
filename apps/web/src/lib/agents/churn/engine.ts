// ============================================================
// SwingVantage — Agent: Churn-Risk Scoring — Engine
// ------------------------------------------------------------
// Scores how likely a user is to lapse, BEFORE they go quiet for
// good, so the Re-Engagement Dispatch agent can prioritise who to
// reach and how urgently. Pure, deterministic, SSR-safe, never
// throws. Every point in the score is attributable to a named
// driver grounded in the user's own data.
//
// The score is additive and capped at 100. Bands:
//   0–24 safe · 25–49 watch · 50–74 at_risk · 75–100 critical
// ============================================================

import type { SportId } from '@swingiq/core';
import type { DailyNote } from '@/lib/dailyNotes/types';
import type { AgentContext, ConfidenceLevel } from '../types';
import type {
  ChurnBand,
  ChurnDriver,
  ChurnIntervention,
  ChurnRisk,
  ChurnSignals,
} from './types';

// ── Tunables (single place to adjust the model) ───────────────

const WEIGHTS = {
  recency14: 18,
  recency30: 34, // total when 30+ days (replaces, not adds, recency14)
  frequencyDecline: 22,
  shallowEngagement: 16,
  progressDeclining: 16,
  progressPlateau: 8,
  negativeSentiment: 18,
  stalledPlan: 14,
  lowReadiness: 8,
} as const;

const DAY = 86_400_000;

// ── Helpers ───────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function bandFor(score: number): ChurnBand {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'at_risk';
  if (score >= 25) return 'watch';
  return 'safe';
}

/** Median gap (in days) between consecutive sessions, newest-first dates. */
function medianGapDays(datesDescIso: string[]): number | null {
  const ms = datesDescIso
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a);
  if (ms.length < 3) return null;
  const gaps: number[] = [];
  for (let i = 0; i < ms.length - 1; i += 1) gaps.push((ms[i] - ms[i + 1]) / DAY);
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
}

/** Simple recent-vs-prior score trend over the active sport's sessions. */
function scoreTrend(scoresNewestFirst: Array<number | null>): 'up' | 'down' | 'flat' | 'unknown' {
  const s = scoresNewestFirst.filter((v): v is number => typeof v === 'number');
  if (s.length < 2) return 'unknown';
  const recent = s[0];
  const prior = s.slice(1, 4);
  const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
  const delta = recent - priorAvg;
  if (delta >= 3) return 'up';
  if (delta <= -3) return 'down';
  return 'flat';
}

/**
 * Derive churn signals from raw Daily Notes without coupling the engine to the
 * store. Callers that have notes pass the result as `signals`; callers that do
 * not simply omit it (the engine degrades honestly).
 */
export function summarizeNoteSignals(
  notes: DailyNote[],
  sport: SportId,
  now: Date = new Date(),
  lookbackDays = 21,
): ChurnSignals {
  const cutoff = now.getTime() - lookbackDays * DAY;
  const recent = notes
    .filter((n) => n.sport === sport)
    .filter((n) => {
      const t = new Date(n.created_at || n.date).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const recentFeels: number[] = recent.map((n) => n.feel).filter((f) => typeof f === 'number');
  // A "frustration note" = a low feel OR any honestly-detected fault in the text.
  const frustrationNotes = recent.filter((n) => n.feel <= 2 || (n.faults?.length ?? 0) > 0).length;

  return { recentFeels, frustrationNotes };
}

// ── The score ─────────────────────────────────────────────────

/**
 * Score lapse risk for the active sport. `signals` is optional behavioural
 * context (Daily Notes sentiment, readiness) the AgentContext cannot carry.
 */
export function scoreChurnRisk(ctx: AgentContext, signals: ChurnSignals = {}): ChurnRisk {
  const drivers: ChurnDriver[] = [];
  const protectiveFactors: string[] = [];

  const days = ctx.daysSinceLastActivity;
  const sessions = ctx.sportSessions.length ? ctx.sportSessions : ctx.sessions;
  const name = ctx.profile.firstName;

  // A user with no data yet is an activation problem, not a churn one.
  if (ctx.sessionCount === 0) {
    return {
      score: 0,
      band: 'safe',
      drivers: [],
      protectiveFactors: ['No history yet — this is an activation moment, not churn.'],
      intervention: { urgency: 0, channelHint: 'none', angle: 'none' },
      confidence: 'low',
      computedAt: ctx.now,
    };
  }

  // 1) Recency — the single strongest predictor. 30+ replaces the 14+ tier.
  if (days !== null && days >= 30) {
    drivers.push({
      id: 'recency',
      weight: WEIGHTS.recency30,
      reason: `${days} days since the last ${ctx.sportLabel.toLowerCase()} activity.`,
    });
  } else if (days !== null && days >= 14) {
    drivers.push({
      id: 'recency',
      weight: WEIGHTS.recency14,
      reason: `${days} days since the last activity — momentum is cooling.`,
    });
  } else if (days !== null && days <= 3) {
    protectiveFactors.push('Active in the last few days.');
  }

  // 2) Frequency decline — current gap is well past the user's own rhythm.
  const median = medianGapDays(sessions.map((s) => s.date));
  if (median !== null && days !== null && days > median * 2 && days >= 7) {
    drivers.push({
      id: 'frequency_decline',
      weight: WEIGHTS.frequencyDecline,
      reason: `Usually active every ~${Math.round(median)} days, but it has been ${days}.`,
    });
  } else if (median !== null && median <= 4) {
    protectiveFactors.push('Has a strong, regular cadence.');
  }

  // 3) Shallow engagement — a single session is the most fragile state.
  if (ctx.sessionCount === 1) {
    drivers.push({
      id: 'shallow_engagement',
      weight: WEIGHTS.shallowEngagement,
      reason: 'Only one session so far — the habit has not formed yet.',
    });
  } else if (ctx.sessionCount >= 4) {
    protectiveFactors.push(`${ctx.sessionCount} sessions logged — an established user.`);
  }

  // 4) Progress sentiment — declining hurts more than a plateau.
  const trend = scoreTrend(sessions.map((s) => s.score));
  if (trend === 'down') {
    drivers.push({
      id: 'progress_declining',
      weight: WEIGHTS.progressDeclining,
      reason: 'Recent scores dipped — frustration is a common reason people drift away.',
    });
  } else if (trend === 'flat') {
    drivers.push({
      id: 'progress_plateau',
      weight: WEIGHTS.progressPlateau,
      reason: 'Scores have plateaued — a fresh angle keeps it interesting.',
    });
  } else if (trend === 'up') {
    protectiveFactors.push('Scores are trending up.');
  }

  // 5) Negative self-reported sentiment from Daily Notes.
  const feels = signals.recentFeels ?? [];
  const lowFeels = feels.filter((f) => f <= 2).length;
  if (feels.length > 0 && lowFeels / feels.length >= 0.5) {
    drivers.push({
      id: 'negative_sentiment',
      weight: WEIGHTS.negativeSentiment,
      reason: 'Recent check-ins skew negative — they may be discouraged.',
    });
  } else if (feels.length > 0 && feels[0] >= 4) {
    protectiveFactors.push('Last check-in was positive.');
  }

  // 6) A plan was started but went stale (commitment without follow-through).
  if (ctx.planStatus === 'in_progress' && days !== null && days >= 10) {
    drivers.push({
      id: 'stalled_plan',
      weight: WEIGHTS.stalledPlan,
      reason: 'An active practice plan has gone quiet — easy to feel "behind".',
    });
  }

  // 7) Low physical readiness (optional, soft signal).
  if (typeof signals.readiness === 'number' && signals.readiness < 40) {
    drivers.push({
      id: 'low_readiness',
      weight: WEIGHTS.lowReadiness,
      reason: 'Readiness has been low — fatigue can quietly stop a routine.',
    });
  }

  drivers.sort((a, b) => b.weight - a.weight);
  const score = clamp(
    Math.round(drivers.reduce((sum, d) => sum + d.weight, 0)),
    0,
    100,
  );
  const band = bandFor(score);

  return {
    score,
    band,
    drivers,
    protectiveFactors,
    intervention: deriveIntervention(band, drivers, trend, name),
    confidence: deriveConfidence(ctx, feels.length),
    computedAt: ctx.now,
  };
}

// ── Intervention + confidence ─────────────────────────────────

function deriveIntervention(
  band: ChurnBand,
  drivers: ChurnDriver[],
  trend: 'up' | 'down' | 'flat' | 'unknown',
  _name: string | null,
): ChurnIntervention {
  if (band === 'safe') return { urgency: 0, channelHint: 'none', angle: 'none' };

  const has = (id: ChurnDriver['id']) => drivers.some((d) => d.id === id);

  // Pick the angle from the dominant, most actionable driver.
  let angle: ChurnIntervention['angle'] = 'check_in';
  if (trend === 'up') angle = 'celebrate_progress';
  else if (has('stalled_plan')) angle = 'one_small_step';
  else if (has('shallow_engagement')) angle = 'gentle_restart';
  else if (has('negative_sentiment') || has('progress_declining')) angle = 'check_in';
  else angle = 'gentle_restart';

  // A user with a real cadence who just slipped → protect the streak instead.
  if (!has('shallow_engagement') && (has('recency') || has('frequency_decline')) && trend !== 'down') {
    angle = 'protect_streak';
  }

  const urgency: ChurnIntervention['urgency'] = band === 'critical' ? 3 : band === 'at_risk' ? 2 : 1;
  const channelHint: ChurnIntervention['channelHint'] =
    band === 'critical' ? 'email' : band === 'at_risk' ? 'email' : 'in_app';

  return { urgency, channelHint, angle };
}

function deriveConfidence(ctx: AgentContext, feelCount: number): ConfidenceLevel {
  const signalPoints = ctx.sessionCount + (feelCount > 0 ? 2 : 0) + (ctx.planStatus !== 'none' ? 1 : 0);
  if (signalPoints >= 5) return 'high';
  if (signalPoints >= 3) return 'medium';
  return 'low';
}
