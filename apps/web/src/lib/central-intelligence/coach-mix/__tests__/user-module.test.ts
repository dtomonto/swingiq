// ============================================================
// Coach Mix — user-module feature flag
// The user-facing module must stay OFF unless explicitly enabled.
// ============================================================

import { isCoachMixUserModuleEnabled } from '..';

describe('Coach Mix — user module flag', () => {
  const original = process.env.NEXT_PUBLIC_COACH_MIX_USER_MODULE;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_COACH_MIX_USER_MODULE;
    else process.env.NEXT_PUBLIC_COACH_MIX_USER_MODULE = original;
  });

  it('is OFF by default (no env)', () => {
    delete process.env.NEXT_PUBLIC_COACH_MIX_USER_MODULE;
    expect(isCoachMixUserModuleEnabled()).toBe(false);
  });

  it('treats placeholder/false values as off', () => {
    for (const v of ['', '0', 'false', 'off', 'no']) {
      process.env.NEXT_PUBLIC_COACH_MIX_USER_MODULE = v;
      expect(isCoachMixUserModuleEnabled()).toBe(false);
    }
  });

  it('turns on for explicit truthy values', () => {
    for (const v of ['1', 'true', 'on', 'ON', 'True']) {
      process.env.NEXT_PUBLIC_COACH_MIX_USER_MODULE = v;
      expect(isCoachMixUserModuleEnabled()).toBe(true);
    }
  });
});
