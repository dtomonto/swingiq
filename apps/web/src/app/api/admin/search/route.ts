// ============================================================
// GET /api/admin/search?q= — entity search for the command palette
// ------------------------------------------------------------
// Admin-gated. Returns up to a few records per type (milestones, users,
// analyses). Service-role-backed sources return nothing when not configured,
// so this never invents results.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/context';
import { searchEntities } from '@/lib/admin/entity-search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await searchEntities(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
