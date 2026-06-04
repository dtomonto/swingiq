// ============================================================
// SwingIQ — AGI: Profile / identity adapter
// ------------------------------------------------------------
// Turns the user's declared profile (golf `GolferProfileInput` + the per-sport
// `sportProfiles` map from the store) into an AthleteIdentity. This is what
// lets the engine reason even before motion data exists, and — crucially —
// tie its conclusions to the athlete's OWN stated goal. Everything here is
// self-reported (basis: user_entered); we never dress it up as measured.
// ============================================================

import type { GolferProfileInput, SportId } from '@swingiq/core';
import { goalToCapabilities } from '../capabilities';
import type { AthleteIdentity } from '../types';

/** Build an AthleteIdentity from the store's profile + sportProfiles. */
export function identityFromStore(
  profile: GolferProfileInput | null,
  sportProfiles: Record<string, unknown> = {},
): AthleteIdentity | undefined {
  const declared = new Set<SportId>();
  if (profile) declared.add('golf');
  for (const key of Object.keys(sportProfiles)) declared.add(key as SportId);

  const declaredSports = Array.from(declared);
  // Nothing declared at all — let other sources decide; no identity to add.
  if (declaredSports.length === 0 && !profile) return undefined;

  const primaryGoal = profile?.primary_goal?.trim() || null;

  return {
    declaredSports,
    primarySport: profile ? 'golf' : declaredSports[0] ?? null,
    skillLevel: profile?.skill_level,
    handedness: profile?.handedness,
    handicap: profile?.handicap ?? null,
    primaryGoal,
    goalCapabilities: primaryGoal ? goalToCapabilities(primaryGoal) : [],
  };
}
