// Event-QA guard (A3): the analytics abstraction must route custom events to
// whichever provider is present, and must never throw when none is configured.
// This guards against silently dropping every event once a provider is wired.
import { track, identifyUser, resetUser, featureEnabled, featureFlag, captureError } from '../analytics';
import { ANALYTICS_EVENTS } from '@swingiq/core';

describe('analytics track() (A3 event-QA)', () => {
  const realWindow = (global as { window?: unknown }).window;

  afterEach(() => {
    (global as { window?: unknown }).window = realWindow;
    jest.restoreAllMocks();
  });

  it('routes events to Plausible when present', () => {
    const plausible = jest.fn();
    (global as { window?: unknown }).window = { plausible };
    track(ANALYTICS_EVENTS.PRICING_VIEWED, { surface: 'test' });
    expect(plausible).toHaveBeenCalledWith('pricing_viewed', { props: { surface: 'test' } });
  });

  it('routes events to PostHog when present', () => {
    const capture = jest.fn();
    (global as { window?: unknown }).window = { posthog: { capture } };
    track(ANALYTICS_EVENTS.CTA_CLICKED, { id: 'hero' });
    expect(capture).toHaveBeenCalledWith('cta_clicked', { id: 'hero' });
  });

  it('routes events to Microsoft Clarity when present', () => {
    const clarity = jest.fn();
    (global as { window?: unknown }).window = { clarity };
    track(ANALYTICS_EVENTS.CTA_CLICKED, { id: 'hero' });
    expect(clarity).toHaveBeenCalledWith('event', 'cta_clicked');
    // properties are forwarded as stringified smart tags
    expect(clarity).toHaveBeenCalledWith('set', 'id', 'hero');
  });

  it('delivers to multiple providers at once', () => {
    const plausible = jest.fn();
    const capture = jest.fn();
    const clarity = jest.fn();
    (global as { window?: unknown }).window = { plausible, posthog: { capture }, clarity };
    track(ANALYTICS_EVENTS.PAGE_VIEW, { path: '/' });
    expect(plausible).toHaveBeenCalled();
    expect(capture).toHaveBeenCalled();
    expect(clarity).toHaveBeenCalledWith('event', 'page_view');
  });

  it('never throws when no provider is configured', () => {
    (global as { window?: unknown }).window = {};
    expect(() => track(ANALYTICS_EVENTS.PAGE_VIEW, { path: '/' })).not.toThrow();
  });

  it('is a safe no-op on the server (no window)', () => {
    (global as { window?: unknown }).window = undefined;
    expect(() => track(ANALYTICS_EVENTS.PAGE_VIEW)).not.toThrow();
  });
});

describe('analytics identity & flags (P0)', () => {
  const realWindow = (global as { window?: unknown }).window;

  afterEach(() => {
    (global as { window?: unknown }).window = realWindow;
    jest.restoreAllMocks();
  });

  it('identifyUser forwards a non-PII id (and props) to PostHog', () => {
    const identify = jest.fn();
    (global as { window?: unknown }).window = { posthog: { capture: jest.fn(), identify } };
    identifyUser('user-123', { sport: 'golf' });
    expect(identify).toHaveBeenCalledWith('user-123', { sport: 'golf' });
  });

  it('identifyUser ignores an empty id', () => {
    const identify = jest.fn();
    (global as { window?: unknown }).window = { posthog: { capture: jest.fn(), identify } };
    identifyUser('');
    expect(identify).not.toHaveBeenCalled();
  });

  it('resetUser forwards to PostHog reset', () => {
    const reset = jest.fn();
    (global as { window?: unknown }).window = { posthog: { capture: jest.fn(), reset } };
    resetUser();
    expect(reset).toHaveBeenCalled();
  });

  it('featureFlag returns the raw value, or undefined when unresolved/absent (no fallback)', () => {
    const isFeatureEnabled = jest.fn((k: string) => (k === 'on' ? true : k === 'off' ? false : undefined));
    (global as { window?: unknown }).window = { posthog: { capture: jest.fn(), isFeatureEnabled } };
    expect(featureFlag('on')).toBe(true);
    expect(featureFlag('off')).toBe(false);
    expect(featureFlag('unknown')).toBeUndefined(); // resolved-as-unknown stays undefined

    (global as { window?: unknown }).window = {}; // no provider
    expect(featureFlag('on')).toBeUndefined();
    (global as { window?: unknown }).window = undefined; // server
    expect(featureFlag('on')).toBeUndefined();
  });

  it('featureEnabled returns the flag value, or the fallback when unresolved/absent', () => {
    const isFeatureEnabled = jest.fn().mockReturnValue(true);
    (global as { window?: unknown }).window = { posthog: { capture: jest.fn(), isFeatureEnabled } };
    expect(featureEnabled('upload-flow-v2')).toBe(true);
    expect(featureEnabled('missing-flag', true)).toBe(true); // provider returns undefined → fallback

    (global as { window?: unknown }).window = {};
    expect(featureEnabled('any', false)).toBe(false); // no provider → fallback
  });

  it('captureError forwards the error to PostHog', () => {
    const captureException = jest.fn();
    (global as { window?: unknown }).window = { posthog: { capture: jest.fn(), captureException } };
    const err = new Error('boom');
    captureError(err, { route: '/upload' });
    expect(captureException).toHaveBeenCalledWith(err, { route: '/upload' });
  });

  it('identity/flag/error helpers never throw without a provider or window', () => {
    (global as { window?: unknown }).window = {};
    expect(() => identifyUser('u')).not.toThrow();
    expect(() => resetUser()).not.toThrow();
    expect(() => captureError(new Error('x'))).not.toThrow();
    expect(featureEnabled('f')).toBe(false);

    (global as { window?: unknown }).window = undefined;
    expect(() => identifyUser('u')).not.toThrow();
    expect(() => resetUser()).not.toThrow();
    expect(featureEnabled('f', true)).toBe(true);
  });
});
