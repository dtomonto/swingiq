// ============================================================
// SwingVantage — File System Access wrappers
//
// Thin, type-safe wrappers around the browser File System Access
// API (showSaveFilePicker / showDirectoryPicker). This is what lets
// SwingVantage keep a real file on your device up to date and read your
// chosen folder (e.g. Downloads) back later to continue progress.
//
// HONEST BROWSER LIMITS (reflected in the UI copy):
//   - The browser will NEVER let a web app silently reach into your
//     disk. You pick a file/folder ONCE (a real OS dialog); after
//     that SwingVantage can write to that file / read that folder, and on
//     return visits it re-checks permission (sometimes needing one
//     more click).
//   - Only Chromium browsers (Chrome, Edge, Brave, Opera) implement
//     this today. Safari/Firefox fall back to manual backup/restore.
//
// We deliberately avoid `declare global` augmentation of lib.dom
// (which differs across TS versions). Instead we model only the
// members we use as local interfaces and reach the pickers through a
// single narrow cast helper.
// ============================================================

// ── Minimal local models of the FS Access API ─────────────────

export type FsPermissionMode = 'read' | 'readwrite';
type FsPermissionState = 'granted' | 'denied' | 'prompt';

interface FsPermissionDescriptor {
  mode?: FsPermissionMode;
}

interface FsWritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}

export interface FsFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(opts?: { keepExistingData?: boolean }): Promise<FsWritableStream>;
  queryPermission?(desc?: FsPermissionDescriptor): Promise<FsPermissionState>;
  requestPermission?(desc?: FsPermissionDescriptor): Promise<FsPermissionState>;
}

export interface FsDirHandle {
  kind: 'directory';
  name: string;
  values(): AsyncIterableIterator<FsFileHandle | FsDirHandle>;
  queryPermission?(desc?: FsPermissionDescriptor): Promise<FsPermissionState>;
  requestPermission?(desc?: FsPermissionDescriptor): Promise<FsPermissionState>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: FsPermissionMode;
  startIn?: 'downloads' | 'documents' | 'desktop' | string;
}

interface WindowWithFs {
  showSaveFilePicker?: (opts?: SaveFilePickerOptions) => Promise<FsFileHandle>;
  showDirectoryPicker?: (opts?: DirectoryPickerOptions) => Promise<FsDirHandle>;
}

function fsWindow(): WindowWithFs | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as WindowWithFs;
}

// ── Capability detection ──────────────────────────────────────

/** True when the browser can keep a chosen file/folder handle (Chromium). */
export function isFileSystemAccessSupported(): boolean {
  const w = fsWindow();
  return !!w && typeof w.showSaveFilePicker === 'function' && typeof w.showDirectoryPicker === 'function';
}

/** Thrown picker errors we treat as "user changed their mind", not failures. */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

// ── Pickers (must be called from a user gesture) ──────────────

export async function pickSaveFile(suggestedName: string): Promise<FsFileHandle | null> {
  const w = fsWindow();
  if (!w?.showSaveFilePicker) return null;
  try {
    return await w.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'SwingVantage backup', accept: { 'application/json': ['.json'] } }],
    });
  } catch (err) {
    if (isAbortError(err)) return null;
    throw err;
  }
}

export async function pickDirectory(): Promise<FsDirHandle | null> {
  const w = fsWindow();
  if (!w?.showDirectoryPicker) return null;
  try {
    return await w.showDirectoryPicker({ id: 'swingiq-autorestore', mode: 'read', startIn: 'downloads' });
  } catch (err) {
    if (isAbortError(err)) return null;
    throw err;
  }
}

// ── Permission helpers ────────────────────────────────────────

/**
 * Check (and optionally request) permission on a stored handle.
 * `request: true` MUST run inside a user gesture — browsers reject a
 * silent prompt. We use `request: false` on load to see if access was
 * already granted, and `request: true` behind an explicit button.
 */
export async function ensurePermission(
  handle: FsFileHandle | FsDirHandle,
  mode: FsPermissionMode,
  request: boolean,
): Promise<boolean> {
  const desc: FsPermissionDescriptor = { mode };
  try {
    if (handle.queryPermission) {
      const current = await handle.queryPermission(desc);
      if (current === 'granted') return true;
      if (current === 'denied') return false;
    }
    if (request && handle.requestPermission) {
      const next = await handle.requestPermission(desc);
      return next === 'granted';
    }
  } catch {
    return false;
  }
  // No permission API (older impl) → assume usable; write will surface errors.
  return !handle.queryPermission;
}

// ── File IO ───────────────────────────────────────────────────

export async function writeTextToFile(handle: FsFileHandle, contents: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

/**
 * Return the SwingVantage backup files (.json / .swingiqbackup) directly in a
 * directory. We do NOT recurse — a folder like Downloads is flat enough and
 * recursing risks scanning unrelated large trees.
 */
export async function listBackupFiles(dir: FsDirHandle): Promise<File[]> {
  const out: File[] = [];
  for await (const entry of dir.values()) {
    if (entry.kind !== 'file') continue;
    const name = entry.name.toLowerCase();
    if (!name.endsWith('.json') && !name.endsWith('.swingiqbackup')) continue;
    // Only look at things that plausibly belong to SwingVantage to avoid
    // reading every random .json in the folder.
    if (!name.includes('swingiq') && !name.endsWith('.swingiqbackup')) continue;
    try {
      out.push(await entry.getFile());
    } catch {
      /* unreadable entry — skip */
    }
  }
  return out;
}
