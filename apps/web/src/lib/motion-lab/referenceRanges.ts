// ============================================================
// SwingVantage — Motion Lab: Reference Ranges (skill-segmented)
// ------------------------------------------------------------
// The single, editable home for how each proxy metric is scored, split
// by skill level (beginner → elite). These are STARTER HEURISTICS, not
// validated norms — centralised here precisely so they can be swapped
// for evidence-based, sport-specific ranges without touching the
// metric engine. `scoreMetric()` maps a raw value → 0–100 quality.
// ============================================================

export type MotionSkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export const SKILL_LEVELS: Array<{ id: MotionSkillLevel; label: string }> = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'elite', label: 'Elite' },
];

type Scorer =
  | { kind: 'inRange'; min: number; max: number; slack: number; unit?: string }
  | { kind: 'lowerBetter'; good: number; bad: number; unit?: string }
  | { kind: 'linear'; mul: number; lo: number; hi: number; unit?: string };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function applyScorer(s: Scorer, value: number): number {
  switch (s.kind) {
    case 'lowerBetter':
      if (value <= s.good) return 100;
      if (value >= s.bad) return 20;
      return Math.round(100 - ((value - s.good) / (s.bad - s.good)) * 80);
    case 'inRange': {
      if (value >= s.min && value <= s.max) return 100;
      const d = value < s.min ? s.min - value : value - s.max;
      return Math.round(clamp(100 - (d / s.slack) * 70, 20, 100));
    }
    case 'linear':
      return clamp(Math.round(value * s.mul), s.lo, s.hi);
  }
}

function targetLabel(s: Scorer): string {
  const u = s.unit ?? '';
  switch (s.kind) {
    case 'inRange':
      return `${s.min}–${s.max}${u}`;
    case 'lowerBetter':
      return `≤ ${s.good}${u}`;
    case 'linear':
      return 'higher is better';
  }
}

// Per metric, per skill level. Tighter expectations as skill rises.
const RANGES: Record<string, Record<MotionSkillLevel, Scorer>> = {
  shoulder_turn: {
    beginner: { kind: 'inRange', min: 55, max: 105, slack: 70, unit: '°' },
    intermediate: { kind: 'inRange', min: 70, max: 110, slack: 60, unit: '°' },
    advanced: { kind: 'inRange', min: 80, max: 110, slack: 50, unit: '°' },
    elite: { kind: 'inRange', min: 85, max: 110, slack: 45, unit: '°' },
  },
  hip_turn: {
    beginner: { kind: 'inRange', min: 25, max: 70, slack: 50, unit: '°' },
    intermediate: { kind: 'inRange', min: 35, max: 70, slack: 45, unit: '°' },
    advanced: { kind: 'inRange', min: 40, max: 65, slack: 40, unit: '°' },
    elite: { kind: 'inRange', min: 42, max: 62, slack: 35, unit: '°' },
  },
  hip_shoulder_sep: {
    beginner: { kind: 'inRange', min: 15, max: 55, slack: 45, unit: '°' },
    intermediate: { kind: 'inRange', min: 20, max: 55, slack: 40, unit: '°' },
    advanced: { kind: 'inRange', min: 28, max: 55, slack: 35, unit: '°' },
    elite: { kind: 'inRange', min: 35, max: 60, slack: 30, unit: '°' },
  },
  head_stability: {
    beginner: { kind: 'lowerBetter', good: 9, bad: 30, unit: '%' },
    intermediate: { kind: 'lowerBetter', good: 6, bad: 25, unit: '%' },
    advanced: { kind: 'lowerBetter', good: 5, bad: 20, unit: '%' },
    elite: { kind: 'lowerBetter', good: 4, bad: 16, unit: '%' },
  },
  pelvis_sway: {
    beginner: { kind: 'lowerBetter', good: 11, bad: 34, unit: '%' },
    intermediate: { kind: 'lowerBetter', good: 8, bad: 30, unit: '%' },
    advanced: { kind: 'lowerBetter', good: 7, bad: 26, unit: '%' },
    elite: { kind: 'lowerBetter', good: 6, bad: 22, unit: '%' },
  },
  spine_change: {
    beginner: { kind: 'lowerBetter', good: 11, bad: 34, unit: '°' },
    intermediate: { kind: 'lowerBetter', good: 8, bad: 30, unit: '°' },
    advanced: { kind: 'lowerBetter', good: 7, bad: 25, unit: '°' },
    elite: { kind: 'lowerBetter', good: 6, bad: 22, unit: '°' },
  },
  knee_flex: {
    beginner: { kind: 'inRange', min: 12, max: 50, slack: 35, unit: '°' },
    intermediate: { kind: 'inRange', min: 15, max: 45, slack: 30, unit: '°' },
    advanced: { kind: 'inRange', min: 18, max: 42, slack: 28, unit: '°' },
    elite: { kind: 'inRange', min: 20, max: 40, slack: 25, unit: '°' },
  },
  tempo_ratio: {
    beginner: { kind: 'inRange', min: 2.2, max: 3.8, slack: 2.2, unit: ':1' },
    intermediate: { kind: 'inRange', min: 2.5, max: 3.5, slack: 2, unit: ':1' },
    advanced: { kind: 'inRange', min: 2.7, max: 3.3, slack: 1.6, unit: ':1' },
    elite: { kind: 'inRange', min: 2.8, max: 3.2, slack: 1.4, unit: ':1' },
  },
  balance_finish: {
    beginner: { kind: 'lowerBetter', good: 6, bad: 22, unit: '%' },
    intermediate: { kind: 'lowerBetter', good: 4, bad: 18, unit: '%' },
    advanced: { kind: 'lowerBetter', good: 3.5, bad: 15, unit: '%' },
    elite: { kind: 'lowerBetter', good: 3, bad: 12, unit: '%' },
  },
  hand_speed_peak: {
    beginner: { kind: 'linear', mul: 40, lo: 20, hi: 100 },
    intermediate: { kind: 'linear', mul: 35, lo: 20, hi: 100 },
    advanced: { kind: 'linear', mul: 30, lo: 20, hi: 100 },
    elite: { kind: 'linear', mul: 26, lo: 20, hi: 100 },
  },
  rom: {
    beginner: { kind: 'inRange', min: 50, max: 125, slack: 70, unit: '°' },
    intermediate: { kind: 'inRange', min: 60, max: 120, slack: 60, unit: '°' },
    advanced: { kind: 'inRange', min: 70, max: 115, slack: 55, unit: '°' },
    elite: { kind: 'inRange', min: 75, max: 112, slack: 50, unit: '°' },
  },
  // % of pelvis motion that is rotation (around the spine) vs lateral slide.
  // Higher = more rotational; a little slide is fine, pure slide is not.
  rotation_quality: {
    beginner: { kind: 'inRange', min: 45, max: 95, slack: 50, unit: '%' },
    intermediate: { kind: 'inRange', min: 55, max: 92, slack: 45, unit: '%' },
    advanced: { kind: 'inRange', min: 60, max: 90, slack: 40, unit: '%' },
    elite: { kind: 'inRange', min: 65, max: 90, slack: 35, unit: '%' },
  },
};

/** Score a metric value (0–100) against the skill-level reference range. */
export function scoreMetric(metricId: string, value: number, skill: MotionSkillLevel): number {
  const byLevel = RANGES[metricId];
  if (!byLevel) return 50;
  return applyScorer(byLevel[skill], value);
}

/** A short human-readable target for the metric at this skill level (or null). */
export function metricTarget(metricId: string, skill: MotionSkillLevel): string | null {
  const byLevel = RANGES[metricId];
  if (!byLevel) return null;
  return `${targetLabel(byLevel[skill])} (${skill})`;
}

export function skillLabel(skill: MotionSkillLevel): string {
  return SKILL_LEVELS.find((s) => s.id === skill)?.label ?? 'Intermediate';
}
