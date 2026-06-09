// ============================================================
// SwingVantage — device-local data wipe (shared-device privacy, F15)
// ------------------------------------------------------------
// On a shared/public computer the next person could read the previous user's
// swing data, notes, and (most sensitively) recruiting snapshots — which may
// include MINORS — straight out of localStorage. These helpers clear that
// device-local app data.
//
// Two levels, by data-loss risk:
//   • wipeSyncedUserData() — clears ONLY the main store, which is cloud-synced
//     (the account is the source of truth and restores it on next sign-in).
//     Safe to call automatically on CLOUD sign-out — no data loss.
//   • wipeAllDeviceData()  — clears EVERY app key (incl. recruiting/academy).
//     User-initiated only (the Data Center "Clear data" control), because in
//     keyless mode some of this is the only copy.
//
// Pure + SSR-safe: pass a Storage for tests, or it reads window.localStorage.
// We never touch non-app keys (e.g. Supabase 'sb-*' session cookies/tokens).
// ============================================================

/** Cloud-synced stores — safe to auto-clear on cloud sign-out (restored on sign-in). */
export const SYNCED_USER_DATA_KEYS = ['swingiq-store'] as const;

/** Prefixes that identify SwingVantage's own localStorage keys. */
export const APP_STORAGE_PREFIXES = ['swingiq', 'swingvantage'] as const;

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null; // storage can throw in private-mode / sandboxed contexts
  }
}

/** Clear the cloud-synced user store(s). Returns how many keys were removed. */
export function wipeSyncedUserData(storage?: Storage): number {
  const s = resolveStorage(storage);
  if (!s) return 0;
  let removed = 0;
  for (const key of SYNCED_USER_DATA_KEYS) {
    if (s.getItem(key) !== null) {
      s.removeItem(key);
      removed += 1;
    }
  }
  return removed;
}

/** Every app-owned localStorage key currently present. */
export function listAppStorageKeys(storage?: Storage): string[] {
  const s = resolveStorage(storage);
  if (!s) return [];
  const keys: string[] = [];
  for (let i = 0; i < s.length; i += 1) {
    const key = s.key(i);
    if (key && APP_STORAGE_PREFIXES.some((p) => key.startsWith(p))) keys.push(key);
  }
  return keys;
}

/** Clear ALL app-owned device data. Returns how many keys were removed. */
export function wipeAllDeviceData(storage?: Storage): number {
  const s = resolveStorage(storage);
  if (!s) return 0;
  const keys = listAppStorageKeys(s); // snapshot first — don't mutate while indexing
  for (const key of keys) s.removeItem(key);
  return keys.length;
}
