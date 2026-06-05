// ============================================================
// POST /api/video-studio/events  — record a video analytics event
//
// PUBLIC + rate-limited. The player also fires client-side analytics via
// track(); this endpoint durably stores events so the reassessment engine
// can roll them into performance metrics. Validates strictly; stores only
// the whitelisted fields.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { getRepo, VideoEventSchema, type StoredEvent } from '@/lib/video-studio';
import { limited } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const tooMany = await limited(req, 'video-studio-events', 120);
  if (tooMany) return tooMany;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = VideoEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event.', issues: parsed.error.issues }, { status: 400 });
  }

  const e = parsed.data;
  const now = new Date();
  const row: StoredEvent = {
    id: `evt_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    assetId: e.assetId ?? '',
    placementId: e.placementId,
    event: e.event,
    completion: e.completion,
    dropOffSec: e.dropOffSec,
    at: now.toISOString(),
  };

  // Only persist events tied to a real asset (impression-only-on-fallback
  // placements have no asset to measure).
  if (row.assetId) await getRepo().appendEvents([row]);

  return NextResponse.json({ ok: true });
}
