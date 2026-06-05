/**
 * SwingVantage Rate Limiting Abstraction
 *
 * Shared rate-limit logic for all API routes.
 *
 * For multi-instance Vercel production, replace the in-memory store with
 * Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit
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
