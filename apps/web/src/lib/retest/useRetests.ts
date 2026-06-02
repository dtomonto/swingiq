'use client';

// ============================================================
// SwingIQ — useRetests hook
// ------------------------------------------------------------
// A reactive, SSR-safe view of the user's open retests and
// completed results. Backed by `useSyncExternalStore`, it stays
// referentially stable between renders and live-updates when a
// new analysis is saved OR a reminder is dismissed — including
// across browser tabs.
// ============================================================

import { useSyncExternalStore } from 'react';
import {
  loadVideoHistory,
  subscribeVideoHistory,
  getVideoHistoryVersion,
} from '@/lib/video/history';
import {
  loadRetestStore,
  subscribeRetestStore,
  getRetestStoreVersion,
  dismissTarget,
  acknowledgeResult,
} from './store';
import { deriveRetestTargets, deriveRetestResults, topRetestTarget } from './targets';
import type { RetestResult, RetestTarget } from './types';

export interface RetestView {
  /** True once client-side localStorage has been read (post-hydration). */
  ready: boolean;
  /** Open findings awaiting a retest, most urgent first. */
  targets: RetestTarget[];
  /** Completed retests (latest vs previous), newest first. */
  results: RetestResult[];
  /** The single most urgent due/overdue target, for a compact nudge. */
  topTarget: RetestTarget | null;
  dismiss: (id: string) => void;
  acknowledge: (id: string) => void;
}

const SERVER_VIEW: RetestView = {
  ready: false,
  targets: [],
  results: [],
  topTarget: null,
  dismiss: () => {},
  acknowledge: () => {},
};

// Cache the computed view so getSnapshot returns a stable reference until
// either underlying store changes (required by useSyncExternalStore).
let cache: { version: number; value: RetestView } | null = null;

function combinedVersion(): number {
  // Distinct multipliers so changes in either store always bump the key.
  return getVideoHistoryVersion() * 1_000_003 + getRetestStoreVersion();
}

function getSnapshot(): RetestView {
  const version = combinedVersion();
  if (cache && cache.version === version) return cache.value;

  const history = loadVideoHistory();
  const store = loadRetestStore();
  const now = new Date();
  const targets = deriveRetestTargets(history, store, now);
  const results = deriveRetestResults(history, store);

  const value: RetestView = {
    ready: true,
    targets,
    results,
    topTarget: topRetestTarget(targets),
    dismiss: dismissTarget,
    acknowledge: acknowledgeResult,
  };
  cache = { version, value };
  return value;
}

function subscribe(callback: () => void): () => void {
  const unsubA = subscribeVideoHistory(callback);
  const unsubB = subscribeRetestStore(callback);
  return () => {
    unsubA();
    unsubB();
  };
}

/** Reactive, SSR-safe retests view. */
export function useRetests(): RetestView {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_VIEW);
}
