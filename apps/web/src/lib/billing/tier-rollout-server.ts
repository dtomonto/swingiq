// ============================================================
// SwingVantage — Tier rollout + waitlist interest store (SERVER-ONLY)
// ------------------------------------------------------------
// Two pieces of state for the gradual paid-tier launch:
//   1. the ROLLOUT MODE   — 'free' (only Free active) | 'full' (all active).
//      This is NOT stored independently: it is the SAME decision as the
//      CentralIntelligence membership-tier gate (founding-server), so the
//      admin command center and the pricing page can never disagree. The
//      gate is unlocked automatically once the Founding campaign fills, or
//      forced on/off by an admin. Here:
//        full  ⟺ membership tiers unlocked   ⟺ founding manualOverride=true
//        free  ⟺ membership tiers locked     ⟺ founding manualOverride=false
//   2. per-user WAITLIST INTEREST — one idempotent record per (tier, user),
//      so the owner can count how many signed-in users want each tier
//      before deciding to roll it out.
//
// Interest persistence mirrors the Founding store: a single `growth_records`
// JSONB table when Supabase is configured, else an in-process store so the
// whole flow works keyless in dev. Interest is written by an AUTHENTICATED
// end-user route (one record per user); the rollout mode is flipped only by
// the admin-guarded route (which writes the founding gate).
//
// SECURITY: uses the service-role admin client (bypasses RLS). Callers are
// either an authenticated user route (interest) or the admin command center
// (mode). Never import into a client component.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import {
  getFoundingCampaignProgress,
  isFoundingPersistent,
  setFoundingConfig,
} from '@/lib/central-intelligence/founding-server';
import {
  WAITLIST_TIER_IDS,
  type TierId,
  type TierRolloutMode,
} from './tiers';

const TABLE = 'growth_records';
const INTEREST_KIND = 'tier-interest';

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
  interest: Map<string, TierInterestRecord>;
}
function memStore(): MemStore {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { interest: new Map() } as MemStore;
  return g[GLOBAL_KEY] as MemStore;
}

function admin() {
  return createSupabaseAdminClient();
}

/** Test-only: clear the in-process interest store (keyless mode) between cases. */
export function __resetTierRolloutStoreForTests(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  g[GLOBAL_KEY] = { interest: new Map() };
}

/** Whether real persistence is active (shared with the Founding gate store). */
export function isTierRolloutPersistent(): boolean {
  return isFoundingPersistent();
}

// ── Rollout mode (≡ membership-tier gate) ─────────────────────

/**
 * The live rollout mode, derived from the CentralIntelligence membership
 * gate so both surfaces stay in lock-step. Never throws (the gate degrades
 * to "locked" when unavailable). 'full' once the gate is unlocked.
 */
export async function getTierRolloutMode(): Promise<TierRolloutMode> {
  try {
    const progress = await getFoundingCampaignProgress();
    return progress.membershipTiersEnabled ? 'full' : 'free';
  } catch {
    return 'free';
  }
}

export interface SetTierRolloutResult {
  mode: TierRolloutMode;
}

/**
 * Flip the rollout by writing the membership gate's manual override:
 *   'full' → force-unlock (true), 'free' → force-lock (false).
 * Any non-'full' value is treated as 'free'. The 3-way "automatic" state is
 * still settable from the Central Intelligence command center.
 */
export async function setTierRolloutMode(mode: TierRolloutMode): Promise<SetTierRolloutResult> {
  const full = mode === 'full';
  await setFoundingConfig({ manualOverride: full });
  return { mode: full ? 'full' : 'free' };
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
