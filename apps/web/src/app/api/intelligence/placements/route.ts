// ============================================================
// /api/intelligence/placements — resolved tier-invitation config (user-facing)
// ------------------------------------------------------------
// GET → the master switch + per-slot invitation config, plus the per-tier
// rollout status and (for signed-in users) which tiers they've already joined.
// The <TierInvite> component reads this to decide whether to show its calm,
// dismissible card. Read-only and safe for anonymous visitors.
// ============================================================

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getPlacementState } from '@/lib/intelligence/placements';
import { getTierAvailability } from '@/lib/intelligence';
import { getJoinedTiers } from '@/lib/intelligence/waitlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [placement, availability, user] = await Promise.all([
    getPlacementState(),
    getTierAvailability(),
    getAuthenticatedUser(),
  ]);
  const joined = user ? await getJoinedTiers(user.id) : null;
  return NextResponse.json({
    ok: true,
    invitationsEnabled: placement.invitationsEnabled,
    slots: placement.slots,
    availability,
    joined,
    signedIn: Boolean(user),
  });
}
