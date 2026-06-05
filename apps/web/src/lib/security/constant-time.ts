// ============================================================
// SwingVantage — Constant-time secret comparison
//
// Comparing a request-supplied secret to the expected secret with `===`
// short-circuits on the first differing byte, which leaks the length of
// the matching prefix through response timing. For low-entropy shared
// secrets (ADMIN_SECRET / CRON_SECRET) that is a real, if slow, oracle.
//
// We hash both sides to a fixed 32-byte digest first, then compare with
// crypto.timingSafeEqual. Hashing makes the inputs equal length (so
// timingSafeEqual never throws on a length mismatch) and stops the
// comparison itself from leaking the secret's length. The Stripe webhook
// verifier (lib/billing/webhook-signature.ts) already uses timingSafeEqual
// directly; this helper gives the rest of the app the same guarantee.
// ============================================================

import crypto from 'node:crypto';

/**
 * Constant-time string equality for secrets. Returns false (never throws)
 * for null/undefined/non-string inputs, so callers can pass a raw header
 * value directly.
 */
export function safeEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const digestA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const digestB = crypto.createHash('sha256').update(b, 'utf8').digest();

  // Digests are always 32 bytes, so timingSafeEqual is safe to call and the
  // comparison time does not depend on where the inputs first differ.
  return crypto.timingSafeEqual(digestA, digestB);
}
