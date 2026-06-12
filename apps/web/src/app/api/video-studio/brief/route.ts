// ============================================================
// POST /api/video-studio/brief  — generate a creative brief
// GET  /api/video-studio/brief  — list briefs
// Admin-only.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { buildBrief, getRepo, makeAuditLog, BriefRequestSchema } from '@/lib/video-studio';
import { getOrScanOpportunity } from '@/lib/video-studio/server/data';
import { requireAdmin, limited } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'video-studio-brief', 30);
  if (tooMany) return tooMany;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = BriefRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid brief request.', issues: parsed.error.issues }, { status: 400 });
  }

  const repo = getRepo();
  const opp = await getOrScanOpportunity(repo, parsed.data.opportunityId);
  if (!opp) return NextResponse.json({ error: 'Opportunity not found.' }, { status: 404 });

  // Version = (existing briefs for this opp) + 1, so reassessment can iterate.
  const existing = (await repo.listBriefs()).filter((b) => b.opportunityId === opp.id);
  const version = existing.length + 1;
  const brief = buildBrief(opp, parsed.data.overrides ?? {}, version);

  await repo.saveBrief(brief);
  await repo.updateOpportunityStatus(opp.id, 'in_production');
  await repo.appendAudit(
    makeAuditLog('brief_generated', brief.id, `Generated brief v${version} for "${opp.businessRationale.split(':')[0]}".`, {
      actor: 'admin',
      detail: { opportunityId: opp.id, version },
    }),
  );

  return NextResponse.json({ brief, persistent: repo.isPersistent() });
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const repo = getRepo();
  return NextResponse.json({ briefs: await repo.listBriefs() });
}
