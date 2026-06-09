// ============================================================
// POST /api/growth/search-intelligence/gsc/sync
// ------------------------------------------------------------
// Admin-only, rate-limited. Pulls Search Analytics rows from Google Search
// Console, maps them to keywords + rankings, persists the snapshot (best-effort)
// so the dashboards read real rank/impression data, and returns the snapshot.
// Keyless-safe: returns connected:false with an honest note when unconfigured.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import {
  gscStatus, fetchGscRows, buildGscSnapshot, persistGscSnapshot,
} from '@/lib/growth/search-intelligence';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:si-gsc-sync`, { limit: 6, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = gscStatus();
  if (!status.connected || !status.siteUrl) {
    return NextResponse.json({ ok: false, connected: false, note: status.note }, { status: 200 });
  }

  const { rows, note } = await fetchGscRows({ days: 28, rowLimit: 1000 });
  const snapshot = buildGscSnapshot(rows, status.siteUrl);
  const persisted = await persistGscSnapshot(snapshot);

  return NextResponse.json({
    ok: true,
    connected: true,
    persisted,
    note,
    summary: snapshot.summary,
    keywords: snapshot.keywords,
    rankings: snapshot.rankings,
  });
}
