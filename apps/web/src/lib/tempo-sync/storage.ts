// ============================================================
// SwingVantage — Tempo Sync: local-first tempo history
// ------------------------------------------------------------
// Self-contained localStorage store for saved tempo reads ("my tempo"),
// in its OWN key — it does not touch the Motion Lab session store or any
// other data flow. Never throws; safe to be missing, corrupt, or cleared.
// Privacy: only a handful of timing numbers are kept, all on-device.
//
// The trend math is pure + unit-tested; the storage I/O is SSR-guarded.
// ============================================================

import { IDEAL_FULL_RATIO } from './tempo';

export type TempoSource = 'tap' | 'sync' | 'manual';

export interface TempoEntry {
  id: string;
  /** Epoch ms when saved. */
  at: number;
  source: TempoSource;
  totalMs: number;
  backMs: number;
  downMs: number;
  ratio: number;
}

export interface TempoTrend {
  count: number;
  latest: TempoEntry;
  /** Ratio of the entry closest to the ideal. */
  bestRatio: number;
  avgRatio: number;
  idealRatio: number;
  direction: 'improving' | 'steady' | 'drifting' | 'n/a';
  summary: string;
}

const KEY = 'swingiq-tempo-history-v1';
const MAX_ENTRIES = 30;
/** Ratio change (in distance-to-ideal) we treat as a real move, not noise. */
const TREND_DEADBAND = 0.15;

// ── Change notification (powers the React hook) ──────────────
const listeners = new Set<() => void>();
let storeVersion = 0;

export function getTempoStoreVersion(): number {
  return storeVersion;
}
function notify(): void {
  storeVersion++;
  for (const l of listeners) l();
}
export function subscribeTempoHistory(cb: () => void): () => void {
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

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `tt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValid(v: unknown): v is TempoEntry {
  if (!v || typeof v !== 'object') return false;
  const r = v as Partial<TempoEntry>;
  return (
    typeof r.id === 'string' &&
    typeof r.at === 'number' &&
    typeof r.totalMs === 'number' &&
    typeof r.ratio === 'number'
  );
}

/** Newest first. Never throws. */
export function loadTempoHistory(): TempoEntry[] {
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

export function saveTempoEntry(input: Omit<TempoEntry, 'id' | 'at'>): TempoEntry | null {
  if (typeof window === 'undefined') return null;
  const entry: TempoEntry = {
    id: makeId(),
    at: Date.now(),
    ...input,
    ratio: +input.ratio.toFixed(2),
  };
  try {
    const next = [entry, ...loadTempoHistory()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    notify();
    return entry;
  } catch {
    return null;
  }
}

export function clearTempoHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  notify();
}

// ── Pure trend read ───────────────────────────────────────────
/**
 * Summarize a tempo history (entries newest-first). Direction compares the
 * latest read's distance-to-ideal against the oldest in the set, so a series
 * of tightening ratios reads as "improving". Returns null when empty.
 */
export function tempoTrend(entries: TempoEntry[], idealRatio = IDEAL_FULL_RATIO): TempoTrend | null {
  if (!entries.length) return null;
  const ratios = entries.map((e) => e.ratio);
  const avgRatio = +(ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2);
  const bestRatio = ratios.reduce((best, r) =>
    Math.abs(r - idealRatio) < Math.abs(best - idealRatio) ? r : best,
  );

  let direction: TempoTrend['direction'] = 'n/a';
  if (entries.length >= 2) {
    const latest = entries[0].ratio;
    const oldest = entries[entries.length - 1].ratio;
    const delta = Math.abs(oldest - idealRatio) - Math.abs(latest - idealRatio);
    direction = delta > TREND_DEADBAND ? 'improving' : delta < -TREND_DEADBAND ? 'drifting' : 'steady';
  }

  const latest = entries[0];
  const SUMMARY: Record<TempoTrend['direction'], string> = {
    improving: `Trending toward the ideal ${idealRatio}:1 — keep grooving it.`,
    drifting: `Drifting away from the ideal ${idealRatio}:1 — slow the transition back down.`,
    steady: `Holding steady around ${avgRatio}:1.`,
    'n/a': `One read so far: ${latest.ratio}:1.`,
  };

  return {
    count: entries.length,
    latest,
    bestRatio: +bestRatio.toFixed(2),
    avgRatio,
    idealRatio,
    direction,
    summary: SUMMARY[direction],
  };
}

// ── Bridge: Motion Lab sessions → tempo entries ───────────────
/** Minimal shape we need from a stored Motion Lab session (kept structural so
 *  tempo-sync stays decoupled from the full MotionSession type). */
export interface TempoSessionLike {
  id: string;
  createdAt: string;
  temporal?: {
    tempoRatio: number | null;
    loadDurationMs: number | null;
    totalMs: number;
  } | null;
}

/**
 * Map stored Motion Lab sessions into tempo entries (newest first) so the same
 * trend math powers a cross-session view. Only sessions with a real measured
 * tempo are included; back/through fall back to the ratio when load timing
 * wasn't isolated. The session's own measured numbers flow through unchanged.
 */
export function sessionsToTempoEntries(sessions: TempoSessionLike[]): TempoEntry[] {
  return sessions
    .filter((s) => s.temporal && s.temporal.tempoRatio != null && s.temporal.totalMs > 0)
    .map((s) => {
      const t = s.temporal!;
      const ratio = t.tempoRatio!;
      const backMs = t.loadDurationMs ?? (t.totalMs * ratio) / (ratio + 1);
      const downMs = Math.max(0, t.totalMs - backMs);
      const at = new Date(s.createdAt).getTime();
      return {
        id: s.id,
        at: Number.isFinite(at) ? at : Date.now(),
        source: 'sync' as TempoSource,
        totalMs: t.totalMs,
        backMs,
        downMs,
        ratio: +ratio.toFixed(2),
      };
    })
    .sort((a, b) => b.at - a.at);
}
