'use client';

// ============================================================
// Today's Command Center — owner state hook (CLIENT, localStorage)
// ------------------------------------------------------------
// Recommendations are generated server-side and are stateless. The owner's
// actions (in-progress / complete / snooze / dismiss / notes) and engine
// settings persist in the browser, so the feature works in production where
// the runtime filesystem is read-only — the exact pattern the Action
// Center's browser-local queues use. State is keyed by recommendation id,
// which is deterministic across scans, so actions survive re-scans.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import type {
  CommandCenterSettings,
  OverrideMap,
  OverrideRecord,
  RecommendationType,
} from './types';
import { DEFAULT_SETTINGS } from './types';

const OVERRIDES_KEY = 'swingvantage:command-center:overrides:v1';
const SETTINGS_KEY = 'swingvantage:command-center:settings:v1';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — degrade silently */
  }
}

export interface CommandCenterState {
  ready: boolean;
  overrides: OverrideMap;
  settings: CommandCenterSettings;
  setInProgress: (id: string, score: number) => void;
  complete: (id: string, score: number) => void;
  snooze: (id: string, score: number, days?: number) => void;
  dismiss: (id: string, score: number, reason?: string) => void;
  reactivate: (id: string) => void;
  addNote: (id: string, note: string) => void;
  updateSettings: (patch: Partial<CommandCenterSettings>) => void;
  toggleType: (type: RecommendationType) => void;
  resetSettings: () => void;
}

export function useCommandCenter(): CommandCenterState {
  const [ready, setReady] = useState(false);
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [settings, setSettings] = useState<CommandCenterSettings>(DEFAULT_SETTINGS);

  // Hydrate once on mount. Reading localStorage during render/SSR would cause a
  // hydration mismatch, so this deliberately syncs from the browser in an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverrides(readJson<OverrideMap>(OVERRIDES_KEY, {}));
    setSettings(readJson<CommandCenterSettings>(SETTINGS_KEY, DEFAULT_SETTINGS));
    setReady(true);
  }, []);

  const mutate = useCallback((id: string, patch: OverrideRecord | null) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (patch === null) delete next[id];
      else next[id] = patch;
      writeJson(OVERRIDES_KEY, next);
      return next;
    });
  }, []);

  const now = () => new Date().toISOString();

  const setInProgress = useCallback(
    (id: string, score: number) => mutate(id, { status: 'in_progress', scoreAtAction: score, updatedAt: now(), note: undefined }),
    [mutate],
  );

  const complete = useCallback(
    (id: string, score: number) =>
      mutate(id, { status: 'completed', completedAt: now(), scoreAtAction: score, updatedAt: now() }),
    [mutate],
  );

  const snooze = useCallback(
    (id: string, score: number, days?: number) => {
      const d = typeof days === 'number' ? days : settings.defaultSnoozeDays;
      const until = new Date();
      until.setDate(until.getDate() + d);
      mutate(id, { status: 'snoozed', snoozedUntil: until.toISOString(), scoreAtAction: score, updatedAt: now() });
    },
    [mutate, settings.defaultSnoozeDays],
  );

  const dismiss = useCallback(
    (id: string, score: number, reason?: string) =>
      mutate(id, { status: 'dismissed', dismissedReason: reason, scoreAtAction: score, updatedAt: now() }),
    [mutate],
  );

  const reactivate = useCallback((id: string) => mutate(id, null), [mutate]);

  const addNote = useCallback(
    (id: string, note: string) =>
      setOverrides((prev) => {
        const existing = prev[id] ?? { status: 'in_progress' as const, updatedAt: now() };
        const next = { ...prev, [id]: { ...existing, note, updatedAt: now() } };
        writeJson(OVERRIDES_KEY, next);
        return next;
      }),
    [],
  );

  const persistSettings = useCallback((next: CommandCenterSettings) => {
    setSettings(next);
    writeJson(SETTINGS_KEY, next);
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<CommandCenterSettings>) => persistSettings({ ...settings, ...patch }),
    [persistSettings, settings],
  );

  const toggleType = useCallback(
    (type: RecommendationType) => {
      const on = settings.disabledTypes.includes(type);
      const disabledTypes = on
        ? settings.disabledTypes.filter((t) => t !== type)
        : [...settings.disabledTypes, type];
      persistSettings({ ...settings, disabledTypes });
    },
    [persistSettings, settings],
  );

  const resetSettings = useCallback(() => persistSettings(DEFAULT_SETTINGS), [persistSettings]);

  return {
    ready,
    overrides,
    settings,
    setInProgress,
    complete,
    snooze,
    dismiss,
    reactivate,
    addNote,
    updateSettings,
    toggleType,
    resetSettings,
  };
}
