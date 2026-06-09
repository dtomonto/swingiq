// Consent gate: cookie-setting analytics (e.g. Microsoft Clarity) must load
// ONLY when the visitor has explicitly accepted — never when declined or
// undecided. This guards the opt-in semantics the privacy posture depends on.
import {
  getConsent,
  setConsent,
  hasAnalyticsConsent,
  subscribeConsent,
  CONSENT_KEY,
} from '../consent';

type G = { window?: unknown; localStorage?: unknown; Event?: unknown };
const g = global as G;

function installBrowserGlobals() {
  const store: Record<string, string> = {};
  const listeners: Record<string, Array<() => void>> = {};
  const win = {
    localStorage: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    },
    dispatchEvent: (e: { type: string }) => {
      (listeners[e.type] ?? []).forEach((fn) => fn());
      return true;
    },
    addEventListener: (t: string, fn: () => void) => { (listeners[t] ??= []).push(fn); },
    removeEventListener: (t: string, fn: () => void) => {
      listeners[t] = (listeners[t] ?? []).filter((f) => f !== fn);
    },
  };
  g.window = win;
  g.localStorage = win.localStorage;
  g.Event = class { type: string; constructor(t: string) { this.type = t; } };
}

describe('consent gate', () => {
  const realWindow = g.window;
  const realLocalStorage = g.localStorage;
  const realEvent = g.Event;

  beforeEach(() => installBrowserGlobals());
  afterEach(() => {
    g.window = realWindow;
    g.localStorage = realLocalStorage;
    g.Event = realEvent;
    jest.restoreAllMocks();
  });

  it('defaults to no consent (opt-in, not opt-out)', () => {
    expect(getConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('accepting grants analytics consent', () => {
    setConsent('accepted');
    expect(getConsent()).toBe('accepted');
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('declining persists but does NOT grant consent', () => {
    setConsent('declined');
    expect(getConsent()).toBe('declined');
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('uses the shared storage key the banner writes', () => {
    setConsent('accepted');
    expect((g.localStorage as Storage).getItem(CONSENT_KEY)).toBe('accepted');
  });

  it('notifies subscribers when the choice changes', () => {
    const cb = jest.fn();
    const unsub = subscribeConsent(cb);
    setConsent('accepted');
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    setConsent('declined');
    expect(cb).toHaveBeenCalledTimes(1); // no more calls after unsubscribe
  });

  it('is a safe no-op on the server (no window)', () => {
    g.window = undefined;
    expect(() => setConsent('accepted')).not.toThrow();
    expect(getConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
