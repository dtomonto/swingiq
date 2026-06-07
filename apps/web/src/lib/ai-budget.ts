// ============================================================
// SwingVantage — Global AI spend guard (server-only)
//
// Per-IP rate limits (lib/rate-limit) slow a SINGLE abuser; a distributed
// botnet of many real IPs can still accumulate AI cost. This adds a global,
// fleet-wide daily kill-switch: once the day's estimated AI spend reaches
// AI_DAILY_BUDGET_CENTS, paid model calls are skipped and routes serve their
// existing keyless/deterministic fallback until the next UTC day.
//
// OFF BY DEFAULT. With AI_DAILY_BUDGET_CENTS unset or 0 there is no ceiling,
// no tracking, and zero added latency — behaviour is identical to before.
// Set it (e.g. 500 = $5.00/day) to arm the guard. Mirrors the existing
// *_CENTS convention (e.g. VIDEO_STUDIO_MAX_COST_CENTS).
//
// Distributed when Upstash is configured (a counter SHARED across every
// serverless instance, exactly like the rate limiter); otherwise a per-
// instance in-memory best-effort fallback. Costs are COARSE UPPER-BOUND
// estimates — the guard intentionally errs toward protecting the wallet
// (it may trip slightly early), and the admin panel labels them "estimated".
//
// SECURITY: server-only (reads secret env + calls Upstash). Never import
// into client components.
// ============================================================

import { isConfigured } from '@/lib/capabilities';

const COUNTER_PREFIX = 'ai:spend:cents:';
const COUNTER_TTL_SECONDS = 172_800; // 48h — covers the active UTC day + slack

/**
 * Coarse, conservative per-operation cost estimates in whole cents. Vision /
 * multi-frame calls cost more than a short text completion. These are upper-
 * bound guesses, not billed amounts — keep them rough and slightly high so
 * the guard protects spend rather than under-counting it.
 */
export const AI_OP_COST_CENTS: Record<string, number> = {
  'ai-coach': 1,
  'video-vision': 5,
  'video-analysis': 5,
  ocr: 4,
  narrative: 1,
  'recruiting-summary': 1,
  'growth-ai': 1,
  'social-generate': 1,
  agents: 1,
};

/** Estimated cost (cents) for an operation; unknown ops default to 1c. */
export function estimateCostCents(op: string): number {
  return AI_OP_COST_CENTS[op] ?? 1;
}

/** UTC day key, so the budget window is unambiguous across instances. */
function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

function counterKey(now = new Date()): string {
  return COUNTER_PREFIX + dayKey(now);
}

/** Configured daily ceiling in cents (0 = off / unlimited). */
export function dailyBudgetCents(): number {
  const raw = process.env.AI_DAILY_BUDGET_CENTS;
  if (!isConfigured(raw)) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** True when an operator has armed the guard with a positive ceiling. */
export function isAiBudgetConfigured(): boolean {
  return dailyBudgetCents() > 0;
}

export interface AiBudgetStatus {
  /** Whether a positive daily ceiling is set (the guard is armed). */
  configured: boolean;
  /** The configured ceiling in cents (0 when off). */
  limitCents: number;
  /** Estimated spend so far today, in cents. */
  usedCents: number;
  /** Cents remaining before the guard trips (0 when off or exhausted). */
  remainingCents: number;
  /** True when today's estimated spend has reached the ceiling. */
  exceeded: boolean;
  /** UTC date (YYYY-MM-DD) the counter applies to. */
  date: string;
  /** Where the count came from: shared Upstash, per-instance memory, or off. */
  source: 'upstash' | 'memory' | 'off';
}

// ── In-memory fallback (per-instance) ───────────────────────
// Used in dev/single-instance, or when Upstash is unreachable. Resets on cold
// starts; a true fleet-wide cap needs Upstash (same trade-off as rate-limit).
const memory = new Map<string, number>();

function memoryGet(key: string): number {
  return memory.get(key) ?? 0;
}

function memoryAdd(key: string, cents: number): number {
  // Only a couple of day-keys are ever live; keep the map from leaking.
  if (memory.size > 8) {
    for (const k of memory.keys()) if (k !== key) memory.delete(k);
  }
  const next = memoryGet(key) + cents;
  memory.set(key, next);
  return next;
}

// ── Upstash Redis REST (shared across instances) ────────────
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
    headers: {
      Authorization: `Bearer ${creds.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    // A budget check must never hang the request it is guarding.
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

async function readUsedCents(
  creds: UpstashCreds | null,
  key: string,
): Promise<{ used: number; source: 'upstash' | 'memory' }> {
  if (creds) {
    try {
      const [val] = await upstashPipeline(creds, [['GET', key]]);
      return { used: Number(val ?? 0) || 0, source: 'upstash' };
    } catch {
      return { used: memoryGet(key), source: 'memory' };
    }
  }
  return { used: memoryGet(key), source: 'memory' };
}

/** Snapshot of today's estimated AI spend vs the configured ceiling. */
export async function getAiBudgetStatus(): Promise<AiBudgetStatus> {
  const limitCents = dailyBudgetCents();
  const date = dayKey();
  if (limitCents <= 0) {
    return {
      configured: false,
      limitCents: 0,
      usedCents: 0,
      remainingCents: 0,
      exceeded: false,
      date,
      source: 'off',
    };
  }
  const { used, source } = await readUsedCents(upstashCreds(), counterKey());
  return {
    configured: true,
    limitCents,
    usedCents: used,
    remainingCents: Math.max(0, limitCents - used),
    exceeded: used >= limitCents,
    date,
    source,
  };
}

/**
 * True when today's estimated AI spend has reached the ceiling. ALWAYS false
 * when the guard is off (no env set), so callers behave exactly as before.
 * Never throws — any Upstash error degrades to the in-memory count.
 */
export async function aiBudgetExceeded(): Promise<boolean> {
  const limitCents = dailyBudgetCents();
  if (limitCents <= 0) return false;
  const { used } = await readUsedCents(upstashCreds(), counterKey());
  return used >= limitCents;
}

/**
 * Record an estimated paid-call cost against today's budget. No-op when the
 * guard is off (zero tracking, zero latency). Best-effort: never throws, and
 * degrades to the per-instance counter if Upstash is unreachable.
 */
export async function recordAiSpend(op: string): Promise<void> {
  if (dailyBudgetCents() <= 0) return;
  const cents = estimateCostCents(op);
  if (cents <= 0) return;
  const key = counterKey();
  const creds = upstashCreds();
  if (creds) {
    try {
      await upstashPipeline(creds, [
        ['INCRBY', key, String(cents)],
        // Set the TTL only on the first hit of the day so the key self-expires.
        ['EXPIRE', key, String(COUNTER_TTL_SECONDS), 'NX'],
      ]);
      return;
    } catch {
      // fall through to the in-memory counter
    }
  }
  memoryAdd(key, cents);
}

/**
 * Test-only introspection — not part of the public API. Lets unit tests
 * exercise the in-memory path deterministically without a network.
 */
export const __test__ = {
  reset: () => memory.clear(),
  memoryUsed: (date?: string) => memoryGet(COUNTER_PREFIX + (date ?? dayKey())),
  counterKey: () => counterKey(),
};
