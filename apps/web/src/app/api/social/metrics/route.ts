// ============================================================
// POST /api/social/metrics — record a metrics snapshot for a post.
// Admin-guarded, rate-limited. Source can be 'manual' (typed in the
// Studio), 'utm_analytics' (a sync job from Plausible/GA), or
// 'platform_api'. Feeds the learning loop.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { persistenceAvailable, recordMetric, type MetricInput } from '@/lib/social/store';

const NUM_FIELDS = [
  'impressions', 'clicks', 'engagements', 'shares', 'saves', 'comments', 'conversions',
] as const;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:social-metrics`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!persistenceAvailable()) return NextResponse.json({ error: 'Persistence not configured.' }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { postId, metrics } = (body ?? {}) as { postId?: unknown; metrics?: Record<string, unknown> };
  if (typeof postId !== 'string' || !postId) {
    return NextResponse.json({ error: 'Missing postId.' }, { status: 400 });
  }

  const clean: MetricInput = { source: 'manual' };
  for (const f of NUM_FIELDS) {
    const v = metrics?.[f];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) clean[f] = Math.floor(v);
  }
  if (typeof metrics?.source === 'string') clean.source = metrics.source;

  const ok = await recordMetric(postId, clean);
  if (!ok) return NextResponse.json({ error: 'Could not record metrics.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
