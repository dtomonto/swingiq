// ============================================================
// POST /api/video-studio/scan   — run the opportunity scanner
// GET  /api/video-studio/scan   — list scored opportunities
// Admin-only. Persists results when Supabase is configured.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { scanForOpportunities, getRepo, makeAuditLog } from '@/lib/video-studio';
import { requireAdmin, limited } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'video-studio-scan', 20);
  if (tooMany) return tooMany;

  const opportunities = scanForOpportunities();
  const repo = getRepo();
  await repo.saveOpportunities(opportunities);
  await repo.appendAudit(
    makeAuditLog('scan', 'app', `Scanned ${opportunities.length} surfaces for video opportunities.`, {
      actor: 'admin',
      detail: { count: opportunities.length },
    }),
  );

  return NextResponse.json({
    opportunities,
    persistent: repo.isPersistent(),
    backend: repo.backendLabel(),
  });
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const repo = getRepo();
  const stored = await repo.listOpportunities();
  const opportunities = stored.length > 0 ? stored : scanForOpportunities();
  return NextResponse.json({ opportunities, persistent: repo.isPersistent() });
}
