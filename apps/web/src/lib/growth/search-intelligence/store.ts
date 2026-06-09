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
import type {
  SearchAction, OpportunityStatus, KeywordRow, RankingSnapshot, BacklinkRecord,
} from './types';

type ActionStatus = SearchAction['status'];

interface ImportedData {
  keywords: KeywordRow[];
  rankings: RankingSnapshot[];
  backlinks: BacklinkRecord[];
}

interface SearchIntelStore {
  actionStatus: Record<string, ActionStatus>;
  keywordState: Record<string, 'saved' | 'ignored'>;
  opportunityStatus: Record<string, OpportunityStatus>;
  imported: ImportedData;
  setActionStatus: (id: string, status: ActionStatus) => void;
  setKeywordState: (id: string, state: 'saved' | 'ignored') => void;
  setOpportunityStatus: (id: string, status: OpportunityStatus) => void;
  addImportedKeywords: (rows: KeywordRow[]) => void;
  addImportedRankings: (rows: RankingSnapshot[]) => void;
  addImportedBacklinks: (rows: BacklinkRecord[]) => void;
  clearImported: (kind?: keyof ImportedData) => void;
  reset: () => void;
}

/** Merge new rows over existing by `id` (latest import wins). */
function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming) map.set(r.id, r);
  return Array.from(map.values());
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
      imported: { keywords: [], rankings: [], backlinks: [] },
      setActionStatus: (id, status) => set((s) => ({ actionStatus: { ...s.actionStatus, [id]: status } })),
      setKeywordState: (id, state) => set((s) => ({ keywordState: { ...s.keywordState, [id]: state } })),
      setOpportunityStatus: (id, status) => set((s) => ({ opportunityStatus: { ...s.opportunityStatus, [id]: status } })),
      addImportedKeywords: (rows) => set((s) => ({ imported: { ...s.imported, keywords: mergeById(s.imported.keywords, rows) } })),
      addImportedRankings: (rows) => set((s) => ({ imported: { ...s.imported, rankings: mergeById(s.imported.rankings, rows) } })),
      addImportedBacklinks: (rows) => set((s) => ({ imported: { ...s.imported, backlinks: mergeById(s.imported.backlinks, rows) } })),
      clearImported: (kind) => set((s) => (kind
        ? { imported: { ...s.imported, [kind]: [] } }
        : { imported: { keywords: [], rankings: [], backlinks: [] } })),
      reset: () => set({ actionStatus: {}, keywordState: {}, opportunityStatus: {}, imported: { keywords: [], rankings: [], backlinks: [] } }),
    }),
    { name: 'swingvantage-search-intel', storage: ssrSafeStorage(), version: 2 },
  ),
);
