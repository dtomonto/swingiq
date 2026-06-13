// ============================================================
// GAI video gate — operating-mode + rollout governance of the live video routes
// ============================================================

import { gateVideoAnalysis } from './video-gate';
import { __test__ as modeTest } from './operating-mode';

// No Supabase/Upstash in tests → operating-mode reads the in-memory default,
// budget guard is off, and entitlement resolves to the Free tier. Paid tiers
// default to 'waitlist', so AI-permitted cases set the tier 'active' first.
const ACTIVE = {
  INSTANT_ESTIMATE: 'active',
  AI_SWING_REPORT: 'active',
  PREMIUM_RETEST_PLAN: 'active',
} as const;

beforeEach(() => modeTest.reset());

describe('gateVideoAnalysis — rollout', () => {
  test('a tier still on the waitlist blocks the paid call with a waitlist message', async () => {
    // Default state has PREMIUM_RETEST_PLAN on waitlist.
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    expect(r.allowAI).toBe(false);
    expect(r.decision.reason).toContain('waitlist');
    expect(r.message).toContain('waitlist');
  });

  test('a fully rolled-out tier is permitted (Default AI Mode)', async () => {
    modeTest.setMemory({ tierRollout: { ...ACTIVE } });
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    expect(r.allowAI).toBe(true);
    expect(r.decision.route).toBe('FULL_AI');
  });
});

describe('gateVideoAnalysis — operating mode (rolled out)', () => {
  test('no provider configured → blocked, route falls back', async () => {
    modeTest.setMemory({ tierRollout: { ...ACTIVE } });
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: false });
    expect(r.allowAI).toBe(false);
    expect(r.decision.route).toBe('FALLBACK_HEURISTIC');
    expect(r.message).toBeTruthy();
  });

  test('kill switch blocks the paid call with an honest message', async () => {
    modeTest.setMemory({ tierRollout: { ...ACTIVE }, killSwitch: true });
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    expect(r.allowAI).toBe(false);
    expect(r.decision.route).toBe('ADMIN_FORCED_HEURISTIC');
    expect(r.message).toContain('Instant Estimate');
  });

  test('force-heuristic blocks the paid call', async () => {
    modeTest.setMemory({ tierRollout: { ...ACTIVE }, forceHeuristic: true });
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    expect(r.allowAI).toBe(false);
  });

  test('Cost-Saving Mode blocks free-plan video AI', async () => {
    modeTest.setMemory({
      tierRollout: { ...ACTIVE },
      mode: 'COST_SAVING_MODE',
      costSavingAiTiers: ['PREMIUM_RETEST_PLAN'],
    });
    const r = await gateVideoAnalysis({ sport: 'golf', tier: 'PREMIUM_RETEST_PLAN', providerConfigured: true });
    // Free plan (no billing in tests) is never billed to paid AI.
    expect(r.allowAI).toBe(false);
    expect(r.message).toContain('Instant Estimate');
  });
});
