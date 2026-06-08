'use client';

// ============================================================
// SwingVantage Admin — Plan template editor store (local-first)
// ------------------------------------------------------------
// Persisted operator overlay (localStorage `swingvantage-admin-plan-edits`).
// Edits preview locally and export as JSON to commit globally — the
// browser never writes to live data. Mirrors the drill-editor store.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlanEdit } from './merge';

interface PlanEditorStore {
  edits: Record<string, PlanEdit>;
  upsert: (edit: PlanEdit) => void;
  remove: (id: string) => void;
  resetAll: () => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

export const usePlanEditor = create<PlanEditorStore>()(
  persist(
    (set) => ({
      edits: {},
      upsert: (edit) =>
        set((s) => ({ edits: { ...s.edits, [edit.id]: { ...edit, updatedAt: new Date().toISOString() } } })),
      remove: (id) =>
        set((s) => {
          const next = { ...s.edits };
          delete next[id];
          return { edits: next };
        }),
      resetAll: () => set({ edits: {} }),
    }),
    { name: 'swingvantage-admin-plan-edits', storage: ssrSafeStorage(), version: 1 },
  ),
);
