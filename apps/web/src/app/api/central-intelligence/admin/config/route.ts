// ============================================================
// POST /api/central-intelligence/admin/config  (admin-guarded)
// ------------------------------------------------------------
// Authorized admins adjust the Founding campaign config: the required
// count and the membership-tier override (force-unlock / force-lock /
// automatic). Mirrors the /admin guard used by the GrowthOS CRUD API.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { setFoundingConfig, getFoundingCampaignProgress } from '@/lib/central-intelligence/founding-server';
import { isAdminUser } from '@/lib/auth/admin';

export const runtime = 'nodejs';

/** Mirrors the /admin layout: a matching secret header OR an allowlisted session. */
async function isAdmin(req: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers.get('x-admin-secret') === secret) return true;
  if (await isAdminUser()) return true;
  if (!secret) return process.env.NODE_ENV === 'development';
  return false;
}

interface ConfigBody {
  requiredCount?: number;
  /** true = force-unlock tiers, false = force-lock, null = automatic. */
  manualOverride?: boolean | null;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
  }

  let body: ConfigBody;
  try {
    body = (await req.json()) as ConfigBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const patch: ConfigBody = {};
  if (typeof body.requiredCount === 'number' && body.requiredCount > 0) {
    patch.requiredCount = Math.floor(body.requiredCount);
  }
  if (body.manualOverride === true || body.manualOverride === false || body.manualOverride === null) {
    patch.manualOverride = body.manualOverride;
  }

  const config = await setFoundingConfig(patch);
  const progress = await getFoundingCampaignProgress();
  return NextResponse.json({ ok: true, config, progress });
}
