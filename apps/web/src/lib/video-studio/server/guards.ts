// ============================================================
// SwingVantage — Video Studio: API guards (server-only)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Small helpers the video API routes share so auth and rate limiting
//   are consistent and never copy-pasted wrong:
//
//   - requireAdmin(): authorizes the SAME way as the rest of /admin — an
//     allowlisted Supabase session OR the x-admin-secret header (and open in
//     dev when no secret is set). The browser carries the Supabase session
//     cookie, so the cockpit's fetch() calls authenticate without the client
//     ever needing the server-only secret. (Header-only auth was a bug: the
//     client can't send ADMIN_SECRET, so every call 404'd in prod.)
//   - requireCronOrAdmin(): the reassessment route can also be triggered
//     by a scheduler carrying CRON_SECRET.
//   - limited(): one-line rate-limit guard returning a 429 when exceeded.
//
//   Not exported from lib/video-studio/index.ts on purpose — these import
//   server-only modules and belong to route handlers.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { safeEqual } from '@/lib/security/constant-time';
import { clientIp } from '@/lib/security/client-ip';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { requireAdmin as requireAdminContext } from '@/lib/admin/context';

/** Returns null when authorized as admin, else a NextResponse to return. */
export async function requireAdmin(_req?: NextRequest): Promise<NextResponse | null> {
  const ctx = await requireAdminContext();
  if (ctx.ok) return null;
  // 404 (not 403) so we don't confirm the route exists to an unauthorized caller.
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}

/** Allow either an admin (session/header) or a scheduler carrying CRON_SECRET. */
export async function requireCronOrAdmin(req: NextRequest): Promise<NextResponse | null> {
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
