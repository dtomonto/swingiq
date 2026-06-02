// ============================================================
// SwingIQ — Offline Outbox (IndexedDB, no deps)
//
// A small durable queue for writes that should sync to a backend
// when one exists. In keyless mode there is no backend, so the
// outbox simply stays empty (all data already lives locally). When
// Supabase is configured, queued items can be flushed on reconnect.
//
// Tiny promise wrapper over IndexedDB — no external dependency.
// ============================================================

const DB_NAME = 'swingiq-offline';
const STORE = 'outbox';
const DB_VERSION = 1;

export interface OutboxItem<T = unknown> {
  id: string;
  kind: string;
  payload: T;
  createdAt: string;
}

function hasIDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

/** Queue a write for later sync. No-op if IndexedDB is unavailable. */
export async function enqueue<T>(kind: string, payload: T): Promise<void> {
  if (!hasIDB()) return;
  const item: OutboxItem<T> = {
    id: (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    kind,
    payload,
    createdAt: new Date().toISOString(),
  };
  try {
    await tx('readwrite', (s) => s.put(item));
  } catch {
    /* best-effort */
  }
}

export async function peekAll(): Promise<OutboxItem[]> {
  if (!hasIDB()) return [];
  try {
    return (await tx<OutboxItem[]>('readonly', (s) => s.getAll())) ?? [];
  } catch {
    return [];
  }
}

export async function remove(id: string): Promise<void> {
  if (!hasIDB()) return;
  try {
    await tx('readwrite', (s) => s.delete(id));
  } catch {
    /* best-effort */
  }
}

export async function pendingCount(): Promise<number> {
  return (await peekAll()).length;
}

/**
 * Flush queued items through a handler. Each item that the handler
 * resolves true for is removed. Failures are left for the next flush.
 * The actual backend handler is wired when Supabase sync ships.
 */
export async function flush(handler: (item: OutboxItem) => Promise<boolean>): Promise<number> {
  const items = await peekAll();
  let flushed = 0;
  for (const item of items) {
    try {
      if (await handler(item)) {
        await remove(item.id);
        flushed++;
      }
    } catch {
      /* keep for next attempt */
    }
  }
  return flushed;
}
