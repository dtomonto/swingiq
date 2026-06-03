'use client';

// ============================================================
// SwingIQ — useOfflineQueue
// ------------------------------------------------------------
// React hook exposing the offline session queue's pending count and
// the browser's online/offline status. SSR-safe (server snapshot =
// online, 0 pending). Live-updates on queue changes and connectivity.
// ============================================================

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { subscribeSessionQueue, countPendingSessions } from './session-queue';

// Online status via useSyncExternalStore (no setState-in-effect).
function subscribeOnline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export interface OfflineQueueState {
  pendingCount: number;
  isOnline: boolean;
  /** Re-read the pending count from IndexedDB. */
  refresh: () => void;
}

export function useOfflineQueue(): OfflineQueueState {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(() => {
    // Async update (not a synchronous render-phase/effect setState).
    countPendingSessions()
      .then(setPendingCount)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    return subscribeSessionQueue(refresh);
  }, [refresh]);

  return { pendingCount, isOnline, refresh };
}
