// ============================================================
// POST /api/billing/portal — open the Stripe Billing Portal
//
// Lets a signed-in subscriber update payment details or cancel their
// plan on Stripe's hosted page. Requires an authenticated user with a
// stored Stripe customer id (set by the webhook on first checkout).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getUserEntitlement } from '@/lib/billing/entitlements';
import { createPortalSession } from '@/lib/billing/stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimit(`${ip}:billing-portal`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, reason: 'auth_required', message: 'Please sign in.' },
      { status: 401 },
    );
  }

  const entitlement = await getUserEntitlement(user.id);
  if (!entitlement.stripeCustomerId) {
    return NextResponse.json(
      { ok: false, reason: 'no_customer', message: 'No subscription found for this account.' },
      { status: 400 },
    );
  }

  const origin =
    req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  const result = await createPortalSession(entitlement.stripeCustomerId, `${origin}/dashboard`);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
