// ============================================================
// SwingVantage — Benchmark Registry
// Versioned benchmark access layer.
//
// The static TARGET_WINDOWS in rules.ts are the v1.0.0 baseline.
// This registry wraps them and supports versioned overrides
// from the database without breaking existing logic.
//
// HOW IT WORKS:
//   1. Static baseline (TARGET_WINDOWS) = always available, no DB needed
//   2. Active version overrides (from DB) applied on top of baseline
//   3. Rules engine receives resolved windows for the active version
//   4. Old versions are preserved for historical comparison
// ============================================================

import type {
  BenchmarkMetric,
  BenchmarkVersion,
} from './types';
import { TARGET_WINDOWS, type ClubTargetWindows, type TargetWindow } from '../diagnostic/rules';

// ──────────────────────────────────────────────────────────────
// Baseline version descriptor
// ──────────────────────────────────────────────────────────────

export const BASELINE_VERSION: BenchmarkVersion = {
  id: 'v1_baseline',
  version: '1.0.0',
  title: 'SwingVantage Baseline Benchmarks',
  description:
    'Initial benchmark values derived from published launch-monitor standards, ' +
    'TrackMan education materials, and established golf instruction principles. ' +
    'These are the founding values for the SwingVantage benchmark evolution system.',
  effective_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  created_by: 'system',
  research_run_id: null,
  status: 'active',
  change_summary: ['Initial baseline established from industry-standard references'],
  metrics_changed: 0,
  parent_version_id: null,
};

// ──────────────────────────────────────────────────────────────
// Resolved benchmark type (what the rules engine receives)
// ──────────────────────────────────────────────────────────────

export type ResolvedWindows = Record<string, ClubTargetWindows>;

// ──────────────────────────────────────────────────────────────
// BenchmarkRegistry class
// ──────────────────────────────────────────────────────────────

export class BenchmarkRegistry {
  private overrides: Partial<ResolvedWindows> = {};
  private activeVersion: BenchmarkVersion = BASELINE_VERSION;
  private versionHistory: BenchmarkVersion[] = [BASELINE_VERSION];

  /** Set a new active version with optional metric overrides */
  applyVersion(
    version: BenchmarkVersion,
    metricOverrides: Partial<ResolvedWindows>,
  ): void {
    // Archive current version as superseded
    this.versionHistory.push({ ...this.activeVersion, status: 'superseded' });
    this.activeVersion = version;
    this.overrides = metricOverrides;
  }

  /** Get the resolved target windows for a given club type */
  getWindows(clubType: string): ClubTargetWindows {
    const override = this.overrides[clubType];
    const baseline = TARGET_WINDOWS[clubType] ?? TARGET_WINDOWS.mid_iron;
    if (!override) return baseline;
    // Deep merge: override only specified metrics
    return { ...baseline, ...override };
  }

  /** Get all resolved windows (all club types) */
  getAllWindows(): ResolvedWindows {
    const allKeys = new Set([
      ...Object.keys(TARGET_WINDOWS),
      ...Object.keys(this.overrides),
    ]);
    const result: ResolvedWindows = {};
    for (const key of allKeys) {
      result[key] = this.getWindows(key);
    }
    return result;
  }

  /** Get active benchmark version descriptor */
  getActiveVersion(): BenchmarkVersion {
    return this.activeVersion;
  }

  /** Get version history */
  getVersionHistory(): BenchmarkVersion[] {
    return [...this.versionHistory];
  }

  /** Get a specific window value for admin/display purposes */
  getTargetValue(
    clubType: string,
    metric: keyof ClubTargetWindows,
  ): TargetWindow | null {
    const windows = this.getWindows(clubType);
    return windows[metric] ?? null;
  }

  /** Reset to baseline (useful for testing) */
  reset(): void {
    this.overrides = {};
    this.activeVersion = BASELINE_VERSION;
    this.versionHistory = [BASELINE_VERSION];
  }
}

/** Singleton registry — shared across the app */
export const benchmarkRegistry = new BenchmarkRegistry();

// ──────────────────────────────────────────────────────────────
// Convert a BenchmarkMetric (DB record) to a TargetWindow
// ──────────────────────────────────────────────────────────────

export function metricToTargetWindow(metric: BenchmarkMetric): TargetWindow {
  return {
    min: metric.lower_bound,
    max: metric.upper_bound,
    ideal: metric.target_value,
    unit: metric.unit,
    description: metric.context,
  };
}

// ──────────────────────────────────────────────────────────────
// Build a ResolvedWindows override map from DB BenchmarkMetrics
// ──────────────────────────────────────────────────────────────

export function buildOverridesFromMetrics(
  metrics: BenchmarkMetric[],
): Partial<ResolvedWindows> {
  const result: Partial<ResolvedWindows> = {};

  for (const metric of metrics) {
    const clubKey = metric.club_type === 'all' ? 'mid_iron' : metric.club_type;
    if (!result[clubKey]) result[clubKey] = {} as ClubTargetWindows;

    const metricKey = metric.metric_name as keyof ClubTargetWindows;
    if (metricKey in (TARGET_WINDOWS.mid_iron ?? {})) {
      (result[clubKey] as Record<string, TargetWindow>)[metricKey] =
        metricToTargetWindow(metric);
    }
  }

  return result;
}

// ──────────────────────────────────────────────────────────────
// Compare two windows to generate a human-readable diff
// ──────────────────────────────────────────────────────────────

export interface BenchmarkDiff {
  metric: string;
  club_type: string;
  old_min: number;
  old_target: number;
  old_max: number;
  new_min: number;
  new_target: number;
  new_max: number;
  change_magnitude: number;   // absolute change in target value
  change_direction: 'increase' | 'decrease' | 'unchanged';
}

export function diffWindows(
  oldWindows: ResolvedWindows,
  newWindows: ResolvedWindows,
): BenchmarkDiff[] {
  const diffs: BenchmarkDiff[] = [];

  for (const [clubType, newClub] of Object.entries(newWindows)) {
    const oldClub = oldWindows[clubType];
    if (!oldClub) continue;

    for (const [metric, newWindow] of Object.entries(newClub)) {
      const oldWindow = (oldClub as Record<string, TargetWindow>)[metric];
      if (!oldWindow) continue;

      const delta = newWindow.ideal - oldWindow.ideal;
      if (Math.abs(delta) < 0.01) continue; // no meaningful change

      diffs.push({
        metric,
        club_type: clubType,
        old_min: oldWindow.min,
        old_target: oldWindow.ideal,
        old_max: oldWindow.max,
        new_min: newWindow.min,
        new_target: newWindow.ideal,
        new_max: newWindow.max,
        change_magnitude: Math.abs(delta),
        change_direction: delta > 0 ? 'increase' : 'decrease',
      });
    }
  }

  return diffs.sort((a, b) => b.change_magnitude - a.change_magnitude);
}
