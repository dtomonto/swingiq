// ============================================================
// SwingVantage — Player Arc
// ------------------------------------------------------------
// The story of a player's improvement: where they started, what
// they keep running into, what they've moved past, and the single
// next move. Built from the agent progress-memory workflow + the
// retest engine — it never claims a flaw is "fixed" (that needs a
// measured retest), only that it's no longer the top issue.
// ============================================================

import type { PlayerArc, PlayerArcInput } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'recently';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function buildPlayerArc(input: PlayerArcInput): PlayerArc {
  const { sessions, progress, retestResults, streakDays, sportLabel } = input;
  const hasData = sessions.length > 0;

  // Newest-first → the first diagnosed focus is the current mission target.
  const latestDiagnosed = sessions.find((s) => s.hasDiagnosis && s.primaryFocus);
  const oldest = sessions[sessions.length - 1] ?? null;

  const mission = latestDiagnosed?.primaryFocus
    ? `Lock in a fix for "${latestDiagnosed.primaryFocus}" — then prove it with a retest.`
    : hasData
      ? `Capture a clean baseline ${sportLabel.toLowerCase()} swing so SwingVantage can find your one fix.`
      : `Run your first ${sportLabel.toLowerCase()} analysis to start your arc.`;

  const baseline = oldest
    ? `Started ${shortDate(oldest.date)}${oldest.primaryFocus ? ` · first focus: ${oldest.primaryFocus}` : ''}.`
    : 'No baseline yet — your first session sets it.';

  // "Moved past": foci that appeared in older sessions but are NOT the current
  // top focus and are NOT still recurring. Honest framing: no longer top issue.
  const currentTop = latestDiagnosed?.primaryFocus ?? null;
  const recurring = new Set(progress.recurringPatterns);
  const seen = new Set<string>();
  const movedPast: string[] = [];
  for (const s of sessions.slice(1)) {
    if (!s.primaryFocus) continue;
    if (s.primaryFocus === currentTop) continue;
    if (recurring.has(s.primaryFocus)) continue;
    if (seen.has(s.primaryFocus)) continue;
    seen.add(s.primaryFocus);
    movedPast.push(s.primaryFocus);
  }

  // Honest, earned milestones.
  const milestones: string[] = [];
  if (hasData) milestones.push('First swing analyzed');
  if (sessions.length >= 3) milestones.push(`${sessions.length} sessions logged`);
  if (streakDays >= 3) milestones.push(`${streakDays}-day practice streak`);
  if (retestResults.length >= 1) milestones.push('First retest completed');
  if (progress.direction === 'improving') milestones.push('Score trending up');

  return {
    sport: input.sport,
    hasData,
    mission,
    baseline,
    trendDirection: progress.direction,
    trendSummary: progress.trendSummary,
    recurringFlaws: progress.recurringPatterns,
    movedPastFlaws: movedPast.slice(0, 4),
    streakDays,
    sessionsLogged: sessions.length,
    retestsCompleted: retestResults.length,
    nextBestAction: progress.nextBestAction,
    milestones,
  };
}
