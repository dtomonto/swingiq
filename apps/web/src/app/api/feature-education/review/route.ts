// ============================================================
// POST /api/feature-education/review — approve / reject / regenerate an asset.
// Admin-only. Records a version + audit entry on every decision.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, limited } from '@/lib/feature-education/server/guards';
import {
  getRepo,
  applyReview,
  prepareRegenerated,
  generateAsset,
  withQuality,
  refreshCoverage,
  ReviewRequestSchema,
} from '@/lib/feature-education';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'fee-review', 60);
  if (tooMany) return tooMany;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const parsed = ReviewRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.', issues: parsed.error.issues }, { status: 400 });

  const { assetId, decision, note } = parsed.data;
  const repo = getRepo();
  const asset = await repo.getAsset(assetId);
  if (!asset) return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });

  const now = new Date();
  let result;

  if (decision === 'regenerate') {
    const feature = await repo.getFeature(asset.featureId);
    if (!feature) return NextResponse.json({ error: 'Feature not found for asset.' }, { status: 404 });
    const fresh = withQuality(generateAsset(feature, asset.type, { now }), now);
    const { asset: merged, version, audit } = prepareRegenerated(asset, fresh, { actor: 'admin', note, now });
    await repo.saveAsset(merged);
    await repo.saveVersion(version);
    await repo.appendAudit(audit);
    result = merged;
  } else {
    const { asset: next, version, audit } = applyReview(asset, decision, { actor: 'admin', note, now });
    await repo.saveAsset(next);
    await repo.saveVersion(version);
    await repo.appendAudit(audit);
    result = next;
  }

  const feature = await repo.getFeature(result.featureId);
  if (feature) {
    await repo.upsertFeatures([refreshCoverage(feature, await repo.listAssetsForFeature(result.featureId), now)]);
  }

  return NextResponse.json({ asset: result });
}
