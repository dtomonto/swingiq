'use client';

// ============================================================
// SwingVantage Admin — feature flag override store (local-first)
// ------------------------------------------------------------
// Persisted operator overrides (localStorage `swingvantage-admin-flags`).
// Features read the effective value via `isFlagEnabled(key)` below.
// Toggling here records an audit entry at the call site.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FLAG_DEFS, evalFlag, findFlagDef, type FlagOverride } from '../flags';

interface FeatureFlagStore {
  overrides: Record<string, FlagOverride>;
  setFlag: (key: string, patch: Partial<FlagOverride>, by: string) => void;
  toggle: (key: string, by: string) => boolean;
  reset: (key: string) => void;
  resetAll: () => void;
}

const ssrSafeStorage = () =>
  createJSONStorage(() => {
    if (typeof window === 'undefined') {
      return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    }
    return localStorage;
  });

function baseOverride(key: string): FlagOverride {
  const def = findFlagDef(key);
  return {
    enabled: def?.defaultEnabled ?? false,
    rolloutPct: def?.defaultEnabled ? 100 : 0,
    segments: [],
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}

export const useFeatureFlags = create<FeatureFlagStore>()(
  persist(
    (set, get) => ({
      overrides: {},
      setFlag: (key, patch, by) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [key]: {
              ...(s.overrides[key] ?? baseOverride(key)),
              ...patch,
              updatedAt: new Date().toISOString(),
              updatedBy: by,
            },
          },
        })),
      toggle: (key, by) => {
        const current = get().overrides[key] ?? baseOverride(key);
        const next = !current.enabled;
        set((s) => ({
          overrides: {
            ...s.overrides,
            [key]: {
              ...current,
              enabled: next,
              rolloutPct: next ? Math.max(current.rolloutPct, 1) : 0,
              updatedAt: new Date().toISOString(),
              updatedBy: by,
            },
          },
        }));
        return next;
      },
      reset: (key) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[key];
          return { overrides: next };
        }),
      resetAll: () => set({ overrides: {} }),
    }),
    { name: 'swingvantage-admin-flags', storage: ssrSafeStorage(), version: 1 },
  ),
);

/**
 * Read the effective state of a flag from any client component.
 * Falls back to the registry default when no override is set.
 */
export function isFlagEnabled(key: string): boolean {
  const def = findFlagDef(key);
  if (!def) return false;
  const override = useFeatureFlags.getState().overrides[key];
  return evalFlag(def, override);
}

/** All flags with their effective state, for the management table. */
export function flagRows(overrides: Record<string, FlagOverride>) {
  return FLAG_DEFS.map((def) => ({
    def,
    override: overrides[def.key],
    enabled: evalFlag(def, overrides[def.key]),
  }));
}
