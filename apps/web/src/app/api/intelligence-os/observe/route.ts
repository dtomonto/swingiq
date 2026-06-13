// POST /api/intelligence-os/observe
// First-party telemetry seam: the app reports a deterministic drill/retest
// recommendation so recurring recommendations are deduped into pattern memories
// and surfaced as reusable knowledge. No third-party AI cost. Rate-limited;
// stores only recommendation text + sport (user id is hashed, never raw).
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { recordFirstPartyRecommendation } from '@/lib/intelligence-os/capture';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX = 4000;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:io-observe`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: { kind?: unknown; intent?: unknown; recommendation?: unknown; sport?: unknown; feature?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid-body' }, { status: 400 }); }

  const kind = body.kind === 'retest' ? 'retest' : 'drill';
  const intent = typeof body.intent === 'string' ? body.intent.slice(0, MAX) : '';
  const recommendation = typeof body.recommendation === 'string' ? body.recommendation.slice(0, MAX) : '';
  if (!intent || !recommendation) {
    return NextResponse.json({ error: 'intent-and-recommendation-required' }, { status: 400 });
  }

  const user = await getAuthenticatedUser();
  // Fire-and-forget: telemetry must never slow or fail the caller.
  void recordFirstPartyRecommendation({
    kind,
    intent,
    recommendation,
    sport: typeof body.sport === 'string' ? body.sport : null,
    affectedFeature: typeof body.feature === 'string' ? body.feature : undefined,
    userId: user?.id ?? null,
  });

  return NextResponse.json({ ok: true });
}
