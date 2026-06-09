import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { createCheckoutSession } from '@/lib/billing/stripe';
import type { TierId } from '@/lib/billing/tiers';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isStripeConfigured } from '@/lib/capabilities';

export const runtime = 'nodejs';

const PAID_TIERS: TierId[] = ['pro', 'team'];

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:billing-checkout`, { limit: 10, windowMs: 60_000 });
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

  // Bind the checkout to the authenticated account (F13) so the webhook can
  // deterministically attribute the subscription via `client_reference_id`.
  // Require sign-in only when real checkout is live (Stripe configured); in the
  // keyless waitlist mode anonymous callers still get the honest not_configured
  // result, so this never regresses the pre-launch UX.
  const user = await getAuthenticatedUser();
  if (isStripeConfigured() && !user) {
    return NextResponse.json(
      { ok: false, reason: 'auth_required', message: 'Please sign in to subscribe.' },
      { status: 401 },
    );
  }

  const origin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(req.url).origin;

  const result = await createCheckoutSession(tier, origin, {
    userId: user?.id,
    email: user?.email ?? undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
