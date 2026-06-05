'use client';

// ============================================================
// SwingVantage — Central Zustand Store
// localStorage-persisted app state, composed from per-domain
// slices (audit finding AA-5). Type shapes + defaults live in
// ./types; each domain's state+actions live in ./slices/*.
// The persisted shape (key `swingiq-store`) is unchanged.
// When Supabase is connected, swap the persist storage adapter.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SportId } from '@swingiq/core';

import type { SwingVantageState, SwingVantageStore } from './types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_SPORT_EQUIPMENT,
  DEFAULT_TRAINING,
  DEFAULT_AGENT_STATE,
  DEFAULT_COMMUNITY_STATE,
  DEFAULT_TUTORIAL_PROGRESS,
} from './types';
import { createProfileSlice } from './slices/profile';
import { createClubsSlice } from './slices/clubs';
import { createEquipmentSlice } from './slices/equipment';
import { createSessionsSlice } from './slices/sessions';
import { createVideoSlice } from './slices/video';
import { createTrainingSlice } from './slices/training';
import { createSettingsSlice } from './slices/settings';
import { createCommunitySlice } from './slices/community';
import { createTutorialSlice } from './slices/tutorial';
import { createAgentSlice } from './slices/agent';

// Re-export all store types/defaults so consumers keep importing from '@/store'.
export * from './types';

export const useSwingVantageStore = create<SwingVantageStore>()(
  persist(
    (set, get, store) => ({
      // ── Per-domain slices ──
      ...createProfileSlice(set, get, store),
      ...createClubsSlice(set, get, store),
      ...createEquipmentSlice(set, get, store),
      ...createSessionsSlice(set, get, store),
      ...createVideoSlice(set, get, store),
      ...createTrainingSlice(set, get, store),
      ...createSettingsSlice(set, get, store),
      ...createCommunitySlice(set, get, store),
      ...createTutorialSlice(set, get, store),
      ...createAgentSlice(set, get, store),

      // ── Onboarding step (cross-slice; derived from profile/bag/sessions) ──
      setup_step: 'profile',

      computeSetupStep: () => {
        const { profile, clubs, sessions, sportProfiles, video_analyses } = get();

        // For non-golf sports: a sport profile counts as a profile,
        // having any sport profile skips the "bag" (clubs) requirement,
        // and having any video analysis counts as a "session".
        const anyProfile = !!profile || Object.keys(sportProfiles).length > 0;
        const hasBagOrSportProfile = clubs.length > 0 || Object.keys(sportProfiles).length > 0;
        const anyContent = sessions.length > 0 || video_analyses.length > 0;
        const anyDiagnosed =
          sessions.some((s) => s.diagnoses.length > 0) ||
          video_analyses.some((v) => !!v.primary_issue);

        let step: SwingVantageState['setup_step'] = 'profile';
        if (anyProfile) step = 'bag';
        if (anyProfile && hasBagOrSportProfile) step = 'session';
        if (anyProfile && hasBagOrSportProfile && anyContent) step = 'diagnose';
        if (anyProfile && hasBagOrSportProfile && anyContent && anyDiagnosed) {
          step = 'complete';
        }
        set({ setup_step: step });
      },

      reset: () =>
        set({
          profile: null,
          sportProfiles: {},
          clubs: [],
          sportEquipment: DEFAULT_SPORT_EQUIPMENT,
          sessions: [],
          video_analyses: [],
          training: DEFAULT_TRAINING,
          settings: DEFAULT_SETTINGS,
          community: DEFAULT_COMMUNITY_STATE,
          tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,
          agent: DEFAULT_AGENT_STATE,
          setup_step: 'profile',
        }),
    }),
    {
      name: 'swingiq-store',
      storage: createJSONStorage(() => {
        // SSR-safe localStorage
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────

/** Latest session with diagnoses (sorted newest-first) */
export function useLatestDiagnosedSession() {
  return useSwingVantageStore((s) =>
    [...s.sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .find((sess) => sess.diagnoses.length > 0),
  );
}

/** All sessions for current sport */
export function useSportSessions(sport: SportId) {
  return useSwingVantageStore((s) => s.sessions.filter((sess) => sess.sport === sport));
}

/** Overall swing score: average of last 3 scored sessions */
export function useOverallScore() {
  return useSwingVantageStore((s) => {
    const scored = s.sessions.filter((sess) => sess.swing_score !== null).slice(0, 3);
    if (!scored.length) return null;
    return Math.round(scored.reduce((sum, sess) => sum + (sess.swing_score ?? 0), 0) / scored.length);
  });
}
