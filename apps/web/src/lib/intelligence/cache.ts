// ============================================================
// SwingVantage — GAI recommendation cache (server-only)
// ------------------------------------------------------------
// A reusable, NON-personalized analysis memory. Mirrors the operating-mode /
// routing override stores: a durable Upstash key per entry (fleet-wide) with a
// per-instance in-memory fallback. Lets common, deterministic estimates be
// reused so identical requests skip recompute and Cost-Saving Mode can prefer
// cache (see decideRoute → CACHED).
//
// SAFETY (hard rule): only DETERMINISTIC, non-personalized results are cached
// (`sourceMode === 'heuristic'`). AI / hybrid / premium-video findings are NEVER
// stored or reused across users, so a personalized finding can never leak from
// one athlete to another. The key normalizes only the symptom-level inputs
// (sport, issue, symptoms, skill, goals, handedness, tier) — never a user id.
//
// SECURITY: server-only (calls Upstash). Never import into a client component.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import type { AnalysisRequest, AnalysisResult } from './types';

const PREFIX = 'intelligence:cache:';
const TTL_SECONDS = 7 * 86_400; // 7 days

/** Build the normalized, user-agnostic cache key for a request. */
export function cacheKey(req: AnalysisRequest): string {
  const norm = (s?: string) => (s ?? '').trim().toLowerCase();
  const parts = {
    sport: req.sport,
    issue: norm(req.issue),
    symptoms: [...(req.symptoms ?? [])].map(norm).filter(Boolean).sort(),
    skill: req.skillLevel ?? '',
    goals: [...(req.goals ?? [])].map(norm).filter(Boolean).sort(),
    hand: req.handedness ?? '',
    tier: req.tier,
  };
  return JSON.stringify(parts);
}

/** Only deterministic, non-personalized results are safe to reuse across users. */
export function isCacheableResult(result: AnalysisResult): boolean {
  return result.sourceMode === 'heuristic';
}

// Per-instance fallback (dev / single instance / Upstash unreachable).
const memory = new Map<string, AnalysisResult>();

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

async function upstashPipeline(creds: UpstashCreds, commands: string[][]): Promise<unknown[]> {
  const res = await fetch(`${creds.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(2_000),
  });
  if (!res.ok) throw new Error(`Upstash REST ${res.status}`);
  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(data)) throw new Error('Upstash malformed response');
  return data.map((d) => {
    if (d?.error) throw new Error(d.error);
    return d?.result;
  });
}

/** Whether the cache is durable (Upstash) or per-instance only. */
export function cacheStoreSource(): 'upstash' | 'memory' {
  return upstashCreds() ? 'upstash' : 'memory';
}

/** Look up a reusable result for a request. Never throws — misses degrade to null. */
export async function getCachedResult(req: AnalysisRequest): Promise<AnalysisResult | null> {
  const key = cacheKey(req);
  const creds = upstashCreds();
  if (!creds) return memory.get(key) ?? null;
  try {
    const [val] = await upstashPipeline(creds, [['GET', PREFIX + key]]);
    if (val == null) return null;
    return typeof val === 'string' ? (JSON.parse(val) as AnalysisResult) : (val as AnalysisResult);
  } catch {
    return memory.get(key) ?? null;
  }
}

/**
 * Store a freshly-computed result for reuse. No-op for non-cacheable
 * (personalized / AI) results. Best-effort: never throws.
 */
export async function putCachedResult(req: AnalysisRequest, result: AnalysisResult): Promise<void> {
  if (!isCacheableResult(result)) return;
  const key = cacheKey(req);
  memory.set(key, result);
  // Keep the per-instance map bounded.
  if (memory.size > 500) {
    const oldest = memory.keys().next().value as string | undefined;
    if (oldest) memory.delete(oldest);
  }
  const creds = upstashCreds();
  if (!creds) return;
  try {
    await upstashPipeline(creds, [['SET', PREFIX + key, JSON.stringify(result), 'EX', String(TTL_SECONDS)]]);
  } catch {
    /* best-effort — the in-memory copy is already set */
  }
}

/** Test-only introspection — exercises the in-memory path without a network. */
export const __test__ = {
  reset: () => memory.clear(),
  size: () => memory.size,
};
