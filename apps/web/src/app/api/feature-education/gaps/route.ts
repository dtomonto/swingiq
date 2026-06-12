// ============================================================
// GET /api/feature-education/gaps — prioritized content-gap dashboard data
// Admin-only.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/feature-education/server/guards';
import { loadFeatures } from '@/lib/feature-education/server/data';
import { getRepo, computeGaps } from '@/lib/feature-education';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const now = new Date();
  const repo = getRepo();
  const [features, assets] = await Promise.all([loadFeatures(now), repo.listAssets()]);
  const gaps = computeGaps(features, assets, now);
  return NextResponse.json({ gaps, count: gaps.length });
}
