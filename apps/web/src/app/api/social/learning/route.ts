// ============================================================
// GET /api/social/learning — "what's working" rankings from metrics.
// Admin-guarded. Returns empty (hasData:false) until metrics exist.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { loadLearnedPreferences } from '@/lib/social/learning';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`${ip}:social-learning`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(await loadLearnedPreferences());
}
