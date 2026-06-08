// ============================================================
// GET /api/coach-mix/preview-access
// ------------------------------------------------------------
// Returns whether the caller may PREVIEW the user-facing Coach Mix
// module ("Curated Swing Drills" + the style selector) before it is
// launched to everyone. True only for an admin (matching session OR
// the admin secret header; open in local dev). This is how the module
// is turned on "just for the admin user" without flipping the global
// NEXT_PUBLIC_COACH_MIX_USER_MODULE env (which would expose it to all).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function canPreview(req: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers.get('x-admin-secret') === secret) return true;
  if (await isAdminUser()) return true;
  if (!secret) return process.env.NODE_ENV === 'development';
  return false;
}

export async function GET(req: NextRequest) {
  const adminPreview = await canPreview(req);
  // Never cache — the answer is per-session.
  return NextResponse.json(
    { adminPreview },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
