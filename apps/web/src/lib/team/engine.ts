// ============================================================
// SwingVantage — TeamOS: team-pulse engine (pure)
// ------------------------------------------------------------
// Aggregates a roster of capability snapshots into ONE coach read:
// each athlete's biggest opportunity, and the capability the most of the
// roster is weak in ("train this one thing as a group"). Mirrors the AGI
// team logic on simple coach-entered scores. Deterministic, never throws.
// ============================================================

import { CAPABILITIES, getCapability } from '@/lib/agi';
import type { CapabilityId } from '@/lib/agi';
import type { AthleteFocus, TeamAthlete, TeamGap, TeamPulse } from './types';

/** Below this, a capability counts as a weakness worth coaching. */
export const WEAK_THRESHOLD = 60;

function focusOf(athlete: TeamAthlete): AthleteFocus['focus'] {
  let lowest: { capability: CapabilityId; name: string; score: number } | null = null;
  for (const cap of CAPABILITIES) {
    const score = athlete.scores[cap.id];
    if (typeof score !== 'number') continue;
    if (!lowest || score < lowest.score) {
      lowest = { capability: cap.id, name: cap.name, score };
    }
  }
  return lowest;
}

/** Aggregate a roster into one team read. */
export function buildTeamPulse(athletes: TeamAthlete[]): TeamPulse {
  const rosterFocus: AthleteFocus[] = athletes.map((a) => ({
    athleteId: a.id,
    name: a.name,
    sport: a.sport,
    focus: focusOf(a),
  }));

  const gaps: TeamGap[] = CAPABILITIES.map((def) => {
    const scores: number[] = [];
    let affected = 0;
    for (const a of athletes) {
      const score = a.scores[def.id];
      if (typeof score !== 'number') continue;
      scores.push(score);
      if (score < WEAK_THRESHOLD) affected += 1;
    }
    const avgScore = scores.length
      ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
      : 0;
    return { capability: def.id, name: def.name, athletesAffected: affected, avgScore };
  })
    .filter((g) => g.athletesAffected > 0)
    .sort((a, b) => b.athletesAffected - a.athletesAffected || a.avgScore - b.avgScore);

  const topSharedGap = gaps[0] ?? null;

  let summary: string;
  if (athletes.length === 0) {
    summary = 'Add your athletes and a few capability scores to see the team’s shared focus.';
  } else if (!topSharedGap) {
    summary = 'No shared weakness stands out yet — add more capability scores to surface the team focus.';
  } else if (topSharedGap.athletesAffected >= Math.ceil(athletes.length / 2)) {
    summary = `${topSharedGap.athletesAffected} of your ${athletes.length} athletes share a ${topSharedGap.name} weakness (team avg ${topSharedGap.avgScore}/100). A group block on ${getCapability(topSharedGap.capability).name.toLowerCase()} lifts the most of the roster at once.`;
  } else {
    summary = `Your athletes’ biggest shared gap is ${topSharedGap.name} (${topSharedGap.athletesAffected} of ${athletes.length}). Otherwise, coach the focus areas one-to-one.`;
  }

  return { memberCount: athletes.length, rosterFocus, topSharedGap, gaps, summary };
}
