// ============================================================
// /api/intelligence/waitlist — GAI tier waitlist (user-facing)
// ------------------------------------------------------------
// GET  → per-tier rollout status (public) + which tiers the signed-in user has
//        already joined.
// POST { tier } → register the signed-in user's interest in a waitlist tier.
//        Requires sign-in (401 when signed out) so interest maps to a real user.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getTierAvailability } from '@/lib/intelligence';
import { joinTierWaitlist, getJoinedTiers, isWaitlistTier } from '@/lib/intelligence/waitlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [availability, user] = await Promise.all([getTierAvailability(), getAuthenticatedUser()]);
  const joined = user ? await getJoinedTiers(user.id) : null;
  return NextResponse.json({ ok: true, availability, joined, signedIn: Boolean(user) });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:tier-waitlist`, { limit: 12, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: { tier?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const tier = typeof body.tier === 'string' ? body.tier : '';
  if (!isWaitlistTier(tier)) {
    return NextResponse.json({ ok: false, error: 'Unknown tier.' }, { status: 400 });
  }

  // Interest must be tied to a real account so the owner can count distinct users.
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Please sign in to join the waitlist.', signInRequired: true },
      { status: 401 },
    );
  }

  const result = await joinTierWaitlist(user.id, tier);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'We could not save your interest right now. Please try again.' },
      { status: 200 },
    );
  }
  return NextResponse.json({ ok: true, joined: true, tier }, { status: 200 });
}
