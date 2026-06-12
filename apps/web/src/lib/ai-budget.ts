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

import {
  isConfigured,
  isAiCoachConfigured,
  isAiVisionConfigured,
  isOcrConfigured,
} from '@/lib/capabilities';

const COUNTER_PREFIX = 'ai:spend:cents:';
const COUNTER_TTL_SECONDS = 172_800; // 48h — covers the active UTC day + slack

// ── Usage metering (per-operation + daily history) ──────────
// The budget COUNTER above is a single fleet-wide total that only runs when a
// ceiling is armed. Metering is a richer, lower-stakes layer: it records every
// paid call broken down by operation and by UTC day so the admin AI-usage page
// can show "what's costing money and when". Kept in a SEPARATE key namespace
// (and a separate in-memory map) so it never perturbs the kill-switch counter.
const USAGE_PREFIX = 'ai:usage:';
const USAGE_TTL_SECONDS = 3_024_000; // 35 days — covers the history window + slack
const USAGE_HISTORY_MAX_DAYS = 35;

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

// ── Admin-editable override (durable when Upstash is configured) ──
// Lets the daily cap be changed from the admin dashboard WITHOUT a redeploy.
// Stored in the same Upstash the counter uses — a single persistent key (no day
// suffix) — so it survives restarts and is shared fleet-wide. Without Upstash it
// falls back to a per-instance value that resets on restart (the UI says so).
//   null  = no override → use the AI_DAILY_BUDGET_CENTS env default
//   0     = explicitly uncapped (admin chose "no limit")
//   >0    = the cap, in cents
const OVERRIDE_KEY = 'ai:budget:override:cents';
let overrideMemory: number | null = null;

/** The admin override cap in cents, or null when unset (use env). */
export async function getBudgetOverrideCents(): Promise<number | null> {
  const creds = upstashCreds();
  if (creds) {
    try {
      const [val] = await upstashPipeline(creds, [['GET', OVERRIDE_KEY]]);
      if (val === null || val === undefined) return null;
      const n = Number(val);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    } catch {
      return overrideMemory;
    }
  }
  return overrideMemory;
}

/** Set (or clear, with null) the admin override cap. Best-effort durable. */
export async function setBudgetOverrideCents(cents: number | null): Promise<void> {
  overrideMemory = cents == null ? null : Math.max(0, Math.floor(cents));
  const creds = upstashCreds();
  if (!creds) return;
  try {
    if (cents == null) await upstashPipeline(creds, [['DEL', OVERRIDE_KEY]]);
    else await upstashPipeline(creds, [['SET', OVERRIDE_KEY, String(Math.max(0, Math.floor(cents)))]]);
  } catch {
    /* best-effort — the in-memory value is already set */
  }
}

/** Effective daily cap in cents: admin override when set, else the env default. 0 = uncapped. */
export async function resolvedDailyBudgetCents(): Promise<number> {
  const override = await getBudgetOverrideCents();
  return override != null ? override : dailyBudgetCents();
}

export interface AiBudgetStatus {
  /** Whether a positive daily ceiling is set (the guard is armed). */
  configured: boolean;
  /** The configured ceiling in cents (0 when off). */
  limitCents: number;
  /** Where the active cap comes from: admin override, the env default, or off. */
  limitSource: 'override' | 'env' | 'off';
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
  const override = await getBudgetOverrideCents();
  const envCents = dailyBudgetCents();
  const limitCents = override != null ? override : envCents;
  const limitSource: AiBudgetStatus['limitSource'] =
    override != null ? 'override' : envCents > 0 ? 'env' : 'off';
  const date = dayKey();
  if (limitCents <= 0) {
    return {
      configured: false,
      limitCents: 0,
      limitSource: 'off',
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
    limitSource,
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
  const limitCents = await resolvedDailyBudgetCents();
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
  // Metering runs first and on its own gate, so usage history is captured even
  // when no kill-switch ceiling is armed (the common "track but don't cap" case).
  await meterAiUsage(op);

  if ((await resolvedDailyBudgetCents()) <= 0) return;
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

// ============================================================
// Usage metering — per-operation + daily history
// ============================================================

/** True when any paid AI provider key is configured (real spend can occur). */
function anyAiProviderConfigured(): boolean {
  return isAiCoachConfigured() || isAiVisionConfigured() || isOcrConfigured();
}

/**
 * Whether usage metering is active. Enabled when there is real spend to track
 * (a provider configured), when a budget ceiling is armed, or when explicitly
 * forced via AI_USAGE_METERING. Disabled (zero work, zero latency) only in the
 * fully-keyless case where no paid call can happen anyway.
 */
export function isAiUsageMeteringEnabled(): boolean {
  const forced = process.env.AI_USAGE_METERING;
  if (isConfigured(forced) && !/^(0|false|off|no)$/i.test(forced!.trim())) return true;
  return dailyBudgetCents() > 0 || anyAiProviderConfigured();
}

function usageCentsKey(op: string, day = dayKey()): string {
  return `${USAGE_PREFIX}cents:${op}:${day}`;
}

function usageCountKey(op: string, day = dayKey()): string {
  return `${USAGE_PREFIX}count:${op}:${day}`;
}

// Separate in-memory map for the per-instance fallback so metering never evicts
// the budget counter (different lifetimes, different eviction).
const usageMemory = new Map<string, number>();

/** Drop entries older than the history window so the map can't grow unbounded. */
function pruneUsageMemory(): void {
  if (usageMemory.size <= USAGE_HISTORY_MAX_DAYS * 64) return;
  const cutoff = new Date(Date.now() - USAGE_HISTORY_MAX_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  for (const k of usageMemory.keys()) {
    const day = k.slice(-10); // keys end in YYYY-MM-DD
    if (day < cutoff) usageMemory.delete(k);
  }
}

function usageMemoryAdd(key: string, n: number): void {
  usageMemory.set(key, (usageMemory.get(key) ?? 0) + n);
  pruneUsageMemory();
}

/**
 * Record one paid call against the per-operation / per-day usage history.
 * No-op when metering is off. Best-effort: never throws, and degrades to the
 * per-instance map when Upstash is unreachable.
 */
export async function meterAiUsage(op: string): Promise<void> {
  if (!isAiUsageMeteringEnabled()) return;
  const cents = estimateCostCents(op);
  const centsKey = usageCentsKey(op);
  const countKey = usageCountKey(op);
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
      // fall through to the in-memory map
    }
  }
  usageMemoryAdd(centsKey, cents);
  usageMemoryAdd(countKey, 1);
}

/** Human-friendly label for a metered operation id. */
const OP_LABELS: Record<string, string> = {
  'ai-coach': 'AI coaching answers',
  'video-vision': 'Swing video vision',
  'video-analysis': 'Swing video analysis',
  ocr: 'Import OCR (photo → data)',
  narrative: 'Journey narratives',
  'recruiting-summary': 'Recruiting summaries',
  'growth-ai': 'Growth AI',
  'social-generate': 'Social post generation',
  agents: 'Agent enhancements',
};

export function aiOpLabel(op: string): string {
  return OP_LABELS[op] ?? op;
}

export interface AiUsageOpRow {
  op: string;
  label: string;
  calls: number;
  cents: number;
}

export interface AiUsageDayRow {
  date: string;
  calls: number;
  cents: number;
}

export interface AiUsageReport {
  /** Whether metering is active (else: nothing is being recorded yet). */
  enabled: boolean;
  /** How many trailing days the report covers (inclusive of today). */
  windowDays: number;
  /** Where the counts came from. */
  source: 'upstash' | 'memory' | 'off';
  /** Window totals. */
  totals: { calls: number; cents: number };
  /** Today's totals (UTC). */
  today: { date: string; calls: number; cents: number };
  /** Per-operation totals over the window, busiest (by est. cost) first. */
  byOp: AiUsageOpRow[];
  /** Per-day totals, most recent first. */
  byDay: AiUsageDayRow[];
}

/** The UTC days in the window, most recent first. */
function windowDays(days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i += 1) {
    out.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Per-operation + per-day AI usage over a trailing window. Reads are batched
 * into a single Upstash pipeline (or the in-memory map), and counts are honest
 * call totals while cents are clearly-labelled upper-bound estimates.
 */
export async function getAiUsageReport(days = 14): Promise<AiUsageReport> {
  const enabled = isAiUsageMeteringEnabled();
  const ops = Object.keys(AI_OP_COST_CENTS);
  const daysList = windowDays(days);
  const today = dayKey();

  // Read every (op, day) cents+count cell.
  const reads = new Map<string, number>(); // key → value
  const creds = upstashCreds();
  let source: AiUsageReport['source'] = enabled ? 'memory' : 'off';

  const keys: string[] = [];
  for (const op of ops) {
    for (const d of daysList) {
      keys.push(usageCentsKey(op, d));
      keys.push(usageCountKey(op, d));
    }
  }

  if (creds) {
    try {
      const results = await upstashPipeline(
        creds,
        keys.map((k) => ['GET', k]),
      );
      results.forEach((v, i) => reads.set(keys[i], Number(v ?? 0) || 0));
      source = 'upstash';
    } catch {
      keys.forEach((k) => reads.set(k, usageMemory.get(k) ?? 0));
      source = 'memory';
    }
  } else {
    keys.forEach((k) => reads.set(k, usageMemory.get(k) ?? 0));
  }

  const byOp: AiUsageOpRow[] = [];
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
      const cents = reads.get(usageCentsKey(op, d)) ?? 0;
      const count = reads.get(usageCountKey(op, d)) ?? 0;
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
  const byDay: AiUsageDayRow[] = daysList.map((d) => ({ date: d, ...dayAgg.get(d)! }));

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

// ============================================================
// Provider billing — "pay for more usage" deep links
// ============================================================

export interface AiBillingLink {
  id: 'anthropic' | 'openai' | 'google' | 'upstash';
  name: string;
  url: string;
  detail: string;
  /** True when this provider's key is configured (i.e. it's actually billing you). */
  configured: boolean;
}

/**
 * Deep links to each AI provider's own billing/credits console so the operator
 * can top up capacity without leaving the admin dashboard (payment completes on
 * the provider's secure page). Configured providers are returned first.
 */
export function getAiProviderBilling(): { links: AiBillingLink[]; configuredCount: number } {
  const links: AiBillingLink[] = [
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      url: 'https://console.anthropic.com/settings/billing',
      detail: 'Add credits or raise your monthly spend limit for Claude (vision + coaching).',
      configured: isConfigured(process.env.ANTHROPIC_API_KEY),
    },
    {
      id: 'openai',
      name: 'OpenAI',
      url: 'https://platform.openai.com/settings/organization/billing/overview',
      detail: 'Top up prepaid credits or manage your OpenAI usage limits.',
      configured: isConfigured(process.env.OPENAI_API_KEY),
    },
    {
      id: 'google',
      name: 'Google AI (Gemini)',
      url: 'https://console.cloud.google.com/billing',
      detail: 'Manage the Google Cloud billing account behind the Gemini API.',
      configured: isConfigured(process.env.GOOGLE_AI_API_KEY),
    },
    {
      id: 'upstash',
      name: 'Upstash (spend counter)',
      url: 'https://console.upstash.com/',
      detail: 'The Redis that powers the fleet-wide spend cap — not an AI provider, but part of the guard.',
      configured: upstashCreds() !== null,
    },
  ];
  links.sort((a, b) => Number(b.configured) - Number(a.configured));
  return { links, configuredCount: links.filter((l) => l.configured).length };
}

/**
 * Test-only introspection — not part of the public API. Lets unit tests
 * exercise the in-memory path deterministically without a network.
 */
export const __test__ = {
  reset: () => {
    memory.clear();
    usageMemory.clear();
    overrideMemory = null;
  },
  memoryUsed: (date?: string) => memoryGet(COUNTER_PREFIX + (date ?? dayKey())),
  counterKey: () => counterKey(),
  usageMemoryUsed: (op: string, date?: string) => usageMemory.get(usageCentsKey(op, date)) ?? 0,
  usageMemoryCount: (op: string, date?: string) => usageMemory.get(usageCountKey(op, date)) ?? 0,
};
