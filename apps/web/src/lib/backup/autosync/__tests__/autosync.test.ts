// ============================================================
// SwingIQ — Auto-Sync unit tests (pure logic)
//
// Covers the snapshot signature, folder scan (newest-wins, encrypted
// skipped, invalid skipped), and the continue-progress evaluation.
// IndexedDB + File System Access wrappers are browser-only and aren't
// exercised here.
// ============================================================

import { buildSnapshot } from '../snapshot';
import { findLatestBackup, evaluateContinue, isStateEmpty, fileSignature } from '../scan';
import { BACKUP_FORMAT, CURRENT_BACKUP_VERSION } from '../../schema';
import type { SwingIQBackup } from '../../schema';
import type { SwingIQState, LocalSession } from '@/store';
import { DEFAULT_COMMUNITY_STATE } from '@/lib/community/types';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/tutorial/types';

// ── Fixtures ──────────────────────────────────────────────────

function makeSession(over: Partial<LocalSession> = {}): LocalSession {
  return {
    id: 'sess-1', name: 'Range', date: '2026-01-01', sport: 'golf',
    club_name: 'Driver', club_category: 'driver', launch_monitor: 'TrackMan',
    indoor_outdoor: 'outdoor', mat_or_grass: 'grass', notes: '',
    shot_count: 0, shots: [], diagnoses: [], swing_score: null,
    created_at: '2026-01-01T00:00:00.000Z', ...over,
  } as LocalSession;
}

function makeState(over: Partial<SwingIQState> = {}): SwingIQState {
  return {
    profile: null,
    sportProfiles: {},
    clubs: [],
    sessions: [],
    video_analyses: [],
    sportEquipment: { tennis: [], baseball: [], softball_slow: [], softball_fast: [] },
    training: {
      active_diagnosis_id: null, active_session_id: null, completed_steps: [],
      drills_completed: {}, started_at: null, streak_days: 0,
      last_practice_date: null, milestones_earned: [],
    },
    settings: {
      units: 'yards', theme: 'light', colorTheme: 'standard', show_estimated_warnings: true,
      coaching_style: 'balanced', default_club_for_diagnose: 'Driver',
      onboarding_complete: false, usage_category: null, usage_category_set_at: null,
    },
    community: DEFAULT_COMMUNITY_STATE,
    tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,
    agent: { dismissedKeys: [], welcomeBackDismissedHash: null },
    setup_step: 'profile',
    ...over,
  } as unknown as SwingIQState;
}

function makeBackup(createdAt: string, sessions: LocalSession[] = []): SwingIQBackup {
  return {
    backupFormat: BACKUP_FORMAT,
    backupVersion: CURRENT_BACKUP_VERSION,
    appVersion: '1.1.0',
    schemaVersion: '1.2.0',
    createdAt,
    exportedAt: createdAt,
    sourceInfo: { userAgent: 'test', platform: 'test' },
    dataScope: 'full',
    encrypted: false,
    data: {
      profile: null, sportProfiles: {}, clubs: [], sessions,
      videoAnalyses: [],
      training: {
        active_diagnosis_id: null, active_session_id: null, completed_steps: [],
        drills_completed: {}, started_at: null, streak_days: 0,
        last_practice_date: null, milestones_earned: [],
      },
      settings: makeState().settings,
      community: DEFAULT_COMMUNITY_STATE,
      tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,
    },
    metadata: {
      recordCounts: { sessions: sessions.length, clubs: 0, videoAnalyses: 0, milestones: 0, drillsCompleted: 0 },
      sportsIncluded: [], dateRange: { earliest: null, latest: null }, warnings: [],
    },
  };
}

function backupFile(createdAt: string, sessions: LocalSession[] = [], name = 'swingiq-backup.json'): File {
  return new File([JSON.stringify(makeBackup(createdAt, sessions))], name, { type: 'application/json' });
}

function encryptedFile(name = 'swingiq-backup.swingiqbackup'): File {
  const envelope = btoa(JSON.stringify({ swingiq_encrypted: true, ciphertext: 'x' }));
  return new File([envelope], name, { type: 'application/octet-stream' });
}

// ── buildSnapshot ─────────────────────────────────────────────

describe('buildSnapshot', () => {
  it('produces a stable hash for identical data', () => {
    const a = buildSnapshot(makeState({ sessions: [makeSession()] }));
    const b = buildSnapshot(makeState({ sessions: [makeSession()] }));
    expect(a.hash).toBe(b.hash);
  });

  it('changes the hash when data changes', () => {
    const empty = buildSnapshot(makeState());
    const withSession = buildSnapshot(makeState({ sessions: [makeSession()] }));
    expect(empty.hash).not.toBe(withSession.hash);
  });

  it('generates a dated .json filename and counts records', () => {
    const snap = buildSnapshot(makeState({ sessions: [makeSession()] }));
    expect(snap.filename).toMatch(/^swingiq-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(snap.recordTotal).toBeGreaterThanOrEqual(1);
  });
});

// ── isStateEmpty / fileSignature ──────────────────────────────

describe('isStateEmpty', () => {
  it('is true for a fresh device', () => {
    expect(isStateEmpty(makeState())).toBe(true);
  });
  it('is false once there is a session', () => {
    expect(isStateEmpty(makeState({ sessions: [makeSession()] }))).toBe(false);
  });
});

describe('fileSignature', () => {
  it('combines name and lastModified', () => {
    const f = { name: 'b.json', lastModified: 123 } as File;
    expect(fileSignature(f)).toBe('b.json|123');
  });
});

// ── findLatestBackup ──────────────────────────────────────────

describe('findLatestBackup', () => {
  it('returns the newest valid backup by createdAt', async () => {
    const files = [
      backupFile('2026-01-01T00:00:00.000Z', [], 'old.json'),
      backupFile('2026-06-01T00:00:00.000Z', [makeSession()], 'new.json'),
      backupFile('2026-03-01T00:00:00.000Z', [], 'mid.json'),
    ];
    const { latest, totalCandidates } = await findLatestBackup(files);
    expect(totalCandidates).toBe(3);
    expect(latest?.fileName).toBe('new.json');
    expect(latest?.createdAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('skips and counts encrypted backups', async () => {
    const { latest, encryptedSkipped } = await findLatestBackup([
      encryptedFile(),
      backupFile('2026-01-01T00:00:00.000Z'),
    ]);
    expect(encryptedSkipped).toBe(1);
    expect(latest).not.toBeNull();
  });

  it('skips files that are not valid backups', async () => {
    const junk = new File(['not json at all'], 'notes.json', { type: 'application/json' });
    const { latest, totalCandidates } = await findLatestBackup([junk]);
    expect(latest).toBeNull();
    expect(totalCandidates).toBe(0);
  });

  it('returns null for an empty folder', async () => {
    const { latest } = await findLatestBackup([]);
    expect(latest).toBeNull();
  });
});

// ── evaluateContinue ──────────────────────────────────────────

describe('evaluateContinue', () => {
  it('flags new data and empty current device', () => {
    const backup = makeBackup('2026-06-01T00:00:00.000Z', [makeSession()]);
    const evalResult = evaluateContinue(backup, makeState());
    expect(evalResult.currentIsEmpty).toBe(true);
    expect(evalResult.hasNewData).toBe(true);
  });

  it('reports no new data when the session already exists locally', () => {
    const session = makeSession();
    const backup = makeBackup('2026-06-01T00:00:00.000Z', [session]);
    const evalResult = evaluateContinue(backup, makeState({ sessions: [session] }));
    expect(evalResult.hasNewData).toBe(false);
  });
});
