'use client';

// ============================================================
// SwingVantage — cross-tab store sync
// ------------------------------------------------------------
// The local-first Zustand store (`swingiq-store`) persists to localStorage but
// does NOT, by default, react to writes made in OTHER tabs. So if a user adds a
// swing / runs a diagnosis in one tab while the dashboard is open in another,
// the open tab would keep showing stale data until a manual refresh.
//
// This listens for the `storage` event (the browser fires it only in tabs OTHER
// than the one that wrote) and rehydrates the store from the latest persisted
// state, so every open surface (dashboard, progress, training) reflects new data
// in-visit. Mirrors the already-proven cross-tab behaviour of useVideoHistory.
// Renders nothing.
// ============================================================

import { useEffect } from 'react';
import { useSwingVantageStore } from '@/store';

const STORE_KEY = 'swingiq-store';

export function StoreCrossTabSync() {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      // Only our store's key (or a full localStorage.clear(), which fires key=null
      // — e.g. a sign-out in another tab). Ignore unrelated keys.
      if (e.key !== null && e.key !== STORE_KEY) return;
      void useSwingVantageStore.persist?.rehydrate?.();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
