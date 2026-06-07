// ============================================================
// SwingVantage — Dispatch delivery (sendEmail + adapters) — Unit Tests
// ============================================================

import {
  planEmailSend,
  buildDispatchEmailHtml,
  buildDispatchEmailText,
  sendDispatchEmail,
} from '../send-email';
import { createEmailAdapter, buildDispatchAdapters, webPushAdapter } from '../adapters';
import { lintCopy, hasBlockingIssues } from '../../trust-linter';
import type { DispatchMessage } from '../types';

const input = {
  to: 'player@example.com',
  subject: 'Danny, keep your golf rhythm going',
  title: 'Keep the rhythm',
  body: 'It has been 16 days; one quick session keeps your plan current.',
  preheader: 'One quick check keeps the habit alive.',
  cta: { label: 'Log a quick refresh session', href: 'https://swingvantage.com/sessions/import' },
};

describe('planEmailSend', () => {
  it('dry-runs when no provider key is configured', () => {
    const plan = planEmailSend(input, {});
    expect(plan.mode).toBe('dry_run');
    expect(plan.provider).toBe('none');
  });

  it('plans a real send when RESEND_API_KEY is present', () => {
    const plan = planEmailSend(input, { RESEND_API_KEY: 'k' });
    expect(plan.mode).toBe('send');
    expect(plan.provider).toBe('resend');
    expect(plan.from).toContain('swingvantage.com');
    expect(plan.to).toBe('player@example.com');
  });

  it('honors a custom from address', () => {
    const plan = planEmailSend(input, { RESEND_API_KEY: 'k', DISPATCH_FROM_EMAIL: 'Coach <c@x.com>' });
    expect(plan.from).toBe('Coach <c@x.com>');
  });
});

describe('email content', () => {
  it('includes the title, body, and CTA link, and escapes HTML', () => {
    const html = buildDispatchEmailHtml({ ...input, title: 'A <b>bold</b> idea' });
    expect(html).toContain(input.body);
    expect(html).toContain(input.cta.href);
    expect(html).toContain('A &lt;b&gt;bold&lt;/b&gt; idea'); // escaped, not injected
  });

  it('produces guarantee-free copy that passes the Trust Linter', () => {
    const text = buildDispatchEmailText(input);
    expect(hasBlockingIssues(lintCopy(text))).toBe(false);
  });
});

describe('sendDispatchEmail', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('is an honest no-op (dry run) without a key — no network call', async () => {
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;
    const res = await sendDispatchEmail(input, {});
    expect(res).toEqual({ sent: false, dryRun: true, provider: 'none' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls the Resend API when configured', async () => {
    const spy = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = spy as unknown as typeof fetch;
    const res = await sendDispatchEmail(input, { RESEND_API_KEY: 'k' });
    expect(res.sent).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer k');
    const payload = JSON.parse(init.body);
    expect(payload.to).toEqual(['player@example.com']);
    expect(payload.subject).toBe(input.subject);
  });
});

describe('adapters', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  const msg: DispatchMessage = {
    channel: 'email',
    subject: input.subject,
    preheader: input.preheader,
    title: input.title,
    body: input.body,
    cta: input.cta,
    groundedOn: ['16 days since last activity'],
  };

  it('email adapter POSTs the message to the send route', async () => {
    const spy = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = spy as unknown as typeof fetch;
    const adapter = createEmailAdapter('player@example.com', '/api/agents/dispatch/send');
    await adapter.sendEmail(msg, 'player@example.com');
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/agents/dispatch/send');
    const payload = JSON.parse(init.body);
    expect(payload.to).toBe('player@example.com');
    expect(payload.subject).toBe(input.subject);
    expect(payload.cta.href).toBe(input.cta.href);
  });

  it('buildDispatchAdapters only enables channels it can back', () => {
    expect(Object.keys(buildDispatchAdapters({}))).toHaveLength(0);
    expect(buildDispatchAdapters({ recipientEmail: 'a@b.com' }).sendEmail).toBeDefined();
    expect(buildDispatchAdapters({ push: true }).sendPush).toBeDefined();
    expect(buildDispatchAdapters({ onInApp: () => {} }).showInApp).toBeDefined();
    expect(typeof webPushAdapter.sendPush).toBe('function');
  });
});
