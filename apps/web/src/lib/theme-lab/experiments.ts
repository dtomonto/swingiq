// ============================================================
// Theme Lab — experiments + segment defaults (#3 step 4). Local-first operator
// config (mirrors control.ts): define theme A/B experiments and per-segment
// default themes, then feed them into resolveThemeForUser(). PURE + SSR-safe;
// writes broadcast a change event so the live ThemeApplicator re-resolves.
//
// Deterministic bucketing already lives in resolve.ts (bucketVariant); this
// module is just the durable config + the "which experiment is live right now"
// selection. Governance: an experiment only affects users once an operator sets
// its status to `running`; a draft/stopped experiment changes nothing.
// ============================================================

import type { ThemeId } from '@/lib/theme/themes';
import type { ThemeExperiment } from './resolve';

export const EXPERIMENTS_STORAGE_KEY = 'swingiq-theme-experiments';
export const EXPERIMENTS_CHANGE_EVENT = 'swingiq-theme-experiments-change';
export const THEME_ANON_ID_KEY = 'swingiq-theme-anon';

export type ExperimentStatus = 'draft' | 'running' | 'stopped';

export interface ThemeExperimentConfig extends ThemeExperiment {
  name: string;
  status: ExperimentStatus;
  createdAt: string;
  /** Set when an operator declares a winner (informational; stops the test). */
  winnerThemeId?: ThemeId | null;
}

/** A segment key → its default theme. Segments map from existing app signals
 *  (e.g. usage_category) — see segmentForUsageCategory below. */
export type SegmentDefaults = Partial<Record<string, ThemeId>>;

interface ExperimentsState {
  experiments: ThemeExperimentConfig[];
  segments: SegmentDefaults;
}

const EMPTY: ExperimentsState = { experiments: [], segments: {} };

function broadcast(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event(EXPERIMENTS_CHANGE_EVENT));
    } catch {
      /* ignore */
    }
  }
}

/** Read the full experiments + segments config. SSR-safe. */
export function readExperimentsState(): ExperimentsState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(EXPERIMENTS_STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ExperimentsState> | null;
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    return {
      experiments: Array.isArray(parsed.experiments) ? parsed.experiments : [],
      segments: parsed.segments && typeof parsed.segments === 'object' ? parsed.segments : {},
    };
  } catch {
    return EMPTY;
  }
}

function writeState(next: ExperimentsState): ExperimentsState {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(EXPERIMENTS_STORAGE_KEY, JSON.stringify(next));
      broadcast();
    } catch {
      /* storage unavailable */
    }
  }
  return next;
}

export function readExperiments(): ThemeExperimentConfig[] {
  return readExperimentsState().experiments;
}

export function readSegmentDefaults(): SegmentDefaults {
  return readExperimentsState().segments;
}

/** Create or replace an experiment by id. */
export function upsertExperiment(cfg: ThemeExperimentConfig): ThemeExperimentConfig[] {
  const state = readExperimentsState();
  const idx = state.experiments.findIndex((e) => e.id === cfg.id);
  const experiments =
    idx >= 0
      ? state.experiments.map((e) => (e.id === cfg.id ? cfg : e))
      : [...state.experiments, cfg];
  return writeState({ ...state, experiments }).experiments;
}

export function removeExperiment(id: string): ThemeExperimentConfig[] {
  const state = readExperimentsState();
  return writeState({ ...state, experiments: state.experiments.filter((e) => e.id !== id) })
    .experiments;
}

export function setExperimentStatus(id: string, status: ExperimentStatus): ThemeExperimentConfig[] {
  const state = readExperimentsState();
  return writeState({
    ...state,
    experiments: state.experiments.map((e) => (e.id === id ? { ...e, status } : e)),
  }).experiments;
}

export function setSegmentDefault(segment: string, themeId: ThemeId | null): SegmentDefaults {
  const state = readExperimentsState();
  const segments = { ...state.segments };
  if (themeId) segments[segment] = themeId;
  else delete segments[segment];
  return writeState({ ...state, segments }).segments;
}

/**
 * The single experiment that is live right now, reduced to the shape the
 * resolver wants ({ id, variants }). The first `running` experiment with at
 * least one positively-weighted variant wins. `null` when none are running.
 */
export function activeRunningExperiment(
  experiments: ThemeExperimentConfig[] = readExperiments(),
): ThemeExperiment | null {
  const live = experiments.find(
    (e) => e.status === 'running' && e.variants.some((v) => v.weight > 0),
  );
  return live ? { id: live.id, variants: live.variants } : null;
}

/**
 * A stable, device-local anonymous id used only for deterministic local theme
 * bucketing. Never transmitted; privacy-safe. Generated once and reused.
 */
export function getThemeAnonId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let id = window.localStorage.getItem(THEME_ANON_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `anon-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
      window.localStorage.setItem(THEME_ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anon-fallback';
  }
}

/** Map an existing app signal (usage_category) to a Theme Lab segment key. */
export function segmentForUsageCategory(usage: string | null | undefined): string | null {
  switch (usage) {
    case 'coach':
      return 'coaches';
    case 'parent_guardian':
      return 'parents';
    case 'adult':
      return 'athletes';
    case 'minor_13_17':
    case 'minor_under_13':
      return 'juniors';
    default:
      return null;
  }
}
