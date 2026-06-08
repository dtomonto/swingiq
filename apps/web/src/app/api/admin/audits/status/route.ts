// ============================================================
// POST /api/admin/audits/status — set an audit finding's tracking status.
// ------------------------------------------------------------
// Re-asserts admin server-side (session email allowlist OR x-admin-secret),
// then writes the owner's status overlay to src/data/audit-status-overrides.json
// — a reviewable git diff you push. Production's runtime FS is read-only, so it
// returns a clear, honest 409 there. Mirrors /api/admin/updates.
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/context';
import { setFindingStatus } from '@/lib/admin/audits/status-store';
import type { AuditTrackStatus } from '@/lib/admin/audits/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES: AuditTrackStatus[] = ['open', 'in-progress', 'done'];

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { findingId?: string; status?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const { findingId, status } = body;
  if (!findingId || typeof findingId !== 'string' || findingId.length > 64) {
    return NextResponse.json({ error: 'invalid findingId' }, { status: 400 });
  }
  if (!status || !STATUSES.includes(status as AuditTrackStatus)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  const result = setFindingStatus(findingId, status as AuditTrackStatus);
  if (!result.ok) {
    if (result.reason === 'read-only') {
      return NextResponse.json(
        {
          error: 'read-only',
          message:
            'Status tracking writes to a versioned data file, only possible in your local dev environment. Track there, then commit & push.',
        },
        { status: 409 },
      );
    }
    if (result.reason === 'invalid') {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    findingId,
    status: result.status,
    actor: admin.email ?? 'header-admin',
  });
}
