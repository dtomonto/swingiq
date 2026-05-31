/**
 * SwingIQ Rate Limiting Abstraction
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

/**
 * Check whether a key (typically `${ip}:${endpoint}`) is within its rate limit.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
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
