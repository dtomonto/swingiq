// ============================================================
// SwingVantage — Retest Engine: Local-First Store
// ------------------------------------------------------------
// Mirrors lib/video/history.ts: a tiny, self-contained
// localStorage record in its OWN key. It does NOT touch the
// Zustand store, the backup schema, or export/import — so existing
// data flows are completely unaffected. Safe to be missing,
// corrupt, or cleared at any time; never throws.
//
// We persist only the user's *choices* (which reminders/results
// they dismissed). The retests themselves are always re-derived
// from saved video history, so there is nothing here to go stale.
// ============================================================

import type { RetestStoreState } from './types';

const KEY = 'swingiq-retests-v1';

const EMPTY: RetestStoreState = {
  version: 1,
  dismissedTargetIds: [],
  acknowledgedResultIds: [],
};

// ── Change notification (powers the useRetests hook) ──────────
const listeners = new Set<() => void>();
let storeVersion = 0;

export function getRetestStoreVersion(): number {
  return storeVersion;
}

function notifyChange(): void {
  storeVersion++;
  for (const listener of listeners) listener();
}

/** Subscribe to retest-store changes (same-tab + cross-tab). */
export function subscribeRetestStore(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notifyChange();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function isValid(value: unknown): value is RetestStoreState {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<RetestStoreState>;
  return (
    r.version === 1 &&
    Array.isArray(r.dismissedTargetIds) &&
    Array.isArray(r.acknowledgedResultIds)
  );
}

/** Read the retest store. Never throws; returns empty defaults on any issue. */
export function loadRetestStore(): RetestStoreState {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function write(state: RetestStoreState): void {
  if (typeof window === 'undefined') return;
  try {
    // Cap each list so localStorage stays small.
    const trimmed: RetestStoreState = {
      version: 1,
      dismissedTargetIds: state.dismissedTargetIds.slice(-50),
      acknowledgedResultIds: state.acknowledgedResultIds.slice(-50),
    };
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
    notifyChange();
  } catch {
    // storage full / unavailable — non-critical
  }
}

/** Hide an open retest reminder. */
export function dismissTarget(id: string): void {
  const s = loadRetestStore();
  if (s.dismissedTargetIds.includes(id)) return;
  write({ ...s, dismissedTargetIds: [...s.dismissedTargetIds, id] });
}

/** Acknowledge (hide) a completed retest result. */
export function acknowledgeResult(id: string): void {
  const s = loadRetestStore();
  if (s.acknowledgedResultIds.includes(id)) return;
  write({ ...s, acknowledgedResultIds: [...s.acknowledgedResultIds, id] });
}

/** Clear all retest dismissals/acknowledgments. Never throws. */
export function clearRetestStore(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    notifyChange();
  } catch {
    // ignore
  }
}
