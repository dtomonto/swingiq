'use client';

// ============================================================
// WS-04 — usePlayerProfileIntelligence
// Memoized composition of the EXISTING engine hooks (athletic-journey +
// priority) plus store activity into the profile intelligence summary.
// No scoring is recomputed here — it only composes.
// ============================================================

import { useMemo } from 'react';
import type { SportId } from '@swingiq/core';
import { useSwingVantageStore } from '@/store';
import { useAthleticJourney } from '@/lib/athletic-journey/adapters/useAthleticJourney';
import { usePriorityResult } from '@/lib/priority/usePriorityResult';
import { buildProfileIntelligence } from './intelligence';
import type { ProfileIntelligenceSummary } from './types';

export function usePlayerProfileIntelligence(sport: SportId): ProfileIntelligenceSummary {
  const journey = useAthleticJourney(sport);
  const priority = usePriorityResult();
  const sessions = useSwingVantageStore((s) => s.sessions);
  const training = useSwingVantageStore((s) => s.training);
  const profile = useSwingVantageStore((s) => s.profile);

  return useMemo(
    () =>
      buildProfileIntelligence({
        journey,
        priority,
        activity: {
          totalSessions: sessions.length,
          lastActiveAt: training.last_practice_date ?? null,
          streakDays: training.streak_days ?? 0,
        },
        profile: {
          skillLevel: profile?.skill_level ?? null,
          goals: profile?.primary_goal ? [profile.primary_goal] : [],
          commonIssues: profile?.current_miss ? [profile.current_miss] : [],
        },
      }),
    [journey, priority, sessions.length, training.last_practice_date, training.streak_days, profile],
  );
}
