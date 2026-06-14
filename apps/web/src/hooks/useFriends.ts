'use client';

// ============================================================
// WS-05 — useFriends: React Query data layer for the friends UI.
// The QueryClientProvider is already mounted (components/layout/Providers).
// All endpoints are cloud-only; queries are disabled in local/device mode.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { authMode } from '@/lib/auth/useAuth';
import type { FriendView, FriendPermissions } from '@/lib/friends/types';

const KEY = {
  friends: ['friends', 'list'] as const,
  pending: ['friends', 'pending'] as const,
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Request failed');
  return res.json() as Promise<T>;
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as T;
}

export function useFriends() {
  const enabled = authMode() === 'cloud';
  const qc = useQueryClient();

  const friends = useQuery({
    queryKey: KEY.friends,
    queryFn: () => getJson<{ friends: FriendView[] }>('/api/friends').then((d) => d.friends),
    enabled,
  });

  const pending = useQuery({
    queryKey: KEY.pending,
    queryFn: () => getJson<{ incoming: FriendView[]; outgoing: FriendView[] }>('/api/friends/pending'),
    enabled,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY.friends });
    qc.invalidateQueries({ queryKey: KEY.pending });
  };

  const sendRequest = useMutation({
    mutationFn: (handle: string) =>
      send<{ status: string }>('/api/friends/requests', 'POST', { handle }),
    onSuccess: (r) => {
      track(ANALYTICS_EVENTS.FRIEND_REQUEST_SENT, { source_type: 'handle', result: r.status });
      invalidate();
    },
  });

  const accept = useMutation({
    mutationFn: (id: string) => send(`/api/friends/requests/${id}/accept`, 'POST'),
    onSuccess: () => {
      track(ANALYTICS_EVENTS.FRIEND_REQUEST_ACCEPTED, {});
      invalidate();
    },
  });

  const decline = useMutation({
    mutationFn: (id: string) => send(`/api/friends/requests/${id}/decline`, 'POST'),
    onSuccess: () => {
      track(ANALYTICS_EVENTS.FRIEND_REQUEST_DECLINED, {});
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => send(`/api/friends/${id}`, 'DELETE'),
    onSuccess: () => {
      track(ANALYTICS_EVENTS.FRIEND_REMOVED, {});
      invalidate();
    },
  });

  const setPermissions = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FriendPermissions> }) =>
      send<{ permissions: FriendPermissions }>(`/api/friends/${id}`, 'PATCH', patch),
    onSuccess: () => invalidate(),
  });

  return {
    enabled,
    friends,
    pending,
    sendRequest,
    accept,
    decline,
    remove,
    setPermissions,
  };
}
