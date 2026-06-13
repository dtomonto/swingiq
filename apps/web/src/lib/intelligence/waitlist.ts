// ============================================================
// SwingVantage — GAI tier waitlist (server-only)
// ------------------------------------------------------------
// While a paid tier is on `waitlist` rollout, signed-in users can register
// interest with one tap. We record ONE row per (user, tier) so the owner can
// count distinct interested athletes and decide when to flip a tier to full
// rollout. Backed by the additive `tier_waitlist` table (supabase-tier-waitlist
// .sql) via the service-role client; degrades to a no-op when Supabase isn't
// configured, so nothing breaks in keyless / local mode.
//
// SECURITY: server-only (service-role client). Never import from a client.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { IntelligenceTier } from './types';

/** Tiers that can be joined (the free tier is never a waitlist). */
export const WAITLIST_TIERS: IntelligenceTier[] = ['AI_SWING_REPORT', 'PREMIUM_RETEST_PLAN'];

export function isWaitlistTier(tier: string): tier is IntelligenceTier {
  return (WAITLIST_TIERS as string[]).includes(tier);
}

/** Register a signed-in user's interest in a tier. Idempotent per (user, tier). */
export async function joinTierWaitlist(
  userId: string,
  tier: IntelligenceTier,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, error: 'not-configured' };
  try {
    const { error } = await admin
      .from('tier_waitlist')
      .upsert({ user_id: userId, tier, created_at: new Date().toISOString() }, { onConflict: 'user_id,tier' });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch {
    return { ok: false, error: 'error' };
  }
}

/** Which waitlist tiers a user has already joined. Never throws. */
export async function getJoinedTiers(userId: string): Promise<Record<IntelligenceTier, boolean>> {
  const joined: Record<IntelligenceTier, boolean> = {
    INSTANT_ESTIMATE: false,
    AI_SWING_REPORT: false,
    PREMIUM_RETEST_PLAN: false,
  };
  const admin = createSupabaseAdminClient();
  if (!admin) return joined;
  try {
    const { data } = await admin.from('tier_waitlist').select('tier').eq('user_id', userId);
    for (const row of (data ?? []) as Array<{ tier: string }>) {
      if (isWaitlistTier(row.tier)) joined[row.tier] = true;
    }
  } catch {
    /* best-effort */
  }
  return joined;
}

export interface TierWaitlistCounts {
  /** True when a durable store (Supabase) is available. */
  available: boolean;
  counts: Record<IntelligenceTier, number>;
  total: number;
}

/** Count distinct interested users per tier, for the admin rollout decision. */
export async function getTierWaitlistCounts(): Promise<TierWaitlistCounts> {
  const counts: Record<IntelligenceTier, number> = {
    INSTANT_ESTIMATE: 0,
    AI_SWING_REPORT: 0,
    PREMIUM_RETEST_PLAN: 0,
  };
  const admin = createSupabaseAdminClient();
  if (!admin) return { available: false, counts, total: 0 };
  try {
    for (const tier of WAITLIST_TIERS) {
      const { count } = await admin
        .from('tier_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('tier', tier);
      counts[tier] = count ?? 0;
    }
    const total = WAITLIST_TIERS.reduce((n, t) => n + counts[t], 0);
    return { available: true, counts, total };
  } catch {
    return { available: false, counts, total: 0 };
  }
}
