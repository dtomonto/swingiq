'use client';

// ============================================================
// SwingVantage — Benchmark override store (Phase 10, admin-tunable)
// ------------------------------------------------------------
// Lets an admin tune the per-profile/dimension benchmarks WITHOUT code,
// persisted locally. The grading engine reads `activeBenchmarks()`
// (defaults deep-merged with any override). Because there is no global
// benchmark backend, an override applies to THIS device for preview;
// the admin page can export the table as JSON to commit for global
// rollout — honest about the boundary.
// ============================================================

import { useEffect, useState } from 'react';
import {
  defaultBenchmarks, GRADE_DIMENSIONS, GOLF_PROFILES,
  type BenchmarkTable, type GolfProfileId, type GradeDimension,
} from './profiles';

const KEY = 'swingiq.grading.benchmarks.override.v1';

/** Read the raw override (partial), or null. Never throws. */
export function loadBenchmarkOverride(): Partial<Record<GolfProfileId, Partial<Record<GradeDimension, number>>>> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Defaults deep-merged with any saved override (clamped 0–100). */
export function activeBenchmarks(): BenchmarkTable {
  const table = defaultBenchmarks();
  const override = loadBenchmarkOverride();
  if (override) {
    for (const p of GOLF_PROFILES) {
      const row = override[p.id];
      if (!row) continue;
      for (const dim of GRADE_DIMENSIONS) {
        const v = row[dim];
        if (typeof v === 'number' && Number.isFinite(v)) {
          table[p.id][dim] = Math.max(0, Math.min(100, Math.round(v)));
        }
      }
    }
  }
  return table;
}

/** Persist the full edited table as an override. Never throws. */
export function saveBenchmarkOverride(table: BenchmarkTable): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(table));
    window.dispatchEvent(new Event('swingiq-benchmarks-changed'));
  } catch {
    /* storage unavailable */
  }
}

export function resetBenchmarkOverride(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('swingiq-benchmarks-changed'));
  } catch {
    /* ignore */
  }
}

/** Live active benchmarks (re-reads on change). SSR-safe (defaults first). */
export function useActiveBenchmarks(): BenchmarkTable {
  const [table, setTable] = useState<BenchmarkTable>(() => defaultBenchmarks());
  useEffect(() => {
    const refresh = () => setTable(activeBenchmarks());
    refresh();
    window.addEventListener('swingiq-benchmarks-changed', refresh);
    return () => window.removeEventListener('swingiq-benchmarks-changed', refresh);
  }, []);
  return table;
}
