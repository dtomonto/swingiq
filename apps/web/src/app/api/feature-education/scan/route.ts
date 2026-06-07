// ============================================================
// POST /api/feature-education/scan — re-detect features (app map) + drift
// GET  /api/feature-education/scan — dashboard overview
// Admin-only. Persists when Supabase is configured.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, limited } from '@/lib/feature-education/server/guards';
import { runScan, loadOverview } from '@/lib/feature-education/server/data';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'fee-scan', 20);
  if (tooMany) return tooMany;

  const { features, drift, detected } = await runScan('admin');
  return NextResponse.json({ ok: true, features: features.length, detected, drift: drift.length });
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const overview = await loadOverview();
  return NextResponse.json(overview);
}
