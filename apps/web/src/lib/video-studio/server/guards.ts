// ============================================================
// SwingVantage — Video Studio: API guards (server-only)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Small helpers the video API routes share so auth and rate limiting
//   are consistent and never copy-pasted wrong:
//
//   - requireAdmin(): admin tools need the x-admin-secret header to match
//     ADMIN_SECRET (constant-time compare). In dev with no secret set, it
//     allows access for local iteration — same rule as the /admin layout.
//   - requireCronOrAdmin(): the reassessment route can also be triggered
//     by a scheduler carrying CRON_SECRET.
//   - limited(): one-line rate-limit guard returning a 429 when exceeded.
//
//   Not exported from lib/video-studio/index.ts on purpose — these import
//   server-only modules and belong to route handlers.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { safeEqual } from '@/lib/security/constant-time';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

/** Returns null when authorized as admin, else a NextResponse to return. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    // Match /admin layout: allow in dev for local iteration, block otherwise.
    if (process.env.NODE_ENV === 'development') return null;
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  const provided = req.headers.get('x-admin-secret');
  if (safeEqual(provided, secret)) return null;
  // 404 (not 403) so we don't confirm the route exists to an unauthorized caller.
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}

/** Allow either an admin header or a scheduler carrying CRON_SECRET. */
export function requireCronOrAdmin(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided =
      req.headers.get('x-cron-secret') ??
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      null;
    if (safeEqual(provided, cronSecret)) return null;
  }
  return requireAdmin(req);
}

/** Client IP for rate-limit keys (best-effort behind proxies). */
export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

/** Returns a 429 response when the caller is over the limit, else null. */
export async function limited(
  req: NextRequest,
  endpoint: string,
  limit: number,
  windowMs = 60_000,
): Promise<NextResponse | null> {
  const rl = await checkRateLimit(`${clientIp(req)}:${endpoint}`, { limit, windowMs });
  return rl.allowed ? null : rateLimitResponse();
}
