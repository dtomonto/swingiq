// ============================================================
// SwingVantage — Profile-aware grading engine (Phase 10)
// ------------------------------------------------------------
// Turns absolute 0–100 dimension scores into grades RELATIVE to the
// player's profile benchmark + their own history. Meeting your level's
// expectation is a solid B; exceeding it is an A; you're only an F
// against YOUR level, never against tour pros (unless that's your level).
// Every grade is explainable: score, the benchmark it's measured
// against, and the gap. Pure + deterministic.
// ============================================================

import type { SwingScores } from '@swingiq/core';
import {
  GRADE_DIMENSIONS, DIMENSION_LABELS, DEFAULT_DIMENSION_WEIGHTS,
  defaultBenchmarks, getProfile, nextProfile,
  type GolfProfileId, type GradeDimension, type BenchmarkTable,
} from './profiles';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Grade from how far a score sits above/below its benchmark expectation. */
export function gradeFromDelta(delta: number): Grade {
  if (delta >= 10) return 'A';
  if (delta >= -8) return 'B'; // meeting your level's expectation
  if (delta >= -20) return 'C';
  if (delta >= -32) return 'D';
  return 'F';
}

export interface DimensionGrade {
  dimension: GradeDimension;
  label: string;
  score: number;
  expected: number;
  delta: number;
  grade: Grade;
}

export interface GradeResult {
  profileId: GolfProfileId;
  profileLabel: string;
  dimensions: DimensionGrade[];
  overall: { score: number; expected: number; delta: number; grade: Grade };
  /** Where the session sits vs the profile benchmark overall. */
  vsProfile: 'exceeding' | 'meeting' | 'below';
  /** Movement vs the player's own prior baseline overall, if known. */
  vsBaseline: { delta: number; direction: 'improving' | 'steady' | 'declining' } | null;
  /** What reaching the next level needs (dimensions still short of it). */
  nextLevel: { id: GolfProfileId; label: string; gaps: Array<{ dimension: GradeDimension; label: string; need: number }> } | null;
  explanation: string[];
}

function weightedExpectedOverall(row: Record<GradeDimension, number>): number {
  let sum = 0;
  for (const dim of GRADE_DIMENSIONS) sum += row[dim] * DEFAULT_DIMENSION_WEIGHTS[dim];
  return Math.round(sum);
}

export interface GradeSessionArgs {
  scores: SwingScores;
  profileId: GolfProfileId;
  /** Optional benchmark override (admin-tuned); falls back to defaults. */
  benchmarks?: BenchmarkTable;
  /** Player's prior baseline overall score (e.g. avg of earlier sessions). */
  ownBaselineOverall?: number | null;
}

export function gradeSession(args: GradeSessionArgs): GradeResult {
  const { scores, profileId } = args;
  const table = args.benchmarks ?? defaultBenchmarks();
  const profile = getProfile(profileId);
  const row = table[profileId] ?? defaultBenchmarks()[profileId];

  const dimensions: DimensionGrade[] = GRADE_DIMENSIONS.map((dim) => {
    const score = Math.round(scores[dim] ?? 50);
    const expected = row[dim];
    const delta = score - expected;
    return { dimension: dim, label: DIMENSION_LABELS[dim], score, expected, delta, grade: gradeFromDelta(delta) };
  });

  const expectedOverall = weightedExpectedOverall(row);
  const overallScore = Math.round(scores.overall ?? 50);
  const overallDelta = overallScore - expectedOverall;
  const overall = { score: overallScore, expected: expectedOverall, delta: overallDelta, grade: gradeFromDelta(overallDelta) };

  const vsProfile: GradeResult['vsProfile'] =
    overallDelta >= 5 ? 'exceeding' : overallDelta >= -8 ? 'meeting' : 'below';

  let vsBaseline: GradeResult['vsBaseline'] = null;
  if (typeof args.ownBaselineOverall === 'number') {
    const delta = overallScore - Math.round(args.ownBaselineOverall);
    vsBaseline = { delta, direction: delta >= 3 ? 'improving' : delta <= -3 ? 'declining' : 'steady' };
  }

  // Next-level gaps: dimensions still below the next profile's benchmark.
  const next = nextProfile(profileId);
  let nextLevel: GradeResult['nextLevel'] = null;
  if (next) {
    const nextRow = table[next.id] ?? defaultBenchmarks()[next.id];
    const gaps = GRADE_DIMENSIONS
      .map((dim) => ({ dimension: dim, label: DIMENSION_LABELS[dim], need: nextRow[dim] - Math.round(scores[dim] ?? 50) }))
      .filter((g) => g.need > 0)
      .sort((a, b) => b.need - a.need);
    nextLevel = { id: next.id, label: next.label, gaps };
  }

  // Explanation (plain language).
  const sorted = [...dimensions].sort((a, b) => a.delta - b.delta);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const explanation: string[] = [
    `Graded against the ${profile.label} benchmark (≈${expectedOverall}/100 overall), plus your own trend.`,
  ];
  if (vsProfile === 'exceeding') explanation.push(`You're scoring above a typical ${profile.label.toLowerCase()} player — ready to push toward ${next?.label ?? 'the top level'}.`);
  else if (vsProfile === 'meeting') explanation.push(`You're right where a ${profile.label.toLowerCase()} player is expected to be.`);
  else explanation.push(`A bit below the ${profile.label.toLowerCase()} benchmark — that's the gap to close first.`);
  if (weakest) explanation.push(`Biggest opportunity: ${weakest.label.toLowerCase()} (${weakest.grade}).`);
  if (strongest && strongest.grade <= 'B') explanation.push(`Strongest today: ${strongest.label.toLowerCase()} (${strongest.grade}).`);

  return { profileId, profileLabel: profile.label, dimensions, overall, vsProfile, vsBaseline, nextLevel, explanation };
}
