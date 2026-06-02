// ============================================================
// SwingIQ — Motion Lab: Local-first Persistence
// ------------------------------------------------------------
// Self-contained localStorage store for Motion Lab sessions. Lives in
// its OWN key — it does not touch the Zustand store, backup schema, or
// the existing video-history store, so existing data flows are
// unaffected. Never throws; safe to be missing, corrupt, or cleared.
//
// Privacy: we store the analysis + a COMPACT pose track (subsampled,
// rounded) for replay/comparison. The original video is never stored.
// ============================================================

import type {
  MotionSession,
  MotionSessionSummary,
  MotionPoseTrack,
  SportId,
  MotionTypeId,
} from './types';

const KEY = 'swingiq-motion-sessions-v1';
const MAX_ENTRIES = 30;
const MAX_STORED_FRAMES = 40;

// ── Change notification (powers the React hook) ──────────────
const listeners = new Set<() => void>();
let storeVersion = 0;

export function getMotionStoreVersion(): number {
  return storeVersion;
}
function notify(): void {
  storeVersion++;
  for (const l of listeners) l();
}
export function subscribeMotionSessions(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notify();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

// ── Helpers ───────────────────────────────────────────────────
function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValid(v: unknown): v is MotionSession {
  if (!v || typeof v !== 'object') return false;
  const r = v as Partial<MotionSession>;
  return r.version === 1 && typeof r.id === 'string' && !!r.capture && !!r.scoreboard;
}

const round = (n: number, p = 3): number => {
  const f = 10 ** p;
  return Math.round(n * f) / f;
};

/** Subsample + round a pose track so it stays small in localStorage. */
export function compactTrack(track: MotionPoseTrack): MotionPoseTrack {
  const frames = track.frames;
  let kept = frames;
  if (frames.length > MAX_STORED_FRAMES) {
    kept = [];
    for (let i = 0; i < MAX_STORED_FRAMES; i++) {
      kept.push(frames[Math.round((i * (frames.length - 1)) / (MAX_STORED_FRAMES - 1))]);
    }
  }
  return {
    ...track,
    frames: kept.map((f) => ({
      tMs: Math.round(f.tMs),
      landmarks: f.landmarks.map((l) => ({ x: round(l.x), y: round(l.y), z: round(l.z), v: round(l.v, 2) })),
    })),
  };
}

// ── CRUD ──────────────────────────────────────────────────────
export function loadSessions(): MotionSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid);
  } catch {
    return [];
  }
}

function writeAll(records: MotionSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(records.slice(0, MAX_ENTRIES)));
    notify();
  } catch {
    // storage full / unavailable — try once more without pose tracks to save the analysis.
    try {
      const slim = records.slice(0, MAX_ENTRIES).map((r) => ({
        ...r,
        poseTrack: { ...r.poseTrack, frames: [] },
      }));
      window.localStorage.setItem(KEY, JSON.stringify(slim));
      notify();
    } catch {
      /* give up silently */
    }
  }
}

/** Persist a session (compacts the pose track first). Returns the saved record. */
export function saveSession(session: MotionSession): MotionSession | null {
  if (typeof window === 'undefined') return null;
  const record: MotionSession = {
    ...session,
    id: session.id || makeId(),
    poseTrack: compactTrack(session.poseTrack),
    updatedAt: new Date().toISOString(),
  };
  const next = [record, ...loadSessions().filter((s) => s.id !== record.id)].slice(0, MAX_ENTRIES);
  writeAll(next);
  return record;
}

export function getSession(id: string): MotionSession | null {
  return loadSessions().find((s) => s.id === id) ?? null;
}

export function deleteSession(id: string): void {
  writeAll(loadSessions().filter((s) => s.id !== id));
}

export function clearSessions(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    notify();
  } catch {
    /* ignore */
  }
}

export function updateSessionMeta(id: string, patch: Partial<Pick<MotionSession, 'coachNotes' | 'tags'>>): void {
  const all = loadSessions();
  const next = all.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s));
  writeAll(next);
}

export function toSummary(s: MotionSession): MotionSessionSummary {
  return {
    id: s.id,
    createdAt: s.createdAt,
    sport: s.capture.sport,
    sportLabel: s.sportLabel,
    motionLabel: s.motionLabel,
    emoji: s.emoji,
    overall: s.scoreboard.overall,
    confidence: s.scoreboard.confidence,
    keyFault: s.keyFault,
  };
}

export function sessionsFor(sport: SportId, motionType?: MotionTypeId): MotionSession[] {
  return loadSessions().filter(
    (s) => s.capture.sport === sport && (!motionType || s.capture.motionType === motionType),
  );
}

// ── Motion Profile (aggregate per sport+motion) ───────────────
export interface MotionProfile {
  sport: SportId;
  motionType: MotionTypeId;
  sessionCount: number;
  latest: MotionSession | null;
  best: MotionSession | null;
  /** Overall scores over time (oldest → newest). */
  trend: Array<{ date: string; overall: number }>;
  currentFocus: string | null;
  /** Average overall across recent sessions. */
  averageOverall: number;
}

export function buildProfile(sport: SportId, motionType: MotionTypeId): MotionProfile | null {
  const sessions = sessionsFor(sport, motionType).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  if (sessions.length === 0) return null;
  const latest = sessions[sessions.length - 1];
  const best = sessions.reduce((b, s) => (s.scoreboard.overall > b.scoreboard.overall ? s : b), sessions[0]);
  const trend = sessions.map((s) => ({ date: s.createdAt, overall: s.scoreboard.overall }));
  const averageOverall = Math.round(sessions.reduce((sum, s) => sum + s.scoreboard.overall, 0) / sessions.length);
  return {
    sport,
    motionType,
    sessionCount: sessions.length,
    latest,
    best,
    trend,
    currentFocus: latest.keyFault,
    averageOverall,
  };
}

/** Build a full session record from a freshly-analysed result. */
export function newSessionId(): string {
  return makeId();
}
