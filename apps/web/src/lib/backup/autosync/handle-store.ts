// ============================================================
// SwingIQ — Auto-Sync persistence (IndexedDB, no deps)
//
// File System Access handles are structured-clonable but NOT
// JSON-serializable, so they can't live in localStorage / the zustand
// persist layer. We keep them — and their small config blobs — in a
// dedicated IndexedDB database. Mirrors the tiny promise wrapper used
// by lib/offline/outbox.ts.
// ============================================================

import type { FsFileHandle, FsDirHandle } from './fs-access';
import type { AutoSaveConfig, AutoRestoreConfig } from './config';
import { DEFAULT_AUTOSAVE_CONFIG, DEFAULT_AUTORESTORE_CONFIG } from './config';

const DB_NAME = 'swingiq-autosync';
const DB_VERSION = 1;
const HANDLES = 'handles';
const CONFIG = 'config';

const SAVE_HANDLE_KEY = 'autosave-file';
const RESTORE_HANDLE_KEY = 'autorestore-dir';
const SAVE_CONFIG_KEY = 'autosave-config';
const RESTORE_CONFIG_KEY = 'autorestore-config';

function hasIDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HANDLES)) db.createObjectStore(HANDLES);
      if (!db.objectStoreNames.contains(CONFIG)) db.createObjectStore(CONFIG);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(store: string, key: string): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve, reject) => {
        const t = db.transaction(store, 'readonly');
        const req = t.objectStore(store).get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

function idbPut(store: string, key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(store, 'readwrite');
        const req = t.objectStore(store).put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

function idbDelete(store: string, key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(store, 'readwrite');
        const req = t.objectStore(store).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

// ── Handles ───────────────────────────────────────────────────

export async function saveFileHandle(handle: FsFileHandle): Promise<void> {
  if (!hasIDB()) return;
  try { await idbPut(HANDLES, SAVE_HANDLE_KEY, handle); } catch { /* best-effort */ }
}

export async function loadFileHandle(): Promise<FsFileHandle | null> {
  if (!hasIDB()) return null;
  try { return await idbGet<FsFileHandle>(HANDLES, SAVE_HANDLE_KEY); } catch { return null; }
}

export async function clearFileHandle(): Promise<void> {
  if (!hasIDB()) return;
  try { await idbDelete(HANDLES, SAVE_HANDLE_KEY); } catch { /* best-effort */ }
}

export async function saveDirHandle(handle: FsDirHandle): Promise<void> {
  if (!hasIDB()) return;
  try { await idbPut(HANDLES, RESTORE_HANDLE_KEY, handle); } catch { /* best-effort */ }
}

export async function loadDirHandle(): Promise<FsDirHandle | null> {
  if (!hasIDB()) return null;
  try { return await idbGet<FsDirHandle>(HANDLES, RESTORE_HANDLE_KEY); } catch { return null; }
}

export async function clearDirHandle(): Promise<void> {
  if (!hasIDB()) return;
  try { await idbDelete(HANDLES, RESTORE_HANDLE_KEY); } catch { /* best-effort */ }
}

// ── Config blobs ──────────────────────────────────────────────

export async function loadSaveConfig(): Promise<AutoSaveConfig> {
  if (!hasIDB()) return { ...DEFAULT_AUTOSAVE_CONFIG };
  try {
    const cfg = await idbGet<AutoSaveConfig>(CONFIG, SAVE_CONFIG_KEY);
    return { ...DEFAULT_AUTOSAVE_CONFIG, ...(cfg ?? {}) };
  } catch {
    return { ...DEFAULT_AUTOSAVE_CONFIG };
  }
}

export async function persistSaveConfig(cfg: AutoSaveConfig): Promise<void> {
  if (!hasIDB()) return;
  try { await idbPut(CONFIG, SAVE_CONFIG_KEY, cfg); } catch { /* best-effort */ }
}

export async function loadRestoreConfig(): Promise<AutoRestoreConfig> {
  if (!hasIDB()) return { ...DEFAULT_AUTORESTORE_CONFIG };
  try {
    const cfg = await idbGet<AutoRestoreConfig>(CONFIG, RESTORE_CONFIG_KEY);
    return { ...DEFAULT_AUTORESTORE_CONFIG, ...(cfg ?? {}) };
  } catch {
    return { ...DEFAULT_AUTORESTORE_CONFIG };
  }
}

export async function persistRestoreConfig(cfg: AutoRestoreConfig): Promise<void> {
  if (!hasIDB()) return;
  try { await idbPut(CONFIG, RESTORE_CONFIG_KEY, cfg); } catch { /* best-effort */ }
}
