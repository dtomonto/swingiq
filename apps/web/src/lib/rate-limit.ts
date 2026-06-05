/**
 * SwingVantage Rate Limiting Abstraction
 *
 * Two layers, one entry point:
 *
 *   • checkRateLimitInMemory — synchronous, per-process counter. Always
 *     available. It's the only limiter in dev/single-instance, and the
 *     fallback everywhere else. On Vercel each serverless instance has its
 *     OWN memory, so on its own this limit only holds per-instance.
 *
 *   • checkRateLimit — the async production entry point routes should call.
 *     When Upstash Redis is configured it counts in a store SHARED across
 *     every instance, so the limit actually holds fleet-wide — the protection
 *     that genuinely caps AI spend if someone hammers the AI routes. If
 *     Upstash isn't configured, or is unreachable, it degrades to the
 *     in-memory limiter so a limit is ALWAYS applied (never fails open).
 *
 * Enable the distributed limiter by setting UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN (free tier at https://upstash.com). No SDK is
 * needed — we call the Upstash REST API directly.
 */

import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/capabilities';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ── In-memory store (dev + production fallback) ──────────────
// Works for dev and single-instance deployments. Resets on cold starts
// (acceptable for the fallback path).
const store = new Map<string, { count: number; resetAt: number }>();

// Opportunistic eviction so the store cannot grow unbounded on a long-lived
// instance. Without this, every distinct `${ip}:${endpoint}` key that never
// returns after its window expires would leak forever (a slow memory growth
// that survives until the next cold start). We sweep at most once per
// SWEEP_INTERVAL_MS, and keep a hard cap as a backstop against a burst of
// unique IPs within a single window. Deleting an expired entry is harmless:
// a returning caller simply starts a fresh window.
const SWEEP_INTERVAL_MS = 60_000;
const MAX_ENTRIES = 10_000;
let lastSweepAt = 0;

function sweep(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }

  // Backstop: if still oversized (many live windows at once), drop the
  // entries closest to resetting so the map stays bounded.
  if (store.size > MAX_ENTRIES) {
    const byResetAsc = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    const overflow = store.size - MAX_ENTRIES;
    for (let i = 0; i < overflow; i++) store.delete(byResetAsc[i][0]);
  }
}

/**
 * Synchronous, per-process rate-limit check (the in-memory fallback).
 * Prefer {@link checkRateLimit} in route handlers — it adds the distributed
 * store when configured. This is exported mainly so the limiter mechanics
 * stay unit-testable without a network.
 */
export function checkRateLimitInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

// ── Upstash Redis REST (distributed, multi-instance) ─────────

interface UpstashCreds {
  url: string;
  token: string;
}

function upstashCreds(): UpstashCreds | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!isConfigured(url) || !isConfigured(token)) return null;
  return { url: url!.replace(/\/+$/, ''), token: token! };
}

/**
 * Fixed-window counter executed server-side in one round trip:
 *   INCR <key>              → current count in this window
 *   EXPIRE <key> <win> NX   → set the TTL only on the first hit of the window
 *   PTTL <key>              → ms remaining, so resetAt is accurate
 * The INCR + EXPIRE NX pair is what makes the window correct across instances.
 */
async function checkRateLimitUpstash(
  creds: UpstashCreds,
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000));

  const res = await fetch(`${creds.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(windowSec), 'NX'],
      ['PTTL', key],
    ]),
    // A rate limiter must never hang the request it is guarding.
    signal: AbortSignal.timeout(2_000),
  });

  if (!res.ok) throw new Error(`Upstash REST ${res.status}`);

  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(data) || data[0]?.error) {
    throw new Error(data?.[0]?.error ?? 'Upstash malformed response');
  }

  const count = Number(data[0]?.result ?? 0);
  const pttl = Number(data[2]?.result ?? -1);
  const resetAt = Date.now() + (pttl > 0 ? pttl : config.windowMs);

  return {
    // Counts 1..limit are allowed; the (limit+1)-th is denied — same contract
    // as the in-memory limiter.
    allowed: count <= config.limit,
    remaining: Math.max(0, config.limit - count),
    resetAt,
  };
}

/**
 * Check whether a key (typically `${ip}:${endpoint}`) is within its rate
 * limit. Uses the distributed store when Upstash is configured, otherwise the
 * in-memory limiter. Never fails open: any Upstash error degrades to the
 * per-instance limiter.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const creds = upstashCreds();
  if (creds) {
    try {
      return await checkRateLimitUpstash(creds, key, config);
    } catch {
      return checkRateLimitInMemory(key, config);
    }
  }
  return checkRateLimitInMemory(key, config);
}

/**
 * Returns a standard 429 Too Many Requests NextResponse.
 */
export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please wait a moment before trying again.' },
    { status: 429 },
  );
}

/**
 * Test-only introspection. Not part of the public API — used by the unit
 * tests to exercise the eviction logic deterministically.
 */
export const __test__ = {
  storeSize: () => store.size,
  reset: () => {
    store.clear();
    lastSweepAt = 0;
  },
  seed: (key: string, resetAt: number) => store.set(key, { count: 1, resetAt }),
  runSweep: (now: number) => {
    lastSweepAt = 0; // force the sweep regardless of when the last one ran
    sweep(now);
  },
};
