'use client';

// ============================================================
// SwingVantage Admin — Drill editor override store (local-first)
// ------------------------------------------------------------
// Persisted operator overlay (localStorage `swingvantage-admin-drill-edits`).
// Edits preview locally and are exported as JSON to commit globally — the
// browser never writes to live production drill data. Mirrors the
// feature-flag / benchmark override pattern.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DrillEdit } from './merge';

interface DrillEditorStore {
  edits: Record<string, DrillEdit>;
  /** Insert or update an edit (stamps updatedAt). */
  upsert: (edit: DrillEdit) => void;
  /** Remove an edit by id (revert override / delete custom). */
  remove: (id: string) => void;
  /** Clear the whole overlay. */
  resetAll: () => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

export const useDrillEditor = create<DrillEditorStore>()(
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
    { name: 'swingvantage-admin-drill-edits', storage: ssrSafeStorage(), version: 1 },
  ),
);
