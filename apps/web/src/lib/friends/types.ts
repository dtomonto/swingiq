// ============================================================
// Player Experience Overhaul — Friends foundation (WS-05)
// ------------------------------------------------------------
// Secure friends MVP. Friendships are added by public handle; every
// cross-user read is privacy-filtered and every mutation is authorized
// server-side. This module's `authz` is the stable seam WS-06
// (upload-for-friend) builds on.
// ============================================================

import type { FriendshipStatus, FriendPermissionKey } from '@/lib/db/shared-enums';

export type { FriendshipStatus, FriendPermissionKey };

/** Per-friendship permission flags (extensible; safe-by-default off). */
export interface FriendPermissions {
  view_profile: boolean;
  view_reports: boolean;
  allow_upload_for_me: boolean;
  [key: string]: boolean;
}

export interface Friendship {
  id: string;
  requesterUserId: string;
  receiverUserId: string;
  status: FriendshipStatus;
  permissions: FriendPermissions;
  createdAt: string;
  updatedAt: string;
}

/** Which side of a pending request the current user is on. */
export type FriendDirection = 'incoming' | 'outgoing';

/**
 * A privacy-filtered view of another athlete. Only ever contains fields
 * the friendship's permissions allow — never raw private data.
 */
export interface FriendSummary {
  userId: string;
  handle: string | null;
  displayName: string;
  /** Initials for an avatar placeholder. */
  initials: string;
  primarySport: string | null;
  /** Present only when view_profile is granted. */
  skillLevel?: string | null;
  stage?: string | null;
  archetype?: string | null;
}

/** A friendship row joined with the other party's summary, for the UI. */
export interface FriendView {
  friendshipId: string;
  status: FriendshipStatus;
  direction: FriendDirection | null;
  permissions: FriendPermissions;
  summary: FriendSummary;
  createdAt: string;
}

export const DEFAULT_FRIEND_PERMISSIONS: FriendPermissions = {
  view_profile: true,
  view_reports: false,
  allow_upload_for_me: false,
};
