// ============================================================
// POST /api/video-studio/reassess  — reassess published videos
// GET  /api/video-studio/reassess  — list past reassessments
//
// Admin OR a scheduler with CRON_SECRET (so it can run periodically).
// Body (optional): { assetId } to target a single video.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import {
  getRepo,
  reassess,
  performanceScore,
  aggregateEvents,
  makeAuditLog,
  type VideoReassessment,
} from '@/lib/video-studio';
import { requireCronOrAdmin, limited } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MIN_SAMPLE = 20; // impressions before performance scores are trusted
const DAY_MS = 86_400_000;

export async function POST(req: NextRequest) {
  const denied = await requireCronOrAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'video-studio-reassess', 10);
  if (tooMany) return tooMany;

  let targetAssetId: string | undefined;
  try {
    const body = (await req.json()) as { assetId?: string };
    targetAssetId = body?.assetId;
  } catch {
    /* no body is fine (cron) */
  }

  const repo = getRepo();
  const now = new Date();
  let assets = await repo.listPublishedAssets();
  if (targetAssetId) assets = assets.filter((a) => a.id === targetAssetId);

  const placements = await repo.listPlacements();
  const results: VideoReassessment[] = [];

  for (const asset of assets) {
    const events = await repo.listEventsForAsset(asset.id);
    const placement = placements.find((p) => p.assetId === asset.id);
    const metric = aggregateEvents(events, {
      assetId: asset.id,
      placementId: placement?.id ?? '',
      windowStart: new Date(now.getTime() - 30 * DAY_MS).toISOString(),
      windowEnd: now.toISOString(),
    });
    const ageDays = Math.max(0, (now.getTime() - new Date(asset.createdAt).getTime()) / DAY_MS);
    const score = performanceScore(metric, ageDays);

    const result = reassess({
      asset,
      score,
      placementId: placement?.id,
      hasEnoughData: metric.impressions >= MIN_SAMPLE,
      now,
    });
    await repo.saveReassessment(result);
    results.push(result);
  }

  await repo.appendAudit(
    makeAuditLog('reassessment_run', targetAssetId ?? 'all', `Reassessed ${results.length} published video(s).`, {
      actor: 'system',
      detail: { count: results.length },
    }),
  );

  return NextResponse.json({ reassessments: results, persistent: repo.isPersistent() });
}

export async function GET(req: NextRequest) {
  const denied = await requireCronOrAdmin(req);
  if (denied) return denied;
  const repo = getRepo();
  return NextResponse.json({ reassessments: await repo.listReassessments() });
}
