// ============================================================
// Player Experience Overhaul — Friends authorization (WS-05)
// ------------------------------------------------------------
// The SINGLE source of truth for cross-user friend access decisions.
// WS-06 (upload-for-friend) imports `assertCanUploadForAthlete` /
// `areAcceptedFriends` rather than re-implementing any check.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FriendPermissions } from './types';

export interface FriendshipRowLike {
  requester_user_id: string;
  receiver_user_id: string;
  status: string;
  permissions?: Partial<FriendPermissions> | null;
}

/** Pure: is this row an accepted friendship between a and b (either direction)? */
export function isAcceptedFriendshipRow(
  row: FriendshipRowLike | null | undefined,
  a: string,
  b: string,
): boolean {
  if (!row || row.status !== 'accepted') return false;
  const pair = new Set([row.requester_user_id, row.receiver_user_id]);
  return pair.has(a) && pair.has(b) && a !== b;
}

/** Pure: does an accepted friendship grant the named permission? */
export function rowGrants(
  row: FriendshipRowLike | null | undefined,
  perm: keyof FriendPermissions,
): boolean {
  if (!row || row.status !== 'accepted') return false;
  return Boolean(row.permissions?.[perm]);
}

async function fetchPairRow(
  client: SupabaseClient,
  a: string,
  b: string,
): Promise<FriendshipRowLike | null> {
  const { data } = await client
    .from('friendships')
    .select('requester_user_id, receiver_user_id, status, permissions')
    .or(
      `and(requester_user_id.eq.${a},receiver_user_id.eq.${b}),` +
        `and(requester_user_id.eq.${b},receiver_user_id.eq.${a})`,
    )
    .maybeSingle();
  return (data as FriendshipRowLike | null) ?? null;
}

/** Are a and b accepted friends? (DB-backed; uses the pure check.) */
export async function areAcceptedFriends(
  client: SupabaseClient,
  a: string,
  b: string,
): Promise<boolean> {
  if (a === b) return false;
  const row = await fetchPairRow(client, a, b);
  return isAcceptedFriendshipRow(row, a, b);
}

export class FriendAuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = 'FriendAuthError';
    this.status = status;
  }
}

/**
 * Throws FriendAuthError unless `actor` may upload a session FOR `athlete`:
 * they must be accepted friends AND the athlete's friendship permission
 * `allow_upload_for_me` must be true. Used by WS-06.
 */
export async function assertCanUploadForAthlete(
  client: SupabaseClient,
  actor: string,
  athlete: string,
): Promise<void> {
  if (actor === athlete) return; // uploading for yourself is always allowed
  const row = await fetchPairRow(client, actor, athlete);
  if (!isAcceptedFriendshipRow(row, actor, athlete)) {
    throw new FriendAuthError('Not friends with this athlete.');
  }
  if (!rowGrants(row, 'allow_upload_for_me')) {
    throw new FriendAuthError('This athlete has not enabled friend uploads.');
  }
}
