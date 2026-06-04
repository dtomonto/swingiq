// ============================================================
// SwingIQ — Stripe webhook signature verification (SDK-free)
//
// Reimplements Stripe's `Webhook.constructEvent` signature check with
// Node's crypto so we don't need the `stripe` npm dependency. Verifies
// the HMAC-SHA256 signature over `${timestamp}.${rawBody}` and rejects
// stale timestamps (replay protection).
//
// Pure + synchronous → unit-testable without network or the SDK.
// ============================================================

import crypto from 'node:crypto';

export interface SignatureResult {
  ok: boolean;
  reason?: 'missing' | 'malformed' | 'timestamp' | 'mismatch';
}

/**
 * @param payload   The exact raw request body (do NOT re-stringify parsed JSON).
 * @param header    The value of the `Stripe-Signature` header.
 * @param secret    Your `STRIPE_WEBHOOK_SECRET` (whsec_...).
 * @param opts      `toleranceSec` (default 300) and `nowSec` (for tests).
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null | undefined,
  secret: string,
  opts: { toleranceSec?: number; nowSec?: number } = {},
): SignatureResult {
  if (!header) return { ok: false, reason: 'missing' };

  const toleranceSec = opts.toleranceSec ?? 300;
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000);

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of header.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 't') timestamp = value;
    else if (key === 'v1' && value) v1Signatures.push(value);
  }

  if (!timestamp || v1Signatures.length === 0) return { ok: false, reason: 'malformed' };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > toleranceSec) {
    return { ok: false, reason: 'timestamp' };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  const matched = v1Signatures.some((candidate) => {
    let candidateBuf: Buffer;
    try {
      candidateBuf = Buffer.from(candidate, 'hex');
    } catch {
      return false;
    }
    return (
      candidateBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(candidateBuf, expectedBuf)
    );
  });

  return matched ? { ok: true } : { ok: false, reason: 'mismatch' };
}
