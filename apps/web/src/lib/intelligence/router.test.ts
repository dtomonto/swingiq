// ============================================================
// GAI Intelligence Router — routing contract tests
// ============================================================

import { decideRoute, routeAnalysis } from './router';
import type { RouteContext } from './router';
import type { AnalysisRequest, AnalysisResult, RouteDecisionInput } from './types';

function inp(over: Partial<RouteDecisionInput> = {}): RouteDecisionInput {
  return {
    operatingMode: 'DEFAULT_AI_MODE',
    tier: 'AI_SWING_REPORT',
    userPlan: 'pro',
    videoAvailable: true,
    cacheHit: false,
    cacheAllowed: true,
    providerConfigured: true,
    providerHealthy: true,
    budgetAllows: true,
    estimatedCostCents: 5,
    maxCostCents: 8,
    adminForceHeuristic: false,
    adminKillSwitch: false,
    adminAllowsAIOverrideForTier: false,
    ...over,
  };
}

describe('decideRoute', () => {
  test('Cost-Saving Mode never calls AI for Instant Estimate', () => {
    const d = decideRoute(inp({ operatingMode: 'COST_SAVING_MODE', tier: 'INSTANT_ESTIMATE' }));
    expect(d.route).toBe('HEURISTIC_ONLY');
    expect(d.usesAI).toBe(false);
  });

  test('Cost-Saving Mode never calls AI for free-plan users', () => {
    const d = decideRoute(
      inp({ operatingMode: 'COST_SAVING_MODE', tier: 'AI_SWING_REPORT', userPlan: 'free', adminAllowsAIOverrideForTier: true }),
    );
    expect(d.route).toBe('HEURISTIC_ONLY');
    expect(d.usesAI).toBe(false);
  });

  test('Cost-Saving Mode allows AI for an admin-allowed paid tier', () => {
    const d = decideRoute(
      inp({ operatingMode: 'COST_SAVING_MODE', tier: 'PREMIUM_RETEST_PLAN', userPlan: 'pro', adminAllowsAIOverrideForTier: true }),
    );
    expect(d.route).toBe('FULL_AI');
    expect(d.usesAI).toBe(true);
  });

  test('Cost-Saving Mode without override keeps the paid tier on heuristics', () => {
    const d = decideRoute(
      inp({ operatingMode: 'COST_SAVING_MODE', tier: 'PREMIUM_RETEST_PLAN', userPlan: 'pro', adminAllowsAIOverrideForTier: false }),
    );
    expect(d.route).toBe('HEURISTIC_ONLY');
  });

  test('Default AI Mode routes premium video analysis to full AI when available', () => {
    const d = decideRoute(inp({ tier: 'PREMIUM_RETEST_PLAN', videoAvailable: true, maxCostCents: 20 }));
    expect(d.route).toBe('FULL_AI');
    expect(d.usesAI).toBe(true);
  });

  test('Default AI Mode routes AI Swing Report to hybrid', () => {
    const d = decideRoute(inp({ tier: 'AI_SWING_REPORT' }));
    expect(d.route).toBe('HYBRID');
  });

  test('Default AI Mode keeps Instant Estimate heuristic by design', () => {
    const d = decideRoute(inp({ tier: 'INSTANT_ESTIMATE' }));
    expect(d.route).toBe('HEURISTIC_ONLY');
  });

  test('cache hit short-circuits to CACHED', () => {
    const d = decideRoute(inp({ cacheHit: true, cacheAllowed: true }));
    expect(d.route).toBe('CACHED');
    expect(d.usesAI).toBe(false);
  });

  test('missing provider key falls back to heuristic', () => {
    const d = decideRoute(inp({ tier: 'AI_SWING_REPORT', providerConfigured: false }));
    expect(d.route).toBe('FALLBACK_HEURISTIC');
    expect(d.usesAI).toBe(false);
  });

  test('unhealthy provider falls back to heuristic', () => {
    const d = decideRoute(inp({ tier: 'PREMIUM_RETEST_PLAN', providerHealthy: false, maxCostCents: 20 }));
    expect(d.route).toBe('FALLBACK_HEURISTIC');
  });

  test('max cost cap blocks the AI call', () => {
    const d = decideRoute(inp({ tier: 'PREMIUM_RETEST_PLAN', estimatedCostCents: 50, maxCostCents: 20 }));
    expect(d.route).toBe('FALLBACK_HEURISTIC');
    expect(d.usesAI).toBe(false);
  });

  test('exhausted budget falls back to heuristic', () => {
    const d = decideRoute(inp({ budgetAllows: false }));
    expect(d.route).toBe('FALLBACK_HEURISTIC');
  });

  test('kill switch forces heuristic over everything', () => {
    const d = decideRoute(inp({ adminKillSwitch: true, tier: 'PREMIUM_RETEST_PLAN' }));
    expect(d.route).toBe('ADMIN_FORCED_HEURISTIC');
    expect(d.usesAI).toBe(false);
  });

  test('force-heuristic forces heuristic over everything', () => {
    const d = decideRoute(inp({ adminForceHeuristic: true, tier: 'PREMIUM_RETEST_PLAN' }));
    expect(d.route).toBe('ADMIN_FORCED_HEURISTIC');
  });
});

// ── routeAnalysis orchestration ─────────────────────────────

function ctx(over: Partial<RouteContext> = {}): RouteContext {
  return {
    operatingMode: 'DEFAULT_AI_MODE',
    userPlan: 'pro',
    providerConfigured: true,
    providerHealthy: true,
    budgetAllows: true,
    adminForceHeuristic: false,
    adminKillSwitch: false,
    adminAllowsAIOverrideForTier: false,
    cacheHit: false,
    cacheAllowed: true,
    ...over,
  };
}

function fakeResult(over: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    tier: 'AI_SWING_REPORT',
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

const req: AnalysisRequest = { tier: 'AI_SWING_REPORT', sport: 'golf', issue: 'slice', videoAvailable: true };

describe('routeAnalysis', () => {
  test('executes the heuristic floor and logs the decision', async () => {
    const logs: unknown[] = [];
    const out = await routeAnalysis({ ...req, tier: 'INSTANT_ESTIMATE' }, ctx(), {
      runHeuristic: () => fakeResult({ tier: 'INSTANT_ESTIMATE' }),
      log: (e) => void logs.push(e),
    });
    expect(out.route).toBe('HEURISTIC_ONLY');
    expect(out.sourceMode).toBe('heuristic');
    expect(logs).toHaveLength(1);
  });

  test('a failing AI executor degrades to a safe heuristic fallback', async () => {
    let heuristicCalls = 0;
    const out = await routeAnalysis(req, ctx(), {
      runHeuristic: () => {
        heuristicCalls += 1;
        return fakeResult();
      },
      runHybrid: async () => {
        throw new Error('provider exploded');
      },
    });
    expect(out.route).toBe('FALLBACK_HEURISTIC');
    expect(out.sourceMode).toBe('heuristic');
    expect(heuristicCalls).toBe(1);
  });

  test('Cost-Saving Mode + free + Instant Estimate never invokes the AI executor', async () => {
    let aiCalls = 0;
    const out = await routeAnalysis({ ...req, tier: 'INSTANT_ESTIMATE' }, ctx({ operatingMode: 'COST_SAVING_MODE', userPlan: 'free' }), {
      runHeuristic: () => fakeResult({ tier: 'INSTANT_ESTIMATE' }),
      runFullAI: async () => {
        aiCalls += 1;
        return fakeResult({ sourceMode: 'ai' });
      },
      runHybrid: async () => {
        aiCalls += 1;
        return fakeResult({ sourceMode: 'hybrid' });
      },
    });
    expect(aiCalls).toBe(0);
    expect(out.sourceMode).toBe('heuristic');
  });

  test('a cache hit serves the cached result without compute', async () => {
    let aiCalls = 0;
    const out = await routeAnalysis(req, ctx({ cacheHit: true }), {
      runHeuristic: () => fakeResult(),
      runHybrid: async () => {
        aiCalls += 1;
        return fakeResult({ sourceMode: 'hybrid' });
      },
      getCached: () => fakeResult({ sourceMode: 'cached', diagnosis: 'cached-d' }),
    });
    expect(out.route).toBe('CACHED');
    expect(out.sourceMode).toBe('cached');
    expect(out.diagnosis).toBe('cached-d');
    expect(aiCalls).toBe(0);
  });

  test('a successful full-AI route is recorded as AI usage', async () => {
    const logs: Array<{ usesAI: boolean; costAvoidedCents: number }> = [];
    const out = await routeAnalysis({ ...req, tier: 'PREMIUM_RETEST_PLAN' }, ctx(), {
      runHeuristic: () => fakeResult(),
      runFullAI: async () => fakeResult({ sourceMode: 'ai', tier: 'PREMIUM_RETEST_PLAN' }),
      log: (e) => void logs.push(e as { usesAI: boolean; costAvoidedCents: number }),
    });
    expect(out.route).toBe('FULL_AI');
    expect(out.sourceMode).toBe('ai');
    expect(logs[0].usesAI).toBe(true);
    expect(logs[0].costAvoidedCents).toBe(0);
  });
});
