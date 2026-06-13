// ============================================================
// GET /api/billing/tier-status — public tier rollout + waitlist status
// ------------------------------------------------------------
// Client-safe (no secrets). Tells the pricing page how to render each
// paid tier: the rollout MODE ('free' = waitlist, 'full' = active),
// whether billing is live (Stripe configured), whether the caller is
// signed in, and which paid tiers they have already joined the waitlist
// for. Resolves cleanly for signed-out / keyless users.
// ============================================================

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isStripeConfigured } from '@/lib/capabilities';
import { getTierRolloutMode, getUserInterestedTiers } from '@/lib/billing/tier-rollout-server';

export const runtime = 'nodejs';

export async function GET() {
  const [mode, user] = await Promise.all([getTierRolloutMode(), getAuthenticatedUser()]);
  const interested = user ? await getUserInterestedTiers(user.id) : [];

  return NextResponse.json(
    {
      mode,
      billingLive: isStripeConfigured(),
      signedIn: !!user,
      interested,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
