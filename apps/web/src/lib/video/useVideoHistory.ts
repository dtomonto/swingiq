'use client';

// ============================================================
// SwingIQ — useVideoHistory hook
// A reactive, SSR-safe view of the locally-saved AI video analyses
// for one sport. Backed by `useSyncExternalStore`, so it loads
// client-only localStorage after hydration (no setState-in-effect),
// stays referentially stable between renders, and live-updates when an
// analysis is saved/deleted — including across browser tabs.
// ============================================================

import { useSyncExternalStore } from 'react';
import type { VisualSport } from '@swingiq/core';
import {
  historyForSport,
  subscribeVideoHistory,
  getVideoHistoryVersion,
  type SavedVideoAnalysis,
} from './history';

/** Stable empty reference for the server snapshot (SSR has no localStorage). */
const EMPTY: SavedVideoAnalysis[] = [];

// Cache the snapshot per sport so getSnapshot returns a stable reference until
// the store actually changes (required by useSyncExternalStore to avoid loops).
const snapshotCache = new Map<VisualSport, { version: number; value: SavedVideoAnalysis[] }>();

function getSnapshotForSport(sport: VisualSport): SavedVideoAnalysis[] {
  const version = getVideoHistoryVersion();
  const cached = snapshotCache.get(sport);
  if (cached && cached.version === version) return cached.value;
  const value = historyForSport(sport);
  snapshotCache.set(sport, { version, value });
  return value;
}

/** Saved analyses for one sport, newest first. Reactive + SSR-safe. */
export function useVideoHistory(sport: VisualSport): SavedVideoAnalysis[] {
  return useSyncExternalStore(
    subscribeVideoHistory,
    () => getSnapshotForSport(sport),
    () => EMPTY,
  );
}
