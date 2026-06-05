// ============================================================
// POST /api/video-studio/publish  — publish / unpublish / re-stage an asset
// Admin-only. Publishing flips draft → live so SmartVideoSlot can serve it.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getRepo, makeAuditLog } from '@/lib/video-studio';
import { LIFECYCLE_STATES } from '@/lib/video-studio/types';
import { requireAdmin } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

const PublishSchema = z.object({
  assetId: z.string().min(1),
  published: z.boolean(),
  lifecycle: z.enum(LIFECYCLE_STATES).optional(),
});

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid publish request.', issues: parsed.error.issues }, { status: 400 });
  }

  const repo = getRepo();
  const asset = await repo.getAsset(parsed.data.assetId);
  if (!asset) return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });

  const now = new Date().toISOString();
  const updated = {
    ...asset,
    published: parsed.data.published,
    lifecycle: parsed.data.lifecycle ?? asset.lifecycle,
    seoUpdatedDate: now,
    updatedAt: now,
  };
  await repo.saveAsset(updated);
  if (parsed.data.published) await repo.updateOpportunityStatus(asset.opportunityId, 'published');
  await repo.appendAudit(
    makeAuditLog(parsed.data.published ? 'asset_published' : 'asset_unpublished', asset.id, `${parsed.data.published ? 'Published' : 'Unpublished'} "${asset.title}".`, {
      actor: 'admin',
      detail: { lifecycle: updated.lifecycle },
    }),
  );

  return NextResponse.json({ asset: updated });
}
