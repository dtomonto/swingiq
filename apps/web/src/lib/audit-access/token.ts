// ============================================================
// External Auditor Access — token gate (SERVER-ONLY for verify)
// ------------------------------------------------------------
// Access to the read-only audit packet is gated by a single shared
// secret in AUDIT_ACCESS_TOKEN. Fail-closed: when the env var is unset,
// the endpoint is fully disabled (a 404), so this stays off until the
// owner deliberately turns it on from /admin/audit-access.
//
// The token may be presented either as `Authorization: Bearer <token>`
// or as a `?token=<token>` query param (so it works in a plain browser
// URL an auditor can paste). Verification is constant-time.
// ============================================================

import { safeEqual } from '@/lib/security/constant-time';
import { isConfigured } from '@/lib/capabilities';

/** True when audit access has been deliberately enabled (token set). */
export function isAuditAccessConfigured(): boolean {
  return isConfigured(process.env.AUDIT_ACCESS_TOKEN);
}

/** Extract a presented token from an Authorization header or token query param. */
export function extractPresentedToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1].trim();

  const url = new URL(req.url);
  const q = url.searchParams.get('token');
  return q && q.trim() !== '' ? q.trim() : null;
}

/**
 * Verify a request against AUDIT_ACCESS_TOKEN. Returns false when access is
 * not configured at all (so the caller renders a 404, never a 401 that would
 * confirm the endpoint exists). Constant-time comparison.
 */
export function verifyAuditToken(req: Request): boolean {
  const expected = process.env.AUDIT_ACCESS_TOKEN;
  if (!isConfigured(expected)) return false;
  const presented = extractPresentedToken(req);
  return safeEqual(presented, expected ?? null);
}
