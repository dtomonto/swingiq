// ============================================================
// GAI video gate — operating-mode governance of the live video routes
// ============================================================

import { gateVideoAnalysis } from './video-gate';
import { __test__ as modeTest } from './operating-mode';

// No Supabase/Upstash in tests → operating-mode reads the in-memory default,
// budget guard is off, and entitlement resolves to the Free tier.
beforeEach(() => modeTest.reset());

describe('gateVideoAnalysis', () => {
  test('Default AI Mode permits premium video AI when a provider is configured', async () => {
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    expect(r.allowAI).toBe(true);
    expect(r.decision.route).toBe('FULL_AI');
  });

  test('Default AI Mode blocks when no provider is configured (route falls back)', async () => {
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: false });
    expect(r.allowAI).toBe(false);
    expect(r.decision.route).toBe('FALLBACK_HEURISTIC');
    expect(r.message).toBeTruthy();
  });

  test('kill switch blocks the paid video call with an honest message', async () => {
    modeTest.setMemory({ killSwitch: true });
    const r = await gateVideoAnalysis({ sport: 'golf', providerConfigured: true });
    expect(r.allowAI).toBe(false);
    expect(r.decision.route).toBe('ADMIN_FORCED_HEURISTIC');
    expect(r.message).toContain('Instant Estimate');
  });

  test('force-heuristic blocks the paid video call', async () => {
    modeTest.setMemory({ forceHeuristic: true });
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    expect(r.allowAI).toBe(false);
  });

  test('Cost-Saving Mode blocks free-plan video AI', async () => {
    modeTest.setMemory({ mode: 'COST_SAVING_MODE', costSavingAiTiers: ['PREMIUM_RETEST_PLAN'] });
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    // Free plan (no billing configured in tests) is never billed to paid AI.
    expect(r.allowAI).toBe(false);
    expect(r.message).toContain('Instant Estimate');
  });
});
