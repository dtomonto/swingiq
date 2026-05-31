// ============================================================
// SwingIQ — Backup/Restore Unit Tests
// Tests for export, import validation, restore (merge + replace),
// community data handling, and tutorial progress.
// ============================================================

import { validateBackupFile } from '../validate';
import { mergeRestore, replaceRestore, previewRestore } from '../restore';
import { migrateBackup, needsMigration } from '../migrate';
import { BACKUP_FORMAT, CURRENT_BACKUP_VERSION } from '../schema';
import type { SwingIQBackup, SwingIQBackupData } from '../schema';
import type { SwingIQState } from '@/store';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/tutorial/types';
import { DEFAULT_COMMUNITY_STATE } from '@/lib/community/types';

// ── Fixtures ──────────────────────────────────────────────────

function makeMinimalBackup(overrides: Partial<SwingIQBackupData> = {}): SwingIQBackup {
  return {
    backupFormat: BACKUP_FORMAT,
    backupVersion: CURRENT_BACKUP_VERSION,
    appVersion: '1.1.0',
    schemaVersion: '1.2.0',
    createdAt: '2025-01-01T00:00:00.000Z',
    exportedAt: '2025-01-01T00:00:00.000Z',
    sourceInfo: { userAgent: 'test', platform: 'test' },
    dataScope: 'full',
    encrypted: false,
    data: {
      profile: null,
      sportProfiles: {},
      clubs: [],
      sessions: [],
      videoAnalyses: [],
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
        usage_category: null,
        usage_category_set_at: null,
      },
      community: DEFAULT_COMMUNITY_STATE,
      tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,
      ...overrides,
    },
    metadata: {
      recordCounts: { sessions: 0, clubs: 0, videoAnalyses: 0, milestones: 0, drillsCompleted: 0 },
      sportsIncluded: [],
      dateRange: { earliest: null, latest: null },
      warnings: [],
    },
  };
}

function makeCurrentState(overrides: Partial<SwingIQState> = {}): SwingIQState {
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
    },
    community: DEFAULT_COMMUNITY_STATE,
    tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,
    setup_step: 'profile',
    // Actions — these are never called in tests, but required by type
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
    ...overrides,
  } as unknown as SwingIQState;
}

// ── validateBackupFile ─────────────────────────────────────────

describe('validateBackupFile', () => {
  it('returns valid for a well-formed backup', () => {
    const backup = makeMinimalBackup();
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for wrong backupFormat', () => {
    const result = validateBackupFile({ ...makeMinimalBackup(), backupFormat: 'wrong-format' as never });
    expect(result.valid).toBe(false);
    // New message says "does not appear to be a SwingIQ backup file"
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns invalid for missing data field', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bad: any = { backupFormat: BACKUP_FORMAT, backupVersion: '1.0.0', createdAt: '2025-01-01' };
    const result = validateBackupFile(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns invalid for non-array sessions', () => {
    const result = validateBackupFile({
      backupFormat: BACKUP_FORMAT,
      backupVersion: '1.0.0',
      createdAt: '2025-01-01',
      data: { sessions: 'not-an-array' },
    });
    expect(result.valid).toBe(false);
  });

  it('returns invalid for null input', () => {
    const result = validateBackupFile(null);
    expect(result.valid).toBe(false);
  });
});

// ── previewRestore ─────────────────────────────────────────────

describe('previewRestore', () => {
  it('shows no new records when backup matches current state', () => {
    const session = {
      id: 'session_1',
      name: 'Test',
      date: '2025-01-01',
      sport: 'golf' as const,
      club_name: 'Driver',
      club_category: 'driver',
      launch_monitor: 'FlightScope',
      indoor_outdoor: 'indoor' as const,
      mat_or_grass: 'mat' as const,
      notes: '',
      shot_count: 5,
      shots: [],
      diagnoses: [],
      swing_score: null,
      created_at: '2025-01-01T00:00:00.000Z',
    };

    const state = makeCurrentState({ sessions: [session] });
    const backup = makeMinimalBackup({ sessions: [session] });
    const preview = previewRestore(backup, state);

    expect(preview.newRecords.sessions).toBe(0);
    expect(preview.skippedDuplicates.sessions).toBe(1);
  });

  it('detects new community badges in backup', () => {
    const state = makeCurrentState();
    const backup = makeMinimalBackup({
      community: {
        ...DEFAULT_COMMUNITY_STATE,
        achievementsEarned: [{ id: 'first_steps', earnedAt: '2025-01-01' }],
        xpTotal: 500,
      },
    });

    const preview = previewRestore(backup, state);
    expect(preview.updatedRecords.communityUpdated).toBe(true);
    expect(preview.updatedRecords.communityBadges).toBe(1);
  });

  it('detects tutorial progress update', () => {
    const state = makeCurrentState();
    const backup = makeMinimalBackup({
      tutorialProgress: { completed: ['/dashboard', '/data'], dismissed: [], lastViewedAt: {} },
    });

    const preview = previewRestore(backup, state);
    expect(preview.updatedRecords.tutorialUpdated).toBe(true);
  });
});

// ── mergeRestore ──────────────────────────────────────────────

describe('mergeRestore', () => {
  it('does not duplicate existing sessions', () => {
    const session = {
      id: 'session_1',
      name: 'Test',
      date: '2025-01-01',
      sport: 'golf' as const,
      club_name: 'Driver',
      club_category: 'driver',
      launch_monitor: 'FlightScope',
      indoor_outdoor: 'indoor' as const,
      mat_or_grass: 'mat' as const,
      notes: '',
      shot_count: 5,
      shots: [],
      diagnoses: [],
      swing_score: null,
      created_at: '2025-01-01T00:00:00.000Z',
    };

    const state = makeCurrentState({ sessions: [session] });
    const backup = makeMinimalBackup({ sessions: [session] });
    const delta = mergeRestore(backup, state);

    expect(delta.sessions?.length).toBe(1);
  });

  it('adds new sessions from backup', () => {
    const existingSession = {
      id: 'session_1', name: 'Existing', date: '2025-01-01', sport: 'golf' as const,
      club_name: '', club_category: '', launch_monitor: 'FS', indoor_outdoor: 'indoor' as const,
      mat_or_grass: 'mat' as const, notes: '', shot_count: 0, shots: [], diagnoses: [],
      swing_score: null, created_at: '2025-01-01T00:00:00.000Z',
    };
    const newSession = {
      id: 'session_2', name: 'New', date: '2025-02-01', sport: 'golf' as const,
      club_name: '', club_category: '', launch_monitor: 'FS', indoor_outdoor: 'indoor' as const,
      mat_or_grass: 'mat' as const, notes: '', shot_count: 0, shots: [], diagnoses: [],
      swing_score: null, created_at: '2025-02-01T00:00:00.000Z',
    };

    const state = makeCurrentState({ sessions: [existingSession] });
    const backup = makeMinimalBackup({ sessions: [existingSession, newSession] });
    const delta = mergeRestore(backup, state);

    expect(delta.sessions?.length).toBe(2);
  });

  it('merges community badges without duplicates', () => {
    const state = makeCurrentState({
      community: {
        ...DEFAULT_COMMUNITY_STATE,
        achievementsEarned: [{ id: 'badge_a', earnedAt: '2025-01-01' }],
        xpTotal: 100,
      },
    });
    const backup = makeMinimalBackup({
      community: {
        ...DEFAULT_COMMUNITY_STATE,
        achievementsEarned: [
          { id: 'badge_a', earnedAt: '2025-01-01' }, // duplicate
          { id: 'badge_b', earnedAt: '2025-02-01' }, // new
        ],
        xpTotal: 200,
      },
    });

    const delta = mergeRestore(backup, state);
    expect(delta.community?.achievementsEarned.length).toBe(2);
    expect(delta.community?.xpTotal).toBe(200); // higher value wins
  });

  it('keeps current XP if higher than backup', () => {
    const state = makeCurrentState({
      community: { ...DEFAULT_COMMUNITY_STATE, xpTotal: 1000 },
    });
    const backup = makeMinimalBackup({
      community: { ...DEFAULT_COMMUNITY_STATE, xpTotal: 300 },
    });

    const delta = mergeRestore(backup, state);
    expect(delta.community?.xpTotal).toBe(1000);
  });

  it('merges tutorial progress from both sides', () => {
    const state = makeCurrentState({
      tutorialProgress: { completed: ['/dashboard'], dismissed: [], lastViewedAt: {} },
    });
    const backup = makeMinimalBackup({
      tutorialProgress: { completed: ['/data', '/settings'], dismissed: [], lastViewedAt: {} },
    });

    const delta = mergeRestore(backup, state);
    expect(delta.tutorialProgress?.completed).toContain('/dashboard');
    expect(delta.tutorialProgress?.completed).toContain('/data');
    expect(delta.tutorialProgress?.completed).toContain('/settings');
  });
});

// ── replaceRestore ────────────────────────────────────────────

describe('replaceRestore', () => {
  it('replaces all data with backup data', () => {
    const session = {
      id: 'session_1', name: 'Test', date: '2025-01-01', sport: 'golf' as const,
      club_name: '', club_category: '', launch_monitor: '', indoor_outdoor: 'indoor' as const,
      mat_or_grass: 'mat' as const, notes: '', shot_count: 0, shots: [], diagnoses: [],
      swing_score: null, created_at: '2025-01-01T00:00:00.000Z',
    };

    const currentState = makeCurrentState({ sessions: [] });
    const backup = makeMinimalBackup({ sessions: [session] });
    const delta = replaceRestore(backup, currentState.settings);

    expect(delta.sessions?.length).toBe(1);
  });

  it('preserves current settings during replace', () => {
    const currentSettings = {
      units: 'meters' as const,
      theme: 'dark' as const,
      show_estimated_warnings: false,
      coaching_style: 'concise' as const,
      default_club_for_diagnose: '7 Iron',
      onboarding_complete: true,
      usage_category: null,
      usage_category_set_at: null,
    };
    const backup = makeMinimalBackup();
    const delta = replaceRestore(backup, currentSettings);

    expect(delta.settings?.units).toBe('meters');
    expect(delta.settings?.theme).toBe('dark');
  });

  it('restores community data from backup', () => {
    const state = makeCurrentState();
    const backup = makeMinimalBackup({
      community: {
        ...DEFAULT_COMMUNITY_STATE,
        achievementsEarned: [{ id: 'test_badge', earnedAt: '2025-01-01' }],
        xpTotal: 500,
      },
    });

    const delta = replaceRestore(backup, state.settings);
    expect(delta.community?.xpTotal).toBe(500);
    expect(delta.community?.achievementsEarned.length).toBe(1);
  });

  it('restores tutorial progress from backup', () => {
    const state = makeCurrentState();
    const backup = makeMinimalBackup({
      tutorialProgress: { completed: ['/dashboard', '/data'], dismissed: ['/settings'], lastViewedAt: {} },
    });

    const delta = replaceRestore(backup, state.settings);
    expect(delta.tutorialProgress?.completed).toContain('/dashboard');
    expect(delta.tutorialProgress?.dismissed).toContain('/settings');
  });
});

// ── migrateBackup ─────────────────────────────────────────────

describe('migrateBackup', () => {
  function makeV100Backup(): SwingIQBackup {
    return {
      backupFormat: BACKUP_FORMAT,
      backupVersion: '1.0.0',
      appVersion: '1.0.0',
      schemaVersion: '1.0.0',
      createdAt: '2024-01-01T00:00:00.000Z',
      exportedAt: '2024-01-01T00:00:00.000Z',
      sourceInfo: { userAgent: 'test', platform: 'test' },
      dataScope: 'full',
      encrypted: false,
      data: {
        profile: null,
        sportProfiles: {},
        clubs: [],
        sessions: [],
        videoAnalyses: [],
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
          usage_category: null,
          usage_category_set_at: null,
        },
      },
      metadata: {
        recordCounts: { sessions: 0, clubs: 0, videoAnalyses: 0, milestones: 0, drillsCompleted: 0 },
        sportsIncluded: [],
        dateRange: { earliest: null, latest: null },
        warnings: [],
      },
    };
  }

  it('identifies a v1.0.0 backup as needing migration', () => {
    const backup = makeV100Backup();
    expect(needsMigration(backup)).toBe(true);
  });

  it('does not flag current version as needing migration', () => {
    const backup = makeMinimalBackup();
    expect(needsMigration(backup)).toBe(false);
  });

  it('migrates v1.0.0 all the way to v1.2.0', () => {
    const backup = makeV100Backup();
    const result = migrateBackup(backup);
    expect(result.backup.backupVersion).toBe('1.2.0');
    expect(result.migratedFrom).toBe('1.0.0');
    expect(result.migratedTo).toBe('1.2.0');
    expect(result.stepsApplied.length).toBe(2);
  });

  it('adds tutorialProgress with defaults after migration', () => {
    const backup = makeV100Backup();
    const result = migrateBackup(backup);
    expect(result.backup.data.tutorialProgress).toBeDefined();
    expect(result.backup.data.tutorialProgress?.completed).toEqual([]);
    expect(result.backup.data.tutorialProgress?.dismissed).toEqual([]);
  });

  it('includes a user-readable warning about migration', () => {
    const backup = makeV100Backup();
    const result = migrateBackup(backup);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('older version');
  });

  it('returns backup unchanged if already current version', () => {
    const backup = makeMinimalBackup();
    const result = migrateBackup(backup);
    expect(result.stepsApplied).toHaveLength(0);
    expect(result.backup).toBe(backup); // same reference
  });
});
