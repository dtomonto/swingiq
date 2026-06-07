/**
 * SwingVantage — Dispatch Send API Route
 *
 * POST /api/agents/dispatch/send
 *
 * Delivers ONE re-engagement email. The Dispatch agent has already made the
 * decision (consent + caps + quiet hours); this route only delivers it.
 *
 * Honesty: with no RESEND_API_KEY it DRY-RUNS (returns { sent:false,
 * dryRun:true }) — it never pretends to have sent. Security mirrors the
 * other agent routes: server-side key, validated + length-capped input,
 * per-IP rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/email/capture';
import { sendDispatchEmail } from '@/lib/agents/dispatch/sendEmail';

const MAX = { subject: 200, title: 200, body: 2000, label: 80, href: 500, preheader: 200 };

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`${ip}:dispatch-send`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const to = str(b.to, 254).trim();
  const subject = str(b.subject, MAX.subject).trim();
  const title = str(b.title, MAX.title).trim() || subject;
  const text = str(b.body, MAX.body).trim();

  if (!isValidEmail(to)) return NextResponse.json({ error: 'Invalid recipient.' }, { status: 400 });
  if (!subject || !text) return NextResponse.json({ error: 'Missing subject or body.' }, { status: 400 });

  const ctaRaw = (b.cta ?? null) as { label?: unknown; href?: unknown } | null;
  const cta =
    ctaRaw && typeof ctaRaw === 'object' && str(ctaRaw.href, MAX.href)
      ? { label: str(ctaRaw.label, MAX.label) || 'Open SwingVantage', href: str(ctaRaw.href, MAX.href) }
      : undefined;

  const result = await sendDispatchEmail({
    to,
    subject,
    title,
    body: text,
    preheader: str(b.preheader, MAX.preheader) || undefined,
    cta,
  });

  return NextResponse.json(result, { status: 200 });
}
