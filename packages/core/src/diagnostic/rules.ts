// ============================================================
// SwingIQ Diagnostic Rules Engine
// Configuration-driven rules that turn launch-monitor data
// into prioritized swing diagnoses.
// ============================================================

import type {
  Shot,
  Diagnosis,
  DiagnosisCategory,
  SupportingDataPoint,
  InsightPriority,
  RetestProtocol,
} from '../types';

// ── Target windows by club category ──────────────────────────

export interface TargetWindow {
  min: number;
  max: number;
  ideal: number;
  unit: string;
  description: string;
}

export type ClubTargetWindows = {
  face_to_path: TargetWindow;
  club_path: TargetWindow;
  attack_angle: TargetWindow;
  dynamic_loft: TargetWindow;
  spin_loft: TargetWindow;
  smash_factor: TargetWindow;
  spin_rate: TargetWindow;
  launch_angle: TargetWindow;
};

export const TARGET_WINDOWS: Record<string, ClubTargetWindows> = {
  driver: {
    face_to_path: { min: -3, max: 3, ideal: 0, unit: '°', description: 'Face-to-path for driver' },
    club_path: { min: -2, max: 4, ideal: 1, unit: '°', description: 'In-to-out preferred for driver' },
    attack_angle: { min: -1, max: 5, ideal: 2, unit: '°', description: 'Slight upswing for driver' },
    dynamic_loft: { min: 10, max: 18, ideal: 14, unit: '°', description: 'Optimal driver loft delivery' },
    spin_loft: { min: 10, max: 18, ideal: 13, unit: '°', description: 'Low spin loft = lower spin' },
    smash_factor: { min: 1.44, max: 1.52, ideal: 1.50, unit: '', description: 'Ball speed efficiency' },
    spin_rate: { min: 1800, max: 3000, ideal: 2300, unit: 'rpm', description: 'Driver optimal spin' },
    launch_angle: { min: 10, max: 16, ideal: 13, unit: '°', description: 'Optimal driver launch' },
  },
  mid_iron: {
    face_to_path: { min: -3, max: 3, ideal: 0, unit: '°', description: 'Face-to-path for irons' },
    club_path: { min: -3, max: 3, ideal: -1, unit: '°', description: 'Slight out-to-in for irons' },
    attack_angle: { min: -6, max: -1, ideal: -4, unit: '°', description: 'Downward strike for irons' },
    dynamic_loft: { min: 16, max: 28, ideal: 22, unit: '°', description: 'Delivered loft mid-iron' },
    spin_loft: { min: 16, max: 26, ideal: 21, unit: '°', description: 'Spin loft mid-iron' },
    smash_factor: { min: 1.30, max: 1.42, ideal: 1.37, unit: '', description: 'Iron smash factor' },
    spin_rate: { min: 5500, max: 8500, ideal: 7000, unit: 'rpm', description: '7-iron spin target' },
    launch_angle: { min: 14, max: 20, ideal: 17, unit: '°', description: '7-iron launch angle' },
  },
  wedge: {
    face_to_path: { min: -4, max: 4, ideal: 0, unit: '°', description: 'Face-to-path wedge' },
    club_path: { min: -5, max: 2, ideal: -2, unit: '°', description: 'Slight cut path for wedge' },
    attack_angle: { min: -8, max: -2, ideal: -5, unit: '°', description: 'Steep wedge preferred' },
    dynamic_loft: { min: 22, max: 40, ideal: 32, unit: '°', description: 'Delivered loft wedge' },
    spin_loft: { min: 22, max: 40, ideal: 33, unit: '°', description: 'Spin loft wedge' },
    smash_factor: { min: 1.20, max: 1.32, ideal: 1.26, unit: '', description: 'Wedge smash factor' },
    spin_rate: { min: 7000, max: 11000, ideal: 9000, unit: 'rpm', description: 'Wedge spin target' },
    launch_angle: { min: 20, max: 36, ideal: 28, unit: '°', description: 'Wedge launch angle' },
  },
};

// ── Diagnostic Rule Definition ────────────────────────────────

export interface DiagnosticRule {
  id: DiagnosisCategory;
  name: string;
  check: (stats: SessionStats) => boolean;
  confidence: (stats: SessionStats) => number;
  priority: InsightPriority;
  score_impact: number;
  primary_issue: (stats: SessionStats) => string;
  likely_cause: string;
  drill_categories: string[];
  retest: RetestProtocol;
  what_improvement_looks_like: (stats: SessionStats) => string;
  is_swing_issue: boolean;
  is_strike_issue: boolean;
  is_equipment_concern: boolean;
  is_setup_issue: boolean;
}

export interface SessionStats {
  shot_count: number;
  club_category: string;
  // Ball averages
  avg_carry?: number;
  avg_ball_speed?: number;
  avg_launch_angle?: number;
  avg_spin_rate?: number;
  avg_spin_axis?: number;
  avg_lateral_offline?: number;
  avg_smash_factor?: number;
  avg_apex?: number;
  carry_std_dev?: number;
  // Club delivery averages
  avg_face_to_path?: number;
  avg_club_path?: number;
  avg_face_angle?: number;
  avg_attack_angle?: number;
  avg_dynamic_loft?: number;
  avg_spin_loft?: number;
  avg_low_point?: number;
  // Strike averages
  avg_impact_lateral?: number;
  avg_impact_vertical?: number;
  // Shot shapes
  slice_pct?: number;
  pull_pct?: number;
  push_pct?: number;
  hook_pct?: number;
}

// ── Diagnostic Rules ──────────────────────────────────────────

export const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  {
    id: 'slice_weak_fade',
    name: 'Open Face / Slice Pattern',
    check: (s) =>
      (s.avg_face_to_path !== undefined && s.avg_face_to_path > 3.5) ||
      (s.avg_lateral_offline !== undefined && s.avg_lateral_offline > 15 &&
        s.avg_spin_axis !== undefined && s.avg_spin_axis > 5),
    confidence: (s) => {
      let score = 0;
      if (s.avg_face_to_path !== undefined && s.avg_face_to_path > 3.5) score += 40;
      if (s.avg_face_to_path !== undefined && s.avg_face_to_path > 6) score += 20;
      if (s.avg_spin_axis !== undefined && s.avg_spin_axis > 8) score += 20;
      if (s.avg_lateral_offline !== undefined && s.avg_lateral_offline > 15) score += 20;
      return Math.min(score, 95);
    },
    priority: 'critical',
    score_impact: 2.5,
    primary_issue: (s) =>
      `Open face relative to path. Average face-to-path: ${s.avg_face_to_path?.toFixed(1) ?? 'N/A'}°. ` +
      `Average lateral miss: ${s.avg_lateral_offline?.toFixed(0) ?? 'N/A'} yards ${(s.avg_lateral_offline ?? 0) > 0 ? 'right' : 'left'}.`,
    likely_cause:
      'The clubface is arriving open relative to the swing path at impact. ' +
      'This may be caused by a weak grip, early release (casting), insufficient forearm rotation, ' +
      'or a steep outside-in downswing path pairing with an open face.',
    drill_categories: ['face_control', 'face_to_path_neutralization', 'start_line'],
    retest: {
      shot_count: 30,
      club: 'Same club',
      focus_metrics: ['face_to_path', 'spin_axis', 'lateral_offline', 'curve'],
      success_criteria: 'Face-to-path under +2.5°, lateral miss under 10 yards right',
      notes: 'Hit 30 shots with a focus on feeling a square or slightly closed face at impact.',
    },
    what_improvement_looks_like: (s) =>
      `Target face-to-path under +2.5°. Current average: ${s.avg_face_to_path?.toFixed(1) ?? 'N/A'}°. ` +
      `Lateral miss should reduce to under 10 yards. Spin axis should move toward 0°.`,
    is_swing_issue: true,
    is_strike_issue: false,
    is_equipment_concern: false,
    is_setup_issue: false,
  },

  {
    id: 'hook_strong_draw',
    name: 'Closed Face / Hook Pattern',
    check: (s) =>
      (s.avg_face_to_path !== undefined && s.avg_face_to_path < -3.5) ||
      (s.avg_spin_axis !== undefined && s.avg_spin_axis < -8 &&
        s.avg_lateral_offline !== undefined && s.avg_lateral_offline < -15),
    confidence: (s) => {
      let score = 0;
      if (s.avg_face_to_path !== undefined && s.avg_face_to_path < -3.5) score += 40;
      if (s.avg_face_to_path !== undefined && s.avg_face_to_path < -6) score += 20;
      if (s.avg_spin_axis !== undefined && s.avg_spin_axis < -8) score += 20;
      if (s.avg_lateral_offline !== undefined && s.avg_lateral_offline < -15) score += 20;
      return Math.min(score, 95);
    },
    priority: 'high',
    score_impact: 2.0,
    primary_issue: (s) =>
      `Closed face / hook pattern. Face-to-path: ${s.avg_face_to_path?.toFixed(1) ?? 'N/A'}°. ` +
      `Average miss: ${Math.abs(s.avg_lateral_offline ?? 0).toFixed(0)} yards left.`,
    likely_cause:
      'The clubface is closed relative to the path at impact. ' +
      'Possible causes: strong grip, excessive forearm rotation, early wrist release closing the face, ' +
      'or a path that is too far in-to-out with a closed face.',
    drill_categories: ['face_control', 'path_control', 'start_line'],
    retest: {
      shot_count: 30,
      club: 'Same club',
      focus_metrics: ['face_to_path', 'spin_axis', 'lateral_offline'],
      success_criteria: 'Face-to-path within -2.5° to +2.5°, curve < 10 yards',
      notes: 'Practice with a focus on a slightly weaker grip or delayed face rotation.',
    },
    what_improvement_looks_like: (s) =>
      `Bring face-to-path from ${s.avg_face_to_path?.toFixed(1) ?? 'N/A'}° toward 0°. ` +
      `Ball should start straighter and curve less left.`,
    is_swing_issue: true,
    is_strike_issue: false,
    is_equipment_concern: false,
    is_setup_issue: false,
  },

  {
    id: 'pull',
    name: 'Pull Pattern',
    check: (s) =>
      s.avg_club_path !== undefined && s.avg_club_path < -3 &&
      s.avg_face_angle !== undefined && s.avg_face_angle < -1 &&
      s.avg_lateral_offline !== undefined && s.avg_lateral_offline < -10,
    confidence: (s) => {
      let score = 0;
      if (s.avg_club_path !== undefined && s.avg_club_path < -3) score += 35;
      if (s.avg_face_angle !== undefined && s.avg_face_angle < -1) score += 35;
      if (s.avg_lateral_offline !== undefined && s.avg_lateral_offline < -10) score += 30;
      return Math.min(score, 90);
    },
    priority: 'high',
    score_impact: 1.8,
    primary_issue: (s) =>
      `Pull pattern: Both face and path are left. Club path: ${s.avg_club_path?.toFixed(1) ?? 'N/A'}°, ` +
      `face angle: ${s.avg_face_angle?.toFixed(1) ?? 'N/A'}°.`,
    likely_cause:
      'Both the club path and face angle are pointed left of the target. ' +
      'This is commonly caused by an over-the-top swing path (outside-in) where the face is also square to the path (not to the target). ' +
      'Check alignment — the player may be aimed left without knowing it.',
    drill_categories: ['club_path_control', 'face_to_path_neutralization', 'alignment'],
    retest: {
      shot_count: 25,
      club: 'Same club',
      focus_metrics: ['club_path', 'face_angle', 'start_direction'],
      success_criteria: 'Club path within -1° to +2°, face angle within ±2°',
      notes: 'Check alignment with alignment sticks before hitting.',
    },
    what_improvement_looks_like: (s) =>
      `Club path should move from ${s.avg_club_path?.toFixed(1) ?? 'N/A'}° toward 0° to +2°. ` +
      `Ball start should move right of current pattern.`,
    is_swing_issue: true,
    is_strike_issue: false,
    is_equipment_concern: false,
    is_setup_issue: true,
  },

  {
    id: 'fat_contact',
    name: 'Fat Contact / Low Point Behind Ball',
    check: (s) =>
      (s.avg_low_point !== undefined && s.avg_low_point > 1.5) ||
      (s.avg_smash_factor !== undefined && s.avg_smash_factor < 1.25 &&
        s.avg_launch_angle !== undefined && s.avg_launch_angle > 24),
    confidence: (s) => {
      let score = 0;
      if (s.avg_low_point !== undefined && s.avg_low_point > 1.5) score += 50;
      if (s.avg_smash_factor !== undefined && s.avg_smash_factor < 1.25) score += 30;
      if (s.avg_launch_angle !== undefined && s.avg_launch_angle > 24 && s.club_category !== 'driver') score += 20;
      return Math.min(score, 90);
    },
    priority: 'high',
    score_impact: 2.2,
    primary_issue: (s) =>
      `Low point is likely behind the ball. Smash factor: ${s.avg_smash_factor?.toFixed(2) ?? 'N/A'}. ` +
      `Launch angle: ${s.avg_launch_angle?.toFixed(1) ?? 'N/A'}°.`,
    likely_cause:
      'The club is reaching its lowest point before the ball, causing ground contact before the ball. ' +
      'Common causes: hanging back/reverse weight shift, early extension, scooping through impact, ' +
      'or excessive hip-sway away from the target.',
    drill_categories: ['low_point_control', 'attack_angle_control', 'shaft_lean'],
    retest: {
      shot_count: 30,
      club: '7-iron',
      focus_metrics: ['low_point_position', 'smash_factor', 'launch_angle', 'carry_distance'],
      success_criteria: 'Smash factor above 1.33, low point at or ahead of ball',
      notes: 'Use a towel or tee-peg behind the ball to provide low-point feedback.',
    },
    what_improvement_looks_like: (s) =>
      `Smash factor should move from ${s.avg_smash_factor?.toFixed(2) ?? 'N/A'} to above 1.33. ` +
      `Launch angle should reduce by 3-5°. Carry distance should increase.`,
    is_swing_issue: true,
    is_strike_issue: true,
    is_equipment_concern: false,
    is_setup_issue: false,
  },

  {
    id: 'dynamic_loft_high',
    name: 'Excess Dynamic Loft / Lack of Shaft Lean',
    check: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        s.avg_dynamic_loft !== undefined && s.avg_dynamic_loft > window.dynamic_loft.max + 4
      );
    },
    confidence: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      if (s.avg_dynamic_loft === undefined) return 0;
      const excess = s.avg_dynamic_loft - window.dynamic_loft.max;
      if (excess < 2) return 40;
      if (excess < 5) return 60;
      return 80;
    },
    priority: 'medium',
    score_impact: 1.5,
    primary_issue: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Dynamic loft is too high: ${s.avg_dynamic_loft?.toFixed(1) ?? 'N/A'}° ` +
        `vs. target of ${window.dynamic_loft.min}–${window.dynamic_loft.max}°. ` +
        `This increases spin and reduces distance.`
      );
    },
    likely_cause:
      'Too much loft is being delivered at impact, often caused by insufficient shaft lean (handle not leading), ' +
      'scooping/flipping through impact, or excessive dynamic loft from a poor transition.',
    drill_categories: ['dynamic_loft_control', 'shaft_lean', 'compression'],
    retest: {
      shot_count: 25,
      club: '7-iron',
      focus_metrics: ['dynamic_loft', 'spin_loft', 'launch_angle', 'spin_rate'],
      success_criteria: 'Dynamic loft reduced by 4°+, spin rate reduced by 500+ rpm',
      notes: 'Focus on keeping the handle slightly forward at impact.',
    },
    what_improvement_looks_like: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Dynamic loft should reduce from ${s.avg_dynamic_loft?.toFixed(1) ?? 'N/A'}° ` +
        `toward ${window.dynamic_loft.ideal}°. Expect lower launch and reduced spin.`
      );
    },
    is_swing_issue: true,
    is_strike_issue: false,
    is_equipment_concern: false,
    is_setup_issue: false,
  },

  {
    id: 'heel_strike',
    name: 'Heel Strike Pattern',
    check: (s) =>
      s.avg_impact_lateral !== undefined && s.avg_impact_lateral < -0.3,
    confidence: (s) => {
      if (s.avg_impact_lateral === undefined) return 0;
      const heelBias = -s.avg_impact_lateral;
      if (heelBias < 0.3) return 0;
      if (heelBias < 0.5) return 50;
      if (heelBias < 0.7) return 70;
      return 85;
    },
    priority: 'high',
    score_impact: 1.6,
    primary_issue: (s) =>
      `Heel-biased strike pattern. Impact location lateral: ${s.avg_impact_lateral?.toFixed(2) ?? 'N/A'} ` +
      `(negative = heel).`,
    likely_cause:
      'The club is making contact on the heel portion of the face, reducing ball speed and creating a gear-effect curve. ' +
      'Possible causes: standing too close at address, spine extending (early extension) through impact, ' +
      'or arms swinging too far around/inside on the downswing.',
    drill_categories: ['strike_location_control', 'low_point_control'],
    retest: {
      shot_count: 20,
      club: 'Same club',
      focus_metrics: ['impact_location_lateral', 'ball_speed', 'smash_factor'],
      success_criteria: 'Impact location lateral between -0.1 and +0.1',
      notes: 'Use impact spray or foot powder spray on the face to see strike location.',
    },
    what_improvement_looks_like: (s) =>
      `Impact location should move from ${s.avg_impact_lateral?.toFixed(2) ?? 'N/A'} toward center (0.0). ` +
      `Ball speed and smash factor should improve by 2-5%.`,
    is_swing_issue: true,
    is_strike_issue: true,
    is_equipment_concern: false,
    is_setup_issue: false,
  },

  {
    id: 'toe_strike',
    name: 'Toe Strike Pattern',
    check: (s) =>
      s.avg_impact_lateral !== undefined && s.avg_impact_lateral > 0.3,
    confidence: (s) => {
      if (s.avg_impact_lateral === undefined) return 0;
      const toeBias = s.avg_impact_lateral;
      if (toeBias < 0.3) return 0;
      if (toeBias < 0.5) return 50;
      if (toeBias < 0.7) return 70;
      return 85;
    },
    priority: 'medium',
    score_impact: 1.2,
    primary_issue: (s) =>
      `Toe-biased strike. Impact location lateral: ${s.avg_impact_lateral?.toFixed(2) ?? 'N/A'} (positive = toe).`,
    likely_cause:
      'The club is contacting the toe side of the face. Possible causes: standing too far away, ' +
      'arms extending too far outward through impact, or a steep swing plane pulling the arms away from the body.',
    drill_categories: ['strike_location_control'],
    retest: {
      shot_count: 20,
      club: 'Same club',
      focus_metrics: ['impact_location_lateral', 'ball_speed'],
      success_criteria: 'Impact location lateral between -0.1 and +0.1',
      notes: 'Use impact spray. Try standing 1 inch closer to the ball at address.',
    },
    what_improvement_looks_like: (s) =>
      `Impact location should move from +${s.avg_impact_lateral?.toFixed(2) ?? 'N/A'} toward center (0.0).`,
    is_swing_issue: true,
    is_strike_issue: true,
    is_equipment_concern: false,
    is_setup_issue: true,
  },

  {
    id: 'spin_too_high',
    name: 'Excessive Spin Rate',
    check: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return s.avg_spin_rate !== undefined && s.avg_spin_rate > window.spin_rate.max + 500;
    },
    confidence: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      if (s.avg_spin_rate === undefined) return 0;
      const excess = s.avg_spin_rate - window.spin_rate.max;
      if (excess < 500) return 40;
      if (excess < 1200) return 65;
      return 80;
    },
    priority: 'medium',
    score_impact: 1.0,
    primary_issue: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Spin rate is above target: ${s.avg_spin_rate?.toFixed(0) ?? 'N/A'} rpm ` +
        `vs. target of ${window.spin_rate.min}–${window.spin_rate.max} rpm.`
      );
    },
    likely_cause:
      'High spin may be caused by excess dynamic loft, steep attack angle, toe/heel strikes, ' +
      'or high spin-loft relationship. Can cause ballooning ball flight and distance loss in wind.',
    drill_categories: ['launch_window_control', 'spin_window_control', 'shaft_lean'],
    retest: {
      shot_count: 25,
      club: 'Same club',
      focus_metrics: ['spin_rate', 'spin_loft', 'dynamic_loft', 'carry_distance'],
      success_criteria: 'Spin rate reduced by 500+ rpm, carry distance maintained or increased',
      notes: 'Check spin loft and dynamic loft. Focus on compressing the ball.',
    },
    what_improvement_looks_like: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Spin rate should reduce from ${s.avg_spin_rate?.toFixed(0) ?? 'N/A'} rpm ` +
        `toward ${window.spin_rate.ideal} rpm. Expect more penetrating ball flight.`
      );
    },
    is_swing_issue: true,
    is_strike_issue: false,
    is_equipment_concern: true,
    is_setup_issue: false,
  },

  {
    id: 'poor_smash_factor',
    name: 'Low Ball Speed Efficiency (Poor Smash Factor)',
    check: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return s.avg_smash_factor !== undefined && s.avg_smash_factor < window.smash_factor.min - 0.05;
    },
    confidence: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      if (s.avg_smash_factor === undefined) return 0;
      const deficit = window.smash_factor.min - s.avg_smash_factor;
      if (deficit < 0.03) return 40;
      if (deficit < 0.08) return 65;
      return 82;
    },
    priority: 'medium',
    score_impact: 1.4,
    primary_issue: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Smash factor is low: ${s.avg_smash_factor?.toFixed(2) ?? 'N/A'} ` +
        `vs. target of ${window.smash_factor.min}–${window.smash_factor.max}. ` +
        `This suggests energy is being lost at impact.`
      );
    },
    likely_cause:
      'Low smash factor means the club is not efficiently transferring energy to the ball. ' +
      'Common causes: off-center strikes, high spin loft, poor impact conditions, or a glancing blow.',
    drill_categories: ['strike_location_control', 'low_point_control'],
    retest: {
      shot_count: 20,
      club: 'Same club',
      focus_metrics: ['smash_factor', 'ball_speed', 'impact_location_lateral', 'impact_location_vertical'],
      success_criteria: 'Smash factor at or above target minimum',
      notes: 'Use impact spray to identify strike location patterns.',
    },
    what_improvement_looks_like: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Smash factor should increase from ${s.avg_smash_factor?.toFixed(2) ?? 'N/A'} ` +
        `to ${window.smash_factor.ideal}+. Ball speed will increase without adding swing speed.`
      );
    },
    is_swing_issue: false,
    is_strike_issue: true,
    is_equipment_concern: false,
    is_setup_issue: false,
  },

  {
    id: 'attack_angle_steep',
    name: 'Steep Attack Angle (Digger Pattern)',
    check: (s) =>
      s.club_category !== 'driver' &&
      s.avg_attack_angle !== undefined && s.avg_attack_angle < -7,
    confidence: (s) => {
      if (s.avg_attack_angle === undefined) return 0;
      const excess = -s.avg_attack_angle - 7;
      if (excess < 1) return 40;
      if (excess < 3) return 65;
      return 80;
    },
    priority: 'medium',
    score_impact: 1.2,
    primary_issue: (s) =>
      `Attack angle is too steep: ${s.avg_attack_angle?.toFixed(1) ?? 'N/A'}°. ` +
      `Target for irons is -4° to -6°. Steep angle causes thin/fat contact and excess spin.`,
    likely_cause:
      'Overly steep downswing, steep shoulder plane, or casting from the top. ' +
      'Can cause divots that start before the ball or thin contact at the bottom of the arc.',
    drill_categories: ['attack_angle_control', 'swing_plane', 'shoulder_turn'],
    retest: {
      shot_count: 25,
      club: '7-iron',
      focus_metrics: ['attack_angle', 'launch_angle', 'spin_rate', 'smash_factor'],
      success_criteria: 'Attack angle between -4° and -6°, spin rate reduced',
      notes: 'Feel a shallower approach into the ball. Try a wider takeaway to flatten the swing plane.',
    },
    what_improvement_looks_like: (s) =>
      `Attack angle should move from ${s.avg_attack_angle?.toFixed(1) ?? 'N/A'}° toward -4° to -6°. ` +
      `Expect lower spin, better contact, and more predictable carry.`,
    is_swing_issue: true,
    is_strike_issue: true,
    is_equipment_concern: false,
    is_setup_issue: false,
  },

  {
    id: 'driver_attack_angle_down',
    name: 'Hitting Down on Driver',
    check: (s) =>
      s.club_category === 'driver' &&
      s.avg_attack_angle !== undefined && s.avg_attack_angle < -1,
    confidence: (s) => {
      if (s.avg_attack_angle === undefined || s.club_category !== 'driver') return 0;
      const deficit = -s.avg_attack_angle + 1;
      if (deficit < 1) return 45;
      if (deficit < 3) return 65;
      return 82;
    },
    priority: 'high',
    score_impact: 2.0,
    primary_issue: (s) =>
      `Hitting down on driver: attack angle ${s.avg_attack_angle?.toFixed(1) ?? 'N/A'}°. ` +
      `Driver needs an upswing attack angle (+1° to +4°) to maximize carry and minimize spin.`,
    likely_cause:
      'Ball position too far back in stance, too much weight on front foot at address, ' +
      'or treating the driver like an iron swing. Hitting down creates high spin and steep trajectory.',
    drill_categories: ['attack_angle_control', 'driver_setup', 'ball_position'],
    retest: {
      shot_count: 20,
      club: 'Driver',
      focus_metrics: ['attack_angle', 'spin_rate', 'launch_angle', 'carry_distance'],
      success_criteria: 'Attack angle positive (+1° or more), spin rate reduced by 300+ rpm',
      notes: 'Move ball forward in stance (off left heel), tilt spine away from target slightly.',
    },
    what_improvement_looks_like: (s) =>
      `Attack angle should move from ${s.avg_attack_angle?.toFixed(1) ?? 'N/A'}° to +1° or better. ` +
      `Expect lower spin, higher launch, and 10-20 yards more carry.`,
    is_swing_issue: true,
    is_strike_issue: false,
    is_equipment_concern: false,
    is_setup_issue: true,
  },

  {
    id: 'launch_angle_low',
    name: 'Low Launch Angle',
    check: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return s.avg_launch_angle !== undefined && s.avg_launch_angle < window.launch_angle.min - 2;
    },
    confidence: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      if (s.avg_launch_angle === undefined) return 0;
      const deficit = window.launch_angle.min - s.avg_launch_angle;
      if (deficit < 2) return 40;
      if (deficit < 5) return 60;
      return 75;
    },
    priority: 'medium',
    score_impact: 1.0,
    primary_issue: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Launch angle is too low: ${s.avg_launch_angle?.toFixed(1) ?? 'N/A'}° ` +
        `vs. target of ${window.launch_angle.min}–${window.launch_angle.max}°. ` +
        `Low launch reduces carry distance and time in the air.`
      );
    },
    likely_cause:
      'Low launch may be caused by excessive shaft lean (de-lofting the club), ' +
      'strong grip pressing the hands too far forward, or ball position too far back in stance. ' +
      'Also possible: shaft/loft that doesn\'t match swing speed.',
    drill_categories: ['launch_window_control', 'shaft_lean', 'ball_position'],
    retest: {
      shot_count: 20,
      club: 'Same club',
      focus_metrics: ['launch_angle', 'carry_distance', 'dynamic_loft'],
      success_criteria: 'Launch angle reaches target window minimum',
      notes: 'Try moving ball position slightly forward. Check that hands are not too far ahead of ball.',
    },
    what_improvement_looks_like: (s) => {
      const window = TARGET_WINDOWS[s.club_category] ?? TARGET_WINDOWS.mid_iron;
      return (
        `Launch angle should rise from ${s.avg_launch_angle?.toFixed(1) ?? 'N/A'}° ` +
        `toward ${window.launch_angle.ideal}°. Carry distance should increase.`
      );
    },
    is_swing_issue: true,
    is_strike_issue: false,
    is_equipment_concern: true,
    is_setup_issue: true,
  },

  {
    id: 'inconsistent_carry',
    name: 'Inconsistent Carry Distance',
    check: (s) =>
      s.carry_std_dev !== undefined && s.avg_carry !== undefined &&
      s.carry_std_dev / s.avg_carry > 0.08, // >8% coefficient of variation
    confidence: (s) => {
      if (s.carry_std_dev === undefined || s.avg_carry === undefined) return 0;
      const cv = s.carry_std_dev / s.avg_carry;
      if (cv < 0.08) return 0;
      if (cv < 0.12) return 55;
      if (cv < 0.18) return 75;
      return 88;
    },
    priority: 'medium',
    score_impact: 1.3,
    primary_issue: (s) =>
      `Carry distance is inconsistent. Standard deviation: ${s.carry_std_dev?.toFixed(1) ?? 'N/A'} yards ` +
      `on average carry of ${s.avg_carry?.toFixed(0) ?? 'N/A'} yards.`,
    likely_cause:
      'High carry variability suggests inconsistent contact quality, varying attack angle, ' +
      'or changing delivery conditions shot-to-shot. This reduces scoring predictability.',
    drill_categories: ['distance_control', 'low_point_control', 'strike_location_control'],
    retest: {
      shot_count: 30,
      club: 'Same club',
      focus_metrics: ['carry_distance', 'smash_factor', 'launch_angle'],
      success_criteria: 'Carry standard deviation under 6% of average carry',
      notes: 'Focus on a consistent pre-shot routine and repeatable impact position.',
    },
    what_improvement_looks_like: (s) =>
      `Carry deviation should reduce from ${s.carry_std_dev?.toFixed(1) ?? 'N/A'} yards. ` +
      `Aim for ±5 yards consistency window around average.`,
    is_swing_issue: false,
    is_strike_issue: true,
    is_equipment_concern: false,
    is_setup_issue: false,
  },
];
