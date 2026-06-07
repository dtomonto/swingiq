'use client';

// ============================================================
// SwingVantage Admin — content review / generated-fix candidates store
// ------------------------------------------------------------
// Local-first (localStorage `swingvantage-admin-content-review`). Holds
// the generated-fix review queue. Starts EMPTY — candidates are added
// by an operator (or, in future, fed by the generation pipeline); we
// never seed fake pages.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FixCandidate, FixStatus, FixScores, FixSource } from '../generated-fixes';

interface ContentReviewStore {
  candidates: FixCandidate[];
  addCandidate: (input: {
    query: string;
    sport: string | null;
    source: FixSource;
    scores: FixScores;
    notes?: string;
  }) => FixCandidate;
  setStatus: (id: string, status: FixStatus, mergedIntoId?: string) => void;
  remove: (id: string) => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

const rid = () => `fix_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const useContentReview = create<ContentReviewStore>()(
  persist(
    (set) => ({
      candidates: [],
      addCandidate: (input) => {
        const candidate: FixCandidate = {
          id: rid(),
          query: input.query.trim(),
          sport: input.sport,
          source: input.source,
          status: 'needs_review',
          createdAt: new Date().toISOString(),
          notes: input.notes,
          scores: input.scores,
        };
        set((s) => ({ candidates: [candidate, ...s.candidates] }));
        return candidate;
      },
      setStatus: (id, status, mergedIntoId) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id ? { ...c, status, mergedIntoId: mergedIntoId ?? c.mergedIntoId } : c,
          ),
        })),
      remove: (id) => set((s) => ({ candidates: s.candidates.filter((c) => c.id !== id) })),
    }),
    { name: 'swingvantage-admin-content-review', storage: ssrSafeStorage(), version: 1 },
  ),
);
