// ============================================================
// GET /api/publishing/cron — scheduled-publish worker
// ------------------------------------------------------------
// Vercel Cron hits this (GET) with `Authorization: Bearer <CRON_SECRET>`; an
// authenticated admin can also "run now". Allow-listed in middleware.ts (cron
// has no Supabase session) and self-protects via the secret / admin check.
// Actions every due scheduled entity: instant → durable override; deploy-backed
// → a GitHub PR via the executor. No-store; never returns secrets.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { processScheduledPublishes } from '@/lib/publishing/cron.server';

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
  const result = await processScheduledPublishes();
  return NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}

// Allow a manual admin "run now" via POST too.
export const POST = GET;
