'use client';

// ============================================================
// SwingVantage Admin — Setup hub: "I did this" store (local-first)
// ------------------------------------------------------------
// Remembers which MANUAL tasks (database files, DNS, one-time commands) the
// owner has marked done — the things we genuinely can't observe from the
// environment. Persisted in localStorage so it survives reloads on this
// browser. Auto-detected tasks (keys, connected integrations) ignore this
// entirely: their live signal always wins, so a box can never lie.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Acknowledgement {
  at: string; // ISO timestamp the owner marked it done
}

interface SetupStore {
  acknowledged: Record<string, Acknowledgement>;
  markDone: (taskId: string) => void;
  markUndone: (taskId: string) => void;
  toggle: (taskId: string) => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

export const useSetupStore = create<SetupStore>()(
  persist(
    (set, get) => ({
      acknowledged: {},
      markDone: (taskId) =>
        set((s) => ({
          acknowledged: { ...s.acknowledged, [taskId]: { at: new Date().toISOString() } },
        })),
      markUndone: (taskId) =>
        set((s) => {
          const next = { ...s.acknowledged };
          delete next[taskId];
          return { acknowledged: next };
        }),
      toggle: (taskId) =>
        get().acknowledged[taskId] ? get().markUndone(taskId) : get().markDone(taskId),
    }),
    { name: 'swingvantage-admin-setup', storage: ssrSafeStorage(), version: 1 },
  ),
);
