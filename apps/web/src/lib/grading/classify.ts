// ============================================================
// SwingVantage — Golf profile auto-assignment (Phase 10)
// ------------------------------------------------------------
// Infers the player's profile from the best signal available:
//   handicap (most reliable) > stated skill level > swing-score data >
//   a safe default. Always returns a confidence + basis so the UI can
//   say what it's based on and let the user confirm/override.
// ============================================================

import type { SkillLevel } from '@swingiq/core';
import { GOLF_PROFILES, type GolfProfileId } from './profiles';

export type ProfileBasis = 'handicap' | 'skill_level' | 'data' | 'default';

export interface ProfileInference {
  profileId: GolfProfileId;
  confidence: 'high' | 'medium' | 'low';
  basis: ProfileBasis;
}

const SKILL_TO_PROFILE: Record<SkillLevel, GolfProfileId> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
  elite: 'elite',
};

/** Map a handicap to a profile (lower handicap = higher profile). */
export function profileFromHandicap(handicap: number): GolfProfileId {
  // Best profile (highest order) whose upper handicap bound the value clears.
  const byBest = [...GOLF_PROFILES].sort((a, b) => b.order - a.order);
  for (const p of byBest) {
    if (handicap <= p.handicapRange[1]) return p.id;
  }
  return 'beginner';
}

/** Map an average 0–100 swing score to a profile (highest level it clears). */
export function profileFromSwingScore(avgOverall: number): GolfProfileId {
  const byOrder = [...GOLF_PROFILES].sort((a, b) => a.order - b.order);
  let pick: GolfProfileId = byOrder[0]!.id;
  for (const p of byOrder) {
    if (avgOverall >= p.expected) pick = p.id;
  }
  return pick;
}

export function inferGolfProfile(args: {
  handicap?: number | null;
  skillLevel?: SkillLevel | null;
  avgOverallScore?: number | null;
}): ProfileInference {
  if (typeof args.handicap === 'number' && Number.isFinite(args.handicap)) {
    return { profileId: profileFromHandicap(args.handicap), confidence: 'high', basis: 'handicap' };
  }
  if (args.skillLevel) {
    return { profileId: SKILL_TO_PROFILE[args.skillLevel], confidence: 'medium', basis: 'skill_level' };
  }
  if (typeof args.avgOverallScore === 'number' && Number.isFinite(args.avgOverallScore)) {
    return { profileId: profileFromSwingScore(args.avgOverallScore), confidence: 'low', basis: 'data' };
  }
  return { profileId: 'developing', confidence: 'low', basis: 'default' };
}
