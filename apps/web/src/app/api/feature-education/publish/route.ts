// ============================================================
// POST /api/feature-education/publish — publish an approved asset.
// Admin-only. Enforces the publish gate (approved + quality + security),
// then performs real cross-system handoff where one exists:
//   - video-brief → Video Studio (opportunity + brief)
//   - everything else is served by the engine's own help reader/API.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, limited } from '@/lib/feature-education/server/guards';
import {
  getRepo,
  canPublish,
  applyPublish,
  refreshCoverage,
  buildVideoOpportunity,
  buildVideoBrief,
  PublishRequestSchema,
} from '@/lib/feature-education';
import { getRepo as getVideoRepo } from '@/lib/video-studio';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'fee-publish', 40);
  if (tooMany) return tooMany;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const parsed = PublishRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.', issues: parsed.error.issues }, { status: 400 });

  const { assetId, target } = parsed.data;
  const repo = getRepo();
  const asset = await repo.getAsset(assetId);
  if (!asset) return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });

  const gate = canPublish(asset);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 400 });

  const now = new Date();
  const { asset: published, version, audit } = applyPublish(asset, target, { actor: 'admin', now });
  await repo.saveAsset(published);
  await repo.saveVersion(version);
  await repo.appendAudit(audit);

  // Real cross-system handoff for video briefs → Video Studio pipeline.
  let handoff: Record<string, unknown> | undefined;
  if (published.type === 'video-brief') {
    const feature = await repo.getFeature(published.featureId);
    if (feature) {
      try {
        const vrepo = getVideoRepo();
        const opp = buildVideoOpportunity(feature, now);
        const brief = buildVideoBrief(feature, now);
        await vrepo.saveOpportunities([opp]);
        await vrepo.saveBrief(brief);
        handoff = {
          videoStudio: { opportunityId: opp.id, briefId: brief.id, persistent: vrepo.isPersistent() },
        };
      } catch {
        /* best-effort handoff — publishing still succeeded in the engine */
      }
    }
  }

  const feature = await repo.getFeature(published.featureId);
  if (feature) {
    await repo.upsertFeatures([refreshCoverage(feature, await repo.listAssetsForFeature(published.featureId), now)]);
  }

  return NextResponse.json({ asset: published, target: published.publishTarget, handoff });
}
