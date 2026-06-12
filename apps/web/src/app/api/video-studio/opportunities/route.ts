// ============================================================
// GET   /api/video-studio/opportunities  — list opportunities
// PATCH /api/video-studio/opportunities  — approve / reject one
// Admin-only.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import {
  scanForOpportunities,
  getRepo,
  makeAuditLog,
  OpportunityDecisionSchema,
} from '@/lib/video-studio';
import { getOrScanOpportunity } from '@/lib/video-studio/server/data';
import { requireAdmin } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const repo = getRepo();
  const stored = await repo.listOpportunities();
  const opportunities = stored.length > 0 ? stored : scanForOpportunities();
  return NextResponse.json({ opportunities, persistent: repo.isPersistent() });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = OpportunityDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid decision.', issues: parsed.error.issues }, { status: 400 });
  }

  const repo = getRepo();
  const opp = await getOrScanOpportunity(repo, parsed.data.opportunityId);
  if (!opp) return NextResponse.json({ error: 'Opportunity not found.' }, { status: 404 });

  const status = parsed.data.decision === 'approve' ? 'approved' : 'rejected';
  await repo.updateOpportunityStatus(opp.id, status);
  await repo.appendAudit(
    makeAuditLog(
      parsed.data.decision === 'approve' ? 'opportunity_approved' : 'opportunity_rejected',
      opp.id,
      `${parsed.data.decision === 'approve' ? 'Approved' : 'Rejected'} "${opp.businessRationale.split(':')[0]}".`,
      { actor: 'admin', detail: { note: parsed.data.note } },
    ),
  );

  return NextResponse.json({ ok: true, opportunityId: opp.id, status });
}
