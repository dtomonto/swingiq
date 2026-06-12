// Per-user AI access + metering — in-memory (keyless) path.
// No Upstash env is set in the test runner, so every call exercises the
// per-instance fallback deterministically.

import {
  isUserAiBlocked,
  setUserAiBlocked,
  listBlockedAiUsers,
  meterUserAiUsage,
  getUserAiUsage,
  setUserCapOverrideCents,
  getUserAiCapStatus,
  userAiCapExceeded,
  isUserAiPaused,
  __test__,
} from '../user-ai';

const USER = 'user-abc';
const OTHER = 'user-xyz';

// Metering is gated on isAiUsageMeteringEnabled(); force it on regardless of
// provider keys so the per-user history is recorded in the test environment.
beforeAll(() => {
  process.env.AI_USAGE_METERING = '1';
});

beforeEach(() => {
  __test__.reset();
});

describe('per-user AI on/off switch', () => {
  it('is not blocked by default', async () => {
    await expect(isUserAiBlocked(USER)).resolves.toBe(false);
  });

  it('blocks and unblocks a single account', async () => {
    await setUserAiBlocked(USER, true);
    await expect(isUserAiBlocked(USER)).resolves.toBe(true);
    // Other accounts are unaffected.
    await expect(isUserAiBlocked(OTHER)).resolves.toBe(false);

    await setUserAiBlocked(USER, false);
    await expect(isUserAiBlocked(USER)).resolves.toBe(false);
  });

  it('never blocks anonymous / empty ids', async () => {
    await setUserAiBlocked('anonymous', true);
    await expect(isUserAiBlocked('anonymous')).resolves.toBe(false);
    await expect(isUserAiBlocked('')).resolves.toBe(false);
    await expect(isUserAiBlocked(null)).resolves.toBe(false);
  });

  it('lists blocked accounts', async () => {
    await setUserAiBlocked(USER, true);
    await setUserAiBlocked(OTHER, true);
    const { ids, source } = await listBlockedAiUsers();
    expect(ids.sort()).toEqual([USER, OTHER].sort());
    expect(source).toBe('memory');
  });
});

describe('per-user usage metering', () => {
  it('records calls + estimated cents per operation', async () => {
    await meterUserAiUsage(USER, 'video-vision'); // 5c
    await meterUserAiUsage(USER, 'video-vision'); // 5c
    await meterUserAiUsage(USER, 'ai-coach'); // 1c

    const report = await getUserAiUsage(USER, 14);
    expect(report.enabled).toBe(true);
    expect(report.totals.calls).toBe(3);
    expect(report.totals.cents).toBe(11);

    const vision = report.byOp.find((r) => r.op === 'video-vision');
    expect(vision).toMatchObject({ calls: 2, cents: 10 });
    // Busiest-by-cost first.
    expect(report.byOp[0]?.op).toBe('video-vision');
  });

  it('scopes usage to the calling account', async () => {
    await meterUserAiUsage(USER, 'ocr');
    const other = await getUserAiUsage(OTHER, 14);
    expect(other.totals.calls).toBe(0);
    expect(other.totals.cents).toBe(0);
  });

  it('does not meter anonymous traffic', async () => {
    await meterUserAiUsage('anonymous', 'video-vision');
    await meterUserAiUsage(null, 'video-vision');
    const report = await getUserAiUsage(USER, 14);
    expect(report.totals.calls).toBe(0);
  });

  it('surfaces todays totals', async () => {
    await meterUserAiUsage(USER, 'ai-coach');
    const report = await getUserAiUsage(USER, 14);
    expect(report.today.calls).toBe(1);
    expect(report.today.cents).toBe(1);
    expect(report.byDay[0]?.date).toBe(report.today.date);
  });
});

describe('per-user daily spend cap (auto-pause)', () => {
  it('is off by default — never caps', async () => {
    const status = await getUserAiCapStatus();
    expect(status).toMatchObject({ configured: false, limitCents: 0, limitSource: 'off' });
    await meterUserAiUsage(USER, 'video-vision');
    await expect(userAiCapExceeded(USER)).resolves.toBe(false);
  });

  it('auto-pauses an account once its spend reaches the cap', async () => {
    await setUserCapOverrideCents(100); // $1.00 / user / day
    const status = await getUserAiCapStatus();
    expect(status).toMatchObject({ configured: true, limitCents: 100, limitSource: 'override' });

    // 19 vision calls = 95c — still under $1.
    for (let i = 0; i < 19; i += 1) await meterUserAiUsage(USER, 'video-vision');
    await expect(userAiCapExceeded(USER)).resolves.toBe(false);
    await expect(isUserAiPaused(USER)).resolves.toBe(false);

    // One more = $1.00 → at/over the cap.
    await meterUserAiUsage(USER, 'video-vision');
    await expect(userAiCapExceeded(USER)).resolves.toBe(true);
    await expect(isUserAiPaused(USER)).resolves.toBe(true);

    // The cap is per-account — a different user is unaffected.
    await expect(userAiCapExceeded(OTHER)).resolves.toBe(false);
  });

  it('never caps anonymous traffic', async () => {
    await setUserCapOverrideCents(1); // 1c — trivially exceeded if it applied
    await meterUserAiUsage('anonymous', 'video-vision');
    await expect(userAiCapExceeded('anonymous')).resolves.toBe(false);
    await expect(userAiCapExceeded(null)).resolves.toBe(false);
  });

  it('isUserAiPaused honours the manual switch independently of the cap', async () => {
    await setUserAiBlocked(USER, true); // no cap set
    await expect(isUserAiPaused(USER)).resolves.toBe(true);
  });

  it('clearing the override reverts to no cap', async () => {
    await setUserCapOverrideCents(100);
    await setUserCapOverrideCents(null);
    const status = await getUserAiCapStatus();
    expect(status.configured).toBe(false);
    for (let i = 0; i < 30; i += 1) await meterUserAiUsage(USER, 'video-vision');
    await expect(userAiCapExceeded(USER)).resolves.toBe(false);
  });
});
