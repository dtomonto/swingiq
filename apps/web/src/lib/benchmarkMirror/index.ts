// ============================================================
// SwingIQ — Benchmark Mirror (schema + honest builder)
// ------------------------------------------------------------
// Surfaces the EXISTING per-sport benchmark windows (segmented by
// skill level) as a "mirror to aim at". Deliberately honest: these
// are typical ranges for a level, NOT your measured percentile, and
// SwingIQ does not rank you against other players.
// ============================================================

import {
  BASEBALL_BENCHMARKS,
  TENNIS_BENCHMARKS,
  SLOW_PITCH_BENCHMARKS,
  FAST_PITCH_BENCHMARKS,
  type SportId,
  type SkillLevel,
  type SportBenchmarks,
  type SportSkillSegment,
} from '@swingiq/core';

const BENCHMARKS_BY_SPORT: Partial<Record<SportId, SportBenchmarks>> = {
  baseball: BASEBALL_BENCHMARKS,
  tennis: TENNIS_BENCHMARKS,
  softball_slow: SLOW_PITCH_BENCHMARKS,
  softball_fast: FAST_PITCH_BENCHMARKS,
};

export interface BenchmarkMetric {
  key: string;
  label: string;
  min: number;
  target: number;
  max: number;
  unit: string;
  confidenceNote: string;
}

export interface BenchmarkMirror {
  sport: SportId;
  skill: SkillLevel;
  available: boolean;
  metrics: BenchmarkMetric[];
  /** Honest framing shown above the windows. */
  framing: string;
  /** Sport-level note, or guidance when windows aren't available. */
  note: string | null;
}

function toSegment(skill: SkillLevel): SportSkillSegment {
  // SportSkillSegment mirrors SkillLevel exactly today; map defensively.
  return skill;
}

const FRAMING =
  'A mirror to aim at — typical windows for your level, not your measured percentile. SwingIQ does not rank you against other players.';

export function buildBenchmarkMirror(sport: SportId, skill: SkillLevel): BenchmarkMirror {
  const benchmarks = BENCHMARKS_BY_SPORT[sport];

  if (!benchmarks) {
    return {
      sport,
      skill,
      available: false,
      metrics: [],
      framing: FRAMING,
      note:
        sport === 'golf'
          ? 'For golf, your launch-monitor numbers on the Progress page are the most useful mirror — segmented benchmark windows are coming.'
          : 'Benchmark windows for this sport are coming soon.',
    };
  }

  const segment = benchmarks.segmented[toSegment(skill)] ?? {};
  const metrics: BenchmarkMetric[] = Object.entries(segment).map(([key, w]) => ({
    key,
    label: w.description,
    min: w.min,
    target: w.target,
    max: w.max,
    unit: w.unit,
    confidenceNote: w.confidence_note,
  }));

  return {
    sport,
    skill,
    available: metrics.length > 0,
    metrics,
    framing: FRAMING,
    note: benchmarks.notes ?? null,
  };
}
