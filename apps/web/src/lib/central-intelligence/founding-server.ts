// ============================================================
// CentralIntelligenceOS — Founding Fathers server (SERVER-ONLY)
// ------------------------------------------------------------
// Owns the scarce, tamper-sensitive resource: the Founding Member
// NUMBER. Member numbers are assigned in qualification (claim) order,
// one per user, and can NEVER be chosen by the client.
//
// Persistence mirrors GrowthOS (lib/growth/repository): a single
// `growth_records` JSONB table when Supabase is configured, else an
// in-process store so the whole flow works keyless in dev. These
// records are NOT exposed through the generic GrowthOS CRUD API —
// only this module writes them, which is what keeps numbers honest.
//
// SECURITY: uses the service-role admin client (bypasses RLS). Every
// caller is either a server route that authenticated the user, or the
// admin-guarded command center.
//
// FOLLOW-UP (documented in docs/CENTRAL_INTELLIGENCE_OS.md): for true
// atomic ordering under heavy concurrency, replace the count+1 step
// with a Postgres sequence / RPC. Idempotency (one record per user)
// already prevents double-claims; the count+1 race only risks two
// near-simultaneous claims sharing a number at launch-scale volume.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { SportId } from '@swingiq/core';
import type { FoundingCampaignProgress } from './types';
import { buildCampaignProgress } from './founding';
import { FOUNDING_REQUIRED_COUNT, FOUNDING_REQUIRED_SESSIONS } from './config';

const TABLE = 'growth_records';
const MEMBER_KIND = 'founding-member';
const CONFIG_KIND = 'founding-config';
const CONFIG_ID = 'founding-config';

export interface FoundingMemberRecord {
  id: string; // `founding-member-${userId}`
  kind: typeof MEMBER_KIND;
  userId: string;
  memberNumber: number | null; // null when waitlisted after the cap
  status: 'qualified' | 'waitlisted_after_1000';
  sport: SportId | null;
  validSessionCountAtClaim: number;
  profileCompleteAtClaim: boolean;
  qualifiedAt: string;
  /** Whether the server independently verified eligibility (vs trusting the client). */
  serverVerified: boolean;
}

export interface FoundingConfigRecord {
  id: typeof CONFIG_ID;
  kind: typeof CONFIG_KIND;
  requiredCount: number;
  /** true = force-unlock tiers, false = force-lock, null = automatic at cap. */
  manualOverride: boolean | null;
  updatedAt: string;
}

// ── In-process fallback (keyless/dev) ─────────────────────────
const GLOBAL_KEY = '__founding_mem_store__';
interface MemStore {
  members: Map<string, FoundingMemberRecord>;
  config: FoundingConfigRecord | null;
}
function memStore(): MemStore {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { members: new Map(), config: null } as MemStore;
  return g[GLOBAL_KEY] as MemStore;
}

function admin() {
  return createSupabaseAdminClient();
}

/** Whether real Supabase persistence is active. */
export function isFoundingPersistent(): boolean {
  return admin() !== null;
}

// ── Config ────────────────────────────────────────────────────

const DEFAULT_CONFIG: FoundingConfigRecord = {
  id: CONFIG_ID,
  kind: CONFIG_KIND,
  requiredCount: FOUNDING_REQUIRED_COUNT,
  manualOverride: null,
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export async function getFoundingConfig(): Promise<FoundingConfigRecord> {
  const c = admin();
  if (!c) return memStore().config ?? DEFAULT_CONFIG;
  try {
    const { data, error } = await c.from(TABLE).select('data').eq('kind', CONFIG_KIND).eq('id', CONFIG_ID).maybeSingle();
    if (error || !data) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(data as { data: FoundingConfigRecord }).data };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function setFoundingConfig(
  patch: Partial<Pick<FoundingConfigRecord, 'requiredCount' | 'manualOverride'>>,
): Promise<FoundingConfigRecord> {
  const current = await getFoundingConfig();
  const next: FoundingConfigRecord = { ...current, ...patch, id: CONFIG_ID, kind: CONFIG_KIND, updatedAt: new Date().toISOString() };
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

// ── Members ───────────────────────────────────────────────────

export async function getQualifiedCount(): Promise<number> {
  const c = admin();
  if (!c) {
    return Array.from(memStore().members.values()).filter((m) => m.memberNumber != null).length;
  }
  try {
    const { count, error } = await c
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('kind', MEMBER_KIND);
    if (error || count == null) return 0;
    return count;
  } catch {
    return 0;
  }
}

export async function listFoundingMembers(limit = 1000): Promise<FoundingMemberRecord[]> {
  const c = admin();
  if (!c) {
    return Array.from(memStore().members.values())
      .sort((a, b) => (a.memberNumber ?? 1e9) - (b.memberNumber ?? 1e9))
      .slice(0, limit);
  }
  try {
    const { data, error } = await c.from(TABLE).select('data').eq('kind', MEMBER_KIND).limit(limit);
    if (error || !data) return [];
    return (data as Array<{ data: FoundingMemberRecord }>)
      .map((r) => r.data)
      .sort((a, b) => (a.memberNumber ?? 1e9) - (b.memberNumber ?? 1e9));
  } catch {
    return [];
  }
}

export async function getFoundingMemberForUser(userId: string): Promise<FoundingMemberRecord | null> {
  const id = `founding-member-${userId}`;
  const c = admin();
  if (!c) return memStore().members.get(id) ?? null;
  try {
    const { data, error } = await c.from(TABLE).select('data').eq('kind', MEMBER_KIND).eq('id', id).maybeSingle();
    if (error || !data) return null;
    return (data as { data: FoundingMemberRecord }).data;
  } catch {
    return null;
  }
}

async function persistMember(record: FoundingMemberRecord): Promise<void> {
  const c = admin();
  if (!c) {
    memStore().members.set(record.id, record);
    return;
  }
  const now = new Date().toISOString();
  try {
    await c.from(TABLE).upsert({ id: record.id, kind: MEMBER_KIND, data: record, created_at: now, updated_at: now }, { onConflict: 'id' });
  } catch {
    memStore().members.set(record.id, record);
  }
}

export interface ClaimInput {
  userId: string;
  sport?: SportId | null;
  profileCompleted: boolean;
  validSessionCount: number;
  /** True when the eligibility was checked against server-side synced data. */
  serverVerified?: boolean;
}

export interface ClaimResult {
  ok: boolean;
  reason?: string;
  record: FoundingMemberRecord | null;
  progress: FoundingCampaignProgress;
}

/**
 * Claim (or re-fetch) a user's Founding Membership. Idempotent: a user can
 * only ever hold ONE record, so re-claiming returns the same number. The
 * number itself is assigned server-side as (current qualified count + 1).
 */
export async function claimFoundingMembership(input: ClaimInput): Promise<ClaimResult> {
  const config = await getFoundingConfig();
  const requiredCount = config.requiredCount;

  // Idempotency: already claimed → return the existing record unchanged.
  const existing = await getFoundingMemberForUser(input.userId);
  if (existing) {
    const qualifiedCount = await getQualifiedCount();
    return {
      ok: true,
      record: existing,
      progress: buildCampaignProgress({ qualifiedCount, requiredCount, manualOverride: config.manualOverride }),
    };
  }

  // Server-side eligibility gate. The client cannot bypass these.
  const eligible = input.profileCompleted && input.validSessionCount >= FOUNDING_REQUIRED_SESSIONS;
  if (!eligible) {
    const qualifiedCount = await getQualifiedCount();
    return {
      ok: false,
      reason: !input.profileCompleted
        ? 'Profile is not complete yet.'
        : `Need ${FOUNDING_REQUIRED_SESSIONS} valid sessions (have ${input.validSessionCount}).`,
      record: null,
      progress: buildCampaignProgress({ qualifiedCount, requiredCount, manualOverride: config.manualOverride }),
    };
  }

  const qualifiedBefore = await getQualifiedCount();
  const now = new Date().toISOString();
  const capReached = qualifiedBefore >= requiredCount;

  const record: FoundingMemberRecord = {
    id: `founding-member-${input.userId}`,
    kind: MEMBER_KIND,
    userId: input.userId,
    memberNumber: capReached ? null : qualifiedBefore + 1,
    status: capReached ? 'waitlisted_after_1000' : 'qualified',
    sport: input.sport ?? null,
    validSessionCountAtClaim: input.validSessionCount,
    profileCompleteAtClaim: input.profileCompleted,
    qualifiedAt: now,
    serverVerified: input.serverVerified ?? false,
  };
  await persistMember(record);

  const qualifiedAfter = await getQualifiedCount();
  return {
    ok: true,
    record,
    progress: buildCampaignProgress({ qualifiedCount: qualifiedAfter, requiredCount, manualOverride: config.manualOverride }),
  };
}

/** Public, privacy-safe campaign progress (used by the global banner). */
export async function getFoundingCampaignProgress(): Promise<FoundingCampaignProgress> {
  const [config, qualifiedCount] = await Promise.all([getFoundingConfig(), getQualifiedCount()]);
  return buildCampaignProgress({ qualifiedCount, requiredCount: config.requiredCount, manualOverride: config.manualOverride });
}
