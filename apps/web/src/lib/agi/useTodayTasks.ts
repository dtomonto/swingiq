'use client';

// ============================================================
// SwingVantage — useTodayTasks
// ------------------------------------------------------------
// A reactive, SSR-safe view of the committed plan's drills as a
// daily checklist. Combines the active AGI commitment (the keystone
// the athlete approved) with today's checkmarks (today-tasks store),
// so the dashboard can render "Today's Tasks" and persist check-offs.
// Self-empties when there is no active commitment.
// ============================================================

import { useSyncExternalStore } from 'react';
import { loadCommitment } from '@/lib/agi/commitment';
import {
  subscribeTodayTasks,
  getTodayTasksVersion,
  loadDoneTaskKeys,
  toggleTodayTask,
  taskKey,
  todayStr,
} from '@/lib/agi/today-tasks';

export interface TodayTask {
  key: string;
  sport: string;
  fix: string;
  drillId: string | null;
  done: boolean;
}

export interface TodayTasksView {
  /** True once client-side localStorage has been read (post-hydration). */
  ready: boolean;
  /** The committed keystone's display name, when a plan is active. */
  planName: string | null;
  tasks: TodayTask[];
  doneCount: number;
  total: number;
  /** Toggle a task's done state for today. */
  toggle: (key: string) => void;
}

const SERVER_VIEW: TodayTasksView = {
  ready: false,
  planName: null,
  tasks: [],
  doneCount: 0,
  total: 0,
  toggle: () => {},
};

let cache: { key: string; value: TodayTasksView } | null = null;

function commitmentSignature(): string {
  const c = loadCommitment();
  if (!c || c.status !== 'active') return 'none';
  return `${c.committedAt}:${c.drills.length}`;
}

function snapshotKey(): string {
  return `${todayStr()}:${getTodayTasksVersion()}:${commitmentSignature()}`;
}

function getSnapshot(): TodayTasksView {
  const key = snapshotKey();
  if (cache && cache.key === key) return cache.value;

  const commitment = loadCommitment();
  const active = commitment && commitment.status === 'active' ? commitment : null;
  const done = loadDoneTaskKeys();

  const tasks: TodayTask[] = (active?.drills ?? []).map((d) => {
    const k = taskKey(d.sport, d.fix, d.drillId);
    return { key: k, sport: d.sport, fix: d.fix, drillId: d.drillId, done: done.has(k) };
  });

  const value: TodayTasksView = {
    ready: true,
    planName: active?.name ?? null,
    tasks,
    doneCount: tasks.filter((t) => t.done).length,
    total: tasks.length,
    toggle: toggleTodayTask,
  };
  cache = { key, value };
  return value;
}

function subscribe(callback: () => void): () => void {
  const unsub = subscribeTodayTasks(callback);
  // The commitment lives in its own key; a cross-tab change there should also
  // refresh the list. Same-tab commit changes are picked up on the next render
  // (e.g. navigating back to the dashboard).
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'swingiq-agi-commitment-v1') callback();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    unsub();
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

/** Reactive, SSR-safe Today's Tasks view. */
export function useTodayTasks(): TodayTasksView {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_VIEW);
}
