// ============================================================
// SwingIQ — Offline-First Session Queue (IndexedDB)
// ------------------------------------------------------------
// Local-first logging foundation: sessions are written to IndexedDB so
// they survive page reloads and being offline. When a sync backend
// (e.g. Supabase) is connected, `flushQueue` drains the queue through a
// caller-provided sync function and removes the items that succeed.
//
// No dependencies, SSR-safe, and degrades gracefully to no-ops if
// IndexedDB is unavailable (private mode, old browsers). Never throws.
// ============================================================

const DB_NAME = 'swingiq-offline';
const DB_VERSION = 1;
const STORE = 'session-queue';

export interface QueuedSession {
  id: string;
  sport: string;
  /** ISO timestamp the session was queued locally. */
  createdAt: string;
  /** Opaque session payload to persist/sync later (shots, notes, etc.). */
  payload: unknown;
  /** Set once successfully synced to a backend. */
  syncedAt?: string | null;
}

function hasIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (!hasIndexedDb()) return resolve(null);
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise<T | null>((resolve) => {
    try {
      const transaction = db.transaction(STORE, mode);
      const store = transaction.objectStore(STORE);
      const request = run(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      transaction.oncomplete = () => db.close();
    } catch {
      resolve(null);
    }
  });
}

// ── Change notification ──────────────────────────────────────
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

/** Subscribe to queue changes (add/remove/flush). Returns an unsubscribe fn. */
export function subscribeSessionQueue(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ── Public API ───────────────────────────────────────────────

/** Queue a session locally. Returns the stored record, or null if unavailable. */
export async function queueSession(
  input: { sport: string; payload: unknown },
): Promise<QueuedSession | null> {
  const record: QueuedSession = {
    id: makeId(),
    sport: input.sport,
    createdAt: new Date().toISOString(),
    payload: input.payload,
    syncedAt: null,
  };
  const ok = await tx('readwrite', (s) => s.put(record));
  if (ok === null) return null;
  notify();
  return record;
}

/** All queued sessions (including any already synced but not yet pruned). */
export async function listQueuedSessions(): Promise<QueuedSession[]> {
  const all = await tx<QueuedSession[]>('readonly', (s) => s.getAll() as IDBRequest<QueuedSession[]>);
  return all ?? [];
}

/** Count of sessions still pending sync. */
export async function countPendingSessions(): Promise<number> {
  const all = await listQueuedSessions();
  return all.filter((q) => !q.syncedAt).length;
}

/** Remove a queued session by id. */
export async function removeQueuedSession(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
  notify();
}

/** Clear the entire queue. */
export async function clearSessionQueue(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
  notify();
}

/**
 * Drain the queue through a caller-supplied sync function (e.g. a Supabase
 * insert). Items whose sync resolves `true` are removed. Returns how many
 * were successfully synced. Safe to call when offline (sync will simply
 * fail and items stay queued).
 */
export async function flushQueue(
  sync: (session: QueuedSession) => Promise<boolean>,
): Promise<number> {
  const pending = (await listQueuedSessions()).filter((q) => !q.syncedAt);
  let synced = 0;
  for (const session of pending) {
    let ok = false;
    try {
      ok = await sync(session);
    } catch {
      ok = false;
    }
    if (ok) {
      await removeQueuedSession(session.id);
      synced += 1;
    }
  }
  if (synced > 0) notify();
  return synced;
}
