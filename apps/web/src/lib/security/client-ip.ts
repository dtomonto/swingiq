// ============================================================
// SwingVantage — Trusted client IP resolution (server-only)
//
// Why this exists: every rate-limit / abuse / AI-cost guard keys on the
// caller's IP. The obvious `x-forwarded-for`.split(',')[0] reads the
// LEFTMOST value — which is fully attacker-controlled. On Vercel (and any
// reverse proxy that appends), a client that sends its own
// `X-Forwarded-For: <random>` shifts that leftmost entry, so the naive read
// hands every request a brand-new rate-limit bucket. That silently defeats
// the per-IP caps that protect the paid AI routes from cost-exhaustion abuse.
//
// Correct order of trust on Vercel:
//   1. `x-real-ip`            — set by Vercel's edge to the real peer IP and
//                               overwritten on every request, so the client
//                               cannot forge it. This is the reliable source.
//   2. last entry of `x-forwarded-for` — the value APPENDED by the closest
//                               trusted proxy (client-supplied values sit to
//                               the LEFT of it), so the rightmost hop is the
//                               least forgeable XFF segment.
//   3. 'unknown'              — no proxy headers (local/dev): one shared
//                               bucket, which is the safe default.
//
// Keep this the single source of truth — never re-parse XFF inline in a route.
// ============================================================

/** Minimal shape so this works with NextRequest, Request, or a header bag. */
interface HeaderLike {
  get(name: string): string | null;
}

interface RequestLike {
  headers: HeaderLike;
}

/**
 * Resolve the best-trusted client IP for rate-limit / abuse keys.
 * Prefers `x-real-ip` (proxy-set, not client-forgeable), then the rightmost
 * `x-forwarded-for` hop, then `'unknown'`.
 */
export function clientIp(req: RequestLike): string {
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    // Rightmost = appended by the nearest trusted proxy (least forgeable).
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  return 'unknown';
}
