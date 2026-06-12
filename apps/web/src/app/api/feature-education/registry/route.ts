// ============================================================
// GET /api/feature-education/registry — list the Feature Registry
// Admin-only.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/feature-education/server/guards';
import { loadFeatures } from '@/lib/feature-education/server/data';
import { getRepo } from '@/lib/feature-education';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const features = await loadFeatures();
  const repo = getRepo();
  return NextResponse.json({ features, count: features.length, persistent: repo.isPersistent(), backend: repo.backendLabel() });
}
