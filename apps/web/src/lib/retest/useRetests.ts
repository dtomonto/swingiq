'use client';

// ============================================================
// SwingVantage — useRetests hook
// ------------------------------------------------------------
// A reactive, SSR-safe view of the user's open retests and
// completed results across BOTH data sources:
//   - video history (tennis / baseball / softball / golf video)
//   - launch-monitor sessions in the Zustand store (golf)
// Backed by `useSyncExternalStore`, it stays referentially stable
// between renders and live-updates when a new analysis is saved, a
// session is added, or a reminder is dismissed — including across tabs.
// ============================================================

import { useSyncExternalStore } from 'react';
import {
  loadVideoHistory,
  subscribeVideoHistory,
  getVideoHistoryVersion,
} from '@/lib/video/history';
import { useSwingVantageStore } from '@/store';
import {
  loadRetestStore,
  subscribeRetestStore,
  getRetestStoreVersion,
  dismissTarget,
  acknowledgeResult,
} from './store';
import { deriveRetestTargets, deriveRetestResults, sortRetestTargets, topRetestTarget } from './targets';
import { deriveGolfRetestTargets, deriveGolfRetestResults } from './targets.golf';
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

// Cache the computed view so getSnapshot returns a stable reference until any
// underlying source changes (required by useSyncExternalStore).
let cache: { key: string; value: RetestView } | null = null;

/** Cheap signature of the golf sessions that affect retests. */
function golfSignature(): string {
  const sessions = useSwingVantageStore.getState().sessions;
  const golf = sessions.filter((s) => s.sport === 'golf');
  const latest = golf[0];
  return `${golf.length}:${latest?.id ?? ''}:${latest?.diagnoses?.length ?? 0}:${latest?.swing_score ?? ''}`;
}

function snapshotKey(): string {
  return `${getVideoHistoryVersion()}:${getRetestStoreVersion()}:${golfSignature()}`;
}

function getSnapshot(): RetestView {
  const key = snapshotKey();
  if (cache && cache.key === key) return cache.value;

  const history = loadVideoHistory();
  const store = loadRetestStore();
  const sessions = useSwingVantageStore.getState().sessions;
  const now = new Date();

  const targets = sortRetestTargets([
    ...deriveRetestTargets(history, store, now),
    ...deriveGolfRetestTargets(sessions, store, now),
  ]);
  const results = [
    ...deriveRetestResults(history, store),
    ...deriveGolfRetestResults(sessions, store),
  ].sort((a, b) => new Date(b.currentDate).getTime() - new Date(a.currentDate).getTime());

  const value: RetestView = {
    ready: true,
    targets,
    results,
    topTarget: topRetestTarget(targets),
    dismiss: dismissTarget,
    acknowledge: acknowledgeResult,
  };
  cache = { key, value };
  return value;
}

function subscribe(callback: () => void): () => void {
  const unsubA = subscribeVideoHistory(callback);
  const unsubB = subscribeRetestStore(callback);
  const unsubC = useSwingVantageStore.subscribe(callback);
  return () => {
    unsubA();
    unsubB();
    unsubC();
  };
}

/** Reactive, SSR-safe retests view. */
export function useRetests(): RetestView {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_VIEW);
}
