import {
  resolvePostHogHosts,
  maskKey,
  getIngestConfig,
  getReadConfig,
  connectionLevel,
  getConnection,
  buildPostHogUrl,
  POSTHOG_DEFAULT_HOST,
  type Env,
} from '../config';
import { POSTHOG_CAPABILITIES, CAPABILITY_GROUPS, CAPABILITY_COUNT } from '../capabilities';
import { buildAnalyticsOsDashboard, resolveCoverage, KEY_FUNNELS } from '../dashboard';
import {
  safeDays,
  webOverviewQuery,
  pageviewsByDayQuery,
  topNamedCountQuery,
  shapeNamedCounts,
  shapeWebOverview,
  validateHogQL,
} from '../queries';
import { phFetch, shapeFlag, type RawFlag } from '../client';
import { ANALYTICS_EVENTS } from '@swingiq/core';

const INGEST_ONLY: Env = { NEXT_PUBLIC_POSTHOG_KEY: 'phc_abc12345678' };
const FULL: Env = {
  NEXT_PUBLIC_POSTHOG_KEY: 'phc_abc12345678',
  POSTHOG_PERSONAL_API_KEY: 'phx_secret_value_here',
  POSTHOG_PROJECT_ID: '12345',
};

describe('config — host resolution', () => {
  test('defaults to US cloud', () => {
    const h = resolvePostHogHosts(undefined);
    expect(h.ingestHost).toBe(POSTHOG_DEFAULT_HOST);
    expect(h.apiBaseUrl).toBe('https://us.posthog.com');
    expect(h.appBaseUrl).toBe('https://us.posthog.com');
    expect(h.region).toBe('us');
  });

  test('detects EU and splits ingest vs app host', () => {
    const h = resolvePostHogHosts('https://eu.i.posthog.com');
    expect(h.region).toBe('eu');
    expect(h.apiBaseUrl).toBe('https://eu.posthog.com');
    expect(h.ingestHost).toBe('https://eu.i.posthog.com');
  });

  test('self-hosted uses one origin for both, region custom', () => {
    const h = resolvePostHogHosts('https://ph.example.com/');
    expect(h.region).toBe('custom');
    expect(h.ingestHost).toBe('https://ph.example.com');
    expect(h.apiBaseUrl).toBe('https://ph.example.com');
  });
});

describe('config — masking & connection levels', () => {
  test('maskKey shows head and tail only', () => {
    expect(maskKey('phc_wAwLuGqKktVoibyDDo2')).toBe('phc_wAwL…DDo2');
    expect(maskKey('')).toBeNull();
    expect(maskKey(undefined)).toBeNull();
    expect(maskKey('short')).toBe('short');
  });

  test('connectionLevel reflects what is wired', () => {
    expect(connectionLevel({})).toBe('none');
    expect(connectionLevel(INGEST_ONLY)).toBe('ingest');
    expect(connectionLevel(FULL)).toBe('full');
  });

  test('getReadConfig requires BOTH personal key and project id', () => {
    expect(getReadConfig({ POSTHOG_PERSONAL_API_KEY: 'phx_x' }).configured).toBe(false);
    expect(getReadConfig({ POSTHOG_PROJECT_ID: '1' }).configured).toBe(false);
    expect(getReadConfig(FULL).configured).toBe(true);
  });

  test('getConnection never leaks the personal key', () => {
    const c = getConnection(FULL);
    expect(c.level).toBe('full');
    expect(c.readConfigured).toBe(true);
    expect(c.projectId).toBe('12345');
    expect(JSON.stringify(c)).not.toContain('phx_secret_value_here');
    // ingest key is public but masked for display
    expect(c.ingestKeyMasked).toBe('phc_abc1…5678');
  });

  test('blank strings do not count as configured', () => {
    expect(getIngestConfig({ NEXT_PUBLIC_POSTHOG_KEY: '   ' }).configured).toBe(false);
  });

  test('buildPostHogUrl joins cleanly regardless of slashes', () => {
    expect(buildPostHogUrl('https://us.posthog.com', '/replay')).toBe('https://us.posthog.com/replay');
    expect(buildPostHogUrl('https://us.posthog.com/', 'replay')).toBe('https://us.posthog.com/replay');
  });
});

describe('capabilities map', () => {
  test('covers a broad PostHog surface with unique ids', () => {
    expect(CAPABILITY_COUNT).toBeGreaterThanOrEqual(15);
    const ids = POSTHOG_CAPABILITIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every capability is complete and lands in a known group', () => {
    const groupIds = new Set(CAPABILITY_GROUPS.map((g) => g.id));
    for (const c of POSTHOG_CAPABILITIES) {
      expect(c.label && c.description && c.posthogPath && c.icon).toBeTruthy();
      expect(groupIds.has(c.group)).toBe(true);
    }
  });

  test('includes the headline PostHog features', () => {
    const ids = POSTHOG_CAPABILITIES.map((c) => c.id);
    for (const must of ['product-analytics', 'web-analytics', 'session-replay', 'feature-flags', 'experiments', 'surveys']) {
      expect(ids).toContain(must);
    }
  });
});

describe('dashboard assembly', () => {
  test('keyless: linked capabilities still link to nothing, gated ones need a key', () => {
    const d = buildAnalyticsOsDashboard({});
    expect(d.connection.level).toBe('none');
    // Nothing is "live" without a read key.
    expect(d.coverageStats.live).toBe(0);
    expect(d.coverageStats.manage).toBe(0);
    // No project at all → no deep links yet.
    expect(d.coverage.every((c) => c.href === null)).toBe(true);
    expect(d.coverageStats.total).toBe(CAPABILITY_COUNT);
  });

  test('ingest-only: deep links work, read features still need a key', () => {
    const d = buildAnalyticsOsDashboard(INGEST_ONLY);
    expect(d.connection.level).toBe('ingest');
    expect(d.coverageStats.needsKey).toBeGreaterThan(0);
    // linked capabilities now have real PostHog URLs
    const funnels = d.coverage.find((c) => c.id === 'funnels');
    expect(funnels?.href).toContain('us.posthog.com');
    expect(funnels?.state).toBe('linked');
    // a read-gated capability is parked until the personal key arrives
    expect(d.coverage.find((c) => c.id === 'web-analytics')?.state).toBe('needs-key');
  });

  test('full: read-gated capabilities light up', () => {
    const d = buildAnalyticsOsDashboard(FULL);
    expect(d.connection.level).toBe('full');
    expect(d.coverageStats.needsKey).toBe(0);
    expect(d.coverage.find((c) => c.id === 'web-analytics')?.state).toBe('live');
    expect(d.coverage.find((c) => c.id === 'feature-flags')?.state).toBe('manage');
  });

  test('stats always sum to the total and group buckets are non-empty', () => {
    const d = buildAnalyticsOsDashboard(INGEST_ONLY);
    const { live, manage, linked, needsKey, total } = d.coverageStats;
    expect(live + manage + linked + needsKey).toBe(total);
    expect(d.coverageByGroup.length).toBeGreaterThan(0);
    expect(d.coverageByGroup.every((g) => g.items.length > 0)).toBe(true);
  });

  test('carries the tracked-event catalog and funnels', () => {
    const d = buildAnalyticsOsDashboard(INGEST_ONLY);
    expect(d.trackedEvents).toContain('page_view');
    expect(d.funnels).toEqual(KEY_FUNNELS);
    expect(() => new Date(d.generatedAt).toISOString()).not.toThrow();
  });

  test('resolveCoverage is pure over a connection', () => {
    const cov = resolveCoverage(getConnection(FULL));
    expect(cov).toHaveLength(CAPABILITY_COUNT);
  });
});

describe('HogQL builders & shapers', () => {
  test('safeDays clamps to 1..365', () => {
    expect(safeDays(0)).toBe(1);
    expect(safeDays(99999)).toBe(365);
    expect(safeDays(NaN)).toBe(30);
    expect(safeDays(30)).toBe(30);
  });

  test('builders embed the clamped window and the right aggregates', () => {
    expect(webOverviewQuery(7)).toContain('INTERVAL 7 DAY');
    expect(webOverviewQuery(7)).toMatch(/countIf\(event = '\$pageview'\)/);
    expect(pageviewsByDayQuery(7)).toContain('GROUP BY day');
    expect(topNamedCountQuery('events', 7).toLowerCase()).toContain('group by name');
    expect(topNamedCountQuery('referrers', 7)).toContain('$referring_domain');
    expect(topNamedCountQuery('pages', 7)).toContain('$pathname');
  });

  test('shapeNamedCounts handles nulls and coerces counts', () => {
    expect(shapeNamedCounts([['/home', 5], [null, '3']])).toEqual([
      { name: '/home', count: 5 },
      { name: '(direct / none)', count: 3 },
    ]);
    expect(shapeNamedCounts(undefined)).toEqual([]);
  });

  test('shapeWebOverview reads totals row + per-day rows', () => {
    const o = shapeWebOverview([[120, 40, 55]], [['2026-06-01', 10], ['2026-06-02', 20]]);
    expect(o).toEqual({
      pageviews: 120,
      visitors: 40,
      sessions: 55,
      byDay: [
        { date: '2026-06-01', pageviews: 10 },
        { date: '2026-06-02', pageviews: 20 },
      ],
    });
    expect(shapeWebOverview(undefined, undefined).pageviews).toBe(0);
  });

  test('validateHogQL allows SELECT, blocks mutations and empties', () => {
    expect(validateHogQL('SELECT count() FROM events').ok).toBe(true);
    expect(validateHogQL('with x as (select 1) select * from x').ok).toBe(true);
    expect(validateHogQL('').ok).toBe(false);
    expect(validateHogQL('DELETE FROM events').ok).toBe(false);
    expect(validateHogQL('DROP TABLE events').ok).toBe(false);
    expect(validateHogQL('truncate events').ok).toBe(false);
  });
});

describe('client — defensive fetch & shaping', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  test('phFetch returns parsed JSON on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ hello: 'world' }),
    }) as unknown as typeof fetch;
    const r = await phFetch<{ hello: string }>('https://x');
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ hello: 'world' });
  });

  test('phFetch surfaces PostHog error detail on non-2xx', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ detail: 'Invalid personal API key.' }),
    }) as unknown as typeof fetch;
    const r = await phFetch('https://x');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
    expect(r.error).toBe('Invalid personal API key.');
  });

  test('phFetch never throws on a network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch;
    const r = await phFetch('https://x');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/network/i);
  });

  test('phFetch reports a timeout when aborted', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
    global.fetch = jest.fn().mockRejectedValue(abortErr) as unknown as typeof fetch;
    const r = await phFetch('https://x', {}, 10);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/timed out/i);
  });

  test('shapeFlag reads the first group rollout percentage', () => {
    const raw: RawFlag = {
      id: 7,
      key: 'new-onboarding',
      name: 'New onboarding',
      active: true,
      filters: { groups: [{ rollout_percentage: 25 }] },
    };
    expect(shapeFlag(raw)).toEqual({
      id: 7,
      key: 'new-onboarding',
      name: 'New onboarding',
      active: true,
      rolloutPercentage: 25,
    });
    expect(shapeFlag({ id: 1, key: 'k', active: false }).rolloutPercentage).toBeNull();
  });
});

describe('KEY_FUNNELS — integrity (every step maps to a real, buildable event)', () => {
  const EVENT_VALUES = new Set<string>(Object.values(ANALYTICS_EVENTS));

  test('there are funnels and each has at least two steps', () => {
    expect(KEY_FUNNELS.length).toBeGreaterThan(0);
    for (const f of KEY_FUNNELS) {
      expect(f.name).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('every step event is null (PostHog-native) or a real ANALYTICS_EVENTS value', () => {
    for (const f of KEY_FUNNELS) {
      for (const step of f.steps) {
        expect(step.label).toBeTruthy();
        if (step.event !== null) {
          expect(EVENT_VALUES.has(step.event)).toBe(true);
        }
      }
    }
  });

  test('funnel names are unique', () => {
    const names = KEY_FUNNELS.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test('the activation funnel covers analysis → fix → drill (the aha+return path)', () => {
    const activation = KEY_FUNNELS.find((f) => f.name === 'Activation');
    expect(activation).toBeDefined();
    const events = activation!.steps.map((s) => s.event);
    expect(events).toContain(ANALYTICS_EVENTS.ANALYSIS_COMPLETED);
    expect(events).toContain(ANALYTICS_EVENTS.DRILL_STARTED);
  });
});
