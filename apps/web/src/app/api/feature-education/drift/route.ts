// ============================================================
// GET  /api/feature-education/drift — list stored drift findings
// POST /api/feature-education/drift — recompute drift (cron or admin)
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireCronOrAdmin, limited } from '@/lib/feature-education/server/guards';
import { loadFeatures } from '@/lib/feature-education/server/data';
import { getRepo, detectDrift, makeFeeAudit } from '@/lib/feature-education';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const repo = getRepo();
  let drift = await repo.listDrift();
  if (drift.length === 0) {
    const [features, assets] = await Promise.all([loadFeatures(), repo.listAssets()]);
    drift = detectDrift(features, assets);
  }
  return NextResponse.json({ drift, count: drift.length });
}

export async function POST(req: NextRequest) {
  // Allow a scheduled drift audit (CRON_SECRET) or an admin.
  const denied = requireCronOrAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'fee-drift', 20);
  if (tooMany) return tooMany;

  const now = new Date();
  const repo = getRepo();
  const [features, assets] = await Promise.all([loadFeatures(now), repo.listAssets()]);
  const drift = detectDrift(features, assets, { now });
  await repo.saveDrift(drift);
  await repo.appendAudit(
    makeFeeAudit('drift_detected', 'registry', `Drift audit: ${drift.length} finding(s).`, {
      actor: 'system',
      detail: { count: drift.length },
      now,
    }),
  );
  return NextResponse.json({ ok: true, count: drift.length, drift });
}
