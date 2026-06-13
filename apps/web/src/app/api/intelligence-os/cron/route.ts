// ============================================================
// GET /api/intelligence-os/cron — age-based retention sweep
// ------------------------------------------------------------
// Vercel Cron hits this (GET) with `Authorization: Bearer <CRON_SECRET>`; an
// authenticated admin can also "run now". Allow-listed in middleware.ts (cron
// has no Supabase session) and self-protects via the secret / admin check.
// Demotes reports through hot → warm → cold per the IntelligenceSettings
// retention windows, dropping full bodies as they age. No-store; no secrets.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { sweepReportRetention } from '@/lib/intelligence-os/reports';
import { runRetentionSweep } from '@/lib/intelligence-os/retention';
import { backfillEmbeddings } from '@/lib/intelligence-os/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true;
  if (await isAuthorizedAdmin(req)) return true;
  // Local/dev convenience only — never an open door in production.
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  // One daily maintenance pass:
  //  • demote reports hot→warm→cold (drop bodies as they age)
  //  • summarize/archive aged AI activity events per IntelligenceSettings
  //  • backfill embeddings on approved records (no-op unless configured)
  const [reports, events, embeddings] = await Promise.all([
    sweepReportRetention(),
    runRetentionSweep(),
    backfillEmbeddings(),
  ]);
  return NextResponse.json(
    { ok: true, reports, events, embeddings },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// Allow a manual admin "run now" via POST too.
export const POST = GET;
