import {
  getConnection,
  connectionLevel,
  buildClarityUrl,
  maskKey,
  type Env,
} from '../config';
import { buildClarityOsDashboard, resolveCoverage } from '../dashboard';
import { CLARITY_CAPABILITIES, CAPABILITY_COUNT } from '../capabilities';
import { safeNumOfDays } from '../client';
import { findFlagDef, evalFlag } from '@/lib/admin/flags';

const ID = 'abcd1234ef';

describe('clarity config — connection levels', () => {
  test('none when nothing is set', () => {
    expect(connectionLevel({})).toBe('none');
    expect(getConnection({}).level).toBe('none');
  });

  test('ingest when only the project id is set', () => {
    const env: Env = { NEXT_PUBLIC_CLARITY_PROJECT_ID: ID };
    expect(connectionLevel(env)).toBe('ingest');
    const c = getConnection(env);
    expect(c.ingestConfigured).toBe(true);
    expect(c.readConfigured).toBe(false);
  });

  test('full when the export token is set', () => {
    const env: Env = { NEXT_PUBLIC_CLARITY_PROJECT_ID: ID, CLARITY_DATA_EXPORT_TOKEN: 'tok' };
    expect(connectionLevel(env)).toBe('full');
    expect(getConnection(env).readConfigured).toBe(true);
  });

  test('blank values do not count as configured', () => {
    expect(connectionLevel({ NEXT_PUBLIC_CLARITY_PROJECT_ID: '  ' })).toBe('none');
  });
});

describe('clarity config — secrets never leak to the client view', () => {
  test('getConnection carries no token field', () => {
    const c = getConnection({ NEXT_PUBLIC_CLARITY_PROJECT_ID: ID, CLARITY_DATA_EXPORT_TOKEN: 'super-secret' });
    expect(JSON.stringify(c)).not.toContain('super-secret');
  });

  test('maskKey shortens long ids and passes short ones through', () => {
    expect(maskKey('abcdefgh_LONG_1234')).toContain('…');
    expect(maskKey('short')).toBe('short');
    expect(maskKey('')).toBeNull();
  });
});

describe('clarity deep links', () => {
  test('builds a project-scoped url', () => {
    expect(buildClarityUrl('https://clarity.microsoft.com', ID, 'heatmaps')).toBe(
      `https://clarity.microsoft.com/projects/view/${ID}/heatmaps`,
    );
  });

  test('returns null without a project id (never a broken link)', () => {
    expect(buildClarityUrl('https://clarity.microsoft.com', null, 'heatmaps')).toBeNull();
  });
});

describe('clarity capability coverage', () => {
  test('linked capabilities are always linked; live ones need the token', () => {
    const connected = getConnection({ NEXT_PUBLIC_CLARITY_PROJECT_ID: ID }); // ingest only
    const coverage = resolveCoverage(connected);
    const traffic = coverage.find((c) => c.id === 'traffic')!;
    const heatmaps = coverage.find((c) => c.id === 'heatmaps')!;
    expect(traffic.state).toBe('needs-key'); // live cap, no token
    expect(heatmaps.state).toBe('linked'); // always deep-linked
    expect(heatmaps.href).toContain('/heatmaps');
  });

  test('live capabilities turn on with the token', () => {
    const full = getConnection({ NEXT_PUBLIC_CLARITY_PROJECT_ID: ID, CLARITY_DATA_EXPORT_TOKEN: 'tok' });
    const traffic = resolveCoverage(full).find((c) => c.id === 'traffic')!;
    expect(traffic.state).toBe('live');
  });

  test('dashboard stats sum to the capability count', () => {
    const d = buildClarityOsDashboard({ NEXT_PUBLIC_CLARITY_PROJECT_ID: ID });
    const { live, linked, needsKey, total } = d.coverageStats;
    expect(total).toBe(CAPABILITY_COUNT);
    expect(live + linked + needsKey).toBe(CLARITY_CAPABILITIES.length);
  });
});

describe('clarity operator kill-switch', () => {
  test('the clarity.enabled flag is registered, wired and defaults on', () => {
    const def = findFlagDef('clarity.enabled');
    expect(def).toBeDefined();
    expect(def!.status).toBe('wired');
    expect(def!.defaultEnabled).toBe(true);
  });

  test('flipping the override off disables it', () => {
    const def = findFlagDef('clarity.enabled')!;
    expect(evalFlag(def, undefined)).toBe(true);
    expect(
      evalFlag(def, { enabled: false, rolloutPct: 0, segments: [], updatedAt: '', updatedBy: 't' }),
    ).toBe(false);
  });
});

describe('clarity export window clamping', () => {
  test('clamps to Clarity’s supported 1–3 day range', () => {
    expect(safeNumOfDays(0)).toBe(1);
    expect(safeNumOfDays(2)).toBe(2);
    expect(safeNumOfDays(7)).toBe(3);
    expect(safeNumOfDays(NaN)).toBe(3);
  });
});
