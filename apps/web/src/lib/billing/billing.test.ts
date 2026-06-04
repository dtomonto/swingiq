import crypto from 'node:crypto';
import { effectiveTier, priceIdToTier, ACTIVE_STATUSES } from './plan';
import { verifyStripeSignature } from './webhook-signature';

describe('effectiveTier', () => {
  test('active/trialing paid plans grant the tier', () => {
    expect(effectiveTier('active', 'pro')).toBe('pro');
    expect(effectiveTier('trialing', 'team')).toBe('team');
  });

  test('non-active statuses fall back to free', () => {
    expect(effectiveTier('canceled', 'pro')).toBe('free');
    expect(effectiveTier('past_due', 'pro')).toBe('free');
    expect(effectiveTier('incomplete', 'team')).toBe('free');
    expect(effectiveTier(null, 'pro')).toBe('free');
  });

  test('a free plan is always free regardless of status', () => {
    expect(effectiveTier('active', 'free')).toBe('free');
    expect(effectiveTier('active', null)).toBe('free');
  });

  test('ACTIVE_STATUSES is the documented set', () => {
    expect([...ACTIVE_STATUSES]).toEqual(['active', 'trialing']);
  });
});

describe('priceIdToTier', () => {
  const env = { STRIPE_PRICE_PRO: 'price_pro_123', STRIPE_PRICE_TEAM: 'price_team_456' };

  test('maps configured price ids to tiers', () => {
    expect(priceIdToTier('price_pro_123', env)).toBe('pro');
    expect(priceIdToTier('price_team_456', env)).toBe('team');
  });

  test('unknown or missing prices return null', () => {
    expect(priceIdToTier('price_other', env)).toBeNull();
    expect(priceIdToTier(undefined, env)).toBeNull();
    expect(priceIdToTier('price_pro_123', {})).toBeNull();
  });
});

describe('verifyStripeSignature', () => {
  const secret = 'whsec_test_secret';
  const payload = '{"id":"evt_1","type":"checkout.session.completed"}';
  const t = 1_700_000_000;

  function sign(ts: number, body: string, key = secret): string {
    const sig = crypto.createHmac('sha256', key).update(`${ts}.${body}`, 'utf8').digest('hex');
    return `t=${ts},v1=${sig}`;
  }

  test('accepts a correctly signed, fresh payload', () => {
    const header = sign(t, payload);
    expect(verifyStripeSignature(payload, header, secret, { nowSec: t }).ok).toBe(true);
  });

  test('rejects a tampered payload', () => {
    const header = sign(t, payload);
    const result = verifyStripeSignature(payload + ' ', header, secret, { nowSec: t });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('mismatch');
  });

  test('rejects a wrong secret', () => {
    const header = sign(t, payload, 'whsec_wrong');
    expect(verifyStripeSignature(payload, header, secret, { nowSec: t }).reason).toBe('mismatch');
  });

  test('rejects a stale timestamp (replay protection)', () => {
    const header = sign(t, payload);
    expect(verifyStripeSignature(payload, header, secret, { nowSec: t + 10_000 }).reason).toBe(
      'timestamp',
    );
  });

  test('rejects malformed and missing headers', () => {
    expect(verifyStripeSignature(payload, 'not-a-signature', secret, { nowSec: t }).reason).toBe(
      'malformed',
    );
    expect(verifyStripeSignature(payload, null, secret).reason).toBe('missing');
  });
});
