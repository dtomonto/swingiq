import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { lookupHandicapIndex } from '@/lib/ghin/client';
import { isValidGhinNumber, normalizeGhinNumber } from '@/lib/ghin/validate';

export const runtime = 'nodejs';

/**
 * POST /api/ghin/lookup — resolve an official Handicap Index from a GHIN number.
 *
 * Honest, keyless-first: when no GHIN credentials are configured the route
 * returns { configured: false } and the client keeps the user's self-reported
 * value. It never invents an index.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:ghin-lookup`, { limit: 6, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: { ghinNumber?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const raw = typeof body.ghinNumber === 'string' ? body.ghinNumber : '';
  if (!isValidGhinNumber(raw)) {
    return NextResponse.json(
      { ok: false, error: 'Enter a valid 6–10 digit GHIN number.' },
      { status: 400 },
    );
  }

  const result = await lookupHandicapIndex(normalizeGhinNumber(raw));

  if (!result.configured) {
    return NextResponse.json(
      {
        ok: true,
        configured: false,
        message: 'Live GHIN lookup is not enabled. Your entry was saved as self-reported.',
      },
      { status: 200 },
    );
  }

  if (result.error) {
    return NextResponse.json({ ok: false, configured: true, error: result.error }, { status: 502 });
  }

  return NextResponse.json(
    {
      ok: true,
      configured: true,
      handicapIndex: result.handicapIndex,
      fullName: result.fullName,
      club: result.club,
      revDate: result.revDate,
    },
    { status: 200 },
  );
}
