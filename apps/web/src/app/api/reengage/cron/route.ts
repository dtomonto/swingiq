// ============================================================
// GET /api/reengage/cron — scheduled outbound re-engagement worker
// ------------------------------------------------------------
// Turns due re-engagement signals (retest-due, streak-at-risk, comeback, …)
// into outbound email/push reminders, reusing the same honest selection rules as
// the in-app nudge (cooldowns, daily cap, dismissals, channel opt-in).
//
// Auth mirrors /api/publishing/cron: `Authorization: Bearer <CRON_SECRET>` for a
// scheduler, or an authenticated admin "run now". Allow-listed in middleware
// (cron carries no Supabase session). No-store; never returns secrets.
//
// DORMANT until configured: returns an honest no-op unless outbound is
// configured (Resend/VAPID + Supabase) AND a candidate source exists. It is NOT
// yet on a Vercel cron schedule — wire that once outbound goes live
// (see docs/OUTBOUND_REMINDERS.md).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { isReengageOutboundConfigured } from '@/lib/capabilities';
import { runReengageBatch } from '@/lib/reengage/outbound';
import { deliverNudge } from '@/lib/notifications/deliver';
import { loadOutboundCandidates } from '@/lib/reengage/batch.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true;
  if (await isAuthorizedAdmin(req)) return true;
  // Local/dev convenience only — never an open door in production.
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const result = await runReengageBatch({
    configured: isReengageOutboundConfigured(),
    loadCandidates: loadOutboundCandidates,
    deliver: deliverNudge,
    origin: new URL(req.url).origin,
  });

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}

// Allow a manual admin "run now" via POST too.
export const POST = GET;
