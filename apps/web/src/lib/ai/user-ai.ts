// ============================================================
// SwingVantage — Per-user AI access + usage metering (server-only)
// ------------------------------------------------------------
// Two related capabilities layered on top of the existing fleet-wide AI
// guard (lib/ai-budget):
//
//   1. A per-user ON/OFF switch. An operator can disable AI for a single
//      account (abuse, cost, a paused plan) without touching everyone else.
//      The AI routes consult `isUserAiBlocked()` and serve their existing
//      honest "configured:false" pause message — never a fabricated reply.
//
//   2. Per-user usage metering. Every successful paid call is recorded
//      against the calling user (calls + estimated cents, per operation,
//      per UTC day) so the admin user-detail page can answer "how much AI
//      has this account used, and on what?".
//
// Storage mirrors the budget-override pattern in lib/ai-budget exactly:
// durable + fleet-wide when Upstash is configured, a per-instance in-memory
// best-effort fallback otherwise (the admin UI says which). Keyless-first:
// with no provider key no paid call succeeds, so nothing is ever metered.
//
// SECURITY: server-only (reads secret env + calls Upstash). Never import
// into a client component.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import {
  estimateCostCents,
  aiOpLabel,
  isAiUsageMeteringEnabled,
  AI_OP_COST_CENTS,
} from '@/lib/ai-budget';

// ── Key namespaces (kept distinct from the fleet-wide ai:* keys) ──
const BLOCK_PREFIX = 'ai:user:blocked:'; // + userId → "1" when AI is OFF
const BLOCK_SET_KEY = 'ai:user:blocked:set'; // Redis SET index of blocked ids
const USAGE_PREFIX = 'ai:user:usage:'; // + cents|count : userId : op : day
const USAGE_TTL_SECONDS = 3_024_000; // 35 days — matches the global usage window
const USAGE_HISTORY_MAX_DAYS = 35;

/** UTC day key (YYYY-MM-DD) so windows are unambiguous across instances. */
function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * A user id is "real" when it identifies an account we can gate/meter.
 * Logged-out traffic resolves to 'anonymous' upstream — never blocked or
 * metered per-user (only the global guard applies to it).
 */
function isRealUserId(userId: string | null | undefined): userId is string {
  return typeof userId === 'string' && userId.length > 0 && userId !== 'anonymous';
}

// ── Upstash Redis REST (shared) + in-memory fallback ─────────
// Self-contained, mirroring lib/ai-budget + lib/rate-limit (each keeps its own
// tiny client). A per-user check must never hang the request it guards.
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

// Per-instance fallbacks (reset on cold start; durable cap needs Upstash).
const blockedMemory = new Set<string>();
const usageMemory = new Map<string, number>();

function pruneUsageMemory(): void {
  if (usageMemory.size <= USAGE_HISTORY_MAX_DAYS * 256) return;
  const cutoff = new Date(Date.now() - USAGE_HISTORY_MAX_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  for (const k of usageMemory.keys()) {
    if (k.slice(-10) < cutoff) usageMemory.delete(k);
  }
}

// ── Per-user ON/OFF switch ───────────────────────────────────

function blockKey(userId: string): string {
  return BLOCK_PREFIX + userId;
}

/**
 * True when an operator has switched AI OFF for this account. Anonymous /
 * empty ids are never blocked. Never throws — any Upstash error degrades to
 * the in-memory set (and ultimately to "not blocked", failing open so a
 * transient KV outage can't lock everyone out of analysis).
 */
export async function isUserAiBlocked(userId: string | null | undefined): Promise<boolean> {
  if (!isRealUserId(userId)) return false;
  const creds = upstashCreds();
  if (creds) {
    try {
      const [val] = await upstashPipeline(creds, [['GET', blockKey(userId)]]);
      return val === '1' || val === 1;
    } catch {
      return blockedMemory.has(userId);
    }
  }
  return blockedMemory.has(userId);
}

/**
 * Switch AI on/off for a single account. Best-effort durable: the in-memory
 * set is always updated so the change holds on this instance even if Upstash
 * is unreachable.
 */
export async function setUserAiBlocked(userId: string, blocked: boolean): Promise<void> {
  if (!isRealUserId(userId)) return;
  if (blocked) blockedMemory.add(userId);
  else blockedMemory.delete(userId);

  const creds = upstashCreds();
  if (!creds) return;
  try {
    if (blocked) {
      await upstashPipeline(creds, [
        ['SET', blockKey(userId), '1'],
        ['SADD', BLOCK_SET_KEY, userId],
      ]);
    } else {
      await upstashPipeline(creds, [
        ['DEL', blockKey(userId)],
        ['SREM', BLOCK_SET_KEY, userId],
      ]);
    }
  } catch {
    /* best-effort — the in-memory set already reflects the change */
  }
}

/** The set of account ids currently switched OFF (for an admin overview). */
export async function listBlockedAiUsers(): Promise<{ ids: string[]; source: 'upstash' | 'memory' }> {
  const creds = upstashCreds();
  if (creds) {
    try {
      const [members] = await upstashPipeline(creds, [['SMEMBERS', BLOCK_SET_KEY]]);
      const ids = Array.isArray(members) ? (members as unknown[]).map(String) : [];
      return { ids, source: 'upstash' };
    } catch {
      return { ids: [...blockedMemory], source: 'memory' };
    }
  }
  return { ids: [...blockedMemory], source: 'memory' };
}

// ── Per-user usage metering ──────────────────────────────────

function usageCentsKey(userId: string, op: string, day = dayKey()): string {
  return `${USAGE_PREFIX}cents:${userId}:${op}:${day}`;
}

function usageCountKey(userId: string, op: string, day = dayKey()): string {
  return `${USAGE_PREFIX}count:${userId}:${op}:${day}`;
}

/**
 * Record one successful paid call against a user's per-operation / per-day
 * history. No-op for anonymous ids or when metering is off (the keyless case).
 * Best-effort: never throws, and degrades to the per-instance map.
 */
export async function meterUserAiUsage(userId: string | null | undefined, op: string): Promise<void> {
  if (!isRealUserId(userId)) return;
  if (!isAiUsageMeteringEnabled()) return;
  const cents = estimateCostCents(op);
  const centsKey = usageCentsKey(userId, op);
  const countKey = usageCountKey(userId, op);
  const creds = upstashCreds();
  if (creds) {
    try {
      await upstashPipeline(creds, [
        ['INCRBY', centsKey, String(cents)],
        ['EXPIRE', centsKey, String(USAGE_TTL_SECONDS), 'NX'],
        ['INCRBY', countKey, '1'],
        ['EXPIRE', countKey, String(USAGE_TTL_SECONDS), 'NX'],
      ]);
      return;
    } catch {
      /* fall through to the in-memory map */
    }
  }
  usageMemory.set(centsKey, (usageMemory.get(centsKey) ?? 0) + cents);
  usageMemory.set(countKey, (usageMemory.get(countKey) ?? 0) + 1);
  pruneUsageMemory();
}

export interface UserAiUsageOpRow {
  op: string;
  label: string;
  calls: number;
  cents: number;
}

export interface UserAiUsageDayRow {
  date: string;
  calls: number;
  cents: number;
}

export interface UserAiUsageReport {
  /** Whether metering is active (else nothing is being recorded). */
  enabled: boolean;
  /** Trailing days covered (inclusive of today). */
  windowDays: number;
  /** Where the counts came from. */
  source: 'upstash' | 'memory' | 'off';
  /** Window totals. */
  totals: { calls: number; cents: number };
  /** Today's totals (UTC). */
  today: { date: string; calls: number; cents: number };
  /** Per-operation totals over the window, busiest (by est. cost) first. */
  byOp: UserAiUsageOpRow[];
  /** Per-day totals, most recent first. */
  byDay: UserAiUsageDayRow[];
}

function windowDayList(days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i += 1) {
    out.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Per-operation + per-day AI usage for ONE account over a trailing window.
 * Reads are batched into a single Upstash pipeline (or the in-memory map).
 * Counts are honest call totals; cents are clearly-labelled upper-bound
 * estimates (the same per-op estimates the fleet-wide report uses).
 */
export async function getUserAiUsage(userId: string, days = 14): Promise<UserAiUsageReport> {
  const enabled = isAiUsageMeteringEnabled();
  const today = dayKey();
  const empty: UserAiUsageReport = {
    enabled,
    windowDays: days,
    source: enabled ? 'memory' : 'off',
    totals: { calls: 0, cents: 0 },
    today: { date: today, calls: 0, cents: 0 },
    byOp: [],
    byDay: windowDayList(days).map((d) => ({ date: d, calls: 0, cents: 0 })),
  };
  if (!isRealUserId(userId)) return { ...empty, source: 'off' };

  const ops = Object.keys(AI_OP_COST_CENTS);
  const daysList = windowDayList(days);

  const keys: string[] = [];
  for (const op of ops) {
    for (const d of daysList) {
      keys.push(usageCentsKey(userId, op, d));
      keys.push(usageCountKey(userId, op, d));
    }
  }

  const reads = new Map<string, number>();
  const creds = upstashCreds();
  let source: UserAiUsageReport['source'] = enabled ? 'memory' : 'off';
  if (creds) {
    try {
      const results = await upstashPipeline(creds, keys.map((k) => ['GET', k]));
      results.forEach((v, i) => reads.set(keys[i], Number(v ?? 0) || 0));
      source = 'upstash';
    } catch {
      keys.forEach((k) => reads.set(k, usageMemory.get(k) ?? 0));
      source = 'memory';
    }
  } else {
    keys.forEach((k) => reads.set(k, usageMemory.get(k) ?? 0));
  }

  const byOp: UserAiUsageOpRow[] = [];
  const dayAgg = new Map<string, { calls: number; cents: number }>();
  daysList.forEach((d) => dayAgg.set(d, { calls: 0, cents: 0 }));
  let totalCalls = 0;
  let totalCents = 0;
  let todayCalls = 0;
  let todayCents = 0;

  for (const op of ops) {
    let opCalls = 0;
    let opCents = 0;
    for (const d of daysList) {
      const cents = reads.get(usageCentsKey(userId, op, d)) ?? 0;
      const count = reads.get(usageCountKey(userId, op, d)) ?? 0;
      opCalls += count;
      opCents += cents;
      const agg = dayAgg.get(d)!;
      agg.calls += count;
      agg.cents += cents;
      if (d === today) {
        todayCalls += count;
        todayCents += cents;
      }
    }
    if (opCalls > 0 || opCents > 0) {
      byOp.push({ op, label: aiOpLabel(op), calls: opCalls, cents: opCents });
    }
    totalCalls += opCalls;
    totalCents += opCents;
  }

  byOp.sort((a, b) => b.cents - a.cents || b.calls - a.calls);
  const byDay: UserAiUsageDayRow[] = daysList.map((d) => ({ date: d, ...dayAgg.get(d)! }));

  return {
    enabled,
    windowDays: days,
    source,
    totals: { calls: totalCalls, cents: totalCents },
    today: { date: today, calls: todayCalls, cents: todayCents },
    byOp,
    byDay,
  };
}

// ── Per-user daily spend cap (automatic pause) ───────────────
// A dollar ceiling applied to EACH account's own metered spend per UTC day.
// Once a user's estimated spend today reaches the cap, AI auto-pauses for that
// user (their routes serve the same honest keyless fallback) until 00:00 UTC,
// without an operator manually flipping the per-user switch. This is the
// per-user analogue of the fleet-wide daily cap in lib/ai-budget.
//
// Storage mirrors the budget-override pattern: a single durable Upstash key
// (no day suffix) so the cap is fleet-wide + survives restarts; a per-instance
// in-memory value otherwise (the admin UI says which).
//   null  = no override → use the AI_PER_USER_DAILY_BUDGET_CENTS env default
//   0     = explicitly uncapped (operator chose "no per-user limit")
//   >0    = the cap, in cents
const CAP_OVERRIDE_KEY = 'ai:user:cap:cents';
let capOverrideMemory: number | null = null;

/** Deploy-time default per-user daily cap in cents (0 = off / unlimited). */
export function perUserDailyCapEnvCents(): number {
  const raw = process.env.AI_PER_USER_DAILY_BUDGET_CENTS;
  if (!isConfigured(raw)) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** The admin override cap in cents, or null when unset (use env). */
export async function getUserCapOverrideCents(): Promise<number | null> {
  const creds = upstashCreds();
  if (creds) {
    try {
      const [val] = await upstashPipeline(creds, [['GET', CAP_OVERRIDE_KEY]]);
      if (val === null || val === undefined) return null;
      const n = Number(val);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    } catch {
      return capOverrideMemory;
    }
  }
  return capOverrideMemory;
}

/** Set (or clear, with null) the admin per-user cap override. Best-effort durable. */
export async function setUserCapOverrideCents(cents: number | null): Promise<void> {
  capOverrideMemory = cents == null ? null : Math.max(0, Math.floor(cents));
  const creds = upstashCreds();
  if (!creds) return;
  try {
    if (cents == null) await upstashPipeline(creds, [['DEL', CAP_OVERRIDE_KEY]]);
    else await upstashPipeline(creds, [['SET', CAP_OVERRIDE_KEY, String(Math.max(0, Math.floor(cents)))]]);
  } catch {
    /* best-effort — the in-memory value is already set */
  }
}

/** Effective per-user daily cap in cents: admin override when set, else env. 0 = uncapped. */
export async function resolvedUserDailyCapCents(): Promise<number> {
  const override = await getUserCapOverrideCents();
  return override != null ? override : perUserDailyCapEnvCents();
}

/** Sum of a single account's estimated metered spend (cents) so far today (UTC). */
async function getUserTodayCents(userId: string): Promise<number> {
  const ops = Object.keys(AI_OP_COST_CENTS);
  const keys = ops.map((op) => usageCentsKey(userId, op));
  const creds = upstashCreds();
  if (creds) {
    try {
      const results = await upstashPipeline(creds, keys.map((k) => ['GET', k]));
      return results.reduce<number>((sum, v) => sum + (Number(v ?? 0) || 0), 0);
    } catch {
      /* fall through to the in-memory map */
    }
  }
  return keys.reduce<number>((sum, k) => sum + (usageMemory.get(k) ?? 0), 0);
}

/**
 * True when this account's estimated spend today has reached the per-user cap.
 * Anonymous ids and an unset cap (0) are never capped. Never throws — any KV
 * error fails OPEN (returns false) so a transient outage can't lock out paying
 * users, exactly like the manual switch.
 */
export async function userAiCapExceeded(userId: string | null | undefined): Promise<boolean> {
  if (!isRealUserId(userId)) return false;
  const cap = await resolvedUserDailyCapCents();
  if (cap <= 0) return false;
  try {
    return (await getUserTodayCents(userId)) >= cap;
  } catch {
    return false;
  }
}

/**
 * The single enforcement gate the AI routes consult: AI is paused for a user
 * when an operator switched them OFF *or* they have hit their daily cap. Serves
 * as a drop-in replacement for `isUserAiBlocked` at the chokepoints.
 */
export async function isUserAiPaused(userId: string | null | undefined): Promise<boolean> {
  if (!isRealUserId(userId)) return false;
  if (await isUserAiBlocked(userId)) return true;
  return userAiCapExceeded(userId);
}

export interface UserAiCapStatus {
  /** Whether a positive per-user daily cap is set. */
  configured: boolean;
  /** The active cap in cents (0 when off). */
  limitCents: number;
  /** Where the active cap comes from. */
  limitSource: 'override' | 'env' | 'off';
  /** Where a durable override would be stored. */
  source: 'upstash' | 'memory';
}

/** Snapshot of the per-user daily cap for the admin editor. */
export async function getUserAiCapStatus(): Promise<UserAiCapStatus> {
  const override = await getUserCapOverrideCents();
  const envCents = perUserDailyCapEnvCents();
  const limitCents = override != null ? override : envCents;
  const limitSource: UserAiCapStatus['limitSource'] =
    override != null ? 'override' : envCents > 0 ? 'env' : 'off';
  return {
    configured: limitCents > 0,
    limitCents,
    limitSource,
    source: upstashCreds() ? 'upstash' : 'memory',
  };
}

/**
 * Test-only introspection — not part of the public API. Exercises the
 * in-memory path deterministically without a network round-trip.
 */
export const __test__ = {
  reset: () => {
    blockedMemory.clear();
    usageMemory.clear();
    capOverrideMemory = null;
  },
  blockedMemoryHas: (userId: string) => blockedMemory.has(userId),
  usageMemoryCents: (userId: string, op: string, date?: string) =>
    usageMemory.get(usageCentsKey(userId, op, date)) ?? 0,
  usageMemoryCount: (userId: string, op: string, date?: string) =>
    usageMemory.get(usageCountKey(userId, op, date)) ?? 0,
};
