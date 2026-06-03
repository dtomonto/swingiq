// ============================================================
// SwingIQ — Workflow: Progress Memory
// ------------------------------------------------------------
// Helps returning users understand what is improving, stalling,
// or sliding. Compares the active sport's sessions over time.
// Deterministic — no AI required.
// ============================================================

import type { AgentContext, ProgressMemory, TrendDirection, SessionSummary } from '../types';

const IMPROVE_THRESHOLD = 3; // score points
const DECLINE_THRESHOLD = -3;

function scoredSessions(ctx: AgentContext): SessionSummary[] {
  // newest-first already; keep only those with a numeric score
  return ctx.sportSessions.filter((s) => typeof s.score === 'number');
}

export function computeProgressTrend(ctx: AgentContext): ProgressMemory {
  const scored = scoredSessions(ctx);
  const recurring = findRecurringPatterns(ctx.sportSessions);

  if (scored.length < 2) {
    return {
      trendSummary:
        scored.length === 1
          ? 'You have one scored session — add another to start tracking your trend.'
          : 'Add a couple of sessions and SwingIQ will start tracking what is improving.',
      direction: 'unknown',
      improvedAreas: [],
      stalledAreas: [],
      worsenedAreas: [],
      recurringPatterns: recurring,
      suggestedAdjustment:
        'Keep your setup consistent between sessions so comparisons are fair.',
      nextBestAction:
        ctx.activeSport === 'golf'
          ? 'Log another session with the same club.'
          : 'Upload another video from the same angle.',
    };
  }

  const latest = scored[0]!;
  const prior = scored[1]!;
  const delta = (latest.score ?? 0) - (prior.score ?? 0);

  let direction: TrendDirection = 'stable';
  if (delta >= IMPROVE_THRESHOLD) direction = 'improving';
  else if (delta <= DECLINE_THRESHOLD) direction = 'declining';

  // Average of last up-to-3 vs the previous up-to-3 for a smoother read.
  const recent = scored.slice(0, 3);
  const older = scored.slice(3, 6);
  const recentAvg = avg(recent.map((s) => s.score ?? 0));
  const olderAvg = older.length ? avg(older.map((s) => s.score ?? 0)) : null;

  const improvedAreas: string[] = [];
  const worsenedAreas: string[] = [];
  const stalledAreas: string[] = [];

  if (direction === 'improving') improvedAreas.push('Overall swing score');
  else if (direction === 'declining') worsenedAreas.push('Overall swing score');
  else stalledAreas.push('Overall swing score');

  // A focus that keeps recurring is a stalled area worth a callout.
  for (const pattern of recurring) {
    if (!stalledAreas.includes(pattern)) stalledAreas.push(pattern);
  }

  const trendSummary = buildTrendSummary(direction, delta, recentAvg, olderAvg);

  return {
    trendSummary,
    direction,
    improvedAreas,
    stalledAreas,
    worsenedAreas,
    recurringPatterns: recurring,
    suggestedAdjustment:
      direction === 'declining'
        ? 'Slow down and rebuild the basics for a session before pushing intensity.'
        : direction === 'improving'
          ? 'Keep doing what is working — change only one thing at a time.'
          : 'Pick one focus and stick with it for a few sessions to break the plateau.',
    nextBestAction:
      direction === 'improving'
        ? 'Lock in the gain with one more session, then move to your next priority.'
        : 'Re-test your top focus with the same setup to confirm the pattern.',
  };
}

function buildTrendSummary(
  direction: TrendDirection,
  delta: number,
  recentAvg: number,
  olderAvg: number | null,
): string {
  const rounded = Math.abs(Math.round(delta));
  if (direction === 'improving') {
    return `Your score is trending up${rounded ? ` (+${rounded} since last session)` : ''}. Recent average: ${Math.round(recentAvg)}.`;
  }
  if (direction === 'declining') {
    return `Your score dipped${rounded ? ` (-${rounded} since last session)` : ''}. That is normal — re-test to see if it is a blip or a pattern.`;
  }
  if (olderAvg !== null) {
    return `Your score is holding steady around ${Math.round(recentAvg)}. Time to target a new focus to move the needle.`;
  }
  return `Your score is holding steady around ${Math.round(recentAvg)}.`;
}

/** A focus that shows up in 2+ sessions is a recurring pattern. */
export function findRecurringPatterns(sessions: SessionSummary[]): string[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (!s.primaryFocus) continue;
    counts.set(s.primaryFocus, (counts.get(s.primaryFocus) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([focus]) => focus);
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
