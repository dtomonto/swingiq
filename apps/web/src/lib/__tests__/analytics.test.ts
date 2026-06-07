// Event-QA guard (A3): the analytics abstraction must route custom events to
// whichever provider is present, and must never throw when none is configured.
// This guards against silently dropping every event once a provider is wired.
import { track } from '../analytics';
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

  it('delivers to multiple providers at once', () => {
    const plausible = jest.fn();
    const capture = jest.fn();
    (global as { window?: unknown }).window = { plausible, posthog: { capture } };
    track(ANALYTICS_EVENTS.PAGE_VIEW, { path: '/' });
    expect(plausible).toHaveBeenCalled();
    expect(capture).toHaveBeenCalled();
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
