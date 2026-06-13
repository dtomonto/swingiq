// ============================================================
// Tier rollout — pure gating helpers + the keyless interest store
// ============================================================

import {
  isTierRolledOut,
  isTierId,
  WAITLIST_TIER_IDS,
  DEFAULT_TIER_ROLLOUT_MODE,
} from './tiers';
import {
  __resetTierRolloutStoreForTests,
  getTierRolloutMode,
  setTierRolloutMode,
  recordTierInterest,
  getTierInterestForUser,
  getUserInterestedTiers,
  getTierInterestCounts,
  listTierInterest,
} from './tier-rollout-server';
import {
  __resetFoundingStoreForTests,
  getFoundingConfig,
  setFoundingConfig,
  getFoundingCampaignProgress,
} from '../central-intelligence/founding-server';

describe('tier gating helpers', () => {
  test('free is always rolled out, paid tiers only on full', () => {
    expect(isTierRolledOut('free', 'free')).toBe(true);
    expect(isTierRolledOut('free', 'full')).toBe(true);
    expect(isTierRolledOut('pro', 'free')).toBe(false);
    expect(isTierRolledOut('team', 'free')).toBe(false);
    expect(isTierRolledOut('pro', 'full')).toBe(true);
    expect(isTierRolledOut('team', 'full')).toBe(true);
  });

  test('default rollout mode gates the paid tiers', () => {
    expect(DEFAULT_TIER_ROLLOUT_MODE).toBe('free');
    expect(WAITLIST_TIER_IDS).toEqual(['pro', 'team']);
  });

  test('isTierId guards user input', () => {
    expect(isTierId('pro')).toBe(true);
    expect(isTierId('free')).toBe(true);
    expect(isTierId('enterprise')).toBe(false);
    expect(isTierId(null)).toBe(false);
    expect(isTierId(42)).toBe(false);
  });
});

describe('tier rollout store (keyless / in-memory)', () => {
  beforeEach(() => {
    __resetTierRolloutStoreForTests();
    __resetFoundingStoreForTests();
  });

  test('defaults to the free (waitlist) mode', async () => {
    expect(await getTierRolloutMode()).toBe('free');
  });

  test('the mode tracks the membership-tier gate and can be flipped both ways', async () => {
    expect(await setTierRolloutMode('full')).toEqual({ mode: 'full' });
    expect(await getTierRolloutMode()).toBe('full');
    // Flipping rollout writes the founding gate's manual override.
    expect((await getFoundingConfig()).manualOverride).toBe(true);

    expect(await setTierRolloutMode('free')).toEqual({ mode: 'free' });
    expect(await getTierRolloutMode()).toBe('free');
    expect((await getFoundingConfig()).manualOverride).toBe(false);
  });

  test('an invalid mode is coerced to free (force-locks the gate)', async () => {
    // @ts-expect-error — exercising the runtime guard
    await setTierRolloutMode('bogus');
    expect(await getTierRolloutMode()).toBe('free');
    expect((await getFoundingConfig()).manualOverride).toBe(false);
  });

  test('the automatic-at-cap unlock does NOT roll out paid tiers (approval required)', async () => {
    // Force the membership gate to auto-unlock (cap reached, no manual override).
    await setFoundingConfig({ requiredCount: 1, baseline: 5, manualOverride: null });
    const progress = await getFoundingCampaignProgress();
    expect(progress.membershipTiersEnabled).toBe(true); // member messaging unlocks…
    expect(await getTierRolloutMode()).toBe('free'); // …but paid tiers stay gated until approval
  });

  test('recording interest is idempotent per (user, tier)', async () => {
    const first = await recordTierInterest({ userId: 'u1', tierId: 'pro' });
    expect(first).toEqual({ ok: true, alreadyInterested: false });

    const second = await recordTierInterest({ userId: 'u1', tierId: 'pro' });
    expect(second).toEqual({ ok: true, alreadyInterested: true });

    expect(await getTierInterestForUser('u1', 'pro')).not.toBeNull();
    expect(await getTierInterestForUser('u1', 'team')).toBeNull();
  });

  test('interest is rejected for the free tier and missing users', async () => {
    expect((await recordTierInterest({ userId: 'u1', tierId: 'free' })).ok).toBe(false);
    expect((await recordTierInterest({ userId: '', tierId: 'pro' })).reason).toBe('auth_required');
  });

  test('counts and per-user lookups reflect recorded interest', async () => {
    await recordTierInterest({ userId: 'u1', tierId: 'pro' });
    await recordTierInterest({ userId: 'u2', tierId: 'pro' });
    await recordTierInterest({ userId: 'u2', tierId: 'team' });
    await recordTierInterest({ userId: 'u2', tierId: 'team' }); // dup → no double count

    const counts = await getTierInterestCounts();
    expect(counts.pro).toBe(2);
    expect(counts.team).toBe(1);

    expect((await getUserInterestedTiers('u2')).sort()).toEqual(['pro', 'team']);
    expect(await getUserInterestedTiers('nobody')).toEqual([]);

    expect(await listTierInterest()).toHaveLength(3);
  });
});
