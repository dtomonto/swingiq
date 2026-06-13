// ============================================================
// GAI Operating Mode store — persistence (in-memory path) tests
// ============================================================

import {
  getOperatingMode,
  getOperatingModeState,
  setOperatingModeState,
  getTierAvailability,
  isTierActive,
  __test__,
} from './operating-mode';

beforeEach(() => __test__.reset());

describe('operating-mode store', () => {
  test('defaults to Default AI Mode with the premium AI override', async () => {
    const s = await getOperatingModeState();
    expect(s.mode).toBe('DEFAULT_AI_MODE');
    expect(s.costSavingAiTiers).toEqual(['PREMIUM_RETEST_PLAN']);
    expect(s.forceHeuristic).toBe(false);
    expect(s.killSwitch).toBe(false);
  });

  test('setOperatingModeState merges a patch and stamps actor + time', async () => {
    const s = await setOperatingModeState({ mode: 'COST_SAVING_MODE', actor: 'admin@x.com' });
    expect(s.mode).toBe('COST_SAVING_MODE');
    expect(s.lastChangedBy).toBe('admin@x.com');
    expect(s.lastChangedAt).toBeTruthy();
    expect(await getOperatingMode()).toBe('COST_SAVING_MODE');
  });

  test('partial patches preserve untouched fields', async () => {
    await setOperatingModeState({ mode: 'COST_SAVING_MODE', costSavingAiTiers: ['AI_SWING_REPORT'] });
    const s = await setOperatingModeState({ killSwitch: true });
    expect(s.mode).toBe('COST_SAVING_MODE');
    expect(s.costSavingAiTiers).toEqual(['AI_SWING_REPORT']);
    expect(s.killSwitch).toBe(true);
  });

  test('sanitize drops invalid tiers and coerces unknown modes to a default', () => {
    const s = __test__.sanitize({ mode: 'BOGUS', costSavingAiTiers: ['AI_SWING_REPORT', 'nope'], killSwitch: 'yes' });
    expect(s.mode).toBe('DEFAULT_AI_MODE');
    expect(s.costSavingAiTiers).toEqual(['AI_SWING_REPORT']);
    expect(s.killSwitch).toBe(false);
  });
});

describe('tier rollout', () => {
  test('paid tiers default to waitlist; Instant Estimate is always active', async () => {
    const avail = await getTierAvailability();
    expect(avail.INSTANT_ESTIMATE).toBe('active');
    expect(avail.AI_SWING_REPORT).toBe('waitlist');
    expect(avail.PREMIUM_RETEST_PLAN).toBe('waitlist');
    expect(await isTierActive('INSTANT_ESTIMATE')).toBe(true);
    expect(await isTierActive('PREMIUM_RETEST_PLAN')).toBe(false);
  });

  test('rolling a tier out flips it to active and is durable', async () => {
    await setOperatingModeState({ tierRollout: { PREMIUM_RETEST_PLAN: 'active' }, actor: 'owner@x.com' });
    expect(await isTierActive('PREMIUM_RETEST_PLAN')).toBe(true);
    // Other tiers are untouched.
    expect(await isTierActive('AI_SWING_REPORT')).toBe(false);
  });

  test('the free tier can never be put on a waitlist', () => {
    const s = __test__.sanitize({ tierRollout: { INSTANT_ESTIMATE: 'waitlist', AI_SWING_REPORT: 'active' } });
    expect(s.tierRollout.INSTANT_ESTIMATE).toBe('active');
    expect(s.tierRollout.AI_SWING_REPORT).toBe('active');
  });
});
