// ============================================================
// POST /api/billing/tier-interest — join a paid tier's waitlist
// ------------------------------------------------------------
// A SIGNED-IN user expresses interest in a gated paid tier (Pro/Team)
// while it is still rolling out. The interest is recorded once per
// (tier, user) so the owner can count demand before flipping rollout on.
//
// Signed-out callers get { ok:false, reason:'auth_required' } so the UI
// can send them to sign in first. Idempotent — re-pressing is a no-op.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isTierId } from '@/lib/billing/tiers';
import { recordTierInterest, getUserInterestedTiers } from '@/lib/billing/tier-rollout-server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:tier-interest`, { limit: 12, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: 'auth_required' }, { status: 401 });
  }

  let body: { tier?: unknown };
  try {
    body = (await req.json()) as { tier?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isTierId(body.tier) || body.tier === 'free') {
    return NextResponse.json({ ok: false, error: 'Unknown tier.' }, { status: 400 });
  }

  const result = await recordTierInterest({ userId: user.id, tierId: body.tier });
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason ?? 'unavailable' }, { status: 400 });
  }

  const interested = await getUserInterestedTiers(user.id);
  return NextResponse.json({ ok: true, alreadyInterested: result.alreadyInterested, interested });
}
