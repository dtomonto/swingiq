// ============================================================
// SwingVantage — Dispatch: transactional email sender (SERVER-ONLY)
// ------------------------------------------------------------
// Fills the genuine gap both retention systems share: actually
// SENDING a re-engagement email. Mirrors lib/email/capture's
// honesty rule — when no provider key is set it DRY-RUNS (returns
// what it would send, never pretends). With RESEND_API_KEY it
// sends a branded, guarantee-free email via the Resend API.
//
// Reusable by our Dispatch agent AND reengage's email payloads
// (same {subject, heading/title, body, cta} shape).
// ============================================================

export interface DispatchEmailInput {
  to: string;
  subject: string;
  title: string;
  body: string;
  preheader?: string;
  cta?: { label: string; href: string };
}

export interface PlannedEmail {
  mode: 'send' | 'dry_run';
  provider: 'resend' | 'none';
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  sent: boolean;
  dryRun: boolean;
  provider: string;
}

type Env = Record<string, string | undefined>;

const DEFAULT_FROM = 'SwingVantage <noreply@swingvantage.com>';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build the plain-text part (honest, no markup). */
export function buildDispatchEmailText(i: DispatchEmailInput): string {
  const lines = [i.title, '', i.body];
  if (i.cta) lines.push('', `${i.cta.label}: ${i.cta.href}`);
  lines.push(
    '',
    '—',
    'You’re receiving this because re-engagement emails are on for your SwingVantage account. You can turn them off in Settings.',
  );
  return lines.join('\n');
}

/** Build a simple, branded, inline-styled HTML email. */
export function buildDispatchEmailHtml(i: DispatchEmailInput): string {
  const preheader = i.preheader
    ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(i.preheader)}</span>`
    : '';
  const button = i.cta
    ? `<a href="${escapeHtml(i.cta.href)}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${escapeHtml(i.cta.label)}</a>`
    : '';
  return [
    `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">`,
    preheader,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">`,
    `<table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;border:1px solid #e5e7eb"><tr><td style="padding:24px">`,
    `<p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:700">SwingVantage</p>`,
    `<h1 style="margin:0 0 8px;font-size:18px;color:#111827">${escapeHtml(i.title)}</h1>`,
    `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">${escapeHtml(i.body)}</p>`,
    button,
    `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af">You’re receiving this because re-engagement emails are on for your account. Manage them anytime in Settings.</p>`,
    `</td></tr></table></td></tr></table></body></html>`,
  ].join('');
}

/** Decide whether to send or dry-run, and assemble the payload. Pure. */
export function planEmailSend(i: DispatchEmailInput, env: Env = process.env): PlannedEmail {
  const hasKey = Boolean(env.RESEND_API_KEY);
  return {
    mode: hasKey ? 'send' : 'dry_run',
    provider: hasKey ? 'resend' : 'none',
    from: env.DISPATCH_FROM_EMAIL || DEFAULT_FROM,
    to: i.to,
    subject: i.subject,
    html: buildDispatchEmailHtml(i),
    text: buildDispatchEmailText(i),
  };
}

/** Send via Resend when configured; honest dry-run otherwise. Never throws. */
export async function sendDispatchEmail(i: DispatchEmailInput, env: Env = process.env): Promise<SendResult> {
  const plan = planEmailSend(i, env);
  if (plan.mode === 'dry_run') {
    if (env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[dispatch:email] dry-run (no RESEND_API_KEY):', { to: plan.to, subject: plan.subject });
    }
    return { sent: false, dryRun: true, provider: 'none' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: plan.from, to: [plan.to], subject: plan.subject, html: plan.html, text: plan.text }),
    });
    return { sent: res.ok, dryRun: false, provider: 'resend' };
  } catch {
    return { sent: false, dryRun: false, provider: 'resend' };
  }
}
