// ============================================================
// SwingVantage — GAI Operating Mode store (server-only)
// ------------------------------------------------------------
// The platform-wide posture toward AI spend, switchable from the admin
// dashboard WITHOUT a redeploy. Mirrors the AI-budget / AI-routing override
// stores exactly: a single durable Upstash key (fleet-wide) with a per-instance
// in-memory fallback that the UI labels honestly.
//
//   DEFAULT_AI_MODE   → use configured GAI routing for best quality, still
//                       preferring heuristics + cache where they help.
//   COST_SAVING_MODE  → protect API spend: deterministic GAI + cache + safe
//                       fallback; free / Instant-Estimate requests never hit
//                       paid AI; AI only for admin-allowed tiers.
//
// The ENV default is INTELLIGENCE_OPERATING_MODE (defaults to DEFAULT_AI_MODE);
// an admin override layers on top. Also tracks WHO changed it and WHEN, plus
// which tiers may use AI while in Cost-Saving Mode.
//
// SECURITY: server-only (reads secret env + calls Upstash). Never import into a
// client component — the admin page reads it through a server action / route.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import type { IntelligenceTier, OperatingMode } from './types';

const STATE_KEY = 'intelligence:operating-mode';

export interface OperatingModeState {
  mode: OperatingMode;
  /** Tiers permitted to use AI while Cost-Saving Mode is active. */
  costSavingAiTiers: IntelligenceTier[];
  /** Global "serve heuristics for everything" toggle. */
  forceHeuristic: boolean;
  /** Global kill switch — no paid AI calls at all. */
  killSwitch: boolean;
  lastChangedBy: string | null;
  lastChangedAt: string | null;
  /** Where the value came from: durable Upstash or per-instance memory. */
  source: 'upstash' | 'memory';
}

/** The default posture before any admin override. */
function envDefaultMode(): OperatingMode {
  const raw = process.env.INTELLIGENCE_OPERATING_MODE;
  return raw && /cost[-_ ]?saving/i.test(raw) ? 'COST_SAVING_MODE' : 'DEFAULT_AI_MODE';
}

function defaultState(): Omit<OperatingModeState, 'source'> {
  return {
    mode: envDefaultMode(),
    costSavingAiTiers: ['PREMIUM_RETEST_PLAN'],
    forceHeuristic: false,
    killSwitch: false,
    lastChangedBy: null,
    lastChangedAt: null,
  };
}

// Per-instance fallback (dev / single instance / Upstash unreachable).
let memory: Omit<OperatingModeState, 'source'> = defaultState();

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

const VALID_TIERS: IntelligenceTier[] = ['INSTANT_ESTIMATE', 'AI_SWING_REPORT', 'PREMIUM_RETEST_PLAN'];

/** Coerce an arbitrary parsed value into a clean state (env defaults fill gaps). */
function sanitize(raw: unknown): Omit<OperatingModeState, 'source'> {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  return {
    mode: o.mode === 'COST_SAVING_MODE' ? 'COST_SAVING_MODE' : o.mode === 'DEFAULT_AI_MODE' ? 'DEFAULT_AI_MODE' : base.mode,
    costSavingAiTiers: Array.isArray(o.costSavingAiTiers)
      ? (o.costSavingAiTiers.filter((t): t is IntelligenceTier => VALID_TIERS.includes(t as IntelligenceTier)))
      : base.costSavingAiTiers,
    forceHeuristic: typeof o.forceHeuristic === 'boolean' ? o.forceHeuristic : base.forceHeuristic,
    killSwitch: typeof o.killSwitch === 'boolean' ? o.killSwitch : base.killSwitch,
    lastChangedBy: typeof o.lastChangedBy === 'string' ? o.lastChangedBy : base.lastChangedBy,
    lastChangedAt: typeof o.lastChangedAt === 'string' ? o.lastChangedAt : base.lastChangedAt,
  };
}

/** Whether the store is durable (Upstash) or per-instance only. */
export function operatingModeStoreSource(): 'upstash' | 'memory' {
  return upstashCreds() ? 'upstash' : 'memory';
}

/** Read the current operating-mode state. Never throws — degrades to memory. */
export async function getOperatingModeState(): Promise<OperatingModeState> {
  const creds = upstashCreds();
  if (!creds) return { ...memory, source: 'memory' };
  try {
    const [val] = await upstashPipeline(creds, [['GET', STATE_KEY]]);
    if (val == null) return { ...defaultState(), source: 'upstash' };
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return { ...sanitize(parsed), source: 'upstash' };
  } catch {
    return { ...memory, source: 'memory' };
  }
}

/** Convenience: just the active mode. */
export async function getOperatingMode(): Promise<OperatingMode> {
  return (await getOperatingModeState()).mode;
}

async function writeState(next: Omit<OperatingModeState, 'source'>): Promise<void> {
  memory = next;
  const creds = upstashCreds();
  if (!creds) return;
  try {
    await upstashPipeline(creds, [['SET', STATE_KEY, JSON.stringify(next)]]);
  } catch {
    /* best-effort — the in-memory copy is already updated */
  }
}

export interface OperatingModePatch {
  mode?: OperatingMode;
  costSavingAiTiers?: IntelligenceTier[];
  forceHeuristic?: boolean;
  killSwitch?: boolean;
  /** Email / actor recorded for the audit trail. */
  actor?: string | null;
}

/** Merge a patch into the operating-mode state. Stamps actor + timestamp. */
export async function setOperatingModeState(patch: OperatingModePatch): Promise<OperatingModeState> {
  const current = await getOperatingModeState();
  const next: Omit<OperatingModeState, 'source'> = {
    mode: patch.mode ?? current.mode,
    costSavingAiTiers: patch.costSavingAiTiers
      ? patch.costSavingAiTiers.filter((t) => VALID_TIERS.includes(t))
      : current.costSavingAiTiers,
    forceHeuristic: patch.forceHeuristic ?? current.forceHeuristic,
    killSwitch: patch.killSwitch ?? current.killSwitch,
    lastChangedBy: patch.actor ?? current.lastChangedBy,
    lastChangedAt: new Date().toISOString(),
  };
  await writeState(next);
  return { ...next, source: operatingModeStoreSource() };
}

/** Test-only introspection — exercises the in-memory path without a network. */
export const __test__ = {
  reset: () => {
    memory = defaultState();
  },
  setMemory: (s: Partial<Omit<OperatingModeState, 'source'>>) => {
    memory = { ...defaultState(), ...s };
  },
  sanitize,
};
