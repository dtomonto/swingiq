// ============================================================
// SwingVantage — User-facing AI feature switchboard (server-only)
// ------------------------------------------------------------
// One durable on/off switch per USER-FACING AI feature, so an operator can turn
// all athlete-facing AI off (or any single feature) from the admin dashboard —
// WITHOUT touching ADMIN AI tools (copilot, social, feature-education, growth),
// which are gated separately and stay on.
//
// Mirrors the AI-budget / routing-override pattern exactly: a single persistent
// Upstash key (fleet-wide + durable) with a per-instance in-memory fallback the
// UI labels honestly. The BASELINE comes from env `AI_USER_FEATURES_DEFAULT`
// ('on' by default; set to 'off' to disable every user AI feature by default);
// a per-feature admin override layers on top of that baseline.
//
//   no override for a feature → use the env baseline (default on)
//   override true / false     → force that feature on / off (durable)
//
// SECURITY: server-only (reads secret env + calls Upstash). Never import into a
// client component — the admin surface reads it through a server action / route.
// ============================================================

import { isConfigured } from '@/lib/capabilities';

export interface AiFeatureDef {
  /** Stable id used in the override store + admin UI + route checks. */
  id: string;
  /** Human label shown in the switchboard. */
  label: string;
  /** Plain-English description of what turning it off does. */
  description: string;
  /** Grouping in the admin UI. */
  group: string;
  /** The API route(s) this switch gates — shown so the operator knows the blast radius. */
  routes: string[];
}

// The canonical catalogue of ATHLETE-FACING AI features. Admin-only AI tools are
// intentionally NOT here — they are gated by requireAdmin()/RBAC and stay on.
export const USER_AI_FEATURES: readonly AiFeatureDef[] = [
  {
    id: 'video-analysis',
    label: 'AI video swing analysis',
    description: 'AI review of uploaded swing frames (the core analysis + the structured one-fix/one-plan/one-retest report).',
    group: 'Analysis',
    routes: ['/api/video-vision-analysis', '/api/video-analysis'],
  },
  {
    id: 'ai-coach',
    label: 'AI Coach chat',
    description: 'Conversational coaching. When off, the coach serves its data-grounded template answers (no AI call).',
    group: 'Coaching',
    routes: ['/api/ai-coach'],
  },
  {
    id: 'photo-import',
    label: 'Photo import (OCR)',
    description: 'Reads numbers off a launch-monitor photo. When off, users enter data manually (always available).',
    group: 'Import',
    routes: ['/api/import/ocr'],
  },
  {
    id: 'journey-narrative',
    label: 'Athletic journey narrative',
    description: 'Optional AI polish of the athletic-journey stage narrative. When off, the deterministic narrative is shown.',
    group: 'Narrative',
    routes: ['/api/athletic-journey/narrative'],
  },
  {
    id: 'recruiting-summary',
    label: 'Recruiting summary',
    description: 'Optional AI polish of the recruiting summary. When off, the deterministic summary is shown.',
    group: 'Narrative',
    routes: ['/api/recruiting/summary'],
  },
] as const;

const FEATURE_IDS = new Set(USER_AI_FEATURES.map((f) => f.id));

export type AiFeatureOverrides = Record<string, boolean>;

const OVERRIDES_KEY = 'ai:features:overrides';

// Per-instance fallback (dev / single instance / Upstash unreachable). Resets on
// cold start — a true fleet-wide override needs Upstash (same trade-off as caps).
let memory: AiFeatureOverrides = {};

// ── env baseline ────────────────────────────────────────────
/** The default on/off for every user AI feature, from AI_USER_FEATURES_DEFAULT. */
export function userAiDefaultEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.AI_USER_FEATURES_DEFAULT ?? '').trim().toLowerCase();
  if (v === '') return true; // unset → on (no behavior change unless opted in)
  return !/^(off|false|0|no|disabled)$/.test(v);
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

/** Sanitize an arbitrary parsed value into a clean overrides object (known ids + booleans only). */
function sanitize(raw: unknown): AiFeatureOverrides {
  if (!raw || typeof raw !== 'object') return {};
  const out: AiFeatureOverrides = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (FEATURE_IDS.has(id) && typeof v === 'boolean') out[id] = v;
  }
  return out;
}

/** Whether the switchboard is durable (Upstash) or per-instance only. */
export function featureStoreSource(): 'upstash' | 'memory' {
  return upstashCreds() ? 'upstash' : 'memory';
}

/** Read all per-feature overrides. Never throws — degrades to the in-memory copy. */
export async function getFeatureOverrides(): Promise<AiFeatureOverrides> {
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

async function writeOverrides(next: AiFeatureOverrides): Promise<void> {
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

/**
 * Is a user-facing AI feature on right now? Unknown ids default to the baseline
 * (so a typo can never silently disable AI). Never throws.
 */
export async function isAiFeatureEnabled(id: string): Promise<boolean> {
  const baseline = userAiDefaultEnabled();
  const overrides = await getFeatureOverrides();
  return id in overrides ? overrides[id] : baseline;
}

/** Force one feature on/off (durable). */
export async function setAiFeatureEnabled(id: string, enabled: boolean): Promise<AiFeatureOverrides> {
  if (!FEATURE_IDS.has(id)) throw new Error(`unknown_feature:${id}`);
  const current = await getFeatureOverrides();
  const next = { ...current, [id]: enabled };
  await writeOverrides(next);
  return next;
}

/** Revert one feature to the env baseline (drop its override). */
export async function clearAiFeatureOverride(id: string): Promise<AiFeatureOverrides> {
  const current = await getFeatureOverrides();
  if (!(id in current)) return current;
  const next = { ...current };
  delete next[id];
  await writeOverrides(next);
  return next;
}

/** Master action: force EVERY user AI feature on or off in one write. */
export async function setAllUserAiEnabled(enabled: boolean): Promise<AiFeatureOverrides> {
  const next: AiFeatureOverrides = {};
  for (const f of USER_AI_FEATURES) next[f.id] = enabled;
  await writeOverrides(next);
  return next;
}

/** Drop all overrides (revert every feature to the env baseline). */
export async function clearAllFeatureOverrides(): Promise<void> {
  await writeOverrides({});
}

export interface AiFeatureState extends AiFeatureDef {
  enabled: boolean;
  /** Whether a durable override is set (vs. following the env baseline). */
  overridden: boolean;
}

export interface AiFeatureSnapshot {
  features: AiFeatureState[];
  /** The env baseline every un-overridden feature follows. */
  defaultEnabled: boolean;
  /** How many user features are currently ON. */
  enabledCount: number;
  /** Durable (Upstash) vs per-instance memory. */
  source: 'upstash' | 'memory';
}

/** The full switchboard snapshot for the admin UI. */
export async function getAiFeatureSnapshot(): Promise<AiFeatureSnapshot> {
  const baseline = userAiDefaultEnabled();
  const overrides = await getFeatureOverrides();
  const features: AiFeatureState[] = USER_AI_FEATURES.map((f) => {
    const overridden = f.id in overrides;
    return { ...f, overridden, enabled: overridden ? overrides[f.id] : baseline };
  });
  return {
    features,
    defaultEnabled: baseline,
    enabledCount: features.filter((f) => f.enabled).length,
    source: featureStoreSource(),
  };
}

/** Test-only introspection — exercises the in-memory path without a network. */
export const __test__ = {
  reset: () => {
    memory = {};
  },
  setMemory: (o: AiFeatureOverrides) => {
    memory = o;
  },
  sanitize,
};
