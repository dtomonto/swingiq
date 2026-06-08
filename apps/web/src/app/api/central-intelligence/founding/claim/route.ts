// ============================================================
// POST /api/central-intelligence/founding/claim
// ------------------------------------------------------------
// Claims (or re-fetches) the caller's Founding Member NUMBER. The number
// is assigned SERVER-SIDE in qualification order and is idempotent (one
// per user) — the client can never choose or fast-forward it.
//
// AUTH: when Supabase is configured the caller MUST be a logged-in user;
// the userId is taken from the verified session, never the request body
// (tamper-proof identity). In keyless/local dev mode there is no server
// identity, so the local userId is accepted from the body and written to
// the in-process store — dev only.
//
// The server re-checks eligibility (profile complete + required valid
// sessions) before assigning a number. The eligibility inputs come from
// the client's local-first store today; `serverVerified` records whether
// they were corroborated against synced data (see docs follow-up).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isSupabaseConfigured } from '@/lib/capabilities';
import { claimFoundingMembership } from '@/lib/central-intelligence/founding-server';
import type { SportId } from '@swingiq/core';

export const runtime = 'nodejs';

interface ClaimBody {
  userId?: string;
  sport?: SportId | null;
  profileCompleted?: boolean;
  validSessionCount?: number;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimit(`${ip}:ff-claim`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: ClaimBody;
  try {
    body = (await req.json()) as ClaimBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  // Resolve identity. Cloud mode: trust ONLY the verified session.
  let userId: string | null = null;
  if (isSupabaseConfigured) {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Sign in to claim Founding Member status.' }, { status: 401 });
    userId = user.id;
  } else {
    // Keyless/local dev: accept the device-local user id.
    userId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;
    if (!userId) return NextResponse.json({ ok: false, error: 'Missing user id.' }, { status: 400 });
  }

  const result = await claimFoundingMembership({
    userId,
    sport: body.sport ?? null,
    profileCompleted: body.profileCompleted === true,
    validSessionCount: Math.max(0, Math.floor(Number(body.validSessionCount) || 0)),
    // Identity is server-verified in cloud mode; eligibility counts are still
    // client-reported until relational re-derivation lands (documented).
    serverVerified: isSupabaseConfigured,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      reason: result.reason,
      memberNumber: result.record?.memberNumber ?? null,
      status: result.record?.status ?? null,
      qualifiedAt: result.record?.qualifiedAt ?? null,
      progress: result.progress,
    },
    { status: result.ok ? 200 : 409 },
  );
}
