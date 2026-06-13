// ============================================================
// GAI Operating Mode store — persistence (in-memory path) tests
// ============================================================

import {
  getOperatingMode,
  getOperatingModeState,
  setOperatingModeState,
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
