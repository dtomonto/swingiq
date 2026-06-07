import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateContact, sendContactMessage } from '@/lib/email/contact';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Tighter than email-capture: a contact message is a heavier action.
  const rl = await checkRateLimit(`${ip}:contact`, { limit: 4, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const validation = validateContact((body ?? {}) as Record<string, unknown>);
  if (!validation.ok || !validation.value) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const result = await sendContactMessage(validation.value);

  return NextResponse.json(
    { ok: true, delivered: result.delivered, provider: result.provider, message: result.message },
    { status: 200 },
  );
}
