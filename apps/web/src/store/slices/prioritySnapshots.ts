import type { SwingVantageSlice, SwingVantageStore } from '../types';
import type { PrioritySnapshot } from '@/lib/priority/types';

/**
 * History of the athlete's top-priority over time (Phase 7), so the priority
 * panel can say "what changed" since last time. Only records when the top
 * priority actually changes (no churn), capped to the last 20. Local-first.
 */
export const createPrioritySnapshotsSlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'prioritySnapshots' | 'recordPrioritySnapshot' | 'clearPrioritySnapshots'>
> = (set) => ({
  prioritySnapshots: [],

  recordPrioritySnapshot: (snap: PrioritySnapshot) =>
    set((s) => {
      const last = s.prioritySnapshots[s.prioritySnapshots.length - 1];
      if (last && last.topId === snap.topId) return s; // no change → don't churn
      return { prioritySnapshots: [...s.prioritySnapshots, snap].slice(-20) };
    }),

  clearPrioritySnapshots: () => set({ prioritySnapshots: [] }),
});
