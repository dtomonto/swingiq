// ============================================================
// SwingVantage — Golf player profiles & benchmarks (Phase 10)
// ------------------------------------------------------------
// Seven named profiles from Beginner → Professional, each with an
// EXPECTED score per swing dimension. Grading is relative to your
// profile's expectation (and your own history), never pro standards by
// default — so "good for a developing player" reads as a B, not an F.
//
// Benchmarks are data (not hard-coded grade cutoffs) so an admin can
// tune them without code (see the admin benchmark table). The grading
// engine (grade.ts) reads a benchmark table; this file is the default.
// ============================================================

export type GolfProfileId =
  | 'beginner'
  | 'developing'
  | 'intermediate'
  | 'advanced'
  | 'competitive'
  | 'elite'
  | 'professional';

/** The swing dimensions we grade (subset of SwingScores that's measurable). */
export const GRADE_DIMENSIONS = [
  'face_control',
  'path_control',
  'strike_quality',
  'launch_spin_optimization',
  'dispersion',
  'consistency',
] as const;
export type GradeDimension = (typeof GRADE_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<GradeDimension, string> = {
  face_control: 'Face control',
  path_control: 'Path control',
  strike_quality: 'Strike quality',
  launch_spin_optimization: 'Launch & spin',
  dispersion: 'Dispersion',
  consistency: 'Consistency',
};

export interface GolfProfile {
  id: GolfProfileId;
  label: string;
  /** 0 = lowest (Beginner). Used for next-level progression. */
  order: number;
  /** Inclusive handicap band [low, high] used for auto-assignment. */
  handicapRange: [number, number];
  /** Typical 18-hole score band, for plain-language context. */
  typicalScore: string;
  /** The dimension score a typical player at this level reaches (the benchmark). */
  expected: number;
  description: string;
}

// `expected` rises ~8 points per level. These are the per-profile benchmark
// scores; the admin table can override per dimension on top of these.
export const GOLF_PROFILES: GolfProfile[] = [
  { id: 'beginner', label: 'Beginner', order: 0, handicapRange: [29, 54], typicalScore: '100+', expected: 40, description: 'New to golf or breaking 100 — building repeatable contact.' },
  { id: 'developing', label: 'Developing', order: 1, handicapRange: [21, 28], typicalScore: '90s–100', expected: 48, description: 'Making contact consistently, learning to control direction.' },
  { id: 'intermediate', label: 'Intermediate', order: 2, handicapRange: [13, 20], typicalScore: 'mid-80s to 90s', expected: 57, description: 'Solid ball-striking, working on dispersion and distance control.' },
  { id: 'advanced', label: 'Advanced', order: 3, handicapRange: [6, 12], typicalScore: 'high 70s to mid-80s', expected: 66, description: 'Single-digit-bound — tightening windows and consistency.' },
  { id: 'competitive', label: 'Competitive', order: 4, handicapRange: [1, 5], typicalScore: 'low-to-mid 70s', expected: 74, description: 'Single-digit, competing — refining shot-shaping and control.' },
  { id: 'elite', label: 'Elite', order: 5, handicapRange: [-2, 0], typicalScore: 'around par', expected: 82, description: 'Scratch or better — optimizing every window.' },
  { id: 'professional', label: 'Professional', order: 6, handicapRange: [-10, -3], typicalScore: 'under par', expected: 90, description: 'Plus-handicap / playing professionally — tour-level tolerances.' },
];

export function getProfile(id: GolfProfileId): GolfProfile {
  return GOLF_PROFILES.find((p) => p.id === id) ?? GOLF_PROFILES[1]!;
}

/** The next profile up, or null at the top. */
export function nextProfile(id: GolfProfileId): GolfProfile | null {
  const cur = getProfile(id);
  return GOLF_PROFILES.find((p) => p.order === cur.order + 1) ?? null;
}

export type BenchmarkTable = Record<GolfProfileId, Record<GradeDimension, number>>;

/** Build the default benchmark table (uniform per profile across dimensions). */
export function defaultBenchmarks(): BenchmarkTable {
  const table = {} as BenchmarkTable;
  for (const p of GOLF_PROFILES) {
    table[p.id] = {} as Record<GradeDimension, number>;
    for (const dim of GRADE_DIMENSIONS) table[p.id][dim] = p.expected;
  }
  return table;
}

/** Default grading weights per dimension (mirrors the scoring engine's overall). */
export const DEFAULT_DIMENSION_WEIGHTS: Record<GradeDimension, number> = {
  face_control: 0.25,
  path_control: 0.15,
  strike_quality: 0.25,
  launch_spin_optimization: 0.1,
  dispersion: 0.1,
  consistency: 0.15,
};
