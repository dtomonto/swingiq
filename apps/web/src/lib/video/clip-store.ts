'use client';

// ============================================================
// SwingVantage — Saved-Swing Clip Store (on-device, IndexedDB)
// ------------------------------------------------------------
// Persists the ORIGINAL swing video for a saved analysis so the user
// can replay it later from their swing history. Videos are far too
// large for localStorage (where the text analysis lives), so the clip
// blob is kept in IndexedDB, keyed by the saved analysis id.
//
// Privacy: clips never leave the device. They are written here only
// after a successful local analysis and can be deleted per-swing or
// cleared entirely. We bound disk use by keeping only the most recent
// MAX_CLIPS swings — older clips are evicted automatically (the text
// analysis for those swings is retained; only the replay clip drops).
//
// Like the text history, this is best-effort: every operation degrades
// gracefully (returns null / false) and never throws, so a missing,
// full, or unavailable store can never break analysis or playback.
// ============================================================

const DB_NAME = 'swingiq-clips';
const DB_VERSION = 1;
const STORE = 'clips';

/** Keep replay clips for only the most recent N swings to bound disk use. */
const MAX_CLIPS = 10;

interface ClipRecord {
  id: string;
  blob: Blob;
  sport: string;
  /** ms epoch — used to evict the oldest clips past MAX_CLIPS. */
  savedAt: number;
  size: number;
}

function idbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

/** Open (and lazily upgrade) the clip database. Resolves null if unavailable. */
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (!idbAvailable()) {
      resolve(null);
      return;
    }
    let req: IDBOpenDBRequest;
    try {
      req = window.indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function done(request: IDBRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ──────────────────────────────────────────────────────────────
// Public API — all best-effort, never throw.
// ──────────────────────────────────────────────────────────────

/**
 * Persist the original clip for a saved analysis, keyed by its id. Prunes the
 * store down to the most recent MAX_CLIPS afterwards. Returns true on success.
 */
export async function putClip(id: string, blob: Blob, sport: string): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    const record: ClipRecord = {
      id,
      blob,
      sport,
      savedAt: Date.now(),
      size: blob.size,
    };
    await done(tx(db, 'readwrite').put(record));
    await pruneOldest(db);
    return true;
  } catch {
    return false;
  } finally {
    db.close();
  }
}

/** Read the stored clip blob for a saved analysis, or null if not kept. */
export async function getClipBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const record = (await done(tx(db, 'readonly').get(id))) as ClipRecord | undefined;
    return record?.blob instanceof Blob ? record.blob : null;
  } catch {
    return null;
  } finally {
    db.close();
  }
}

/** Remove a single clip by id. */
export async function deleteClip(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await done(tx(db, 'readwrite').delete(id));
  } catch {
    // non-critical
  } finally {
    db.close();
  }
}

/** Remove every stored clip. */
export async function clearClips(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await done(tx(db, 'readwrite').clear());
  } catch {
    // non-critical
  } finally {
    db.close();
  }
}

/** Evict the oldest clips so at most MAX_CLIPS remain. Best-effort. */
async function pruneOldest(db: IDBDatabase): Promise<void> {
  try {
    const ids = (await done(tx(db, 'readonly').getAllKeys())) as IDBValidKey[];
    if (ids.length <= MAX_CLIPS) return;
    // getAllKeys with no index returns keys in ascending key order, which is not
    // chronological — so read the records and sort by savedAt to evict honestly.
    const records = (await done(tx(db, 'readonly').getAll())) as ClipRecord[];
    const stale = records
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(MAX_CLIPS)
      .map((r) => r.id);
    if (stale.length === 0) return;
    const store = tx(db, 'readwrite');
    await Promise.all(stale.map((id) => done(store.delete(id))));
  } catch {
    // bounding is best-effort; never block a successful save on it
  }
}
