'use client';

// ============================================================
// SwingVantage — Motion Lab: React hook for stored sessions
// ------------------------------------------------------------
// Subscribes to the local session store and re-renders on any
// save/delete/clear (same tab) or cross-tab storage change.
// ============================================================

import { useSyncExternalStore } from 'react';
import {
  loadSessions,
  subscribeMotionSessions,
  getMotionStoreVersion,
} from './persistence';
import type { MotionSession } from './types';

const EMPTY: MotionSession[] = [];

export function useMotionSessions(): MotionSession[] {
  // Server snapshot is a stable empty array (store is client-only).
  const version = useSyncExternalStore(
    subscribeMotionSessions,
    getMotionStoreVersion,
    () => 0,
  );
  // version drives re-reads; loadSessions is cheap and never throws.
  void version;
  if (typeof window === 'undefined') return EMPTY;
  return loadSessions();
}
