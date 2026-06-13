// ============================================================
// GAI tier waitlist — validation + keyless-degradation tests
// (No Supabase configured in tests → the store degrades to safe no-ops.)
// ============================================================

import {
  isWaitlistTier,
  WAITLIST_TIERS,
  joinTierWaitlist,
  getJoinedTiers,
  getTierWaitlistCounts,
} from './waitlist';

describe('isWaitlistTier', () => {
  test('accepts the two paid tiers, rejects the free tier and junk', () => {
    expect(isWaitlistTier('AI_SWING_REPORT')).toBe(true);
    expect(isWaitlistTier('PREMIUM_RETEST_PLAN')).toBe(true);
    expect(isWaitlistTier('INSTANT_ESTIMATE')).toBe(false);
    expect(isWaitlistTier('nonsense')).toBe(false);
  });

  test('WAITLIST_TIERS excludes the free tier', () => {
    expect(WAITLIST_TIERS).not.toContain('INSTANT_ESTIMATE');
  });
});

describe('degraded (keyless) behavior', () => {
  test('joining without Supabase reports not-configured rather than throwing', async () => {
    const r = await joinTierWaitlist('user-1', 'AI_SWING_REPORT');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('not-configured');
  });

  test('joined tiers default to all-false', async () => {
    const joined = await getJoinedTiers('user-1');
    expect(joined.AI_SWING_REPORT).toBe(false);
    expect(joined.PREMIUM_RETEST_PLAN).toBe(false);
  });

  test('counts report unavailable with zeroes', async () => {
    const c = await getTierWaitlistCounts();
    expect(c.available).toBe(false);
    expect(c.total).toBe(0);
  });
});
