// Consent gate: cookie-setting analytics (e.g. Microsoft Clarity) must load
// ONLY when the visitor has explicitly accepted — never when declined or
// undecided. This guards the opt-in semantics the privacy posture depends on.
import {
  getConsent,
  setConsent,
  hasAnalyticsConsent,
  subscribeConsent,
  acceptAll,
  declineAll,
  clearConsent,
  consentItems,
  provisionedConsentItems,
  consentRequired,
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

  it('acceptAll / declineAll set the umbrella decision in one call', () => {
    acceptAll();
    expect(hasAnalyticsConsent()).toBe(true);
    declineAll();
    expect(getConsent()).toBe('declined');
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('clearConsent re-prompts (back to undecided)', () => {
    acceptAll();
    clearConsent();
    expect(getConsent()).toBeNull();
  });
});

describe('consent registry', () => {
  const ENV_KEYS = ['NEXT_PUBLIC_CLARITY_PROJECT_ID', 'NEXT_PUBLIC_GA_ID', 'NEXT_PUBLIC_POSTHOG_KEY'];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => ENV_KEYS.forEach((k) => { saved[k] = process.env[k]; delete process.env[k]; }));
  afterEach(() => ENV_KEYS.forEach((k) => {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }));

  it('enumerates the cookie-setting providers (and excludes cookieless Plausible)', () => {
    const ids = consentItems().map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['clarity', 'ga4', 'posthog']));
    expect(ids).not.toContain('plausible');
  });

  it('nothing requires consent when no provider is configured', () => {
    expect(provisionedConsentItems()).toHaveLength(0);
    expect(consentRequired()).toBe(false);
  });

  it('only configured providers require consent', () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = 'abc123';
    expect(consentRequired()).toBe(true);
    const provisioned = provisionedConsentItems().map((i) => i.id);
    expect(provisioned).toEqual(['clarity']);
  });
});
