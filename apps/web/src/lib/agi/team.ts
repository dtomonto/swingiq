// ============================================================
// SwingVantage — AGI: Team intelligence (the moat engine)
// ------------------------------------------------------------
// Aggregates each athlete's cross-sport model into ONE team read: every
// athlete's keystone, and — the coach payload — the capability the MOST of the
// roster is weak in ("train this one thing as a group and you lift the team").
// This is only possible because each athlete already has a cross-sport model,
// so it compounds the single-athlete moat into a coach/roster lock-in. Pure:
// the caller runs runAthleteGI per athlete and passes the results in.
// ============================================================

import { CAPABILITIES, getCapability } from './capabilities';
import { AGI_THRESHOLDS } from './config/thresholds';
import type { AthleteGIResult, CapabilityId } from './types';

export interface TeamMember {
  athleteId: string;
  name: string;
  result: AthleteGIResult;
}

export interface TeamMemberKeystone {
  athleteId: string;
  name: string;
  keystone: { capability: CapabilityId; name: string; score: number } | null;
  trustGrade: 'A' | 'B' | 'C' | 'D';
}

export interface TeamCapabilityGap {
  capability: CapabilityId;
  name: string;
  /** How many athletes are weak (below the keystone threshold) in this capability. */
  athletesAffected: number;
  /** Mean score across athletes who have this capability observed. */
  avgScore: number;
}

export interface TeamSummary {
  memberCount: number;
  rosterKeystones: TeamMemberKeystone[];
  /** The capability the most athletes are weak in — the group focus. */
  topSharedGap: TeamCapabilityGap | null;
  /** All gaps, ranked by how many athletes they affect. */
  gaps: TeamCapabilityGap[];
  summary: string;
}

function keystoneOf(result: AthleteGIResult): TeamMemberKeystone['keystone'] {
  const ks = result.insights.find((i) => i.kind === 'keystone');
  if (!ks || !ks.capability) return null;
  const cap = result.model.capabilities.find((c) => c.capability === ks.capability);
  if (!cap || cap.score === null) return null;
  return { capability: cap.capability, name: cap.name, score: cap.score };
}

/** Aggregate a roster of per-athlete results into one team read. Never throws. */
export function buildTeamSummary(members: TeamMember[]): TeamSummary {
  const rosterKeystones: TeamMemberKeystone[] = members.map((m) => ({
    athleteId: m.athleteId,
    name: m.name,
    keystone: keystoneOf(m.result),
    trustGrade: m.result.trust.grade,
  }));

  // For each capability, how many athletes are weak in it + their average score.
  const weakMax = AGI_THRESHOLDS.keystone.maxScore;
  const gaps: TeamCapabilityGap[] = CAPABILITIES.map((def) => {
    const scores: number[] = [];
    let affected = 0;
    for (const m of members) {
      const cap = m.result.model.capabilities.find((c) => c.capability === def.id);
      if (!cap || cap.score === null) continue;
      scores.push(cap.score);
      if (cap.score < weakMax) affected += 1;
    }
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { capability: def.id, name: def.name, athletesAffected: affected, avgScore };
  })
    .filter((g) => g.athletesAffected > 0)
    .sort((a, b) => b.athletesAffected - a.athletesAffected || a.avgScore - b.avgScore);

  const topSharedGap = gaps[0] ?? null;

  let summary: string;
  if (members.length === 0) {
    summary = 'No athletes analysed yet — once your roster has sessions, the team\'s shared focus appears here.';
  } else if (!topSharedGap) {
    summary = 'No shared weakness stands out — your athletes are strong across the board or need more data.';
  } else if (topSharedGap.athletesAffected >= Math.ceil(members.length / 2)) {
    summary = `${topSharedGap.athletesAffected} of your ${members.length} athletes share a ${topSharedGap.name} weakness (team avg ${topSharedGap.avgScore}/100). A group block on ${getCapability(topSharedGap.capability).name.toLowerCase()} lifts the most of the roster at once.`;
  } else {
    summary = `Your athletes' biggest shared gap is ${topSharedGap.name} (${topSharedGap.athletesAffected} of ${members.length}). Otherwise keystones are individual — coach them one-to-one.`;
  }

  return { memberCount: members.length, rosterKeystones, topSharedGap, gaps, summary };
}
