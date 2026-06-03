// ============================================================
// SwingIQ store — shared types, defaults, and the slice helper.
// The store is split into per-domain slices (audit finding AA-5);
// this module is the single source of truth for the state/action
// shapes so the slices and consumers never drift. The persisted
// shape (localStorage key `swingiq-store`) is unchanged.
// ============================================================

import type { StateCreator } from 'zustand';
import type { GolferProfileInput, Shot, DiagnosisOutput } from '@swingiq/core';
import type { SportId } from '@swingiq/core';
import type { LanguageCode } from '@/lib/i18n';
import type { ThemeId } from '@/lib/theme/themes';
import type { CoachingTone } from '@/lib/coaching/tones';
import type { CommunityState } from '@/lib/community/types';
import { DEFAULT_COMMUNITY_STATE } from '@/lib/community/types';
import type { TutorialProgress } from '@/lib/tutorial/types';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/tutorial/types';

export { DEFAULT_COMMUNITY_STATE, DEFAULT_TUTORIAL_PROGRESS };

// ── Sport-specific profile storage types ──────────────────────
// Intentionally loose so the store doesn't couple to schema types.
export type SportProfiles = {
  tennis?: Record<string, unknown>;
  baseball?: Record<string, unknown>;
  softball_slow?: Record<string, unknown>;
  softball_fast?: Record<string, unknown>;
};

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
  /** Audience-oriented tone (Beginner/Parent/Competitive/Coach). Optional for
   *  back-compat with older saved state and backups. Defaults to 'beginner'. */
  coaching_tone?: CoachingTone;
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
export interface AgentClientState {
  /** Keys of dismissed insight cards, formatted `${contextHash}:${insightId}`. */
  dismissedKeys: string[];
  /** Context hash at which the Welcome Back card was dismissed. */
  welcomeBackDismissedHash: string | null;
}

export interface SwingIQState {
  profile: GolferProfileInput | null;
  sportProfiles: SportProfiles;
  clubs: LocalClub[];
  sportEquipment: SportEquipment;
  sessions: LocalSession[];
  video_analyses: LocalVideoAnalysis[];
  training: TrainingProgress;
  settings: AppSettings;
  community: CommunityState;
  tutorialProgress: TutorialProgress;
  agent: AgentClientState;
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

/** The full combined store (state + actions). */
export type SwingIQStore = SwingIQState & SwingIQActions;

/**
 * Slice creator type for the persisted store. Each slice receives `set`/`get`
 * typed against the WHOLE store, so cross-slice calls (e.g. computeSetupStep)
 * are type-safe. `T` is the subset of the store the slice owns.
 */
export type SwingIQSlice<T> = StateCreator<
  SwingIQStore,
  [['zustand/persist', unknown]],
  [],
  T
>;

// ── Defaults ──────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  units: 'yards',
  theme: 'light',
  colorTheme: 'standard',
  show_estimated_warnings: true,
  coaching_style: 'balanced',
  coaching_tone: 'beginner',
  default_club_for_diagnose: 'Driver',
  onboarding_complete: false,
  usage_category: null,
  usage_category_set_at: null,
};

export const DEFAULT_SPORT_EQUIPMENT: SportEquipment = {
  tennis: [],
  baseball: [],
  softball_slow: [],
  softball_fast: [],
};

export const DEFAULT_TRAINING: TrainingProgress = {
  active_diagnosis_id: null,
  active_session_id: null,
  completed_steps: [],
  drills_completed: {},
  started_at: null,
  streak_days: 0,
  last_practice_date: null,
  milestones_earned: [],
};

export const DEFAULT_AGENT_STATE: AgentClientState = {
  dismissedKeys: [],
  welcomeBackDismissedHash: null,
};

// Helper for id generation, shared across slices.
export const newId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
