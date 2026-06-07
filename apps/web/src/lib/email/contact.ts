// ============================================================
// SwingVantage — Contact form email (SERVER-ONLY)
// ------------------------------------------------------------
// Sends a contact-form submission to the owner's inbox. Mirrors
// lib/email/capture's HONESTY RULE and lib/agents/dispatch/send-email's
// provider pattern:
//
//   • With RESEND_API_KEY set, it sends a real email via the Resend
//     API to CONTACT_TO_EMAIL (defaults to the public support@ role
//     address, which forwards to the owner). reply_to is the visitor's
//     address so the owner can reply with one click.
//   • With no key, it DRY-RUNS — it returns delivered:false and never
//     pretends the message was sent, so the UI can stay truthful.
//
// Nothing here ever throws to the caller.
// ============================================================

import { siteConfig } from '@/config/site';
import { isValidEmail } from '@/lib/email/capture';

/** The kinds of message the contact form collects. */
export type ContactTopic = 'feedback' | 'bug' | 'idea' | 'question' | 'other';

export const CONTACT_TOPICS: readonly ContactTopic[] = [
  'feedback',
  'bug',
  'idea',
  'question',
  'other',
] as const;

const TOPIC_LABELS: Record<ContactTopic, string> = {
  feedback: 'General feedback',
  bug: 'Something looks broken',
  idea: 'Feature idea / suggestion',
  question: 'A question',
  other: 'Other',
};

export interface ContactInput {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  /** Optional page the visitor was on, captured by the form. */
  pagePath?: string;
}

export interface ContactValidation {
  ok: boolean;
  /** First user-facing error, when ok is false. */
  error?: string;
  /** Cleaned, length-capped values, when ok is true. */
  value?: ContactInput;
}

export interface ContactSendResult {
  /** True only when a provider actually accepted the message. */
  delivered: boolean;
  /** Machine-readable provider name or 'none'. */
  provider: 'resend' | 'none';
  /** Safe, user-facing message. */
  message: string;
}

type Env = Record<string, string | undefined>;

const DEFAULT_FROM = 'SwingVantage <noreply@swingvantage.com>';
const MAX_NAME = 120;
const MAX_MESSAGE = 4000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isTopic(v: unknown): v is ContactTopic {
  return typeof v === 'string' && (CONTACT_TOPICS as readonly string[]).includes(v);
}

/**
 * Validate + normalize a raw contact payload. Pure (no I/O) so the API route
 * and unit tests share exactly one definition of "a valid message".
 */
export function validateContact(raw: {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
  pagePath?: unknown;
}): ContactValidation {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name.length < 1) return { ok: false, error: 'Please tell us your name.' };

  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };

  const message = typeof raw.message === 'string' ? raw.message.trim() : '';
  if (message.length < 10) {
    return { ok: false, error: 'Please add a little more detail (at least 10 characters).' };
  }

  const topic: ContactTopic = isTopic(raw.topic) ? raw.topic : 'other';
  const pagePath =
    typeof raw.pagePath === 'string' && raw.pagePath.startsWith('/')
      ? raw.pagePath.slice(0, 200)
      : undefined;

  return {
    ok: true,
    value: {
      name: name.slice(0, MAX_NAME),
      email: email.slice(0, 254),
      topic,
      message: message.slice(0, MAX_MESSAGE),
      pagePath,
    },
  };
}

/** Subject line for the owner's inbox. */
export function buildContactSubject(i: ContactInput): string {
  return `[SwingVantage contact] ${TOPIC_LABELS[i.topic]} — from ${i.name}`;
}

/** Plain-text body (no markup) — always sent alongside the HTML part. */
export function buildContactText(i: ContactInput): string {
  const lines = [
    `New message from the SwingVantage contact form.`,
    '',
    `Name:    ${i.name}`,
    `Email:   ${i.email}`,
    `Topic:   ${TOPIC_LABELS[i.topic]}`,
  ];
  if (i.pagePath) lines.push(`Page:    ${i.pagePath}`);
  lines.push('', 'Message:', i.message, '', '—', 'Reply directly to this email to respond to the sender.');
  return lines.join('\n');
}

/** Simple, inline-styled HTML body for the owner's inbox. */
export function buildContactHtml(i: ContactInput): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(
      label,
    )}</td><td style="padding:4px 0;color:#111827;font-size:13px">${escapeHtml(value)}</td></tr>`;

  return [
    `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">`,
    `<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb"><tr><td style="padding:24px">`,
    `<p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:700">SwingVantage</p>`,
    `<h1 style="margin:0 0 16px;font-size:18px;color:#111827">New contact-form message</h1>`,
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px">`,
    row('Name', i.name),
    row('Email', i.email),
    row('Topic', TOPIC_LABELS[i.topic]),
    i.pagePath ? row('Page', i.pagePath) : '',
    `</table>`,
    `<p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600">Message</p>`,
    `<p style="margin:0;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap">${escapeHtml(
      i.message,
    )}</p>`,
    `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af">Reply directly to this email to respond to the sender.</p>`,
    `</td></tr></table></td></tr></table></body></html>`,
  ].join('');
}

/** Where contact messages are delivered. Public role address by default. */
export function contactRecipient(env: Env = process.env): string {
  return env.CONTACT_TO_EMAIL || siteConfig.contactEmail;
}

/**
 * Send the message via Resend when configured; honest dry-run otherwise.
 * Never throws.
 */
export async function sendContactMessage(
  input: ContactInput,
  env: Env = process.env,
): Promise<ContactSendResult> {
  const hasKey = Boolean(env.RESEND_API_KEY);

  if (!hasKey) {
    if (env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[contact] dry-run (no RESEND_API_KEY):', {
        to: contactRecipient(env),
        subject: buildContactSubject(input),
        from: input.email,
      });
    }
    return {
      delivered: false,
      provider: 'none',
      message:
        'Thanks! Email delivery is not connected yet, so your message was not sent. Please email us directly in the meantime.',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: [contactRecipient(env)],
        reply_to: input.email,
        subject: buildContactSubject(input),
        html: buildContactHtml(input),
        text: buildContactText(input),
      }),
    });
    return res.ok
      ? { delivered: true, provider: 'resend', message: 'Thanks — your message is on its way. We read every note.' }
      : {
          delivered: false,
          provider: 'resend',
          message: 'We could not send your message right now. Please try again in a moment.',
        };
  } catch {
    return {
      delivered: false,
      provider: 'resend',
      message: 'Something went wrong sending your message. Please try again later.',
    };
  }
}
