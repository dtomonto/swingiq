// ============================================================
// GAI recommendation cache — key, safety, store, and round-trip tests
// ============================================================

import { cacheKey, isCacheableResult, getCachedResult, putCachedResult, __test__ } from './cache';
import { analyze } from './service';
import type { AnalysisRequest, AnalysisResult } from './types';

beforeEach(() => __test__.reset());

function res(over: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    tier: 'INSTANT_ESTIMATE',
    route: 'HEURISTIC_ONLY',
    sourceMode: 'heuristic',
    sport: 'golf',
    issue: 'slice',
    diagnosis: 'd',
    confidence: 0.7,
    confidenceLabel: 'moderate',
    reasoning: 'r',
    primaryFix: 'f',
    drills: [{ name: 'x', goal: 'g' }],
    practicePlan: { days: [] },
    retest: { protocol: 'p', activeWindowDays: 7, improvedWhen: 'w' },
    disclaimer: 'd',
    poweredBy: 'SwingVantage GAI',
    ruleVersion: '1.0.0',
    costEstimateCents: 0,
    ...over,
  };
}

const req: AnalysisRequest = { tier: 'INSTANT_ESTIMATE', sport: 'golf', issue: 'slice', symptoms: ['a', 'b'] };

describe('cacheKey + cacheability', () => {
  test('key is user-agnostic and order-insensitive for symptoms/goals', () => {
    const k1 = cacheKey({ ...req, symptoms: ['b', 'a'], userId: 'user-1' });
    const k2 = cacheKey({ ...req, symptoms: ['a', 'b'], userId: 'user-2' });
    expect(k1).toBe(k2);
    expect(k1).not.toContain('user-');
  });

  test('only deterministic heuristic results are cacheable', () => {
    expect(isCacheableResult(res({ sourceMode: 'heuristic' }))).toBe(true);
    expect(isCacheableResult(res({ sourceMode: 'ai' }))).toBe(false);
    expect(isCacheableResult(res({ sourceMode: 'hybrid' }))).toBe(false);
    expect(isCacheableResult(res({ sourceMode: 'cached' }))).toBe(false);
  });
});

describe('get / put', () => {
  test('stores and returns a heuristic result', async () => {
    await putCachedResult(req, res({ diagnosis: 'stored' }));
    expect((await getCachedResult(req))?.diagnosis).toBe('stored');
  });

  test('never stores personalized AI results', async () => {
    await putCachedResult(req, res({ sourceMode: 'ai' }));
    expect(await getCachedResult(req)).toBeNull();
    expect(__test__.size()).toBe(0);
  });

  test('a different request misses', async () => {
    await putCachedResult(req, res());
    expect(await getCachedResult({ ...req, issue: 'hook' })).toBeNull();
  });
});

describe('analyze() cache round-trip', () => {
  test('first call computes a heuristic estimate; second serves it from cache', async () => {
    const first = await analyze(req, { disableLogging: true });
    expect(first.route).toBe('HEURISTIC_ONLY');
    expect(first.sourceMode).toBe('heuristic');
    expect(__test__.size()).toBe(1);

    const second = await analyze(req, { disableLogging: true });
    expect(second.route).toBe('CACHED');
    expect(second.sourceMode).toBe('cached');
    expect(second.diagnosis).toBe(first.diagnosis);
  });
});
