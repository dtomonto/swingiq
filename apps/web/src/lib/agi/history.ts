// ============================================================
// SwingVantage — AGI: local snapshot history
// ------------------------------------------------------------
// Self-contained localStorage store for AGI snapshots, in its OWN key. It does
// not touch the Zustand store, the backup schema, or Motion Lab's store — so it
// can be missing, corrupt, or cleared without affecting anything else. At most
// one snapshot per day (the latest that day wins), capped, never throws.
// Privacy: stores only small capability scores, never video or raw pose.
// ============================================================

import type { AGISnapshot, AthleteWorldModel } from './types';
import { snapshotFromModel } from './progress';

const KEY = 'swingiq-agi-history-v1';
const MAX_ENTRIES = 90;

const dayOf = (iso: string) => iso.slice(0, 10);

function isValid(v: unknown): v is AGISnapshot {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<AGISnapshot>;
  return typeof s.at === 'string' && Array.isArray(s.capabilities);
}

export function loadHistory(): AGISnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid).sort((a, b) => a.at.localeCompare(b.at));
  } catch {
    return [];
  }
}

/**
 * Record today's snapshot (one per day; latest that day replaces earlier ones).
 * No-op on the server or when there's no analysed data yet.
 */
export function recordSnapshot(model: AthleteWorldModel): void {
  if (typeof window === 'undefined') return;
  if (model.dataMap.totalSessions === 0) return;
  const snap = snapshotFromModel(model);
  const today = dayOf(snap.at);
  const next = [...loadHistory().filter((s) => dayOf(s.at) !== today), snap]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / unavailable — non-critical, drop silently */
  }
}

export function clearAgiHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
