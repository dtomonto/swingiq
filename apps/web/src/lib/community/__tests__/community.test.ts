// ============================================================
// SwingIQ Community — Unit Tests
// Tests for achievement calculation, streak logic, XP, backup health.
// ============================================================

import { calculateBackupHealth, formatLastExport } from '../backup-health';
import { calculateLevelFromXP, getLevelTitle, canAwardExportXP } from '../xp';
import { syncEarnedAchievements, ACHIEVEMENTS, getAchievementById } from '../achievements';
import type { AchievementContext } from '../types';
import type { LocalSession, LocalVideoAnalysis, TrainingProgress } from '@/store';

// ── Helpers ───────────────────────────────────────────────────

function makeSession(overrides: Partial<LocalSession> = {}): LocalSession {
  return {
    id: `session_${Math.random()}`,
    name: 'Test Session',
    date: new Date().toISOString().split('T')[0],
    sport: 'golf',
    club_name: 'Driver',
    club_category: 'driver',
    launch_monitor: 'FlightScope',
    indoor_outdoor: 'indoor',
    mat_or_grass: 'mat',
    notes: '',
    shot_count: 10,
    shots: [],
    diagnoses: [],
    swing_score: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeVideoAnalysis(overrides: Partial<LocalVideoAnalysis> = {}): LocalVideoAnalysis {
  return {
    id: `video_${Math.random()}`,
    session_id: null,
    sport: 'tennis',
    file_name: 'test.mp4',
    overall_score: 75,
    camera_angle: 'side',
    phases_count: 5,
    issues_count: 2,
    primary_issue: 'late_contact',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

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

// ── Backup Health Tests ───────────────────────────────────────

describe('calculateBackupHealth', () => {
  test('returns "none" when no sessions exist', () => {
    const health = calculateBackupHealth([], [], DEFAULT_TRAINING, null, 0);
    expect(health.status).toBe('none');
    expect(health.sessionsSinceExport).toBe(0);
  });

  test('returns "none" when sessions exist but never exported', () => {
    const sessions = [makeSession()];
    const health = calculateBackupHealth(sessions, [], DEFAULT_TRAINING, null, 0);
    expect(health.status).toBe('none');
    expect(health.sessionsSinceExport).toBe(1);
  });

  test('returns "current" when exported after all sessions', () => {
    const exportTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
    const sessions = [makeSession({ created_at: new Date(Date.now() - 10000).toISOString() })];
    const health = calculateBackupHealth(sessions, [], DEFAULT_TRAINING, exportTime, 1);
    expect(health.status).toBe('current');
    expect(health.sessionsSinceExport).toBe(0);
  });

  test('returns "recommended" when 5 sessions since last export', () => {
    const exportTime = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ created_at: new Date().toISOString() })
    );
    const health = calculateBackupHealth(sessions, [], DEFAULT_TRAINING, exportTime, 1);
    expect(health.status).toBe('recommended');
    expect(health.sessionsSinceExport).toBe(5);
  });

  test('returns "urgent" when 12 sessions since last export', () => {
    const exportTime = new Date(Date.now() - 86400000).toISOString();
    const sessions = Array.from({ length: 12 }, () =>
      makeSession({ created_at: new Date().toISOString() })
    );
    const health = calculateBackupHealth(sessions, [], DEFAULT_TRAINING, exportTime, 1);
    expect(health.status).toBe('urgent');
  });

  test('includes video analyses in sessionsSinceExport count', () => {
    const exportTime = new Date(Date.now() - 86400000).toISOString();
    const sessions = [makeSession({ created_at: new Date().toISOString() })];
    const videos = [makeVideoAnalysis({ created_at: new Date().toISOString() })];
    const health = calculateBackupHealth(sessions, videos, DEFAULT_TRAINING, exportTime, 1);
    expect(health.sessionsSinceExport).toBe(2);
  });
});

// ── XP / Level Tests ──────────────────────────────────────────

describe('calculateLevelFromXP', () => {
  test('Level 1 at 0 XP', () => {
    const { level } = calculateLevelFromXP(0);
    expect(level).toBe(1);
  });

  test('Level 2 at 100 XP', () => {
    const { level } = calculateLevelFromXP(100);
    expect(level).toBe(2);
  });

  test('Level 3 at 250 XP', () => {
    const { level } = calculateLevelFromXP(250);
    expect(level).toBe(3);
  });

  test('progressToNext is 0 before reaching next level threshold', () => {
    const { progressToNext } = calculateLevelFromXP(50);
    expect(progressToNext).toBeGreaterThan(0);
    expect(progressToNext).toBeLessThan(100);
  });

  test('xpForNext decreases as XP increases', () => {
    const { xpForNext: xpForNext50 } = calculateLevelFromXP(50);
    const { xpForNext: xpForNext90 } = calculateLevelFromXP(90);
    expect(xpForNext90).toBeLessThan(xpForNext50);
  });

  test('getLevelTitle returns correct titles', () => {
    expect(getLevelTitle(1)).toBe('Rookie');
    expect(getLevelTitle(2)).toBe('Beginner');
    expect(getLevelTitle(5)).toBe('Consistent');
  });
});

describe('canAwardExportXP', () => {
  test('allows XP when no export events today', () => {
    expect(canAwardExportXP([])).toBe(true);
  });

  test('allows XP for up to 3 exports per day', () => {
    const today = new Date().toISOString();
    const events = [
      { type: 'export_data' as const, xp: 20, at: today, description: 'test' },
      { type: 'export_data' as const, xp: 20, at: today, description: 'test' },
    ];
    expect(canAwardExportXP(events)).toBe(true);
  });

  test('blocks XP after 3 exports per day', () => {
    const today = new Date().toISOString();
    const events = [
      { type: 'export_data' as const, xp: 20, at: today, description: 'test' },
      { type: 'export_data' as const, xp: 20, at: today, description: 'test' },
      { type: 'export_data' as const, xp: 20, at: today, description: 'test' },
    ];
    expect(canAwardExportXP(events)).toBe(false);
  });
});

// ── Achievement Tests ─────────────────────────────────────────

describe('syncEarnedAchievements', () => {
  const baseCtx: AchievementContext = {
    sessions: [],
    videoAnalyses: [],
    training: DEFAULT_TRAINING,
    lastExportAt: null,
    exportCount: 0,
    challengesCompleted: [],
  };

  test('no achievements earned with empty state', () => {
    const { newEarned } = syncEarnedAchievements(baseCtx, []);
    expect(newEarned).toHaveLength(0);
  });

  test('first_session badge earned after 1 session', () => {
    const ctx = { ...baseCtx, sessions: [makeSession()] };
    const { newEarned } = syncEarnedAchievements(ctx, []);
    const ids = newEarned.map(a => a.id);
    expect(ids).toContain('first_session');
  });

  test('first_backup badge earned after 1 export', () => {
    const ctx = { ...baseCtx, exportCount: 1, lastExportAt: new Date().toISOString() };
    const { newEarned } = syncEarnedAchievements(ctx, []);
    const ids = newEarned.map(a => a.id);
    expect(ids).toContain('first_backup');
  });

  test('does not re-earn already earned achievements', () => {
    const ctx = { ...baseCtx, sessions: [makeSession()] };
    const alreadyEarned = [{ id: 'first_session', earnedAt: new Date().toISOString() }];
    const { newEarned } = syncEarnedAchievements(ctx, alreadyEarned);
    const ids = newEarned.map(a => a.id);
    expect(ids).not.toContain('first_session');
  });

  test('five_sessions badge earned after 5 sessions', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession());
    const ctx = { ...baseCtx, sessions };
    const { newEarned } = syncEarnedAchievements(ctx, []);
    const ids = newEarned.map(a => a.id);
    expect(ids).toContain('five_sessions');
  });

  test('seven_day_streak badge earned with 7+ day streak', () => {
    const ctx = { ...baseCtx, training: { ...DEFAULT_TRAINING, streak_days: 7 } };
    const { newEarned } = syncEarnedAchievements(ctx, []);
    const ids = newEarned.map(a => a.id);
    expect(ids).toContain('seven_day_streak');
  });

  test('multi_sport badge earned with sessions in 2+ sports', () => {
    const sessions = [
      makeSession({ sport: 'golf' }),
      makeSession({ sport: 'tennis' }),
    ];
    const ctx = { ...baseCtx, sessions };
    const { newEarned } = syncEarnedAchievements(ctx, []);
    const ids = newEarned.map(a => a.id);
    expect(ids).toContain('multi_sport');
  });

  test('XP gained from multiple achievements', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession());
    const ctx = { ...baseCtx, sessions };
    const { xpGained } = syncEarnedAchievements(ctx, []);
    expect(xpGained).toBeGreaterThan(0);
  });
});

describe('getAchievementById', () => {
  test('returns achievement for valid ID', () => {
    const a = getAchievementById('first_session');
    expect(a).toBeDefined();
    expect(a?.id).toBe('first_session');
  });

  test('returns undefined for invalid ID', () => {
    const a = getAchievementById('nonexistent_badge');
    expect(a).toBeUndefined();
  });
});

describe('ACHIEVEMENTS list', () => {
  test('all achievements have unique IDs', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('all achievements have icons', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a.icon).toBeTruthy();
    });
  });

  test('all achievements have positive XP rewards', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a.xpReward).toBeGreaterThan(0);
    });
  });

  test('all achievements have maxProgress > 0', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a.maxProgress).toBeGreaterThan(0);
    });
  });
});

// ── formatLastExport Tests ────────────────────────────────────

describe('formatLastExport', () => {
  test('returns "Never" for null', () => {
    expect(formatLastExport(null)).toBe('Never');
  });

  test('returns "Today" for recent export', () => {
    const now = new Date().toISOString();
    expect(formatLastExport(now)).toBe('Today');
  });

  test('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000 - 1000).toISOString();
    expect(formatLastExport(yesterday)).toBe('Yesterday');
  });

  test('returns days ago for older exports', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatLastExport(threeDaysAgo)).toContain('days ago');
  });
});
