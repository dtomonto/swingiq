// ============================================================
// SwingVantage — AI coach response cache (recommendation #6)
// ------------------------------------------------------------
// Identical coach requests (same context + same question) shouldn't re-hit the
// paid API. This is an APP-LEVEL response cache keyed on a stable hash of the
// structured context — NOT Anthropic prompt caching (the coach system prompt is
// ~500 tokens, below Haiku's 4096-token cacheable minimum, so prompt caching
// never fires there; it's already used on the larger vision prompt).
//
// In-memory + per-instance (keyless). On serverless it helps within a warm
// instance; the cross-instance upgrade is to back this with the existing
// Upstash/KV the rate-limiter uses (owner-gated). Cache logic is pure +
// testable (injectable `now`).
// ============================================================

import type { CoachContext } from '../ai-coach-prompts';

/** Deterministic JSON: object keys sorted recursively so key order never matters. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** Stable cache key from the fields of the context that determine the answer. */
export function cacheKey(ctx: CoachContext): string {
  const question = (ctx.user_question ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return stableStringify({
    sport: ctx.active_sport ?? 'golf',
    question,
    skill: ctx.skill_level ?? null,
    tone: ctx.coaching_tone_hint ?? null,
    diagnosisId: ctx.primary_diagnosis_id ?? null,
    diagnosisName: ctx.primary_diagnosis_name ?? null,
    diagnosisConfidence: ctx.primary_diagnosis_confidence ?? null,
    videoIssue: ctx.primary_video_issue ?? null,
    videoConfidence: ctx.primary_video_issue_confidence ?? null,
    engineSummary: ctx.engine_summary ?? null,
    stats: ctx.current_session_stats ?? null,
    history: ctx.recent_history ?? null,
  });
}

interface Entry<V> {
  value: V;
  expires: number;
}

/** Minimal TTL + LRU cache. Map insertion order = recency; front = least recent. */
export class TtlLruCache<V> {
  private map = new Map<string, Entry<V>>();
  constructor(
    private readonly maxSize = 200,
    private readonly ttlMs = 10 * 60 * 1000,
  ) {}

  get(key: string, now: number = Date.now()): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.expires <= now) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh recency.
    this.map.delete(key);
    this.map.set(key, e);
    return e.value;
  }

  set(key: string, value: V, now: number = Date.now()): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: now + this.ttlMs });
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

// Module-level singleton used by the route (10-minute TTL, 200 entries).
const coachCache = new TtlLruCache<string>(200, 10 * 60 * 1000);

export function getCachedResponse(ctx: CoachContext): string | undefined {
  return coachCache.get(cacheKey(ctx));
}

export function setCachedResponse(ctx: CoachContext, message: string): void {
  if (message) coachCache.set(cacheKey(ctx), message);
}

/** Test-only: reset the shared cache. */
export function __resetCoachCache(): void {
  coachCache.clear();
}
