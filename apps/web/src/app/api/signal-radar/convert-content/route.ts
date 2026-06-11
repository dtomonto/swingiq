// ============================================================
// SignalRadar OS — content-idea → PublishingOS handoff
// POST /api/signal-radar/convert-content
// ------------------------------------------------------------
// When an operator converts a signal into a content idea, this drops a
// DRAFT roadmap entry into PublishingOS so it shows up in the publishing
// queue for review (never auto-published — it lands as a low-risk draft).
// Admin + signals.manage guarded; durable when Supabase is configured,
// memory-fallback otherwise. Never throws to the caller.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkSignalRadarAccess } from '@/lib/signal-radar/access.server';
import { upsertEntity } from '@/lib/publishing/store';
import type { PublishableEntity } from '@/lib/publishing/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { ok, ctx } = await checkSignalRadarAccess();
  if (!ok) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });

  let body: { title?: unknown; summary?: unknown; conversionId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim().slice(0, 1000) : '';
  const conversionId = typeof body.conversionId === 'string' ? body.conversionId.slice(0, 80) : '';
  if (!title || !conversionId) {
    return NextResponse.json({ ok: false, error: 'title and conversionId required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const entityId = `sr_${conversionId}`;
  const entity: PublishableEntity = {
    id: `roadmap-entry:${entityId}`,
    entityType: 'roadmap-entry',
    entityId,
    title: `[SignalRadar] ${title}`,
    status: 'draft',
    publishMode: 'instant',
    riskLevel: 'low',
    metadata: { sourceSystem: 'SignalRadar', summary },
    notes: summary,
    createdBy: ctx.email ?? 'signal-radar',
    createdAt: now,
    updatedAt: now,
    version: 1,
    validationStatus: 'unknown',
    deploymentStatus: 'none',
  };

  try {
    const saved = await upsertEntity(entity);
    return NextResponse.json({ ok: true, id: saved.id, status: saved.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'store write failed' }, { status: 502 });
  }
}
