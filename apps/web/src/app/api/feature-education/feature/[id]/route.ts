// ============================================================
// GET /api/feature-education/feature/[id] — full detail for one feature
// Admin-only.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/feature-education/server/guards';
import { loadFeatureDetail } from '@/lib/feature-education/server/data';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
  const detail = await loadFeatureDetail(id);
  if (!detail) return NextResponse.json({ error: 'Feature not found.' }, { status: 404 });
  return NextResponse.json(detail);
}
