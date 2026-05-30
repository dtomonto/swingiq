'use client';

// ============================================================
// SwingIQ — Central Zustand Store
// localStorage-persisted app state.
// Every page reads/writes from here instead of hardcoded data.
// When Supabase is connected, swap the persist storage adapter.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GolferProfileInput, Shot, DiagnosisOutput } from '@swingiq/core';
import type { SportId } from '@swingiq/core';

// ── Sport-specific profile storage types ──────────────────────
// These are intentionally loose (Record<string, unknown>) so the
// store doesn't couple tightly to the schema types. Consumers
// cast to the appropriate type when reading.
export type SportProfiles = {
  tennis?: Record<string, unknown>;
  baseball?: Record<string, unknown>;
  softball_slow?: Record<string, unknown>;
  softball_fast?: Record<string, unknown>;
};

// ── Types ─────────────────────────────────────────────────────

export interface LocalClub {
  id: string;
  name: string;
  category: 'driver' | 'wood' | 'hybrid' | 'iron' | 'wedge' | 'putter' | 'other';
  brand: string;
  model: string;
  loft: number | null;
  typical_carry: number | null;
  typical_total: number | null;
  shaft_flex: string;
  notes: string;
  sort_order: number;
  created_at: string;
}

export interface LocalSession {
  id: string;
  name: string;
  date: string;
  sport: SportId;
  club_name: string;
  club_category: string;
  launch_monitor: string;
  indoor_outdoor: 'indoor' | 'outdoor';
  mat_or_grass: 'mat' | 'grass';
  notes: string;
  shot_count: number;
  shots: Shot[];
  diagnoses: DiagnosisOutput[];
  swing_score: number | null;
  created_at: string;
}

export interface LocalVideoAnalysis {
  id: string;
  session_id: string | null;
  sport: SportId;
  file_name: string;
  overall_score: number;
  camera_angle: string;
  phases_count: number;
  issues_count: number;
  primary_issue: string | null;
  created_at: string;
}

export interface TrainingProgress {
  active_diagnosis_id: string | null;
  active_session_id: string | null;
  completed_steps: number[]; // drill step indices
  drills_completed: Record<string, { count: number; last_done: string }>;
  started_at: string | null;
  streak_days: number;
  last_practice_date: string | null;
  milestones_earned: string[];
}

export interface AppSettings {
  units: 'yards' | 'meters';
  theme: 'light' | 'dark' | 'system';
  show_estimated_warnings: boolean;
  coaching_style: 'detailed' | 'concise' | 'encouragement' | 'balanced';
  default_club_for_diagnose: string;
  onboarding_complete: boolean;
}

export interface SwingIQState {
  // Golf profile (existing)
  profile: GolferProfileInput | null;

  // Sport-specific profiles for all non-golf sports
  sportProfiles: SportProfiles;

  // Equipment
  clubs: LocalClub[];

  // Sessions & shots
  sessions: LocalSession[];

  // Video analyses
  video_analyses: LocalVideoAnalysis[];

  // Training
  training: TrainingProgress;

  // Settings
  settings: AppSettings;

  // Onboarding step
  setup_step: 'profile' | 'bag' | 'session' | 'diagnose' | 'complete';
}

export interface SwingIQActions {
  // Golf profile
  setProfile: (profile: GolferProfileInput) => void;

  // Sport-specific profiles (non-golf)
  setSportProfile: (sport: Exclude<SportId, 'golf'>, data: Record<string, unknown>) => void;

  // Clubs
  addClub: (club: Omit<LocalClub, 'id' | 'created_at'>) => void;
  updateClub: (id: string, updates: Partial<LocalClub>) => void;
  removeClub: (id: string) => void;
  reorderClubs: (clubs: LocalClub[]) => void;

  // Sessions
  addSession: (session: Omit<LocalSession, 'id' | 'created_at'>) => void;
  updateSession: (id: string, updates: Partial<LocalSession>) => void;
  removeSession: (id: string) => void;
  getSessionById: (id: string) => LocalSession | undefined;

  // Video analyses
  addVideoAnalysis: (analysis: Omit<LocalVideoAnalysis, 'id' | 'created_at'>) => void;

  // Training
  setActiveDiagnosis: (diagnosisId: string | null, sessionId: string | null) => void;
  toggleDrillStep: (stepIndex: number) => void;
  markDrillDone: (drillId: string) => void;
  recordPractice: () => void;
  earnMilestone: (milestoneId: string) => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Computed
  computeSetupStep: () => void;
  reset: () => void;
}

// ── Defaults ──────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  units: 'yards',
  theme: 'light',
  show_estimated_warnings: true,
  coaching_style: 'balanced',
  default_club_for_diagnose: 'Driver',
  onboarding_complete: false,
};

const DEFAULT_TRAINING: TrainingProgress = {
  active_diagnosis_id: null,
  active_session_id: null,
  completed_steps: [],
  drills_completed: {},
  started_at: null,
  streak_days: 0,
  last_practice_date: null,
  milestones_earned: [],
};

// ── Store ─────────────────────────────────────────────────────

export const useSwingIQStore = create<SwingIQState & SwingIQActions>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      sportProfiles: {},
      clubs: [],
      sessions: [],
      video_analyses: [],
      training: DEFAULT_TRAINING,
      settings: DEFAULT_SETTINGS,
      setup_step: 'profile',

      // ── Golf Profile ──
      setProfile: (profile) => {
        set({ profile });
        get().computeSetupStep();
      },

      // ── Sport-Specific Profiles ──
      setSportProfile: (sport, data) =>
        set((s) => ({
          sportProfiles: { ...s.sportProfiles, [sport]: data },
        })),

      // ── Clubs ──
      addClub: (club) => {
        const newClub: LocalClub = {
          ...club,
          id: `club_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ clubs: [...s.clubs, newClub] }));
        get().computeSetupStep();
      },
      updateClub: (id, updates) =>
        set((s) => ({ clubs: s.clubs.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      removeClub: (id) => set((s) => ({ clubs: s.clubs.filter((c) => c.id !== id) })),
      reorderClubs: (clubs) => set({ clubs }),

      // ── Sessions ──
      addSession: (session) => {
        const newSession: LocalSession = {
          ...session,
          id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ sessions: [newSession, ...s.sessions] }));
        get().computeSetupStep();
      },
      updateSession: (id, updates) =>
        set((s) => ({ sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...updates } : sess)) })),
      removeSession: (id) => set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) })),
      getSessionById: (id) => get().sessions.find((s) => s.id === id),

      // ── Video Analyses ──
      addVideoAnalysis: (analysis) => {
        const newAnalysis: LocalVideoAnalysis = {
          ...analysis,
          id: `video_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ video_analyses: [newAnalysis, ...s.video_analyses] }));
      },

      // ── Training ──
      setActiveDiagnosis: (diagnosisId, sessionId) =>
        set((s) => ({
          training: {
            ...s.training,
            active_diagnosis_id: diagnosisId,
            active_session_id: sessionId,
            completed_steps: [],
            started_at: new Date().toISOString(),
          },
        })),
      toggleDrillStep: (stepIndex) =>
        set((s) => {
          const steps = s.training.completed_steps;
          const next = steps.includes(stepIndex)
            ? steps.filter((i) => i !== stepIndex)
            : [...steps, stepIndex];
          return { training: { ...s.training, completed_steps: next } };
        }),
      markDrillDone: (drillId) =>
        set((s) => {
          const existing = s.training.drills_completed[drillId];
          return {
            training: {
              ...s.training,
              drills_completed: {
                ...s.training.drills_completed,
                [drillId]: {
                  count: (existing?.count ?? 0) + 1,
                  last_done: new Date().toISOString(),
                },
              },
            },
          };
        }),
      recordPractice: () =>
        set((s) => {
          const today = new Date().toDateString();
          const lastDate = s.training.last_practice_date
            ? new Date(s.training.last_practice_date).toDateString()
            : null;
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          const newStreak =
            lastDate === today
              ? s.training.streak_days
              : lastDate === yesterday
              ? s.training.streak_days + 1
              : 1;
          return {
            training: {
              ...s.training,
              streak_days: newStreak,
              last_practice_date: new Date().toISOString(),
            },
          };
        }),
      earnMilestone: (milestoneId) =>
        set((s) => {
          if (s.training.milestones_earned.includes(milestoneId)) return s;
          return {
            training: {
              ...s.training,
              milestones_earned: [...s.training.milestones_earned, milestoneId],
            },
          };
        }),

      // ── Settings ──
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      // ── Computed setup step ──
      computeSetupStep: () => {
        const { profile, clubs, sessions } = get();
        let step: SwingIQState['setup_step'] = 'profile';
        if (profile) step = 'bag';
        if (profile && clubs.length > 0) step = 'session';
        if (profile && clubs.length > 0 && sessions.length > 0) step = 'diagnose';
        if (profile && clubs.length > 0 && sessions.length > 0 && sessions.some((s) => s.diagnoses.length > 0)) {
          step = 'complete';
        }
        set({ setup_step: step });
      },

      // ── Reset ──
      reset: () =>
        set({
          profile: null,
          sportProfiles: {},
          clubs: [],
          sessions: [],
          video_analyses: [],
          training: DEFAULT_TRAINING,
          settings: DEFAULT_SETTINGS,
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
    }
  )
);

// ── Selectors ─────────────────────────────────────────────────

/** Latest session with diagnoses (sorted newest-first) */
export function useLatestDiagnosedSession() {
  return useSwingIQStore((s) =>
    [...s.sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .find((sess) => sess.diagnoses.length > 0)
  );
}

/** All sessions for current sport */
export function useSportSessions(sport: SportId) {
  return useSwingIQStore((s) => s.sessions.filter((sess) => sess.sport === sport));
}

/** Overall swing score: average of last 3 scored sessions */
export function useOverallScore() {
  return useSwingIQStore((s) => {
    const scored = s.sessions.filter((sess) => sess.swing_score !== null).slice(0, 3);
    if (!scored.length) return null;
    return Math.round(scored.reduce((sum, sess) => sum + (sess.swing_score ?? 0), 0) / scored.length);
  });
}
