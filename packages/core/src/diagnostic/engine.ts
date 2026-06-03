// ============================================================
// SwingIQ Diagnostic Engine
// Converts shot data arrays into prioritized diagnoses
// ============================================================

import type { Shot, SupportingDataPoint } from '../types';
import { DIAGNOSTIC_RULES, type SessionStats, type DiagnosticRule } from './rules';

function average(values: (number | null | undefined)[]): number | undefined {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return undefined;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

function stdDev(values: (number | null | undefined)[]): number | undefined {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length < 2) return undefined;
  const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
  const variance = valid.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / valid.length;
  return Math.sqrt(variance);
}

function pct<T>(arr: T[], pred: (v: T) => boolean): number {
  if (arr.length === 0) return 0;
  return arr.filter(pred).length / arr.length;
}

export function computeSessionStats(shots: Shot[], clubCategory: string): SessionStats {
  const ball = shots.map((s) => s.ball_data);
  const club = shots.map((s) => s.club_data);
  const strike = shots.map((s) => s.strike_data);
  const shapes = shots.map((s) => s.ball_data.shot_shape);

  return {
    shot_count: shots.length,
    club_category: clubCategory,
    // Ball
    avg_carry: average(ball.map((b) => b.carry_distance)),
    avg_ball_speed: average(ball.map((b) => b.ball_speed)),
    avg_launch_angle: average(ball.map((b) => b.launch_angle_vertical)),
    avg_spin_rate: average(ball.map((b) => b.spin_rate)),
    avg_spin_axis: average(ball.map((b) => b.spin_axis)),
    avg_lateral_offline: average(ball.map((b) => b.lateral_offline)),
    avg_smash_factor: average(ball.map((b) => b.smash_factor)),
    avg_apex: average(ball.map((b) => b.apex_height)),
    carry_std_dev: stdDev(ball.map((b) => b.carry_distance)),
    // Club delivery
    avg_face_to_path: average(club.map((c) => c.face_to_path)),
    avg_club_path: average(club.map((c) => c.club_path)),
    avg_face_angle: average(club.map((c) => c.face_angle_to_target)),
    avg_attack_angle: average(club.map((c) => c.attack_angle)),
    avg_dynamic_loft: average(club.map((c) => c.dynamic_loft)),
    avg_spin_loft: average(club.map((c) => c.spin_loft)),
    avg_low_point: average(club.map((c) => c.low_point_position)),
    // Strike
    avg_impact_lateral: average(strike.map((s) => s.impact_location_lateral)),
    avg_impact_vertical: average(strike.map((s) => s.impact_location_vertical)),
    // Shapes
    slice_pct: pct(shapes, (s) => s === 'slice' || s === 'fade'),
    pull_pct: pct(shapes, (s) => s === 'pull' || s === 'pull_fade'),
    push_pct: pct(shapes, (s) => s === 'push' || s === 'push_draw'),
    hook_pct: pct(shapes, (s) => s === 'hook' || s === 'draw'),
  };
}

export interface DiagnosticResult {
  stats: SessionStats;
  diagnoses: DiagnosisOutput[];
  primary: DiagnosisOutput | null;
  secondary: DiagnosisOutput[];
}

export interface DiagnosisOutput {
  rule: DiagnosticRule;
  /** Sample-size–calibrated confidence (0–100). This is what the UI shows. */
  confidence: number;
  /** The rule's raw confidence before sample-size calibration. */
  raw_confidence: number;
  /** Number of shots the diagnosis was based on. */
  sample_size: number;
  stats: SessionStats;
  supporting_data: SupportingDataPoint[];
}

/** Shots below this are treated as too small to diagnose at all. */
export const MIN_DIAGNOSIS_SHOTS = 3;

/** Shots at/above this earn full statistical confidence (no penalty). */
export const FULL_CONFIDENCE_SHOTS = 12;

/**
 * Confidence multiplier based on sample size. Small samples are penalized so a
 * handful of shots can't produce a high-confidence "false positive" diagnosis.
 * Ramps linearly from 0.6 at MIN_DIAGNOSIS_SHOTS to 1.0 at FULL_CONFIDENCE_SHOTS.
 */
export function sampleSizeConfidenceFactor(shotCount: number): number {
  if (shotCount >= FULL_CONFIDENCE_SHOTS) return 1;
  if (shotCount <= MIN_DIAGNOSIS_SHOTS) return 0.6;
  const span = FULL_CONFIDENCE_SHOTS - MIN_DIAGNOSIS_SHOTS;
  return 0.6 + 0.4 * ((shotCount - MIN_DIAGNOSIS_SHOTS) / span);
}

export function runDiagnosticEngine(
  shots: Shot[],
  clubCategory: string,
  _sessionId: string,
  _userId: string,
): DiagnosticResult {
  if (shots.length < MIN_DIAGNOSIS_SHOTS) {
    return { stats: computeSessionStats(shots, clubCategory), diagnoses: [], primary: null, secondary: [] };
  }

  const stats = computeSessionStats(shots, clubCategory);

  // Penalize confidence on small samples so a few shots can't fabricate a
  // high-confidence diagnosis. Borderline rules drop below the 40 floor and
  // are filtered out entirely until enough shots back them up.
  const sampleFactor = sampleSizeConfidenceFactor(stats.shot_count);

  const triggered: DiagnosisOutput[] = [];

  for (const rule of DIAGNOSTIC_RULES) {
    if (rule.check(stats)) {
      const rawConfidence = rule.confidence(stats);
      const confidence = Math.round(rawConfidence * sampleFactor);
      if (confidence >= 40) {
        triggered.push({
          rule,
          confidence,
          raw_confidence: rawConfidence,
          sample_size: stats.shot_count,
          stats,
          supporting_data: buildSupportingData(stats, rule.id),
        });
      }
    }
  }

  // Sort by score_impact desc, then confidence desc
  triggered.sort((a, b) => {
    const impactDiff = b.rule.score_impact - a.rule.score_impact;
    if (impactDiff !== 0) return impactDiff;
    return b.confidence - a.confidence;
  });

  const priorityOrder: Record<string, number> = {
    critical: 0, high: 1, medium: 2, monitor: 3, ignore: 4,
  };
  triggered.sort((a, b) =>
    (priorityOrder[a.rule.priority] ?? 5) - (priorityOrder[b.rule.priority] ?? 5),
  );

  return {
    stats,
    diagnoses: triggered,
    primary: triggered[0] ?? null,
    secondary: triggered.slice(1, 3),
  };
}

function buildSupportingData(stats: SessionStats, _ruleId: string): SupportingDataPoint[] {
  const points: SupportingDataPoint[] = [];

  const add = (
    metric: string,
    value: number | undefined,
    unit: string,
    targetMin: number | null,
    targetMax: number | null,
    interpretation: string,
  ) => {
    if (value === undefined) return;
    points.push({
      metric,
      value,
      unit,
      target_min: targetMin,
      target_max: targetMax,
      deviation: targetMin !== null && targetMax !== null
        ? value < targetMin ? value - targetMin : value > targetMax ? value - targetMax : 0
        : null,
      interpretation,
    });
  };

  // Always include key metrics when available
  add('Face-to-Path', stats.avg_face_to_path, '°', -3, 3,
    stats.avg_face_to_path !== undefined
      ? stats.avg_face_to_path > 3 ? 'Open face relative to path — causes fade/slice'
        : stats.avg_face_to_path < -3 ? 'Closed face relative to path — causes draw/hook'
        : 'Face-to-path within acceptable window'
      : '');
  add('Club Path', stats.avg_club_path, '°', -3, 3,
    stats.avg_club_path !== undefined
      ? stats.avg_club_path < -3 ? 'Out-to-in path — can cause pull/slice'
        : stats.avg_club_path > 3 ? 'In-to-out path — can cause push/hook'
        : 'Club path in acceptable range'
      : '');
  add('Smash Factor', stats.avg_smash_factor, '', 1.30, 1.50,
    stats.avg_smash_factor !== undefined
      ? stats.avg_smash_factor < 1.30 ? 'Low — energy loss at impact, check strike location'
        : 'Good ball speed efficiency'
      : '');
  add('Attack Angle', stats.avg_attack_angle, '°', -7, 5,
    'Negative = downward strike (irons), positive = upward (driver)');
  add('Dynamic Loft', stats.avg_dynamic_loft, '°', null, null,
    'Actual loft delivered at impact');
  add('Average Carry', stats.avg_carry, 'yds', null, null,
    `${stats.shot_count} shots averaged`);
  add('Spin Rate', stats.avg_spin_rate, 'rpm', null, null, 'Ball spin at launch');
  add('Lateral Offline', stats.avg_lateral_offline, 'yds', -5, 5,
    stats.avg_lateral_offline !== undefined
      ? `Average miss ${Math.abs(stats.avg_lateral_offline).toFixed(0)} yds ${stats.avg_lateral_offline > 0 ? 'right' : 'left'}`
      : '');
  add('Impact Lateral', stats.avg_impact_lateral, '', -0.1, 0.1,
    'Strike location on face (negative=heel, positive=toe)');
  add('Carry Consistency', stats.carry_std_dev, 'yds std dev', null, null,
    stats.carry_std_dev !== undefined && stats.avg_carry !== undefined
      ? `${((stats.carry_std_dev / stats.avg_carry) * 100).toFixed(1)}% variation`
      : '');

  return points.filter((p) => p.value !== undefined);
}

// ── Insight Prioritization ────────────────────────────────────

export interface SessionInsight {
  primary_diagnosis: DiagnosisOutput | null;
  secondary_findings: DiagnosisOutput[];
  technical_focus: string;
  ball_flight_focus: string;
  practice_routine_title: string;
  retest_protocol: string;
  what_do_i_do_next: string;
}

export function buildSessionInsight(result: DiagnosticResult): SessionInsight {
  const { primary, secondary, stats } = result;

  const technicalFocus = primary?.rule.drill_categories[0] ?? 'Consistency';
  const ballFlightFocus = stats.avg_lateral_offline !== undefined
    ? `Average miss: ${Math.abs(stats.avg_lateral_offline).toFixed(0)} yds ${stats.avg_lateral_offline > 0 ? 'right' : 'left'}`
    : stats.avg_carry !== undefined
    ? `Average carry: ${stats.avg_carry.toFixed(0)} yds`
    : 'Record more shots to see ball flight pattern';

  const nextStep = primary
    ? `Start the ${primary.rule.name} training routine. ` +
      `${primary.rule.retest.shot_count} shots with focus on ${primary.rule.retest.focus_metrics.join(', ')}.`
    : stats.shot_count < 10
    ? 'Hit more shots (at least 10) so the diagnostic engine can identify patterns.'
    : 'No critical issues detected. Focus on maintaining consistency.';

  return {
    primary_diagnosis: primary,
    secondary_findings: secondary,
    technical_focus: technicalFocus,
    ball_flight_focus: ballFlightFocus,
    practice_routine_title: primary ? `${primary.rule.name} — Correction Routine` : 'General Consistency Routine',
    retest_protocol: primary
      ? primary.rule.retest.success_criteria
      : 'Retest with 20+ shots after focused practice.',
    what_do_i_do_next: nextStep,
  };
}
