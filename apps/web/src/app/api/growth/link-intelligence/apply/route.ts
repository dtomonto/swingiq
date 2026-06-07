// ============================================================
// POST /api/growth/link-intelligence/apply — act on an internal-link rec.
// Admin-only. action: approve | reject | auto-apply | snooze.
//
// NOTE: "auto-apply" records the ACCEPTED decision (status auto-applied) and
// is gated to recs the guardrails marked autoSafe. It does NOT edit your page
// source at runtime — actual insertion happens through your content workflow.
// Everything is reversible + logged via the record's status + updatedAt.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { internalLinkRecsRepo } from '@/lib/growth/repository';
import type { InternalLinkRecommendation, InternalLinkStatus } from '@/lib/growth/types';

type Action = 'approve' | 'reject' | 'auto-apply' | 'snooze';
const STATUS: Record<Action, InternalLinkStatus> = {
  approve: 'approved',
  reject: 'rejected',
  'auto-apply': 'auto-applied',
  snooze: 'snoozed',
};

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:li-apply`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; action?: Action; record?: InternalLinkRecommendation };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { id, action, record } = body;
  if (!id || !action || !(action in STATUS)) {
    return NextResponse.json({ error: 'Missing or invalid id/action.' }, { status: 400 });
  }

  // Ensure the rec exists (recs computed live aren't persisted until first action).
  let existing = await internalLinkRecsRepo.get(id);
  if (!existing && record && record.id === id) {
    existing = await internalLinkRecsRepo.create(record);
  }
  if (!existing) {
    return NextResponse.json({ error: 'Recommendation not found. Run the agent first.' }, { status: 404 });
  }

  // Guardrail: only autoSafe recs may be auto-applied.
  if (action === 'auto-apply' && !existing.autoSafe) {
    return NextResponse.json({ error: 'This recommendation is not safe to auto-apply — approve for manual review instead.' }, { status: 400 });
  }

  const updated = await internalLinkRecsRepo.update(id, {
    status: STATUS[action],
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, record: updated ?? existing });
}
