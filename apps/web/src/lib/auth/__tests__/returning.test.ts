// Tests for returning-user detection (lib/auth/returning.ts).
// Runs in the node test env, so we install a minimal in-memory localStorage
// on a fake `window` — the module (and localAccountCount) read `window` at
// call time, so this fully exercises the real logic.

import { isReturningUser, markReturningUser } from '../returning';

function installFakeWindow() {
  const store: Record<string, string> = {};
  const localStorage = {
    getItem: (k: string): string | null => (k in store ? store[k] : null),
    setItem: (k: string, v: string): void => {
      store[k] = String(v);
    },
    removeItem: (k: string): void => {
      delete store[k];
    },
    key: (i: number): string | null => Object.keys(store)[i] ?? null,
    get length(): number {
      return Object.keys(store).length;
    },
  };
  (globalThis as unknown as { window?: unknown }).window = { localStorage };
  return store;
}

function clearFakeWindow() {
  delete (globalThis as unknown as { window?: unknown }).window;
}

describe('isReturningUser', () => {
  afterEach(() => clearFakeWindow());

  it('is false on a brand-new device (empty storage)', () => {
    installFakeWindow();
    expect(isReturningUser()).toBe(false);
  });

  it('is true once markReturningUser() has run', () => {
    installFakeWindow();
    markReturningUser();
    expect(isReturningUser()).toBe(true);
  });

  it('is true when a local (keyless) account exists, even without the flag', () => {
    const store = installFakeWindow();
    store['swingiq.localAccounts.v1'] = JSON.stringify([
      { id: 'a', email: 'a@b.com', name: 'A', createdAt: 'now', salt: 's', hash: 'h' },
    ]);
    expect(isReturningUser()).toBe(true);
  });

  it('is false when the local-accounts list is present but empty', () => {
    const store = installFakeWindow();
    store['swingiq.localAccounts.v1'] = JSON.stringify([]);
    expect(isReturningUser()).toBe(false);
  });

  it('is true when a lingering Supabase auth token is present', () => {
    const store = installFakeWindow();
    store['sb-onbsyasnjegnmpxgadch-auth-token'] = '{"access_token":"x"}';
    expect(isReturningUser()).toBe(true);
  });

  it('is false during SSR (no window)', () => {
    clearFakeWindow();
    expect(isReturningUser()).toBe(false);
  });
});

describe('markReturningUser', () => {
  afterEach(() => clearFakeWindow());

  it('does not throw during SSR (no window)', () => {
    clearFakeWindow();
    expect(() => markReturningUser()).not.toThrow();
  });
});
