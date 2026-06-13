// POST /api/admin/intelligence-os/maintenance
// Admin maintenance actions:
//   { action: 'retention' }          → run the hot/warm/cold retention sweep
//   { action: 'backfill-embeddings' } → embed approved records missing a vector
import { NextResponse } from 'next/server';
import { runRetentionSweep } from '@/lib/intelligence-os/retention';
import { backfillEmbeddings } from '@/lib/intelligence-os/service';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { error } = await guard('settings.manage');
  if (error) return error;
  const body = await readJson<{ action?: string }>(req);

  if (body.action === 'backfill-embeddings') {
    return NextResponse.json({ ok: true, result: await backfillEmbeddings() });
  }
  if (body.action === 'retention') {
    return NextResponse.json({ ok: true, report: await runRetentionSweep() });
  }
  return NextResponse.json({ error: 'unknown-action' }, { status: 400 });
}
