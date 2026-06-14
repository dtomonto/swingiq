'use client';

// ============================================================
// WS-06 — useUploadForFriend: posts an analysis assignment to the secure
// server route and mirrors the analytics events client-side. The server is
// the authority on whether the assignment is allowed.
// ============================================================

import { useMutation } from '@tanstack/react-query';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export interface UploadForFriendArgs {
  athleteUserId: string;
  sport?: string;
  fileName?: string;
  analysis?: unknown;
}

export interface UploadForFriendResult {
  id: string;
  athleteUserId: string;
  uploadContext: string;
  permissionStatus: string;
}

export function useUploadForFriend() {
  return useMutation<UploadForFriendResult, Error, UploadForFriendArgs>({
    mutationFn: async (args) => {
      track(ANALYTICS_EVENTS.UPLOAD_FOR_FRIEND_STARTED, { sport: args.sport ?? '', upload_context: 'friend' });
      const res = await fetch('/api/uploads/for-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        track(ANALYTICS_EVENTS.UPLOAD_FOR_FRIEND_FAILED, {
          sport: args.sport ?? '',
          reason: json.error ?? 'error',
        });
        throw new Error(json.error ?? 'Upload failed');
      }
      return json as UploadForFriendResult;
    },
    onSuccess: (r) => {
      track(ANALYTICS_EVENTS.UPLOAD_FOR_FRIEND_COMPLETED, {
        upload_context: r.uploadContext,
        permission_status: r.permissionStatus,
      });
    },
  });
}
