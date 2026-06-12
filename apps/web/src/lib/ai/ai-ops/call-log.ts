// ============================================================
// SwingVantage — AI Operations: call observability log (server-only)
// ------------------------------------------------------------
// A lightweight, privacy-safe record of recent AI calls so the admin can see
// provider/model/latency/cost/fallback/schema health at a glance. Captures
// SANITIZED METADATA ONLY — never prompts, raw payloads, video, or PII. Mirrors
// the metering store: a capped Upstash list (durable + fleet-wide) with an
// in-memory ring-buffer fallback. Best-effort — recording never throws into the
// call it is observing, and is a no-op cost-wise beyond a single LPUSH/LTRIM.
//
// SECURITY: server-only (reads secret env + calls Upstash). Never import into a
// client component.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import { estimateCostCents } from '@/lib/ai-budget';

const LOG_KEY = 'ai:calls:log';
const LOG_MAX = 200; // keep the most recent N calls (ring-buffer cap)
const LOG_TTL_SECONDS = 604_800; // 7 days

export interface AiCallRecord {
  /** UTC ISO timestamp the call completed. */
  at: string;
  /** Metering operation id (e.g. 'ai-coach', 'video-vision'). */
  op: string;
  /** Orchestrator stage, when known (e.g. 'coach_chat', 'video_intake'). */
  stage: string | null;
  provider: string;
  model: string | null;
  latencyMs: number | null;
  /** Coarse upper-bound cost estimate in cents (same basis as metering). */
  estCostCents: number;
  /** true = a real provider response; false = fallback/keyless/error. */
  ok: boolean;
  /** Fallback reason when not ok ('no_provider' | 'over_budget' | 'error' | null). */
  fallback: string | null;
  /** Did the call request structured (JSON-schema) output? */
  schemaRequested: boolean;
  /** Did structured parsing succeed (null when not requested)? */
  schemaParsed: boolean | null;
}

// ── In-memory ring buffer (per-instance fallback) ───────────
const memory: AiCallRecord[] = [];

function memoryPush(rec: AiCallRecord): void {
  memory.unshift(rec);
  if (memory.length > LOG_MAX) memory.length = LOG_MAX;
}

// ── Upstash Redis REST ──────────────────────────────────────
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

export interface RecordAiCallInput {
  op: string;
  stage?: string | null;
  provider: string;
  model?: string | null;
  latencyMs?: number | null;
  ok: boolean;
  fallback?: string | null;
  schemaRequested?: boolean;
  schemaParsed?: boolean | null;
  /** Override the cost estimate; defaults to the op's metering estimate. */
  estCostCents?: number;
}

/** Sanitize free-form input into a clean, PII-free record. */
function toRecord(input: RecordAiCallInput, nowIso: string): AiCallRecord {
  return {
    at: nowIso,
    op: String(input.op).slice(0, 64),
    stage: input.stage ?? null,
    provider: String(input.provider).slice(0, 32),
    model: input.model ? String(input.model).slice(0, 64) : null,
    latencyMs: input.latencyMs == null ? null : Math.max(0, Math.round(input.latencyMs)),
    estCostCents: input.estCostCents ?? estimateCostCents(input.op),
    ok: !!input.ok,
    fallback: input.fallback ?? null,
    schemaRequested: !!input.schemaRequested,
    schemaParsed: input.schemaRequested ? !!input.schemaParsed : null,
  };
}

/**
 * Record one AI call. Best-effort + never throws — degrades to the in-memory
 * ring buffer when Upstash is unreachable. The timestamp is injected so callers
 * stay testable.
 */
export async function recordAiCall(input: RecordAiCallInput, now: Date = new Date()): Promise<void> {
  let rec: AiCallRecord;
  try {
    rec = toRecord(input, now.toISOString());
  } catch {
    return; // a malformed input must never break the observed call
  }
  memoryPush(rec);
  const creds = upstashCreds();
  if (!creds) return;
  try {
    await upstashPipeline(creds, [
      ['LPUSH', LOG_KEY, JSON.stringify(rec)],
      ['LTRIM', LOG_KEY, '0', String(LOG_MAX - 1)],
      ['EXPIRE', LOG_KEY, String(LOG_TTL_SECONDS)],
    ]);
  } catch {
    /* best-effort — the in-memory copy is already recorded */
  }
}

/** The most recent calls (newest first), up to `limit`. */
export async function getRecentAiCalls(limit = 50): Promise<{ calls: AiCallRecord[]; source: 'upstash' | 'memory' }> {
  const creds = upstashCreds();
  if (creds) {
    try {
      const [vals] = await upstashPipeline(creds, [['LRANGE', LOG_KEY, '0', String(Math.max(0, limit - 1))]]);
      const list = Array.isArray(vals) ? vals : [];
      const calls = list
        .map((v) => {
          try {
            return JSON.parse(String(v)) as AiCallRecord;
          } catch {
            return null;
          }
        })
        .filter((c): c is AiCallRecord => c !== null);
      return { calls, source: 'upstash' };
    } catch {
      return { calls: memory.slice(0, limit), source: 'memory' };
    }
  }
  return { calls: memory.slice(0, limit), source: 'memory' };
}

export interface AiProviderCallStat {
  key: string; // `${provider}` or `${provider}:${op}`
  provider: string;
  calls: number;
  okCalls: number;
  fallbackCalls: number;
  schemaFailures: number;
  avgLatencyMs: number | null;
  estCostCents: number;
}

export interface AiCallStats {
  source: 'upstash' | 'memory';
  total: number;
  okRate: number; // 0..1
  fallbackRate: number;
  schemaFailureRate: number; // of schema-requested calls
  avgLatencyMs: number | null;
  byProvider: AiProviderCallStat[];
}

/** Aggregate the recent-call buffer into per-provider health stats. */
export async function getAiCallStats(limit = LOG_MAX): Promise<AiCallStats> {
  const { calls, source } = await getRecentAiCalls(limit);
  const total = calls.length;
  if (total === 0) {
    return { source, total: 0, okRate: 0, fallbackRate: 0, schemaFailureRate: 0, avgLatencyMs: null, byProvider: [] };
  }

  let ok = 0;
  let fallback = 0;
  let schemaReq = 0;
  let schemaFail = 0;
  let latencySum = 0;
  let latencyN = 0;

  // Per-provider accumulator: latency sum/count kept separately from the public
  // shape so the average is computed cleanly at the end.
  interface Acc extends AiProviderCallStat {
    latSum: number;
    latN: number;
  }
  const prov = new Map<string, Acc>();

  for (const c of calls) {
    if (c.ok) ok += 1;
    if (c.fallback) fallback += 1;
    if (c.schemaRequested) {
      schemaReq += 1;
      if (c.schemaParsed === false) schemaFail += 1;
    }
    if (c.latencyMs != null) {
      latencySum += c.latencyMs;
      latencyN += 1;
    }
    const stat: Acc =
      prov.get(c.provider) ??
      { key: c.provider, provider: c.provider, calls: 0, okCalls: 0, fallbackCalls: 0, schemaFailures: 0, avgLatencyMs: null, estCostCents: 0, latSum: 0, latN: 0 };
    stat.calls += 1;
    if (c.ok) stat.okCalls += 1;
    if (c.fallback) stat.fallbackCalls += 1;
    if (c.schemaRequested && c.schemaParsed === false) stat.schemaFailures += 1;
    stat.estCostCents += c.estCostCents;
    if (c.latencyMs != null) {
      stat.latSum += c.latencyMs;
      stat.latN += 1;
    }
    prov.set(c.provider, stat);
  }

  const byProvider: AiProviderCallStat[] = [...prov.values()].map(({ latSum, latN, ...s }) => ({
    ...s,
    avgLatencyMs: latN > 0 ? Math.round(latSum / latN) : null,
  }));
  byProvider.sort((a, b) => b.calls - a.calls);

  return {
    source,
    total,
    okRate: ok / total,
    fallbackRate: fallback / total,
    schemaFailureRate: schemaReq > 0 ? schemaFail / schemaReq : 0,
    avgLatencyMs: latencyN > 0 ? Math.round(latencySum / latencyN) : null,
    byProvider,
  };
}

/** Test-only introspection — exercises the in-memory path without a network. */
export const __callLogTest__ = {
  reset: () => {
    memory.length = 0;
  },
  size: () => memory.length,
};
