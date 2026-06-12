// ============================================================
// SwingVantage — AI Operations: durable routing override store (server-only)
// ------------------------------------------------------------
// Lets an admin re-route a task (provider / model / enabled) from the dashboard
// WITHOUT a redeploy. Mirrors the AI-budget override pattern exactly: a single
// persistent Upstash key (fleet-wide + durable) with a per-instance in-memory
// fallback that the UI labels honestly. The env-driven model-config remains the
// DEFAULT; an override only layers on top of it.
//
//   no entry for a stage  → use the env/config default
//   { provider }          → force this provider for the stage
//   { model }             → force this model id ('' / null clears → tier default)
//   { enabled }           → force the stage on/off (e.g. enable Claude narrative)
//
// SECURITY: server-only (reads secret env + calls Upstash). Never import into a
// client component — the admin page reads it through a server action / route.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import type { AiProviderName, ProviderStage } from './schemas';

export interface RoutingOverride {
  provider?: AiProviderName;
  /** Explicit model id; '' is treated as "clear" (back to the tier default). */
  model?: string | null;
  enabled?: boolean;
}

export type RoutingOverrides = Partial<Record<ProviderStage, RoutingOverride>>;

const OVERRIDES_KEY = 'ai:routing:overrides';

// Per-instance fallback (dev / single instance / Upstash unreachable). Resets on
// cold start — a true fleet-wide override needs Upstash (same trade-off as caps).
let memory: RoutingOverrides = {};

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

/** Sanitize an arbitrary parsed value into a clean RoutingOverrides object. */
function sanitize(raw: unknown): RoutingOverrides {
  if (!raw || typeof raw !== 'object') return {};
  const out: RoutingOverrides = {};
  for (const [stage, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    const entry: RoutingOverride = {};
    if (typeof o.provider === 'string') entry.provider = o.provider as AiProviderName;
    if (typeof o.model === 'string') entry.model = o.model;
    else if (o.model === null) entry.model = null;
    if (typeof o.enabled === 'boolean') entry.enabled = o.enabled;
    if (Object.keys(entry).length > 0) out[stage as ProviderStage] = entry;
  }
  return out;
}

/** Whether the override store is durable (Upstash) or per-instance only. */
export function routingStoreSource(): 'upstash' | 'memory' {
  return upstashCreds() ? 'upstash' : 'memory';
}

/** Read all routing overrides. Never throws — degrades to the in-memory copy. */
export async function getRoutingOverrides(): Promise<RoutingOverrides> {
  const creds = upstashCreds();
  if (!creds) return memory;
  try {
    const [val] = await upstashPipeline(creds, [['GET', OVERRIDES_KEY]]);
    if (val == null) return {};
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return sanitize(parsed);
  } catch {
    return memory;
  }
}

async function writeOverrides(next: RoutingOverrides): Promise<void> {
  memory = next;
  const creds = upstashCreds();
  if (!creds) return;
  try {
    if (Object.keys(next).length === 0) await upstashPipeline(creds, [['DEL', OVERRIDES_KEY]]);
    else await upstashPipeline(creds, [['SET', OVERRIDES_KEY, JSON.stringify(next)]]);
  } catch {
    /* best-effort — the in-memory copy is already updated */
  }
}

/** Set (merge) an override for one stage. Empty patch clears that stage. */
export async function setRoutingOverride(stage: ProviderStage, patch: RoutingOverride): Promise<RoutingOverrides> {
  const current = await getRoutingOverrides();
  const merged: RoutingOverride = { ...current[stage], ...patch };
  // Normalize: drop empty-string model to a "clear model" (null), prune empties.
  if (merged.model === '') merged.model = null;
  const cleaned: RoutingOverride = {};
  if (merged.provider != null) cleaned.provider = merged.provider;
  if (merged.model !== undefined) cleaned.model = merged.model;
  if (merged.enabled != null) cleaned.enabled = merged.enabled;

  const next: RoutingOverrides = { ...current };
  if (Object.keys(cleaned).length === 0) delete next[stage];
  else next[stage] = cleaned;
  await writeOverrides(next);
  return next;
}

/** Remove the override for one stage (revert to the env/config default). */
export async function clearRoutingOverride(stage: ProviderStage): Promise<RoutingOverrides> {
  const current = await getRoutingOverrides();
  if (!(stage in current)) return current;
  const next = { ...current };
  delete next[stage];
  await writeOverrides(next);
  return next;
}

/** Remove every override (revert all tasks to their defaults). */
export async function clearAllRoutingOverrides(): Promise<void> {
  await writeOverrides({});
}

/** Test-only introspection — exercises the in-memory path without a network. */
export const __test__ = {
  reset: () => {
    memory = {};
  },
  setMemory: (o: RoutingOverrides) => {
    memory = o;
  },
  sanitize,
};
