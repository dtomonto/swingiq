'use client';

// ============================================================
// SwingVantage — useGolfProfile (Phase 10)
// ------------------------------------------------------------
// The active golf profile: the user's confirmed choice if set, else
// auto-inferred from handicap → skill level → swing-score data. Exposes
// the inference (so the UI can say what it's based on) and a setter that
// persists the confirmed profile in settings (synced).
// ============================================================

import { useMemo } from 'react';
import { useSwingVantageStore } from '@/store';
import { inferGolfProfile } from './classify';
import type { GolfProfileId } from './profiles';

export function useGolfProfile() {
  const confirmed = useSwingVantageStore((s) => s.settings.golf_profile);
  const handicap = useSwingVantageStore((s) => s.profile?.handicap ?? null);
  const skillLevel = useSwingVantageStore((s) => s.profile?.skill_level ?? null);
  const sessions = useSwingVantageStore((s) => s.sessions);
  const updateSettings = useSwingVantageStore((s) => s.updateSettings);

  const avgOverallScore = useMemo(() => {
    const scored = sessions.filter((x) => x.swing_score != null).slice(0, 5);
    if (scored.length === 0) return null;
    return scored.reduce((a, b) => a + (b.swing_score ?? 0), 0) / scored.length;
  }, [sessions]);

  const inference = useMemo(
    () => inferGolfProfile({ handicap, skillLevel, avgOverallScore }),
    [handicap, skillLevel, avgOverallScore],
  );

  const profileId: GolfProfileId = confirmed ?? inference.profileId;

  return {
    profileId,
    inference,
    isConfirmed: !!confirmed,
    /** Confirm/override the profile (null reverts to auto). */
    setProfile: (id: GolfProfileId | null) => updateSettings({ golf_profile: id }),
  };
}
