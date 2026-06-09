'use client';

// ============================================================
// SearchIntelligenceOS — local-first decision overlay
// ------------------------------------------------------------
// Persists the human decisions that should survive a live re-scan: action
// status (in-progress/done/dismissed), keyword save/ignore, and content
// opportunity status. Mirrors the GrowthOS feature-flag store pattern
// (zustand + persist + SSR-safe storage). The engine stays pure; the UI
// overlays these statuses on top of the recomputed result.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SearchAction, OpportunityStatus } from './types';

type ActionStatus = SearchAction['status'];

interface SearchIntelStore {
  actionStatus: Record<string, ActionStatus>;
  keywordState: Record<string, 'saved' | 'ignored'>;
  opportunityStatus: Record<string, OpportunityStatus>;
  setActionStatus: (id: string, status: ActionStatus) => void;
  setKeywordState: (id: string, state: 'saved' | 'ignored') => void;
  setOpportunityStatus: (id: string, status: OpportunityStatus) => void;
  reset: () => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

export const useSearchIntelStore = create<SearchIntelStore>()(
  persist(
    (set) => ({
      actionStatus: {},
      keywordState: {},
      opportunityStatus: {},
      setActionStatus: (id, status) => set((s) => ({ actionStatus: { ...s.actionStatus, [id]: status } })),
      setKeywordState: (id, state) => set((s) => ({ keywordState: { ...s.keywordState, [id]: state } })),
      setOpportunityStatus: (id, status) => set((s) => ({ opportunityStatus: { ...s.opportunityStatus, [id]: status } })),
      reset: () => set({ actionStatus: {}, keywordState: {}, opportunityStatus: {} }),
    }),
    { name: 'swingvantage-search-intel', storage: ssrSafeStorage(), version: 1 },
  ),
);
