// ============================================================
// /api/admin/tier-rollout  (admin-guarded)
// ------------------------------------------------------------
// GET  → current rollout mode + per-tier waitlist interest counts.
// POST → set the rollout mode ('free' = waitlist only | 'full' = all
//        paid tiers active). Mirrors the /admin guard used elsewhere
//        (ADMIN_SECRET header OR an allowlisted admin session).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/auth/admin';
import {
  getTierRolloutMode,
  setTierRolloutMode,
  getTierInterestCounts,
} from '@/lib/billing/tier-rollout-server';

export const runtime = 'nodejs';

/** Mirrors the /admin layout: a matching secret header OR an allowlisted session. */
async function isAdmin(req: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers.get('x-admin-secret') === secret) return true;
  if (await isAdminUser()) return true;
  if (!secret) return process.env.NODE_ENV === 'development';
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
  }
  const [mode, counts] = await Promise.all([getTierRolloutMode(), getTierInterestCounts()]);
  return NextResponse.json({ ok: true, mode, counts });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
  }

  let body: { mode?: unknown };
  try {
    body = (await req.json()) as { mode?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (body.mode !== 'free' && body.mode !== 'full') {
    return NextResponse.json({ error: "mode must be 'free' or 'full'." }, { status: 400 });
  }

  const config = await setTierRolloutMode(body.mode);
  const counts = await getTierInterestCounts();
  return NextResponse.json({ ok: true, mode: config.mode, counts });
}
