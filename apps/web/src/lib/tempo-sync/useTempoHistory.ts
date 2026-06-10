'use client';

// ============================================================
// SwingVantage — Tempo Sync: React hook for saved tempo history
// ------------------------------------------------------------
// Subscribes to the local tempo-history store and re-renders on any
// save/clear (same tab) or cross-tab storage change. Mirrors the Motion
// Lab useMotionSessions pattern.
// ============================================================

import { useSyncExternalStore } from 'react';
import {
  loadTempoHistory,
  subscribeTempoHistory,
  getTempoStoreVersion,
  type TempoEntry,
} from './storage';

const EMPTY: TempoEntry[] = [];

export function useTempoHistory(): TempoEntry[] {
  const version = useSyncExternalStore(
    subscribeTempoHistory,
    getTempoStoreVersion,
    () => 0,
  );
  void version; // version change drives the re-read below
  if (typeof window === 'undefined') return EMPTY;
  return loadTempoHistory();
}
