// ============================================================
// Tier-invitation placements — defaults, sanitize, and patch round-trip
// (No Upstash in tests → the in-memory fallback is exercised.)
// ============================================================

import {
  getPlacementState,
  setPlacementState,
  PLACEMENT_SLOTS,
  __test__,
} from './placements';

beforeEach(() => __test__.reset());

describe('defaults', () => {
  test('master on; conservative calm default placements', async () => {
    const s = await getPlacementState();
    expect(s.invitationsEnabled).toBe(true);
    expect(s.slots['post-diagnosis'].enabled).toBe(true);
    // Static/snapshotted surfaces default off — admin opts in.
    expect(s.slots.pricing.enabled).toBe(false);
    expect(s.slots.dashboard.enabled).toBe(false);
    expect(s.slots['todays-tasks'].enabled).toBe(false);
  });

  test('every registered slot has a setting', async () => {
    const s = await getPlacementState();
    for (const slot of PLACEMENT_SLOTS) {
      expect(s.slots[slot.id]).toBeDefined();
    }
  });
});

describe('sanitize', () => {
  test('rejects invalid tier + non-boolean enabled, clamps headline', () => {
    const s = __test__.sanitize({
      invitationsEnabled: 'yes',
      slots: { dashboard: { enabled: 'maybe', tier: 'BOGUS', headline: '  hi  ' } },
    });
    expect(s.invitationsEnabled).toBe(true); // fell back to default
    expect(s.slots.dashboard.enabled).toBe(false); // non-boolean → default
    expect(s.slots.dashboard.tier).toBe('AI_SWING_REPORT'); // invalid → default
    expect(s.slots.dashboard.headline).toBe('hi'); // trimmed
  });

  test('blank headline normalizes to null', () => {
    const s = __test__.sanitize({ slots: { pricing: { headline: '   ' } } });
    expect(s.slots.pricing.headline).toBeNull();
  });
});

describe('patch round-trip', () => {
  test('master toggle + per-slot change persist and merge', async () => {
    await setPlacementState({ slots: { dashboard: { enabled: true, tier: 'PREMIUM_RETEST_PLAN' } }, actor: 'owner@x.com' });
    let s = await getPlacementState();
    expect(s.slots.dashboard.enabled).toBe(true);
    expect(s.slots.dashboard.tier).toBe('PREMIUM_RETEST_PLAN');
    expect(s.lastChangedBy).toBe('owner@x.com');
    // Untouched slots preserved (post-diagnosis stays on by default).
    expect(s.slots['post-diagnosis'].enabled).toBe(true);

    await setPlacementState({ invitationsEnabled: false });
    s = await getPlacementState();
    expect(s.invitationsEnabled).toBe(false);
    expect(s.slots.dashboard.enabled).toBe(true); // still there
  });
});
