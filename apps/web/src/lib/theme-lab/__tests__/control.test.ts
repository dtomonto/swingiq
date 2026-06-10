// Runs in the repo's default `node` test env (no jsdom dep). We provide a
// minimal `window` with a Map-backed localStorage + EventTarget so the
// device-local control can be exercised exactly as it behaves in the browser.
class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeAll(() => {
  const target = new EventTarget();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = Object.assign(target, { localStorage: new MemStorage() });
});

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).window;
});

import {
  readThemeLabControl,
  writeThemeLabControl,
  effectiveForcedTheme,
  envForcedTheme,
  DEFAULT_CONTROL,
  THEME_LAB_STORAGE_KEY,
  THEME_LAB_CHANGE_EVENT,
} from '../control';

describe('theme-lab/control', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete process.env.NEXT_PUBLIC_THEME_LAB_FORCE;
  });

  it('reads the default control when nothing is stored', () => {
    expect(readThemeLabControl()).toEqual(DEFAULT_CONTROL);
  });

  it('round-trips a write and broadcasts a change event', () => {
    const handler = jest.fn();
    window.addEventListener(THEME_LAB_CHANGE_EVENT, handler);
    const next = writeThemeLabControl({ allowSeasonal: true });
    expect(next.allowSeasonal).toBe(true);
    expect(readThemeLabControl().allowSeasonal).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(THEME_LAB_CHANGE_EVENT, handler);
  });

  it('merges patches without clobbering other fields', () => {
    writeThemeLabControl({ forcedThemeId: 'coach-mode' });
    writeThemeLabControl({ allowSeasonal: true });
    const c = readThemeLabControl();
    expect(c.forcedThemeId).toBe('coach-mode');
    expect(c.allowSeasonal).toBe(true);
    expect(c.allowRecommended).toBe(true); // default on, untouched
  });

  it('allowRecommended defaults ON and only an explicit false turns it off', () => {
    expect(readThemeLabControl().allowRecommended).toBe(true);
    writeThemeLabControl({ allowRecommended: false });
    expect(readThemeLabControl().allowRecommended).toBe(false);
    writeThemeLabControl({ allowRecommended: true });
    expect(readThemeLabControl().allowRecommended).toBe(true);
  });

  it('ignores a forced theme that is not an active theme', () => {
    window.localStorage.setItem(
      THEME_LAB_STORAGE_KEY,
      JSON.stringify({ forcedThemeId: 'not-a-real-theme', allowSeasonal: false }),
    );
    expect(readThemeLabControl().forcedThemeId).toBeNull();
  });

  it('survives corrupt JSON', () => {
    window.localStorage.setItem(THEME_LAB_STORAGE_KEY, '{not json');
    expect(readThemeLabControl()).toEqual(DEFAULT_CONTROL);
  });

  it('envForcedTheme honors a valid active theme and ignores junk', () => {
    expect(envForcedTheme()).toBeNull();
    process.env.NEXT_PUBLIC_THEME_LAB_FORCE = 'coach-mode';
    expect(envForcedTheme()).toBe('coach-mode');
    process.env.NEXT_PUBLIC_THEME_LAB_FORCE = 'bogus';
    expect(envForcedTheme()).toBeNull();
  });

  it('effectiveForcedTheme: device pin beats env pin beats nothing', () => {
    const base = { allowSeasonal: false, allowRecommended: true };
    process.env.NEXT_PUBLIC_THEME_LAB_FORCE = 'coach-mode';
    expect(effectiveForcedTheme({ forcedThemeId: null, ...base })).toBe('coach-mode');
    expect(effectiveForcedTheme({ forcedThemeId: 'field-court', ...base })).toBe('field-court');
    delete process.env.NEXT_PUBLIC_THEME_LAB_FORCE;
    expect(effectiveForcedTheme({ forcedThemeId: null, ...base })).toBeNull();
  });
});
