// ============================================================
// SwingVantage — Confidence calibration: local-first store (#16)
// ------------------------------------------------------------
// Records each surfaced diagnosis + its predicted confidence, and lets a later
// retest / feedback resolve it (confirmed|refuted). Own localStorage key, SSR-
// safe, never throws. Mirrors the lib/reengage store pattern. The pure report
// lives in ./analyze.
// ============================================================

import type { CalibrationEntry, CalibrationOutcome } from './analyze';

export const CALIBRATION_KEY = 'swingiq-calibration-v1';
const KEY = CALIBRATION_KEY;
const EVENT = 'swingvantage:calibration-change';
/** Cap the ring buffer so the log can't grow unbounded in localStorage. */
const MAX_ENTRIES = 500;

const hasWindow = () => typeof window !== 'undefined';

interface CalibrationState {
  version: 1;
  entries: CalibrationEntry[];
}

const EMPTY: CalibrationState = { version: 1, entries: [] };

let cache: { raw: string | null; value: CalibrationState } | null = null;

function readState(): CalibrationState {
  if (!hasWindow()) return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* private mode */
  }
  if (cache && cache.raw === raw) return cache.value;
  let value: CalibrationState = EMPTY;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<CalibrationState>;
      value = { version: 1, entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
    } catch {
      value = EMPTY;
    }
  }
  cache = { raw, value };
  return value;
}

function write(next: CalibrationState): void {
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

export function read(): CalibrationEntry[] {
  return readState().entries;
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

export interface RecordPredictionInput {
  diagnosisId: string;
  diagnosisName: string;
  predictedConfidence: number;
  sport: string;
}

/** Record a surfaced diagnosis + its predicted confidence. Returns the entry id. */
export function recordPrediction(input: RecordPredictionInput): string {
  const s = readState();
  const id = `${input.diagnosisId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: CalibrationEntry = {
    id,
    diagnosisId: input.diagnosisId,
    diagnosisName: input.diagnosisName,
    predictedConfidence: Math.max(0, Math.min(100, input.predictedConfidence)),
    sport: input.sport,
    recordedAt: new Date().toISOString(),
    outcome: null,
    resolvedAt: null,
  };
  const entries = [entry, ...s.entries].slice(0, MAX_ENTRIES);
  write({ version: 1, entries });
  return id;
}

/** Resolve a pending prediction from a retest / feedback. */
export function resolveOutcome(id: string, outcome: CalibrationOutcome): void {
  const s = readState();
  let changed = false;
  const entries = s.entries.map((e) => {
    if (e.id !== id || e.outcome !== null) return e;
    changed = true;
    return { ...e, outcome, resolvedAt: new Date().toISOString() };
  });
  if (changed) write({ version: 1, entries });
}

export function clearAll(): void {
  write(EMPTY);
}
