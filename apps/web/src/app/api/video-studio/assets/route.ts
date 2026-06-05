// ============================================================
// GET /api/video-studio/assets  — list generated videos (the library)
// Admin-only.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { getRepo } from '@/lib/video-studio';
import { requireAdmin } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const repo = getRepo();
  return NextResponse.json({ assets: await repo.listAssets(), persistent: repo.isPersistent() });
}
