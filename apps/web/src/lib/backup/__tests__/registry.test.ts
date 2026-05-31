// ============================================================
// SwingIQ — Backup Registry Tests
// Tests that the registry is populated and all modules are valid.
// ============================================================

import { getBackupRegistry, getExportableModules, getSensitiveModules } from '../registry';
import type { SwingIQState } from '@/store';
import { DEFAULT_COMMUNITY_STATE } from '@/lib/community/types';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/tutorial/types';

function makeMinimalState(): SwingIQState {
  return {
    profile: null,
    sportProfiles: {},
    clubs: [],
    sessions: [],
    video_analyses: [],
    training: {
      active_diagnosis_id: null,
      active_session_id: null,
      completed_steps: [],
      drills_completed: {},
      started_at: null,
      streak_days: 0,
      last_practice_date: null,
      milestones_earned: [],
    },
    settings: {
      units: 'yards',
      theme: 'light',
      show_estimated_warnings: true,
      coaching_style: 'balanced',
      default_club_for_diagnose: 'Driver',
      onboarding_complete: false,
      language: 'en',
    },
    community: DEFAULT_COMMUNITY_STATE,
    tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,
    setup_step: 'profile',
    setProfile: jest.fn(),
    setSportProfile: jest.fn(),
    addClub: jest.fn(),
    updateClub: jest.fn(),
    removeClub: jest.fn(),
    reorderClubs: jest.fn(),
    addSession: jest.fn(),
    updateSession: jest.fn(),
    removeSession: jest.fn(),
    getSessionById: jest.fn(),
    addVideoAnalysis: jest.fn(),
    setActiveDiagnosis: jest.fn(),
    toggleDrillStep: jest.fn(),
    markDrillDone: jest.fn(),
    recordPractice: jest.fn(),
    earnMilestone: jest.fn(),
    updateSettings: jest.fn(),
    updateCommunity: jest.fn(),
    recordExport: jest.fn(),
    updateTutorialProgress: jest.fn(),
    computeSetupStep: jest.fn(),
    reset: jest.fn(),
  } as unknown as SwingIQState;
}

describe('Backup Registry', () => {
  it('contains at least 8 registered modules', () => {
    expect(getBackupRegistry().length).toBeGreaterThanOrEqual(8);
  });

  it('all exportable modules return a non-null getSummaryLine', () => {
    const state = makeMinimalState();
    for (const mod of getExportableModules()) {
      const line = mod.getSummaryLine(state);
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    }
  });

  it('all modules have unique IDs', () => {
    const ids = getBackupRegistry().map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('getSensitiveModules returns only modules marked sensitive', () => {
    for (const mod of getSensitiveModules()) {
      expect(mod.sensitive).toBe(true);
    }
  });

  it('required core modules are registered', () => {
    const ids = new Set(getBackupRegistry().map((m) => m.id));
    const required = ['sessions', 'clubs', 'community', 'tutorial_progress', 'settings'];
    for (const id of required) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('getCount returns 0 for an empty state', () => {
    const state = makeMinimalState();
    const sessions = getBackupRegistry().find((m) => m.id === 'sessions');
    expect(sessions?.getCount(state)).toBe(0);
  });
});
