// ============================================================
// device-data — shared-device wipe (F15)
// ============================================================

import {
  wipeSyncedUserData, wipeAllDeviceData, listAppStorageKeys, SYNCED_USER_DATA_KEYS,
} from '../device-data';

/** Minimal in-memory Storage for tests. */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
  } as Storage;
}

const seed = () => fakeStorage({
  'swingiq-store': '{"sessions":[1]}',
  'swingvantage-recruiting': '{"minor":"data"}',
  'swingvantage-academy': '{}',
  'swingvantage-admin-flags': '{}',
  'sb-abc-auth-token': 'supabase-session', // NOT app-owned — must never be touched
  'theme': 'dark',
});

describe('wipeSyncedUserData', () => {
  it('clears only the cloud-synced main store and leaves everything else', () => {
    const s = seed();
    const removed = wipeSyncedUserData(s);
    expect(removed).toBe(1);
    expect(s.getItem('swingiq-store')).toBeNull();
    expect(s.getItem('swingvantage-recruiting')).not.toBeNull();
    expect(s.getItem('sb-abc-auth-token')).toBe('supabase-session');
  });
  it('only targets the documented synced keys', () => {
    expect(SYNCED_USER_DATA_KEYS).toContain('swingiq-store');
  });
});

describe('listAppStorageKeys', () => {
  it('returns app-owned keys and ignores foreign keys (sb-*, theme)', () => {
    const keys = listAppStorageKeys(seed());
    expect(keys).toEqual(expect.arrayContaining([
      'swingiq-store', 'swingvantage-recruiting', 'swingvantage-academy', 'swingvantage-admin-flags',
    ]));
    expect(keys).not.toContain('sb-abc-auth-token');
    expect(keys).not.toContain('theme');
  });
});

describe('wipeAllDeviceData', () => {
  it('clears every app key (incl. recruiting) but never the Supabase session', () => {
    const s = seed();
    const removed = wipeAllDeviceData(s);
    expect(removed).toBe(4);
    expect(s.getItem('swingiq-store')).toBeNull();
    expect(s.getItem('swingvantage-recruiting')).toBeNull();
    expect(s.getItem('swingvantage-admin-flags')).toBeNull();
    expect(s.getItem('sb-abc-auth-token')).toBe('supabase-session');
    expect(s.getItem('theme')).toBe('dark');
  });
});

describe('SSR / no-storage safety', () => {
  it('returns 0 / [] when no storage is available', () => {
    // Pass an explicit null-ish: emulate by giving a storage that throws? Simpler:
    // the helpers read window when no arg — in the node test env there is no window.
    expect(wipeSyncedUserData()).toBe(0);
    expect(wipeAllDeviceData()).toBe(0);
    expect(listAppStorageKeys()).toEqual([]);
  });
});
