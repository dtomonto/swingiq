// ============================================================
// GET /api/admin/security-os/scan — admin-only security scan export
// ------------------------------------------------------------
// Server-side guarded JSON export of the current security scan (score,
// checks, findings, recommendations). Demonstrates + enforces API-level
// access control: the caller must be an authenticated admin holding
// `security.manage` (checkSecurityAccess). Non-admins get a 403; the route
// never reveals scan data to an unauthorized caller. No secrets are returned
// — only posture results and grounded evidence.
// ============================================================

import { NextResponse } from 'next/server';
import { checkSecurityAccess } from '@/lib/security-os/access.server';
import { runSecurityScan } from '@/lib/security-os/generate.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { ok } = await checkSecurityAccess();
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const scan = runSecurityScan();
  return NextResponse.json(scan, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
