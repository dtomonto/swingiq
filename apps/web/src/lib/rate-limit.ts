/**
 * SwingIQ Rate Limiting Abstraction
 *
 * Shared rate-limit logic for all API routes.
 *
 * Two layers:
 *   • checkRateLimit            — synchronous, in-memory (per-instance).
 *                                 Always available; used as the fallback.
 *   • checkRateLimitDistributed — async; uses Upstash Redis across ALL
 *                                 serverless instances when configured,
 *                                 else delegates to the in-memory limiter.
 *
 * Route handlers should call checkRateLimitDistributed so limits hold on
 * multi-instance Vercel (the protection that actually caps AI spend under
 * abuse). With no Upstash credentials set it behaves exactly like the
 * in-memory limiter — zero config, zero added latency.
 */

import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// In-memory store — works for dev and single-instance deployments.
// Resets on cold starts (acceptable for MVP).
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
 * Check whether a key (typically `${ip}:${endpoint}`) is within its rate limit.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
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

// ──────────────────────────────────────────────────────────────
// Distributed limiter (Upstash Redis REST) with in-memory fallback
//
// Serverless platforms (Vercel) run many isolated instances, so the
// in-memory store above only limits a single instance. When Upstash REST
// credentials are present, the limit is enforced in shared Redis so it
// holds across ALL instances — the protection that actually caps AI spend
// under abuse. With no credentials set this transparently falls back to
// the in-memory limiter (zero config, zero added latency).
//
// Fetch-based, no SDK dependency (matches the Stripe/AI provider style).
// Any Redis error falls back to in-memory so a flaky cache never takes the
// API down.
// ──────────────────────────────────────────────────────────────

// Atomic fixed-window: increment the counter and, on the first hit of a
// window, set its expiry. Returns the post-increment count.
const UPSTASH_FIXED_WINDOW_LUA =
  "local c = redis.call('INCR', KEYS[1]) " +
  "if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end " +
  'return c';

async function upstashIncr(
  url: string,
  token: string,
  key: string,
  windowMs: number,
): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Upstash REST accepts a single command as a JSON array.
      body: JSON.stringify([
        'EVAL',
        UPSTASH_FIXED_WINDOW_LUA,
        '1',
        `rl:${key}`,
        String(windowMs),
      ]),
      // Never let a slow cache hang the request.
      signal: AbortSignal.timeout(2_000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown };
    const count = Number(data?.result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

/**
 * Distributed rate-limit check. Uses Upstash Redis when
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (so the limit
 * holds across all serverless instances); otherwise falls back to the
 * in-memory limiter. Drop-in async replacement for checkRateLimit in
 * route handlers.
 */
export async function checkRateLimitDistributed(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const count = await upstashIncr(url, token, key, config.windowMs);
    if (count !== null) {
      return {
        allowed: count <= config.limit,
        remaining: Math.max(0, config.limit - count),
        resetAt: Date.now() + config.windowMs,
      };
    }
    // Redis unreachable/errored → fall back to in-memory below.
  }

  return checkRateLimit(key, config);
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
