// ============================================================
// SwingVantage — Tier rollout + waitlist interest store (SERVER-ONLY)
// ------------------------------------------------------------
// Owns two durable pieces of state for the gradual paid-tier launch:
//   1. the ROLLOUT MODE   — 'free' (only Free active) | 'full' (all active),
//      flipped by an admin from the dashboard to roll the tiers out.
//   2. per-user WAITLIST INTEREST — one idempotent record per (tier, user),
//      so the owner can count how many signed-in users want each tier
//      before deciding to roll it out.
//
// Persistence mirrors the Founding store (lib/central-intelligence/
// founding-server.ts): a single `growth_records` JSONB table when Supabase
// is configured, else an in-process store so the whole flow works keyless in
// dev. Interest is written by an AUTHENTICATED end-user route (one record per
// user); the rollout mode is written only by the admin-guarded route.
//
// SECURITY: uses the service-role admin client (bypasses RLS). Callers are
// either an authenticated user route (interest) or the admin command center
// (mode). Never import into a client component.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import {
  DEFAULT_TIER_ROLLOUT_MODE,
  WAITLIST_TIER_IDS,
  type TierId,
  type TierRolloutMode,
} from './tiers';

const TABLE = 'growth_records';
const CONFIG_KIND = 'tier-rollout-config';
const CONFIG_ID = 'tier-rollout-config';
const INTEREST_KIND = 'tier-interest';

export interface TierRolloutConfigRecord {
  id: typeof CONFIG_ID;
  kind: typeof CONFIG_KIND;
  mode: TierRolloutMode;
  updatedAt: string;
}

export interface TierInterestRecord {
  id: string; // `tier-interest-${tierId}-${userId}`
  kind: typeof INTEREST_KIND;
  tierId: TierId;
  userId: string;
  createdAt: string;
}

// ── In-process fallback (keyless/dev) ─────────────────────────
const GLOBAL_KEY = '__tier_rollout_store__';
interface MemStore {
  config: TierRolloutConfigRecord | null;
  interest: Map<string, TierInterestRecord>;
}
function memStore(): MemStore {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { config: null, interest: new Map() } as MemStore;
  return g[GLOBAL_KEY] as MemStore;
}

function admin() {
  return createSupabaseAdminClient();
}

/** Test-only: clear the in-process store (keyless mode) between cases. */
export function __resetTierRolloutStoreForTests(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  g[GLOBAL_KEY] = { config: null, interest: new Map() };
}

/** Whether real Supabase persistence is active. */
export function isTierRolloutPersistent(): boolean {
  return admin() !== null;
}

// ── Rollout mode ──────────────────────────────────────────────

const DEFAULT_CONFIG: TierRolloutConfigRecord = {
  id: CONFIG_ID,
  kind: CONFIG_KIND,
  mode: DEFAULT_TIER_ROLLOUT_MODE,
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export async function getTierRolloutConfig(): Promise<TierRolloutConfigRecord> {
  const c = admin();
  if (!c) return memStore().config ?? DEFAULT_CONFIG;
  try {
    const { data, error } = await c.from(TABLE).select('data').eq('kind', CONFIG_KIND).eq('id', CONFIG_ID).maybeSingle();
    if (error || !data) return DEFAULT_CONFIG;
    const stored = (data as { data: Partial<TierRolloutConfigRecord> }).data;
    const mode: TierRolloutMode = stored.mode === 'full' ? 'full' : 'free';
    return { ...DEFAULT_CONFIG, ...stored, mode };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Convenience: just the current rollout mode. Never throws. */
export async function getTierRolloutMode(): Promise<TierRolloutMode> {
  return (await getTierRolloutConfig()).mode;
}

export async function setTierRolloutMode(mode: TierRolloutMode): Promise<TierRolloutConfigRecord> {
  const next: TierRolloutConfigRecord = {
    id: CONFIG_ID,
    kind: CONFIG_KIND,
    mode: mode === 'full' ? 'full' : 'free',
    updatedAt: new Date().toISOString(),
  };
  const c = admin();
  if (!c) {
    memStore().config = next;
    return next;
  }
  const now = new Date().toISOString();
  try {
    await c.from(TABLE).upsert({ id: CONFIG_ID, kind: CONFIG_KIND, data: next, created_at: now, updated_at: now }, { onConflict: 'id' });
  } catch {
    memStore().config = next;
  }
  return next;
}

// ── Waitlist interest ─────────────────────────────────────────

function interestId(tierId: TierId, userId: string): string {
  return `tier-interest-${tierId}-${userId}`;
}

export interface RecordInterestResult {
  ok: boolean;
  alreadyInterested: boolean;
  reason?: string;
}

/**
 * Record a signed-in user's interest in a (paid) tier. Idempotent: a user can
 * only ever hold ONE record per tier, so pressing the button again is a no-op
 * that reports `alreadyInterested`.
 */
export async function recordTierInterest(input: { userId: string; tierId: TierId }): Promise<RecordInterestResult> {
  const { userId, tierId } = input;
  if (!userId) return { ok: false, alreadyInterested: false, reason: 'auth_required' };
  if (!WAITLIST_TIER_IDS.includes(tierId)) {
    return { ok: false, alreadyInterested: false, reason: 'tier_not_waitlistable' };
  }

  const existing = await getTierInterestForUser(userId, tierId);
  if (existing) return { ok: true, alreadyInterested: true };

  const record: TierInterestRecord = {
    id: interestId(tierId, userId),
    kind: INTEREST_KIND,
    tierId,
    userId,
    createdAt: new Date().toISOString(),
  };
  await persistInterest(record);
  return { ok: true, alreadyInterested: false };
}

async function persistInterest(record: TierInterestRecord): Promise<void> {
  const c = admin();
  if (!c) {
    memStore().interest.set(record.id, record);
    return;
  }
  const now = new Date().toISOString();
  try {
    await c.from(TABLE).upsert({ id: record.id, kind: INTEREST_KIND, data: record, created_at: now, updated_at: now }, { onConflict: 'id' });
  } catch {
    memStore().interest.set(record.id, record);
  }
}

export async function getTierInterestForUser(userId: string, tierId: TierId): Promise<TierInterestRecord | null> {
  const id = interestId(tierId, userId);
  const c = admin();
  if (!c) return memStore().interest.get(id) ?? null;
  try {
    const { data, error } = await c.from(TABLE).select('data').eq('kind', INTEREST_KIND).eq('id', id).maybeSingle();
    if (error || !data) return null;
    return (data as { data: TierInterestRecord }).data;
  } catch {
    return null;
  }
}

/** The set of (paid) tier ids a user has already expressed interest in. */
export async function getUserInterestedTiers(userId: string): Promise<TierId[]> {
  if (!userId) return [];
  const records = await Promise.all(WAITLIST_TIER_IDS.map((t) => getTierInterestForUser(userId, t)));
  return WAITLIST_TIER_IDS.filter((_, i) => records[i] != null);
}

async function listAllInterest(limit = 5000): Promise<TierInterestRecord[]> {
  const c = admin();
  if (!c) return Array.from(memStore().interest.values());
  try {
    const { data, error } = await c.from(TABLE).select('data').eq('kind', INTEREST_KIND).limit(limit);
    if (error || !data) return [];
    return (data as Array<{ data: TierInterestRecord }>).map((r) => r.data);
  } catch {
    return [];
  }
}

/** Count of unique interested users per paid tier (zero-filled). */
export async function getTierInterestCounts(): Promise<Record<TierId, number>> {
  const counts = Object.fromEntries(WAITLIST_TIER_IDS.map((t) => [t, 0])) as Record<TierId, number>;
  const all = await listAllInterest();
  for (const r of all) {
    if (r && (counts[r.tierId] ?? undefined) !== undefined) counts[r.tierId] += 1;
  }
  return counts;
}

/** Recent interest records (most recent first), for the admin view. */
export async function listTierInterest(limit = 100): Promise<TierInterestRecord[]> {
  const all = await listAllInterest();
  return all
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
