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
import type { LanguageCode } from '@/lib/i18n';
import type { ThemeId } from '@/lib/theme/themes';
import type { CommunityState } from '@/lib/community/types';
import { DEFAULT_COMMUNITY_STATE } from '@/lib/community/types';
import type { TutorialProgress } from '@/lib/tutorial/types';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/tutorial/types';

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

export type UsageCategory =
  | 'adult'
  | 'parent_guardian'
  | 'coach'
  | 'minor_13_17'
  | 'minor_under_13'
  | null;

export interface AppSettings {
  units: 'yards' | 'meters';
  /** Legacy light/dark/system toggle. Retained for back-compat; the curated
   *  `colorTheme` selector is now the primary appearance control. */
  theme: 'light' | 'dark' | 'system';
  /** Active curated theme from the multi-theme system (see lib/theme/themes). */
  colorTheme: ThemeId;
  show_estimated_warnings: boolean;
  coaching_style: 'detailed' | 'concise' | 'encouragement' | 'balanced';
  default_club_for_diagnose: string;
  onboarding_complete: boolean;
  language?: LanguageCode;
  usage_category: UsageCategory;
  usage_category_set_at: string | null;
}

// ── Sport equipment types (non-golf) ──────────────────────────

export interface TennisRacket {
  id: string;
  brand: string;
  model: string;
  year: string;
  head_size_sq_in: number | null;
  weight_strung_oz: number | null;
  balance_pts_hl: number | null;
  swingweight: number | null;
  stiffness_ra: number | null;
  string_pattern: string;
  grip_size: string;
  string_brand: string;
  string_tension_mains: number | null;
  condition: 'new' | 'good' | 'fair' | 'worn';
  notes: string;
  created_at: string;
}

export interface BaseballBat {
  id: string;
  brand: string;
  model: string;
  year: string;
  length_in: number | null;
  weight_oz: number | null;
  drop: number | null;
  barrel_diameter_in: number | null;
  material: 'wood' | 'alloy' | 'composite' | 'hybrid' | '';
  piece_construction: 'one_piece' | 'two_piece' | '';
  balance: 'balanced' | 'end_loaded' | '';
  certification: string;
  composite_broken_in: boolean | null;
  condition: 'new' | 'good' | 'fair' | 'worn';
  notes: string;
  created_at: string;
}

export interface SoftballBat {
  id: string;
  brand: string;
  model: string;
  year: string;
  length_in: number | null;
  weight_oz: number | null;
  end_load_oz: number | null;
  balance: 'balanced' | 'end_loaded' | '';
  barrel_length_in: number | null;
  compression_rating: number | null;
  material: 'alloy' | 'composite' | 'hybrid' | '';
  certification_stamps: string;
  break_in_status: 'new' | 'partially_broken_in' | 'fully_broken_in' | '';
  condition: 'new' | 'good' | 'fair' | 'worn';
  notes: string;
  created_at: string;
}

export interface SportEquipment {
  tennis: TennisRacket[];
  baseball: BaseballBat[];
  softball_slow: SoftballBat[];
  softball_fast: SoftballBat[];
}

// ── Agent layer client state (dismissals + continuity) ────────
// Small, exportable slice so the intelligent layer's dismissals
// travel with a profile backup. The Welcome Back summary itself
// is always re-derived from sessions/training, so only the user's
// dismiss choices need to persist here.
export interface AgentClientState {
  /** Keys of dismissed insight cards, formatted `${contextHash}:${insightId}`. */
  dismissedKeys: string[];
  /** Context hash at which the Welcome Back card was dismissed. */
  welcomeBackDismissedHash: string | null;
}

export interface SwingIQState {
  // Golf profile (existing)
  profile: GolferProfileInput | null;

  // Sport-specific profiles for all non-golf sports
  sportProfiles: SportProfiles;

  // Golf equipment
  clubs: LocalClub[];

  // Non-golf equipment
  sportEquipment: SportEquipment;

  // Sessions & shots
  sessions: LocalSession[];

  // Video analyses
  video_analyses: LocalVideoAnalysis[];

  // Training
  training: TrainingProgress;

  // Settings
  settings: AppSettings;

  // Community & gamification state
  community: CommunityState;

  // Tutorial/help system progress
  tutorialProgress: TutorialProgress;

  // Agent layer client state (dismissals, continuity)
  agent: AgentClientState;

  // Onboarding step
  setup_step: 'profile' | 'bag' | 'session' | 'diagnose' | 'complete';
}

export interface SwingIQActions {
  // Golf profile
  setProfile: (profile: GolferProfileInput) => void;

  // Sport-specific profiles (non-golf)
  setSportProfile: (sport: Exclude<SportId, 'golf'>, data: Record<string, unknown>) => void;

  // Golf clubs
  addClub: (club: Omit<LocalClub, 'id' | 'created_at'>) => void;
  updateClub: (id: string, updates: Partial<LocalClub>) => void;
  removeClub: (id: string) => void;
  reorderClubs: (clubs: LocalClub[]) => void;

  // Non-golf equipment
  addTennisRacket: (racket: Omit<TennisRacket, 'id' | 'created_at'>) => void;
  removeTennisRacket: (id: string) => void;
  addBaseballBat: (bat: Omit<BaseballBat, 'id' | 'created_at'>) => void;
  removeBaseballBat: (id: string) => void;
  addSoftballBat: (sport: 'softball_slow' | 'softball_fast', bat: Omit<SoftballBat, 'id' | 'created_at'>) => void;
  removeSoftballBat: (sport: 'softball_slow' | 'softball_fast', id: string) => void;

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

  // Community
  updateCommunity: (updates: Partial<CommunityState>) => void;
  recordExport: () => void;

  // Tutorial progress
  updateTutorialProgress: (updates: Partial<TutorialProgress>) => void;

  // Agent layer
  dismissAgentInsight: (key: string) => void;
  setWelcomeBackDismissed: (hash: string) => void;
  resetAgentDismissals: () => void;

  // Computed
  computeSetupStep: () => void;
  reset: () => void;
}

// ── Defaults ──────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  units: 'yards',
  theme: 'light',
  colorTheme: 'standard',
  show_estimated_warnings: true,
  coaching_style: 'balanced',
  default_club_for_diagnose: 'Driver',
  onboarding_complete: false,
  usage_category: null,
  usage_category_set_at: null,
};

const DEFAULT_SPORT_EQUIPMENT: SportEquipment = {
  tennis: [],
  baseball: [],
  softball_slow: [],
  softball_fast: [],
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

const DEFAULT_AGENT_STATE: AgentClientState = {
  dismissedKeys: [],
  welcomeBackDismissedHash: null,
};

// ── Store ─────────────────────────────────────────────────────

export const useSwingIQStore = create<SwingIQState & SwingIQActions>()(
  persist(
    (set, get) => ({
      // Initial state
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

      // ── Non-golf equipment ──
      addTennisRacket: (racket) => {
        const item: TennisRacket = { ...racket, id: `racket_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, created_at: new Date().toISOString() };
        set((s) => ({ sportEquipment: { ...s.sportEquipment, tennis: [...s.sportEquipment.tennis, item] } }));
      },
      removeTennisRacket: (id) =>
        set((s) => ({ sportEquipment: { ...s.sportEquipment, tennis: s.sportEquipment.tennis.filter((r) => r.id !== id) } })),
      addBaseballBat: (bat) => {
        const item: BaseballBat = { ...bat, id: `bat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, created_at: new Date().toISOString() };
        set((s) => ({ sportEquipment: { ...s.sportEquipment, baseball: [...s.sportEquipment.baseball, item] } }));
      },
      removeBaseballBat: (id) =>
        set((s) => ({ sportEquipment: { ...s.sportEquipment, baseball: s.sportEquipment.baseball.filter((b) => b.id !== id) } })),
      addSoftballBat: (sport, bat) => {
        const item: SoftballBat = { ...bat, id: `sbat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, created_at: new Date().toISOString() };
        set((s) => ({ sportEquipment: { ...s.sportEquipment, [sport]: [...s.sportEquipment[sport], item] } }));
      },
      removeSoftballBat: (sport, id) =>
        set((s) => ({ sportEquipment: { ...s.sportEquipment, [sport]: s.sportEquipment[sport].filter((b: SoftballBat) => b.id !== id) } })),

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

      // ── Community ──
      updateCommunity: (updates) =>
        set((s) => ({ community: { ...s.community, ...updates } })),

      recordExport: () =>
        set((s) => ({
          community: {
            ...s.community,
            lastExportAt: new Date().toISOString(),
            exportCount: s.community.exportCount + 1,
          },
        })),

      // ── Tutorial Progress ──
      updateTutorialProgress: (updates) =>
        set((s) => ({
          tutorialProgress: { ...s.tutorialProgress, ...updates },
        })),

      // ── Agent layer (dismissals + continuity) ──
      dismissAgentInsight: (key) =>
        set((s) =>
          s.agent.dismissedKeys.includes(key)
            ? s
            : { agent: { ...s.agent, dismissedKeys: [...s.agent.dismissedKeys, key].slice(-100) } },
        ),
      setWelcomeBackDismissed: (hash) =>
        set((s) => ({ agent: { ...s.agent, welcomeBackDismissedHash: hash } })),
      resetAgentDismissals: () => set({ agent: DEFAULT_AGENT_STATE }),

      // ── Computed setup step ──
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

        let step: SwingIQState['setup_step'] = 'profile';
        if (anyProfile) step = 'bag';
        if (anyProfile && hasBagOrSportProfile) step = 'session';
        if (anyProfile && hasBagOrSportProfile && anyContent) step = 'diagnose';
        if (anyProfile && hasBagOrSportProfile && anyContent && anyDiagnosed) {
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
