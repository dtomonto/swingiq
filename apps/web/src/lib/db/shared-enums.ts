// ============================================================
// Player Experience Overhaul — shared DB enums (single source of truth)
// ------------------------------------------------------------
// String-literal unions for anything used in permissions, querying,
// analytics, or product logic across the overhaul workstreams. Feature
// workstreams (WS-03..WS-07) import from here so statuses/contexts never
// drift between SQL, types, services, and UI. Keep these in lockstep with
// the CHECK constraints in the supabase-*.sql migrations.
// ============================================================

/** friendships.status */
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export const FRIENDSHIP_STATUSES: readonly FriendshipStatus[] = [
  'pending',
  'accepted',
  'declined',
  'blocked',
] as const;

/** Known keys in friendships.permissions (extensible — others may exist). */
export type FriendPermissionKey =
  | 'view_profile'
  | 'view_reports'
  | 'allow_upload_for_me';

/** skill_tree_nodes.status */
export type SkillNodeStatus =
  | 'locked'
  | 'available'
  | 'active'
  | 'improving'
  | 'mastered'
  | 'needs_attention'
  | 'regressed';
export const SKILL_NODE_STATUSES: readonly SkillNodeStatus[] = [
  'locked',
  'available',
  'active',
  'improving',
  'mastered',
  'needs_attention',
  'regressed',
] as const;

/** sessions/video_analyses.upload_context */
export type UploadContext = 'self' | 'friend' | 'coach' | 'parent';
export const UPLOAD_CONTEXTS: readonly UploadContext[] = [
  'self',
  'friend',
  'coach',
  'parent',
] as const;

/** sessions/video_analyses.permission_status (extensible) */
export type PermissionStatus =
  | 'self_owned'
  | 'friend_granted'
  | 'pending'
  | 'revoked';

/** Upload pipeline status surfaced in the UI. */
export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
