// ============================================================
// GET /api/billing/status — the signed-in user's current plan
//
// Client-safe summary (no secrets). Returns the effective tier and
// whether a "Manage subscription" button should be shown. Resolves to
// the Free tier for signed-out or keyless users.
// ============================================================

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getUserEntitlement } from '@/lib/billing/entitlements';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      tier: 'free',
      status: 'inactive',
      canManage: false,
    });
  }

  const entitlement = await getUserEntitlement(user.id);
  return NextResponse.json({
    authenticated: true,
    tier: entitlement.tier,
    planTier: entitlement.planTier,
    status: entitlement.status,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    canManage: !!entitlement.stripeCustomerId,
  });
}
