// ============================================================
// SwingVantage — Sport Registry
// Single source of truth for all sports supported by SwingVantage.
// Each sport's config, phases, drills, benchmarks, and analysis
// function are registered here.
// ============================================================

import type { SportId, SportConfig } from './types';
import type { SportAnalysisInput, SportSwingAnalysis } from './types';

// Phase definitions
import { TENNIS_PHASE_DEFINITIONS, TENNIS_PHASE_SEQUENCE } from './tennis/phases';
import { BASEBALL_PHASE_DEFINITIONS, BASEBALL_PHASE_SEQUENCE } from './baseball/phases';
import { SLOW_PITCH_PHASE_DEFINITIONS, SLOW_PITCH_PHASE_SEQUENCE } from './softball-slow/phases';
import { FAST_PITCH_PHASE_DEFINITIONS, FAST_PITCH_PHASE_SEQUENCE } from './softball-fast/phases';

// Benchmarks
import { TENNIS_BENCHMARKS } from './tennis/benchmarks';
import { BASEBALL_BENCHMARKS } from './baseball/benchmarks';
import { SLOW_PITCH_BENCHMARKS } from './softball-slow/benchmarks';
import { FAST_PITCH_BENCHMARKS } from './softball-fast/benchmarks';

// Analysis engines
import { runTennisAnalysis } from './tennis/analysis';
import { runBaseballAnalysis } from './baseball/analysis';
import { runSlowPitchAnalysis } from './softball-slow/analysis';
import { runFastPitchAnalysis } from './softball-fast/analysis';

// ──────────────────────────────────────────────────────────────
// Sport configuration objects
// ──────────────────────────────────────────────────────────────

const TENNIS_CONFIG: SportConfig = {
  id: 'tennis',
  name: 'Tennis',
  short_name: 'Tennis',
  emoji: '🎾',
  description:
    'Forehand and backhand groundstroke analysis. Phase-by-phase coaching for recreational to competitive players.',
  tagline: 'Serve, swing, improve.',
  color_class: 'text-yellow-500',
  accent_hex: '#EAB308',
  phases: Object.fromEntries(
    Object.entries(TENNIS_PHASE_DEFINITIONS).map(([k, v]) => [k, v]),
  ),
  phase_sequence: TENNIS_PHASE_SEQUENCE,
  benchmarks: TENNIS_BENCHMARKS,
  camera_angle_guidance: {
    face_on: 'Best for groundstroke phase analysis — captures hip rotation and follow-through.',
    down_the_line: 'Useful for tracking racket plane and contact point depth.',
    rear: 'Good for seeing shoulder turn and backswing loop.',
  },
  evidence_note:
    'SwingVantage tennis benchmarks are evidence-informed and segmented by skill level. ' +
    'Values are based on published coaching and biomechanics literature. ' +
    'Periodically reviewed and updated as new research is available.',
  benchmark_version: '1.0.0',
};

const BASEBALL_CONFIG: SportConfig = {
  id: 'baseball',
  name: 'Baseball',
  short_name: 'Baseball',
  emoji: '⚾',
  description:
    'Full swing analysis for baseball hitters. Covers stance through follow-through with phase-specific coaching cues and evidence-based drills.',
  tagline: 'Load, fire, drive.',
  color_class: 'text-red-500',
  accent_hex: '#EF4444',
  phases: Object.fromEntries(
    Object.entries(BASEBALL_PHASE_DEFINITIONS).map(([k, v]) => [k, v]),
  ),
  phase_sequence: BASEBALL_PHASE_SEQUENCE,
  benchmarks: BASEBALL_BENCHMARKS,
  camera_angle_guidance: {
    face_on: 'Best for evaluating hip rotation, stride direction, and contact point.',
    down_the_line: 'Ideal for evaluating bat path, casting, and extension through the zone.',
    rear: 'Useful for viewing hand path and load position.',
  },
  evidence_note:
    'SwingVantage baseball benchmarks are evidence-informed using publicly available MLB Statcast data, ' +
    'published biomechanics research, and USA Baseball coaching resources. ' +
    'Segmented by skill level from youth to professional reference.',
  benchmark_version: '1.0.0',
};

const SOFTBALL_SLOW_CONFIG: SportConfig = {
  id: 'softball_slow',
  name: 'Slow Pitch Softball',
  short_name: 'Slow Pitch',
  emoji: '🥎',
  description:
    'Swing analysis tuned for the slow pitch softball arc. Covers the unique mechanics of hitting a high-arc descending pitch with power and consistency.',
  tagline: 'Read the arc. Drive it out.',
  color_class: 'text-orange-500',
  accent_hex: '#F97316',
  phases: Object.fromEntries(
    Object.entries(SLOW_PITCH_PHASE_DEFINITIONS).map(([k, v]) => [k, v]),
  ),
  phase_sequence: SLOW_PITCH_PHASE_SEQUENCE,
  benchmarks: SLOW_PITCH_BENCHMARKS,
  camera_angle_guidance: {
    face_on: 'Best for evaluating hip rotation, contact height, and arc timing.',
    down_the_line: 'Good for viewing bat path and contact point depth.',
    rear: 'Useful for viewing load position and shoulder rotation.',
  },
  evidence_note:
    'SwingVantage slow pitch benchmarks are evidence-informed using ASA/USA Softball coaching resources, ' +
    'published recreational player research, and competitive slow pitch coaching literature. ' +
    'Confidence is medium — more data is available for baseball.',
  benchmark_version: '1.0.0',
};

const SOFTBALL_FAST_CONFIG: SportConfig = {
  id: 'softball_fast',
  name: 'Fast Pitch Softball',
  short_name: 'Fast Pitch',
  emoji: '🥎',
  description:
    'Compact swing analysis for fast pitch softball hitters. Addresses the unique challenges of the rising pitch, shorter reaction window, and compact swing mechanics.',
  tagline: 'Quick, compact, explosive.',
  color_class: 'text-pink-500',
  accent_hex: '#EC4899',
  phases: Object.fromEntries(
    Object.entries(FAST_PITCH_PHASE_DEFINITIONS).map(([k, v]) => [k, v]),
  ),
  phase_sequence: FAST_PITCH_PHASE_SEQUENCE,
  benchmarks: FAST_PITCH_BENCHMARKS,
  camera_angle_guidance: {
    face_on: 'Best for stride length, hip rotation, and contact point analysis.',
    down_the_line: 'Ideal for evaluating bat path, casting, and extension against the rising pitch.',
    rear: 'Useful for load position and hand path into the zone.',
  },
  evidence_note:
    'SwingVantage fast pitch benchmarks are evidence-informed using USA Softball, NFCA, and NCAA research. ' +
    'Reaction time benchmarks are based on published sports science literature. ' +
    'Confidence: medium — collegiate and international data available; recreational ranges estimated.',
  benchmark_version: '1.0.0',
};

// ──────────────────────────────────────────────────────────────
// Registry
// ──────────────────────────────────────────────────────────────

export const SPORT_CONFIGS: Record<Exclude<SportId, 'golf'>, SportConfig> = {
  tennis: TENNIS_CONFIG,
  baseball: BASEBALL_CONFIG,
  softball_slow: SOFTBALL_SLOW_CONFIG,
  softball_fast: SOFTBALL_FAST_CONFIG,
};

/** All non-golf sports in display order */
export const ALL_SPORTS: SportConfig[] = [
  TENNIS_CONFIG,
  BASEBALL_CONFIG,
  SOFTBALL_SLOW_CONFIG,
  SOFTBALL_FAST_CONFIG,
];

/**
 * Golf display config (phases/drills/analysis remain in video-analysis/ package).
 * Only included here for UI purposes (sport switcher).
 */
export const GOLF_DISPLAY = {
  id: 'golf' as const,
  name: 'Golf',
  short_name: 'Golf',
  emoji: '⛳',
  description: 'Full swing, short game, and launch monitor analysis for golfers of all levels.',
  tagline: 'From tee to green.',
  color_class: 'text-green-500',
  accent_hex: '#22C55E',
};

/** All sports including golf for UI */
export const ALL_SPORTS_INCLUDING_GOLF = [GOLF_DISPLAY, ...ALL_SPORTS];

/**
 * Get a sport config by ID (non-golf).
 * Returns null for golf — use the video-analysis module instead.
 */
export function getSportConfig(id: SportId): SportConfig | null {
  if (id === 'golf') return null;
  return SPORT_CONFIGS[id] ?? null;
}

// ──────────────────────────────────────────────────────────────
// Analysis dispatcher
// ──────────────────────────────────────────────────────────────

type AnalysisRunner = (input: SportAnalysisInput) => SportSwingAnalysis;

const ANALYSIS_RUNNERS: Record<Exclude<SportId, 'golf'>, AnalysisRunner> = {
  tennis: runTennisAnalysis,
  baseball: runBaseballAnalysis,
  softball_slow: runSlowPitchAnalysis,
  softball_fast: runFastPitchAnalysis,
};

/**
 * Run the heuristic analysis engine for the given sport.
 * For golf, use runVideoAnalysis() from the video-analysis module.
 */
export function runSportAnalysis(input: SportAnalysisInput): SportSwingAnalysis {
  if (input.sport_id === 'golf') {
    throw new Error('Use runVideoAnalysis() from @swingiq/core for golf analysis.');
  }
  const runner = ANALYSIS_RUNNERS[input.sport_id as Exclude<SportId, 'golf'>];
  if (!runner) {
    throw new Error(`No analysis engine registered for sport: ${input.sport_id}`);
  }
  return runner(input);
}

// ──────────────────────────────────────────────────────────────
// Camera angle labels (sport-agnostic UI)
// ──────────────────────────────────────────────────────────────

export const CAMERA_ANGLE_OPTIONS = [
  {
    value: 'face_on',
    label: 'Face-On',
    description: 'Camera facing the hitter directly (from pitcher\'s mound direction)',
  },
  {
    value: 'down_the_line',
    label: 'Down the Line',
    description: 'Camera behind and to the side, looking along the target line',
  },
  {
    value: 'rear',
    label: 'From Behind',
    description: 'Camera behind the hitter',
  },
  {
    value: 'unknown',
    label: 'Unknown / Other',
    description: 'Camera angle not specified',
  },
] as const;
