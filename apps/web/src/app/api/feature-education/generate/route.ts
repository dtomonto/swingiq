// ============================================================
// POST /api/feature-education/generate — generate a feature's education
// package (all warranted assets) or a specific subset. Admin-only.
// Drafts only — nothing is published here.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, limited } from '@/lib/feature-education/server/guards';
import {
  getRepo,
  generatePackage,
  enhanceAsset,
  withQuality,
  refreshCoverage,
  makeVersion,
  makeFeeAudit,
  GenerateRequestSchema,
} from '@/lib/feature-education';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'fee-generate', 30);
  if (tooMany) return tooMany;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.', issues: parsed.error.issues }, { status: 400 });

  const { featureId, types, enhance } = parsed.data;
  const repo = getRepo();
  const feature = await repo.getFeature(featureId);
  if (!feature) return NextResponse.json({ error: 'Feature not found.' }, { status: 404 });

  const now = new Date();
  const drafts = generatePackage(feature, { types, ctx: { now } });
  const processed = [];
  for (const draft of drafts) {
    let asset = withQuality(draft, now);
    if (enhance) asset = await enhanceAsset(asset);
    await repo.saveAsset(asset);
    await repo.saveVersion(makeVersion(asset, 'Generated draft', 'admin', now));
    processed.push(asset);
  }

  const updated = refreshCoverage(feature, await repo.listAssetsForFeature(feature.id), now);
  await repo.upsertFeatures([updated]);
  await repo.appendAudit(
    makeFeeAudit('package_generated', feature.id, `Generated ${processed.length} draft asset(s) for ${feature.name}.`, {
      actor: 'admin',
      detail: { types: processed.map((p) => p.type) },
      now,
    }),
  );

  return NextResponse.json({
    featureId: feature.id,
    count: processed.length,
    assets: processed,
    persistent: repo.isPersistent(),
  });
}
