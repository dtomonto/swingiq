// ============================================================
// ReliabilityOS — optional ingest endpoint
// POST /api/reliability/ingest
// ------------------------------------------------------------
// Fire-and-forget telemetry sink for sanitized operational events (sent by the
// client capture buffer via sendBeacon when a durable backend is configured).
// Re-sanitizes server-side (defense-in-depth — a client could POST anything),
// rate-limits, and writes to growth_records. Always 204 so the browser beacon
// never blocks; a no-op when Supabase isn't configured.
//
// No auth required to WRITE (it's anonymous product telemetry, sanitized to
// metadata only). The admin READ path is RBAC-guarded on the dashboard.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { sanitizeOperationalEvent, type RawOperationalEvent } from '@/lib/reliability-os/fingerprint';
import { ingestOperationalEvent, isIngestEnabled } from '@/lib/reliability-os/ingest.server';

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  // Keyless: nothing to persist — accept and drop so the client beacon is cheap.
  if (!isIngestEnabled()) return noContent();

  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:reliability-ingest`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let raw: RawOperationalEvent;
  try {
    raw = (await req.json()) as RawOperationalEvent;
  } catch {
    return noContent();
  }
  if (!raw || typeof raw.type !== 'string') return noContent();

  try {
    // Re-sanitize server-side, force source=ingest, and persist. Never trust the
    // client's pre-sanitized blob — rebuild it from scratch through the scrubber.
    const event = sanitizeOperationalEvent({ ...raw, source: 'ingest' });
    await ingestOperationalEvent(event);
  } catch {
    /* swallow — telemetry must never error the caller */
  }
  return noContent();
}
