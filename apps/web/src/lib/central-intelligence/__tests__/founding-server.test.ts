// ============================================================
// Founding server — member-number integrity (keyless in-process mode)
// ============================================================

import {
  claimFoundingMembership,
  getFoundingCampaignProgress,
  setFoundingConfig,
  getFoundingMemberForUser,
  getQualifiedCount,
  __resetFoundingStoreForTests,
} from '../founding-server';

const eligible = { profileCompleted: true, validSessionCount: 12 };

beforeEach(async () => {
  __resetFoundingStoreForTests();
  // Most tests below exercise the RAW member-number mechanics, so neutralize
  // the public launch baseline (its own behavior is covered separately).
  await setFoundingConfig({ baseline: 0 });
});

describe('founding member numbers', () => {
  it('assigns numbers in qualification (claim) order', async () => {
    const a = await claimFoundingMembership({ userId: 'A', ...eligible });
    const b = await claimFoundingMembership({ userId: 'B', ...eligible });
    expect(a.record?.memberNumber).toBe(1);
    expect(b.record?.memberNumber).toBe(2);
  });

  it('is idempotent — a user only ever gets one number', async () => {
    const first = await claimFoundingMembership({ userId: 'A', ...eligible });
    const again = await claimFoundingMembership({ userId: 'A', ...eligible });
    expect(first.record?.memberNumber).toBe(1);
    expect(again.record?.memberNumber).toBe(1);
    expect(await getQualifiedCount()).toBe(1);
  });

  it('rejects an ineligible claim and assigns no number', async () => {
    const incompleteProfile = await claimFoundingMembership({ userId: 'C', profileCompleted: false, validSessionCount: 12 });
    expect(incompleteProfile.ok).toBe(false);
    expect(incompleteProfile.record).toBeNull();

    const tooFewSessions = await claimFoundingMembership({ userId: 'D', profileCompleted: true, validSessionCount: 9 });
    expect(tooFewSessions.ok).toBe(false);
    expect(await getFoundingMemberForUser('D')).toBeNull();
  });

  it('cannot be manipulated from the client (count comes from the server)', async () => {
    // Even if a client "claims" to be a high number, the server assigns next-in-order.
    const a = await claimFoundingMembership({ userId: 'A', ...eligible });
    expect(a.record?.memberNumber).toBe(1); // not client-chosen
  });

  it('waitlists once the cap is reached', async () => {
    await setFoundingConfig({ requiredCount: 2 });
    const a = await claimFoundingMembership({ userId: 'A', ...eligible });
    const b = await claimFoundingMembership({ userId: 'B', ...eligible });
    const c = await claimFoundingMembership({ userId: 'C', ...eligible });
    expect(a.record?.memberNumber).toBe(1);
    expect(b.record?.memberNumber).toBe(2);
    expect(c.record?.status).toBe('waitlisted_after_cap');
    expect(c.record?.memberNumber).toBeNull();
  });

  it('honors the public launch baseline: counter starts at it, numbers continue from it', async () => {
    await setFoundingConfig({ baseline: 55, requiredCount: 100 });
    // Counter shows the baseline before anyone qualifies.
    let progress = await getFoundingCampaignProgress();
    expect(progress.qualifiedCount).toBe(55);
    expect(progress.remaining).toBe(45);
    expect(progress.full).toBe(false);
    // First real member gets #56; the counter ticks to 56.
    const a = await claimFoundingMembership({ userId: 'A', ...eligible });
    expect(a.record?.memberNumber).toBe(56);
    progress = await getFoundingCampaignProgress();
    expect(progress.qualifiedCount).toBe(56);
  });
});

describe('membership tier gate (server)', () => {
  it('locks below the required count and unlocks at it', async () => {
    await setFoundingConfig({ requiredCount: 2, manualOverride: null });
    let progress = await getFoundingCampaignProgress();
    expect(progress.membershipTiersEnabled).toBe(false);

    await claimFoundingMembership({ userId: 'A', ...eligible });
    await claimFoundingMembership({ userId: 'B', ...eligible });
    progress = await getFoundingCampaignProgress();
    expect(progress.full).toBe(true);
    expect(progress.membershipTiersEnabled).toBe(true);
  });

  it('honors an admin manual override', async () => {
    await setFoundingConfig({ requiredCount: 1000, manualOverride: true });
    const progress = await getFoundingCampaignProgress();
    expect(progress.membershipTiersEnabled).toBe(true); // unlocked despite 0 members
  });
});
