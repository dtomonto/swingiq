// ============================================================
// SwingVantage — Community analytics sync (badges + challenges)
//
// The full community/gamification state already syncs as a document on the
// community_state row (the source of truth). This layer ADDITIONALLY projects
// the individual badge unlocks and per-challenge progress into their own
// COLUMNED tables (badge_unlocks, challenge_progress) so they can power
// cross-user analytics — badge rarity, challenge completion rates, etc.
//
// Write-only: the app never reads these back (community_state already carries
// the data cross-device). We just keep each user's rows in step with their
// community state, hash-gated so an unchanged state does no work. Tolerates
// the tables being absent (sets available=false) so the rest of sync is
// unaffected if this migration hasn't been applied yet.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { djb2, isSchemaMissing } from './cloud-repo';
import type { CommunityState } from '@/lib/community/types';

type Row = Record<string, unknown> & { id: string };

/** One row per earned badge: id = '<user>:<badge>'. */
export function badgeUnlockRows(c: CommunityState, userId: string): Row[] {
  return (c.achievementsEarned ?? []).map((b) => ({
    id: `${userId}:${b.id}`,
    user_id: userId,
    badge_id: b.id,
    earned_at: b.earnedAt ?? '',
  }));
}

/** One row per challenge the user has touched (completed overrides active). */
export function challengeProgressRows(c: CommunityState, userId: string): Row[] {
  const byChallenge = new Map<string, Row>();

  for (const a of c.challengesActive ?? []) {
    byChallenge.set(a.id, {
      id: `${userId}:${a.id}`,
      user_id: userId,
      challenge_id: a.id,
      status: 'active',
      joined_at: a.joinedAt ?? null,
      completed_at: null,
      progress: a.progress ?? 0,
      xp_earned: 0,
    });
  }
  for (const done of c.challengesCompleted ?? []) {
    const prev = byChallenge.get(done.id);
    byChallenge.set(done.id, {
      id: `${userId}:${done.id}`,
      user_id: userId,
      challenge_id: done.id,
      status: 'completed',
      joined_at: (prev?.joined_at as string | null) ?? null,
      completed_at: done.completedAt ?? null,
      progress: 100,
      xp_earned: done.xpEarned ?? 0,
    });
  }
  return [...byChallenge.values()];
}

export interface CommunityAnalyticsSyncState {
  available: boolean;
  badge: Map<string, string>;
  challenge: Map<string, string>;
}

export function freshCommunityAnalyticsSync(): CommunityAnalyticsSyncState {
  return { available: true, badge: new Map(), challenge: new Map() };
}

/** Upsert only the rows whose content changed since last sync. */
async function upsertChanged(
  client: SupabaseClient, table: string, rows: Row[], cache: Map<string, string>,
): Promise<boolean> {
  const next = new Map<string, string>();
  const toUpsert: Row[] = [];
  for (const row of rows) {
    const h = djb2(JSON.stringify(row));
    next.set(row.id, h);
    if (cache.get(row.id) !== h) toUpsert.push(row);
  }
  let wrote = false;
  if (toUpsert.length) {
    const { error } = await client.from(table).upsert(toUpsert, { onConflict: 'id' });
    if (error) throw error;
    wrote = true;
  }
  cache.clear();
  for (const [k, v] of next) cache.set(k, v);
  return wrote;
}

/**
 * Project the user's current community state into the badge_unlocks and
 * challenge_progress analytics tables. Returns true if anything was written.
 */
export async function syncCommunityAnalytics(
  client: SupabaseClient, userId: string, community: CommunityState,
  s: CommunityAnalyticsSyncState,
): Promise<boolean> {
  if (!s.available) return false;
  try {
    const wroteB = await upsertChanged(client, 'badge_unlocks', badgeUnlockRows(community, userId), s.badge);
    const wroteC = await upsertChanged(
      client, 'challenge_progress', challengeProgressRows(community, userId), s.challenge,
    );
    return wroteB || wroteC;
  } catch (err) {
    if (isSchemaMissing(err)) { s.available = false; return false; }
    throw err;
  }
}
