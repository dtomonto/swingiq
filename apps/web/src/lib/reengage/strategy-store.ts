// ============================================================
// SwingVantage — Re-engagement OS: strategy override store (local-first)
// ------------------------------------------------------------
// Persists the operator's drip-strategy tweaks (per-campaign priority /
// cadence / channels / copy + engine settings) in its own localStorage
// key, separate from the per-user nudge state in ./store.ts. SSR-safe,
// never throws. Mirrors the store.ts read/subscribe/write pattern.
//
// This is a PREVIEW/authoring layer: changes shape what the admin console
// shows and what `exportStrategyJson` emits to commit into triggers.ts —
// it does not mutate the shipped engine defaults at runtime for end users.
// ============================================================

import {
  DEFAULT_STRATEGY_SETTINGS,
  type StrategyOverride,
  type StrategyOverrides,
  type StrategySettings,
} from './analysis';
import type { TriggerId } from './types';

export const REENGAGE_STRATEGY_KEY = 'swingiq-reengage-strategy-v1';
const KEY = REENGAGE_STRATEGY_KEY;
const EVENT = 'swingvantage:reengage-strategy-change';

const hasWindow = () => typeof window !== 'undefined';

export interface StrategyState {
  version: 1;
  settings: StrategySettings;
  overrides: StrategyOverrides;
}

export const DEFAULT_STRATEGY_STATE: StrategyState = {
  version: 1,
  settings: DEFAULT_STRATEGY_SETTINGS,
  overrides: {},
};

let cache: { raw: string | null; value: StrategyState } | null = null;

export function read(): StrategyState {
  if (!hasWindow()) return DEFAULT_STRATEGY_STATE;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* private mode */
  }
  if (cache && cache.raw === raw) return cache.value;

  let value: StrategyState = DEFAULT_STRATEGY_STATE;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<StrategyState>;
      value = {
        version: 1,
        settings: { ...DEFAULT_STRATEGY_SETTINGS, ...parsed.settings },
        overrides: parsed.overrides ?? {},
      };
    } catch {
      value = DEFAULT_STRATEGY_STATE;
    }
  }
  cache = { raw, value };
  return value;
}

function write(next: StrategyState): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    cache = null;
    window.dispatchEvent(new Event(EVENT));
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    } catch {
      /* ignore */
    }
  } catch {
    /* quota / private mode */
  }
}

export function subscribe(cb: () => void): () => void {
  if (!hasWindow()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

// ── mutations ────────────────────────────────────────────────

/** Merge a partial override into a campaign; empty objects are pruned. */
export function setOverride(triggerId: TriggerId, patch: StrategyOverride): void {
  const s = read();
  const merged: StrategyOverride = { ...s.overrides[triggerId], ...patch };
  // Drop keys set back to undefined so "customized" stays accurate.
  (Object.keys(merged) as (keyof StrategyOverride)[]).forEach((k) => {
    if (merged[k] === undefined) delete merged[k];
  });
  const overrides = { ...s.overrides };
  if (Object.keys(merged).length === 0) delete overrides[triggerId];
  else overrides[triggerId] = merged;
  write({ ...s, overrides });
}

/** Remove every override for one campaign (reverts it to the code default). */
export function resetOverride(triggerId: TriggerId): void {
  const s = read();
  if (!s.overrides[triggerId]) return;
  const overrides = { ...s.overrides };
  delete overrides[triggerId];
  write({ ...s, overrides });
}

export function setSettings(patch: Partial<StrategySettings>): void {
  const s = read();
  write({ ...s, settings: { ...s.settings, ...patch } });
}

/** Wipe all overrides + settings back to the shipped defaults. */
export function resetAll(): void {
  write(DEFAULT_STRATEGY_STATE);
}
