import { CONNECTOR_FLAGS } from '../feature-flags/flags';
import {
  CONNECTORS,
  getConnectorStatuses,
  summarizeConnectors,
} from '../feature-flags/connector-status';
import {
  submitUrls,
  keyFileLocation,
  isIndexNowConfigured,
} from '../seo/indexnow';
import { userSafeError } from '../monitoring/errors';
import { SITE_URL } from '@/config/site';

// Derive the same-host base from the real SITE_URL (defaults to
// https://swingvantage.com when NEXT_PUBLIC_SITE_URL is unset) so the
// IndexNow same-host filter is exercised against the actual host.
const HOST_BASE = SITE_URL.replace(/\/$/, '');

describe('connector-status registry', () => {
  it('defines exactly one connector per flag (no gaps, no extras)', () => {
    const ids = CONNECTORS.map((c) => c.id).sort();
    expect(ids).toEqual([...CONNECTOR_FLAGS].sort());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reports nothing configured for an empty env', () => {
    const statuses = getConnectorStatuses({});
    // Vercel analytics / speed insights / mediapipe default-on (opt-out vars),
    // so "configured" for an empty env is the count of default-on connectors.
    const defaultOn = statuses.filter((s) => s.configured).map((s) => s.id).sort();
    expect(defaultOn).toEqual(['mediapipe', 'speedInsights', 'vercelAnalytics']);
  });

  it('flips a connector to configured when its env is set to a real value', () => {
    const statuses = getConnectorStatuses({ NEXT_PUBLIC_POSTHOG_KEY: 'phc_real_key' });
    expect(statuses.find((s) => s.id === 'posthog')?.configured).toBe(true);
  });

  it('treats placeholder values as NOT configured', () => {
    const statuses = getConnectorStatuses({ NEXT_PUBLIC_POSTHOG_KEY: 'your-posthog-key-here' });
    expect(statuses.find((s) => s.id === 'posthog')?.configured).toBe(false);
  });

  it('requires BOTH keys for multi-key connectors (turnstile)', () => {
    const partial = getConnectorStatuses({ NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: 'site' });
    expect(partial.find((s) => s.id === 'turnstile')?.configured).toBe(false);
    const full = getConnectorStatuses({
      NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: 'site',
      CLOUDFLARE_TURNSTILE_SECRET_KEY: 'secret',
    });
    expect(full.find((s) => s.id === 'turnstile')?.configured).toBe(true);
  });

  it('never exposes secret values — only booleans', () => {
    const statuses = getConnectorStatuses({ STRIPE_SECRET_KEY: 'sk_live_supersecret' });
    const json = JSON.stringify(statuses);
    expect(json).not.toContain('sk_live_supersecret');
  });

  it('summarizes counts by layer', () => {
    const summary = summarizeConnectors({ NEXT_PUBLIC_POSTHOG_KEY: 'phc_x' });
    expect(summary.total).toBe(CONNECTORS.length);
    expect(summary.byLayer.analytics.total).toBeGreaterThan(0);
    expect(summary.configured).toBeGreaterThanOrEqual(1);
  });
});

describe('IndexNow', () => {
  it('is not configured without a key', () => {
    expect(isIndexNowConfigured({})).toBe(false);
    expect(keyFileLocation({})).toBeNull();
  });

  it('derives the key-file location from the site URL', () => {
    expect(keyFileLocation({ INDEXNOW_KEY: 'abc123' })).toBe(`${HOST_BASE}/abc123.txt`);
  });

  it('honors an explicit key-location override', () => {
    expect(
      keyFileLocation({ INDEXNOW_KEY: 'abc123', INDEXNOW_KEY_LOCATION: 'https://x/y.txt' }),
    ).toBe('https://x/y.txt');
  });

  it('no-ops without a key (never calls fetch)', async () => {
    const spy = jest.fn();
    const res = await submitUrls([`${HOST_BASE}/a`], {}, spy as unknown as typeof fetch);
    expect(res).toEqual({ submitted: false, reason: 'no-key' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('drops foreign-host URLs and reports no-urls', async () => {
    const spy = jest.fn();
    const res = await submitUrls(
      ['https://evil.example.com/x'],
      { INDEXNOW_KEY: 'abc123' },
      spy as unknown as typeof fetch,
    );
    expect(res.reason).toBe('no-urls');
    expect(spy).not.toHaveBeenCalled();
  });

  it('submits same-host URLs and reports success on ok', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const res = await submitUrls(
      [`${HOST_BASE}/page-a`, `${HOST_BASE}/page-a`, `${HOST_BASE}/page-b`],
      { INDEXNOW_KEY: 'abc123' },
      fetchImpl as unknown as typeof fetch,
    );
    expect(res.submitted).toBe(true);
    expect(res.urls).toEqual([`${HOST_BASE}/page-a`, `${HOST_BASE}/page-b`]); // deduped
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports request-failed when fetch throws', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('network'));
    const res = await submitUrls(
      [`${HOST_BASE}/page-a`],
      { INDEXNOW_KEY: 'abc123' },
      fetchImpl as unknown as typeof fetch,
    );
    expect(res.submitted).toBe(false);
    expect(res.reason).toBe('request-failed');
  });
});

describe('user-safe errors', () => {
  it('returns a trust-preserving message with no stack trace', () => {
    const err = userSafeError('analysis');
    expect(err.message).toContain('not published publicly');
    expect(err.retryable).toBe(true);
  });

  it('falls back to generic', () => {
    expect(userSafeError().title).toBe('Something went wrong');
  });
});
