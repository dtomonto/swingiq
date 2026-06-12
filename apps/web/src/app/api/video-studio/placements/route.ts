// ============================================================
// GET  /api/video-studio/placements  — list (tutorial seeds + studio)
// POST /api/video-studio/placements  — create / update a studio placement
// Admin-only.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import {
  getRepo,
  makeAuditLog,
  mergePlacements,
  getSurface,
  PlacementUpsertSchema,
  type StudioPlacement,
} from '@/lib/video-studio';
import { requireAdmin } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const repo = getRepo();
  const studio = await repo.listPlacements();
  return NextResponse.json({ placements: mergePlacements(studio), persistent: repo.isPersistent() });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = PlacementUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid placement.', issues: parsed.error.issues }, { status: 400 });
  }

  const repo = getRepo();
  const input = parsed.data;
  const surface = getSurface(input.surfaceId);
  const existing = input.id ? await repo.getPlacement(input.id) : undefined;
  const id = input.id ?? `place_${input.surfaceId}_${Date.now().toString(36)}`;

  const placement: StudioPlacement = {
    id,
    assetId: input.assetId,
    surfaceId: input.surfaceId,
    page: surface?.page ?? existing?.page ?? '/',
    zone: surface?.zone ?? existing?.zone ?? 'Custom placement',
    display: input.display,
    trigger: input.trigger,
    audience: input.audience,
    sport: input.sport,
    device: input.device,
    experiment: input.experiment,
    priority: input.priority,
    cta: input.cta,
    blurb: input.blurb,
    captionsRequired: existing?.captionsRequired ?? true,
    journeyStage: surface?.journeyStage ?? existing?.journeyStage ?? 'understand',
    enabled: input.enabled,
    source: 'studio',
  };

  await repo.upsertPlacement(placement);
  await repo.appendAudit(
    makeAuditLog(existing ? 'placement_updated' : 'placement_assigned', id, `${existing ? 'Updated' : 'Created'} placement on ${placement.page}.`, {
      actor: 'admin',
      detail: { assetId: input.assetId, surfaceId: input.surfaceId },
    }),
  );

  return NextResponse.json({ placement, persistent: repo.isPersistent() });
}
