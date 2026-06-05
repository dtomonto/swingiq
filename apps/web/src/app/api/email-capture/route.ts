import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { captureLead, isValidEmail, type LeadSource } from '@/lib/email/capture';

export const runtime = 'nodejs';

const VALID_SOURCES: LeadSource[] = [
  'golf_slice', 'launch_monitor', 'slow_pitch_softball', 'youth_baseball',
  'youth_softball', 'tennis_forehand', 'coach', 'creator', 'team',
  'challenge', 'practice_plan', 'pro_waitlist', 'team_waitlist', 'general',
];

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimit(`${ip}:email-capture`, { limit: 8, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: { email?: unknown; source?: unknown; meta?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const source: LeadSource = VALID_SOURCES.includes(body.source as LeadSource)
    ? (body.source as LeadSource)
    : 'general';

  const meta: Record<string, string> = {};
  if (body.meta && typeof body.meta === 'object') {
    for (const [k, v] of Object.entries(body.meta as Record<string, unknown>)) {
      if (typeof v === 'string' && k.length < 40) meta[k.slice(0, 40)] = v.slice(0, 200);
    }
  }

  const result = await captureLead({ email, source, meta });

  return NextResponse.json(
    { ok: true, persisted: result.persisted, provider: result.provider, message: result.message },
    { status: 200 },
  );
}
