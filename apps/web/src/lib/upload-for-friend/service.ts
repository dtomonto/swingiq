// ============================================================
// Player Experience Overhaul — Upload-for-friend (WS-06)
// ------------------------------------------------------------
// Lets User A upload a swing FOR User B, but only when B is an accepted
// friend who enabled `allow_upload_for_me`. Authorization is delegated to
// the friends authz seam (single source of truth) and enforced server-side;
// the client can never assign an arbitrary athlete id.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { assertCanUploadForAthlete } from '@/lib/friends/authz';
import type { UploadContext, PermissionStatus } from '@/lib/db/shared-enums';

export type { UploadContext, PermissionStatus };

export interface UploadTarget {
  athleteUserId: string;
  context: UploadContext;
  permissionStatus: PermissionStatus;
}

export interface OwnershipColumns {
  athlete_user_id: string;
  uploaded_by_user_id: string;
  assigned_by_user_id: string;
  upload_context: UploadContext;
  permission_status: PermissionStatus;
  audit_metadata: Record<string, unknown>;
}

/**
 * Resolve + AUTHORIZE the athlete a swing is being uploaded for.
 * - No target / self → self upload (always allowed).
 * - A friend target → must pass assertCanUploadForAthlete (throws otherwise).
 * The returned athlete id is server-trusted; callers must use it (never the
 * raw client value).
 */
export async function resolveUploadTarget(args: {
  server: SupabaseClient;
  actorUserId: string;
  requestedAthleteUserId?: string | null;
}): Promise<UploadTarget> {
  const requested = args.requestedAthleteUserId?.trim();
  if (!requested || requested === args.actorUserId) {
    return { athleteUserId: args.actorUserId, context: 'self', permissionStatus: 'self_owned' };
  }
  await assertCanUploadForAthlete(args.server, args.actorUserId, requested);
  return { athleteUserId: requested, context: 'friend', permissionStatus: 'friend_granted' };
}

/** Build the ownership columns for a session/video row from a resolved target. */
export function buildOwnershipColumns(
  target: UploadTarget,
  actorUserId: string,
  reason = 'upload_for_friend',
): OwnershipColumns {
  return {
    athlete_user_id: target.athleteUserId,
    uploaded_by_user_id: actorUserId,
    assigned_by_user_id: actorUserId,
    upload_context: target.context,
    permission_status: target.permissionStatus,
    audit_metadata: {
      reason: target.context === 'self' ? 'self_upload' : reason,
      assigned_at: new Date().toISOString(),
    },
  };
}

export interface AuditEntry {
  actor_user_id: string;
  athlete_user_id: string;
  session_id: string | null;
  video_analysis_id: string | null;
  action: string;
  context: UploadContext;
  permission_status: PermissionStatus;
  metadata: Record<string, unknown>;
}

export function buildAuditEntry(
  target: UploadTarget,
  actorUserId: string,
  ids: { sessionId?: string | null; videoAnalysisId?: string | null },
): AuditEntry {
  return {
    actor_user_id: actorUserId,
    athlete_user_id: target.athleteUserId,
    session_id: ids.sessionId ?? null,
    video_analysis_id: ids.videoAnalysisId ?? null,
    action: target.context === 'self' ? 'self_upload' : 'upload_for_friend',
    context: target.context,
    permission_status: target.permissionStatus,
    metadata: { at: new Date().toISOString() },
  };
}
