// ============================================================
// SwingIQ — Provider-Agnostic Email Capture (server-only)
//
// Resolves an email provider from environment variables and stores
// a lead. Supports (in priority order):
//   1. Resend audiences        — RESEND_API_KEY + RESEND_AUDIENCE_ID
//   2. ConvertKit forms        — CONVERTKIT_API_KEY + CONVERTKIT_FORM_ID
//   3. Mailchimp lists         — MAILCHIMP_API_KEY + MAILCHIMP_LIST_ID + MAILCHIMP_SERVER_PREFIX
//   4. Generic webhook         — EMAIL_CAPTURE_WEBHOOK_URL  (POST JSON)
//   5. None configured         — returns { persisted: false }
//
// HONESTY RULE: when no provider is configured we DO NOT pretend the
// email was saved. The API returns persisted:false so the UI can be
// truthful. Nothing here ever throws to the caller.
// ============================================================

export type LeadSource =
  | 'golf_slice'
  | 'launch_monitor'
  | 'slow_pitch_softball'
  | 'youth_baseball'
  | 'youth_softball'
  | 'tennis_forehand'
  | 'coach'
  | 'creator'
  | 'team'
  | 'challenge'
  | 'practice_plan'
  | 'general';

export interface CaptureInput {
  email: string;
  source: LeadSource;
  /** Optional extra context, e.g. sport or tool name. */
  meta?: Record<string, string>;
}

export interface CaptureResult {
  /** True only when a provider actually accepted the lead. */
  persisted: boolean;
  /** Machine-readable provider name or 'none'. */
  provider: string;
  /** Safe, user-facing message. */
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

async function storeResend(input: CaptureInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audienceId) return false;
  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: input.email, unsubscribed: false }),
  });
  return res.ok;
}

async function storeConvertKit(input: CaptureInput): Promise<boolean> {
  const key = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;
  if (!key || !formId) return false;
  const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, email: input.email, fields: { source: input.source, ...input.meta } }),
  });
  return res.ok;
}

async function storeMailchimp(input: CaptureInput): Promise<boolean> {
  const key = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const prefix = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. 'us21'
  if (!key || !listId || !prefix) return false;
  const res = await fetch(`https://${prefix}.api.mailchimp.com/3.0/lists/${listId}/members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: input.email, status: 'subscribed', merge_fields: { SOURCE: input.source } }),
  });
  return res.ok;
}

async function storeWebhook(input: CaptureInput): Promise<boolean> {
  const url = process.env.EMAIL_CAPTURE_WEBHOOK_URL;
  if (!url) return false;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: input.email, source: input.source, meta: input.meta, at: new Date().toISOString() }),
  });
  return res.ok;
}

/** The provider that is currently configured, or 'none'. */
export function configuredProvider(): string {
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) return 'resend';
  if (process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_FORM_ID) return 'convertkit';
  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID && process.env.MAILCHIMP_SERVER_PREFIX) return 'mailchimp';
  if (process.env.EMAIL_CAPTURE_WEBHOOK_URL) return 'webhook';
  return 'none';
}

export async function captureLead(input: CaptureInput): Promise<CaptureResult> {
  const provider = configuredProvider();

  try {
    let persisted = false;
    switch (provider) {
      case 'resend': persisted = await storeResend(input); break;
      case 'convertkit': persisted = await storeConvertKit(input); break;
      case 'mailchimp': persisted = await storeMailchimp(input); break;
      case 'webhook': persisted = await storeWebhook(input); break;
      default: persisted = false;
    }

    if (provider === 'none') {
      // No provider configured — be honest, do not claim success.
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[EmailCapture] (not persisted — no provider configured)', input);
      }
      return {
        persisted: false,
        provider: 'none',
        message: 'Thanks! Email saving is not connected yet, so your address was not stored.',
      };
    }

    return persisted
      ? { persisted: true, provider, message: "You're on the list — check your inbox." }
      : { persisted: false, provider, message: 'We could not save your email right now. Please try again later.' };
  } catch {
    return { persisted: false, provider, message: 'Something went wrong saving your email. Please try again later.' };
  }
}
