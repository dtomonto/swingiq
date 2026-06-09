import { getWebPushConfig, isPushConfigured, sendPushToUser } from '../web-push';
import { deliverNudge } from '../deliver';

describe('web-push config gating', () => {
  it('is not configured without VAPID keys', () => {
    expect(getWebPushConfig({})).toBeNull();
    expect(isPushConfigured({})).toBe(false);
  });

  it('is configured when public + private keys are present', () => {
    const env = { VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv' };
    expect(isPushConfigured(env)).toBe(true);
    const cfg = getWebPushConfig(env);
    expect(cfg?.publicKey).toBe('pub');
    expect(cfg?.subject).toMatch(/^mailto:/); // sensible default
  });

  it('accepts the NEXT_PUBLIC public key as a fallback', () => {
    expect(isPushConfigured({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv' })).toBe(true);
  });

  it('sendPushToUser honestly no-ops when unconfigured (never throws)', async () => {
    const r = await sendPushToUser('user-1', { title: 't', body: 'b' });
    expect(r.configured).toBe(false);
    expect(r.sent).toBe(0);
  });
});

describe('deliverNudge — honest per-channel result', () => {
  it('reports push + email channels without throwing (both off in test env)', async () => {
    const r = await deliverNudge({
      userId: 'u1',
      email: 'a@b.com',
      subject: 's',
      title: 't',
      body: 'b',
      cta: { label: 'Open', href: '/dashboard' },
    });
    expect(r.push.configured).toBe(false); // no VAPID in test env
    expect(typeof r.email.sent).toBe('boolean');
  });

  it('skips email when no recipient is given', async () => {
    const r = await deliverNudge({ userId: 'u1', subject: 's', title: 't', body: 'b' });
    expect(r.email.sent).toBe(false);
  });
});
