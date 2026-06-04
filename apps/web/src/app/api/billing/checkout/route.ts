import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitDistributed, rateLimitResponse } from '@/lib/rate-limit';
import { createCheckoutSession } from '@/lib/billing/stripe';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import type { TierId } from '@/lib/billing/tiers';

export const runtime = 'nodejs';

const PAID_TIERS: TierId[] = ['pro', 'team'];

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimitDistributed(`${ip}:billing-checkout`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: { tier?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_tier', message: 'Invalid request.' }, { status: 400 });
  }

  const tier = body.tier as TierId;
  if (!PAID_TIERS.includes(tier)) {
    return NextResponse.json({ ok: false, reason: 'invalid_tier', message: 'Unknown plan.' }, { status: 400 });
  }

  // A subscription must belong to an account, so the webhook can grant the
  // right user their plan. Require a signed-in user before checkout.
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, reason: 'auth_required', message: 'Please sign in or create an account to subscribe.' },
      { status: 401 },
    );
  }

  const origin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(req.url).origin;

  const result = await createCheckoutSession(tier, origin, {
    userId: user.id,
    email: user.email ?? undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
