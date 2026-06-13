// ============================================================
// SwingVantage — Tier invitation placements (server-only)
// ------------------------------------------------------------
// A dynamic, admin-managed map of WHERE the calm "join the early-access list"
// invitation appears, so the strategy can change without a redeploy. Mirrors the
// operating-mode store (durable Upstash key + per-instance memory fallback).
//
// Design intent — ZERO pressure: invitations are purely informational, fully
// dismissible, and only ever invite interest in a tier that is still on the
// waitlist (nothing to "upgrade" to). Each placement slot can be turned on/off,
// pointed at a tier, and given gentle custom wording from /admin/operating-mode.
// A global master switch turns every invitation off at once.
//
// SECURITY: server-only (calls Upstash). Never import into a client component.
// ============================================================

import { isConfigured } from '@/lib/capabilities';

export type WaitlistTier = 'AI_SWING_REPORT' | 'PREMIUM_RETEST_PLAN';
export type PlacementSlotId = 'post-diagnosis' | 'dashboard' | 'pricing' | 'todays-tasks';

export interface PlacementSlotDef {
  id: PlacementSlotId;
  label: string;
  /** Where this slot renders + why it's a calm, earned moment. */
  description: string;
}

/** The registry of mountable invitation slots (each maps to one mounted spot). */
export const PLACEMENT_SLOTS: PlacementSlotDef[] = [
  {
    id: 'post-diagnosis',
    label: 'After a swing diagnosis',
    description: 'Below the result once an athlete has just received their plan — the value is already delivered.',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'A quiet card among the secondary dashboard panels for returning athletes.',
  },
  {
    id: 'pricing',
    label: 'Pricing page',
    description: 'Below the plan grid, where someone is already exploring what’s ahead.',
  },
  {
    id: 'todays-tasks',
    label: "Today's Tasks",
    description: 'Footer of the daily task card — only shown to athletes already working a plan.',
  },
];

const SLOT_IDS = PLACEMENT_SLOTS.map((s) => s.id);
const WAITLIST_TIERS_INTERNAL: WaitlistTier[] = ['AI_SWING_REPORT', 'PREMIUM_RETEST_PLAN'];

export interface PlacementSetting {
  enabled: boolean;
  tier: WaitlistTier;
  /** Optional gentle headline override; null → the component's calm default. */
  headline: string | null;
}

export interface PlacementState {
  /** Global master switch — off hides every invitation everywhere. */
  invitationsEnabled: boolean;
  slots: Record<PlacementSlotId, PlacementSetting>;
  lastChangedBy: string | null;
  lastChangedAt: string | null;
  source: 'upstash' | 'memory';
}

// Conservative, calm defaults: on at the clearest earned moment (right after a
// diagnosis result). The static marketing/dashboard surfaces are registered but
// default OFF — flip them on from the admin tool whenever you like. (Pricing is
// a visual-regression-snapshotted page, so it stays off by default to keep that
// baseline stable; one click in the admin turns it on.)
function defaultSlots(): Record<PlacementSlotId, PlacementSetting> {
  return {
    'post-diagnosis': { enabled: true, tier: 'AI_SWING_REPORT', headline: null },
    dashboard: { enabled: false, tier: 'AI_SWING_REPORT', headline: null },
    pricing: { enabled: false, tier: 'PREMIUM_RETEST_PLAN', headline: null },
    'todays-tasks': { enabled: false, tier: 'AI_SWING_REPORT', headline: null },
  };
}

function defaultState(): Omit<PlacementState, 'source'> {
  return { invitationsEnabled: true, slots: defaultSlots(), lastChangedBy: null, lastChangedAt: null };
}

function sanitizeSetting(raw: unknown, fallback: PlacementSetting): PlacementSetting {
  if (!raw || typeof raw !== 'object') return fallback;
  const o = raw as Record<string, unknown>;
  return {
    enabled: typeof o.enabled === 'boolean' ? o.enabled : fallback.enabled,
    tier: WAITLIST_TIERS_INTERNAL.includes(o.tier as WaitlistTier) ? (o.tier as WaitlistTier) : fallback.tier,
    headline:
      typeof o.headline === 'string' && o.headline.trim() ? o.headline.trim().slice(0, 160) : null,
  };
}

function sanitize(raw: unknown): Omit<PlacementState, 'source'> {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const slots = { ...base.slots };
  if (o.slots && typeof o.slots === 'object') {
    for (const id of SLOT_IDS) {
      slots[id] = sanitizeSetting((o.slots as Record<string, unknown>)[id], base.slots[id]);
    }
  }
  return {
    invitationsEnabled: typeof o.invitationsEnabled === 'boolean' ? o.invitationsEnabled : base.invitationsEnabled,
    slots,
    lastChangedBy: typeof o.lastChangedBy === 'string' ? o.lastChangedBy : base.lastChangedBy,
    lastChangedAt: typeof o.lastChangedAt === 'string' ? o.lastChangedAt : base.lastChangedAt,
  };
}

// ── Durable store (Upstash) with per-instance memory fallback ──
const KEY = 'intelligence:placements';
let memory: Omit<PlacementState, 'source'> | null = null;

function upstashCreds(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!isConfigured(url) || !isConfigured(token)) return null;
  return { url: url!.replace(/\/+$/, ''), token: token! };
}

async function upstash(creds: { url: string; token: string }, cmd: string[]): Promise<unknown> {
  const res = await fetch(`${creds.url}/${cmd.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${creds.token}` },
    signal: AbortSignal.timeout(2_000),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

export function placementStoreSource(): 'upstash' | 'memory' {
  return upstashCreds() ? 'upstash' : 'memory';
}

export async function getPlacementState(): Promise<PlacementState> {
  const creds = upstashCreds();
  if (!creds) return { ...(memory ?? defaultState()), source: 'memory' };
  try {
    const raw = await upstash(creds, ['GET', KEY]);
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { ...sanitize(parsed), source: 'upstash' };
  } catch {
    return { ...(memory ?? defaultState()), source: 'memory' };
  }
}

export interface PlacementPatch {
  invitationsEnabled?: boolean;
  slots?: Partial<Record<PlacementSlotId, Partial<PlacementSetting>>>;
  actor?: string | null;
}

export async function setPlacementState(patch: PlacementPatch): Promise<PlacementState> {
  const current = await getPlacementState();
  const slots = { ...current.slots };
  if (patch.slots) {
    for (const id of SLOT_IDS) {
      const p = patch.slots[id];
      if (p) slots[id] = sanitizeSetting({ ...slots[id], ...p }, slots[id]);
    }
  }
  const next: Omit<PlacementState, 'source'> = {
    invitationsEnabled: patch.invitationsEnabled ?? current.invitationsEnabled,
    slots,
    lastChangedBy: patch.actor ?? current.lastChangedBy,
    lastChangedAt: new Date().toISOString(),
  };
  const creds = upstashCreds();
  if (creds) {
    try {
      await upstash(creds, ['SET', KEY, JSON.stringify(next)]);
    } catch {
      memory = next;
    }
  } else {
    memory = next;
  }
  return { ...next, source: placementStoreSource() };
}

/** Test-only reset of the in-memory fallback. */
export const __test__ = { reset: () => { memory = null; }, sanitize, defaultState };
