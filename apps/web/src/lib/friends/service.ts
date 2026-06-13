// ============================================================
// Player Experience Overhaul — Friends service (WS-05)
// ------------------------------------------------------------
// Domain logic + Supabase I/O for the friends MVP. Pure helpers are unit-
// tested directly; DB ops take an explicit client so they stay decoupled
// from request context. All actor ids are passed by the caller AFTER it has
// derived them server-side from auth — never from the client body.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Friendship,
  FriendPermissions,
  FriendSummary,
  FriendView,
} from './types';
import { DEFAULT_FRIEND_PERMISSIONS } from './types';
import { FriendAuthError } from './authz';

// ── Pure helpers ─────────────────────────────────────────────

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeHandle(input: string): string {
  return (input ?? '').trim().toLowerCase().replace(/^@/, '');
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

export function mergePermissions(
  current: Partial<FriendPermissions> | null | undefined,
  patch: Partial<FriendPermissions>,
): FriendPermissions {
  // Start from safe defaults, then overlay only DEFINED booleans so a
  // Partial never injects `undefined` into the typed permission map.
  const merged: FriendPermissions = { ...DEFAULT_FRIEND_PERMISSIONS };
  for (const src of [current, patch]) {
    if (!src) continue;
    for (const [k, v] of Object.entries(src)) {
      if (typeof v === 'boolean') merged[k] = v;
    }
  }
  return merged;
}

export function initialsFrom(name: string | null, handle: string | null): string {
  const src = (name && name.trim()) || (handle && handle.trim()) || '?';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ProfileRowLike {
  user_id: string;
  display_name?: string | null;
  handle?: string | null;
  primary_sport?: string | null;
  skill_level?: string | null;
  profile_intelligence_summary?: Record<string, unknown> | null;
}

/**
 * Privacy-filter a profile row into a FriendSummary. Extended fields are
 * only included when the friendship explicitly grants `view_profile`.
 */
export function friendSummaryFromProfile(
  row: ProfileRowLike,
  opts: { viewProfileGranted: boolean },
): FriendSummary {
  const displayName = (row.display_name && row.display_name.trim()) || row.handle || 'Athlete';
  const base: FriendSummary = {
    userId: row.user_id,
    handle: row.handle ?? null,
    displayName,
    initials: initialsFrom(row.display_name ?? null, row.handle ?? null),
    primarySport: row.primary_sport ?? null,
  };
  if (!opts.viewProfileGranted) return base;
  const summary = (row.profile_intelligence_summary ?? {}) as Record<string, unknown>;
  const archetype = (summary.archetype as { label?: string } | undefined)?.label ?? null;
  const stage = (summary.stage as { name?: string } | undefined)?.name ?? null;
  return { ...base, skillLevel: row.skill_level ?? null, stage, archetype };
}

interface FriendshipDbRow {
  id: string;
  requester_user_id: string;
  receiver_user_id: string;
  status: string;
  permissions: Partial<FriendPermissions> | null;
  created_at: string;
  updated_at: string;
}

export function mapFriendshipRow(row: FriendshipDbRow): Friendship {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    receiverUserId: row.receiver_user_id,
    status: row.status as Friendship['status'],
    permissions: mergePermissions(row.permissions, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── DB operations ────────────────────────────────────────────

export type SendRequestResult =
  | { status: 'sent'; id: string }
  | { status: 'already_pending' }
  | { status: 'already_friends' }
  // Generic for an unknown handle — callers surface the SAME message as
  // success to avoid handle enumeration.
  | { status: 'not_found' }
  | { status: 'self' };

/** Resolve a handle to a user id via the admin client (exact match only). */
export async function resolveUserIdByHandle(
  admin: SupabaseClient,
  handle: string,
): Promise<string | null> {
  const { data } = await admin
    .from('player_profiles')
    .select('user_id, handle')
    .eq('handle', handle)
    .maybeSingle();
  return (data as { user_id: string } | null)?.user_id ?? null;
}

/**
 * Send a friend request addressed by handle. `actorUserId` MUST already be
 * the authenticated user's id. Idempotent w.r.t. existing friendships.
 */
export async function sendRequestByHandle(
  server: SupabaseClient,
  admin: SupabaseClient,
  actorUserId: string,
  rawHandle: string,
): Promise<SendRequestResult> {
  const handle = normalizeHandle(rawHandle);
  if (!isValidHandle(handle)) return { status: 'not_found' };

  const targetId = await resolveUserIdByHandle(admin, handle);
  if (!targetId) return { status: 'not_found' };
  if (targetId === actorUserId) return { status: 'self' };

  // Existing friendship in either direction?
  const { data: existing } = await server
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_user_id.eq.${actorUserId},receiver_user_id.eq.${targetId}),` +
        `and(requester_user_id.eq.${targetId},receiver_user_id.eq.${actorUserId})`,
    )
    .maybeSingle();
  if (existing) {
    const status = (existing as { status: string }).status;
    if (status === 'accepted') return { status: 'already_friends' };
    return { status: 'already_pending' };
  }

  const { data, error } = await server
    .from('friendships')
    .insert({
      requester_user_id: actorUserId, // RLS also enforces this
      receiver_user_id: targetId,
      status: 'pending',
      permissions: DEFAULT_FRIEND_PERMISSIONS,
    })
    .select('id')
    .single();
  if (error) throw new FriendAuthError(error.message, 400);
  return { status: 'sent', id: (data as { id: string }).id };
}

async function loadParticipantRow(
  server: SupabaseClient,
  id: string,
  actorUserId: string,
): Promise<FriendshipDbRow> {
  const { data } = await server
    .from('friendships')
    .select('id, requester_user_id, receiver_user_id, status, permissions, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  const row = data as FriendshipDbRow | null;
  if (!row) throw new FriendAuthError('Friendship not found.', 404);
  if (row.requester_user_id !== actorUserId && row.receiver_user_id !== actorUserId) {
    throw new FriendAuthError('Not a participant in this friendship.', 403);
  }
  return row;
}

/** Accept a pending request. Only the RECEIVER may accept. Idempotent. */
export async function acceptRequest(
  server: SupabaseClient,
  actorUserId: string,
  id: string,
): Promise<void> {
  const row = await loadParticipantRow(server, id, actorUserId);
  if (row.status === 'accepted') return;
  if (row.receiver_user_id !== actorUserId) {
    throw new FriendAuthError('Only the recipient can accept this request.', 403);
  }
  const { error } = await server
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new FriendAuthError(error.message, 400);
}

/** Decline a pending request (receiver only). */
export async function declineRequest(
  server: SupabaseClient,
  actorUserId: string,
  id: string,
): Promise<void> {
  const row = await loadParticipantRow(server, id, actorUserId);
  if (row.receiver_user_id !== actorUserId) {
    throw new FriendAuthError('Only the recipient can decline this request.', 403);
  }
  const { error } = await server
    .from('friendships')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new FriendAuthError(error.message, 400);
}

/** Remove a friendship (either participant). */
export async function removeFriend(
  server: SupabaseClient,
  actorUserId: string,
  id: string,
): Promise<void> {
  await loadParticipantRow(server, id, actorUserId); // participant check
  const { error } = await server.from('friendships').delete().eq('id', id);
  if (error) throw new FriendAuthError(error.message, 400);
}

/** Update per-friendship permissions (either participant). */
export async function updatePermissions(
  server: SupabaseClient,
  actorUserId: string,
  id: string,
  patch: Partial<FriendPermissions>,
): Promise<FriendPermissions> {
  const row = await loadParticipantRow(server, id, actorUserId);
  const next = mergePermissions(row.permissions, patch);
  const { error } = await server
    .from('friendships')
    .update({ permissions: next, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new FriendAuthError(error.message, 400);
  return next;
}

async function summariesByUserIds(
  admin: SupabaseClient,
  ids: string[],
): Promise<Map<string, ProfileRowLike>> {
  const map = new Map<string, ProfileRowLike>();
  if (ids.length === 0) return map;
  const { data } = await admin
    .from('player_profiles')
    .select('user_id, display_name, handle, primary_sport, skill_level, profile_intelligence_summary')
    .in('user_id', ids);
  for (const r of (data as ProfileRowLike[] | null) ?? []) map.set(r.user_id, r);
  return map;
}

function viewFor(
  row: FriendshipDbRow,
  actorUserId: string,
  profiles: Map<string, ProfileRowLike>,
): FriendView {
  const otherId = row.requester_user_id === actorUserId ? row.receiver_user_id : row.requester_user_id;
  const permissions = mergePermissions(row.permissions, {});
  const accepted = row.status === 'accepted';
  const profile = profiles.get(otherId) ?? { user_id: otherId };
  const summary = friendSummaryFromProfile(profile, {
    viewProfileGranted: accepted && permissions.view_profile,
  });
  const direction =
    row.status === 'pending'
      ? row.requester_user_id === actorUserId
        ? ('outgoing' as const)
        : ('incoming' as const)
      : null;
  return {
    friendshipId: row.id,
    status: row.status as FriendView['status'],
    direction,
    permissions,
    summary,
    createdAt: row.created_at,
  };
}

/** Accepted friends. */
export async function listFriends(
  server: SupabaseClient,
  admin: SupabaseClient,
  actorUserId: string,
): Promise<FriendView[]> {
  const { data } = await server
    .from('friendships')
    .select('id, requester_user_id, receiver_user_id, status, permissions, created_at, updated_at')
    .eq('status', 'accepted');
  const rows = (data as FriendshipDbRow[] | null) ?? [];
  const ids = rows.map((r) => (r.requester_user_id === actorUserId ? r.receiver_user_id : r.requester_user_id));
  const profiles = await summariesByUserIds(admin, ids);
  return rows.map((r) => viewFor(r, actorUserId, profiles));
}

/** Pending requests split into incoming/outgoing. */
export async function listPending(
  server: SupabaseClient,
  admin: SupabaseClient,
  actorUserId: string,
): Promise<{ incoming: FriendView[]; outgoing: FriendView[] }> {
  const { data } = await server
    .from('friendships')
    .select('id, requester_user_id, receiver_user_id, status, permissions, created_at, updated_at')
    .eq('status', 'pending');
  const rows = (data as FriendshipDbRow[] | null) ?? [];
  const ids = rows.map((r) => (r.requester_user_id === actorUserId ? r.receiver_user_id : r.requester_user_id));
  const profiles = await summariesByUserIds(admin, ids);
  const views = rows.map((r) => viewFor(r, actorUserId, profiles));
  return {
    incoming: views.filter((v) => v.direction === 'incoming'),
    outgoing: views.filter((v) => v.direction === 'outgoing'),
  };
}
