// ============================================================
// POST /api/growth/search-intelligence/run — run the scan + persist.
// Admin-only, rate-limited. Mirrors the Link Intelligence run route.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { runSearchIntel, persistSearchIntel } from '@/lib/growth/search-intelligence';

// Generous ceiling for cold starts + Supabase latency (handler itself ~2s).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:si-run`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = runSearchIntel();
  const { persisted } = await persistSearchIntel(result);

  return NextResponse.json({
    ok: true,
    persisted,
    run: result.run,
    counts: {
      pages: result.pages.length,
      issues: result.issues.length,
      keywords: result.keywords.length,
      opportunities: result.opportunities.length,
      actions: result.actions.length,
      decay: result.decay.length,
    },
  });
}
