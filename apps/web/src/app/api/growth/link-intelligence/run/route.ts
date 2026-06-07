// ============================================================
// POST /api/growth/link-intelligence/run — run the agent + persist.
// Admin-only, rate-limited. ?cadence=daily|weekly|monthly|manual.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { runLinkAgent, persistLinkAgentResult } from '@/lib/growth/link-intelligence';
import type { LinkRunCadence } from '@/lib/growth/types';

const CADENCES: LinkRunCadence[] = ['daily', 'weekly', 'monthly', 'manual'];

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:li-run`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = new URL(req.url).searchParams.get('cadence');
  const cadence: LinkRunCadence = CADENCES.includes(raw as LinkRunCadence) ? (raw as LinkRunCadence) : 'manual';

  const result = runLinkAgent({ cadence });
  const { persisted } = await persistLinkAgentResult(result);

  return NextResponse.json({
    ok: true,
    persisted,
    run: result.run,
    counts: {
      findings: result.findings.length,
      recommendations: result.recommendations.length,
      backlinkOpportunities: result.backlinkOpportunities.length,
      competitorGaps: result.competitorGaps.length,
      contentGaps: result.contentGaps.length,
      notifications: result.notifications.length,
    },
  });
}
