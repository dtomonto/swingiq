// ============================================================
// SignalRadar OS — authenticated webhook ingest
// POST /api/signal-radar/webhook
// ------------------------------------------------------------
// Lets trusted automations (Zapier / Make / a custom scraper you run)
// feed mentions into SignalRadar. OFF BY DEFAULT: returns 404 until
// SIGNALRADAR_WEBHOOK_SECRET is set, so the endpoint doesn't even exist
// for the public. When set, every request must present that secret
// (constant-time compare); the body is re-validated + clamped server-side
// (never trust the caller), classified + scored by the pure engine, and
// upserted to the durable store (idempotent by fingerprint). Persistence
// needs Supabase — without it we answer honestly (503), never silently
// drop while claiming success.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { safeEqual } from '@/lib/security/constant-time';
import { isConfigured } from '@/lib/capabilities';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { parseWebhookPayload } from '@/lib/signal-radar/ingest';
import { ingestSignal, isSignalIngestEnabled } from '@/lib/signal-radar/ingest.server';
import { processRawInputs } from '@/lib/signal-radar/engine';
import { DEFAULT_CONFIG, DEFAULT_COMPETITORS } from '@/lib/signal-radar/config';

export const dynamic = 'force-dynamic';

function presentedSecret(req: NextRequest): string | null {
  const header = req.headers.get('x-signalradar-secret');
  if (header) return header;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.SIGNALRADAR_WEBHOOK_SECRET;

  // Off by default — the route is invisible until a secret is configured.
  if (!isConfigured(secret)) {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  }

  // Rate-limit by IP BEFORE the auth check, so failed-secret attempts are
  // throttled too (defense-in-depth against brute force).
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:signal-radar-webhook`, { limit: 120, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  // Constant-time secret check.
  if (!safeEqual(presentedSecret(req), secret!)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // Honest when there's nowhere durable to store it.
  if (!isSignalIngestEnabled()) {
    return NextResponse.json(
      { ok: false, error: 'ingest store not configured (Supabase service role required)' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON' }, { status: 400 });
  }

  const input = parseWebhookPayload(body);
  if (!input) {
    return NextResponse.json({ ok: false, error: 'payload needs a "text" or "title" field' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { signals } = processRawInputs([input], DEFAULT_CONFIG, DEFAULT_COMPETITORS, {
    now,
    makeId: () => 'sr_pending',
  });
  if (!signals.length) {
    return NextResponse.json({ ok: false, error: 'could not process payload' }, { status: 422 });
  }

  // Stable id = fingerprint, so re-POSTing the same mention upserts in place.
  const signal = { ...signals[0], id: `sr_${signals[0].fingerprint}`, ingested: true as const };
  const stored = await ingestSignal(signal);
  if (!stored) {
    return NextResponse.json({ ok: false, error: 'store write failed' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    id: signal.id,
    intent: signal.classification.intent,
    sentiment: signal.classification.sentiment,
    sport: signal.classification.sport,
    priority: signal.scores.priority,
  });
}
