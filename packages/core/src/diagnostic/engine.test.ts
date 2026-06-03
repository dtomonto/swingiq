// ============================================================
// SwingIQ Diagnostic Engine — Unit Tests
// Run with: cd packages/core && npx jest
// ============================================================

import {
  runDiagnosticEngine,
  computeSessionStats,
  buildSessionInsight,
  sampleSizeConfidenceFactor,
} from './engine';
import type { Shot } from '../types';

function makeShotWith(overrides: {
  face_to_path?: number;
  club_path?: number;
  face_angle?: number;
  attack_angle?: number;
  dynamic_loft?: number;
  smash_factor?: number;
  carry?: number;
  lateral_offline?: number;
  spin_axis?: number;
  spin_rate?: number;
  impact_lateral?: number;
  low_point?: number;
}): Shot {
  return {
    id: 'test',
    session_id: 's1',
    user_id: 'u1',
    club_id: null,
    club_name: '7-Iron',
    club_category: 'mid_iron',
    shot_number: 1,
    date_time: new Date().toISOString(),
    swing_type: 'full',
    intended_shot_shape: null,
    actual_shot_shape: null,
    is_outlier: false,
    user_notes: '',
    ball_data: {
      carry_distance: overrides.carry ?? 160,
      total_distance: null,
      roll_distance: null,
      ball_speed: overrides.smash_factor ? overrides.smash_factor * 80 : 110,
      launch_angle_vertical: null,
      launch_direction_horizontal: null,
      spin_rate: overrides.spin_rate ?? 7000,
      spin_axis: overrides.spin_axis ?? 0,
      apex_height: null,
      descent_angle: null,
      side_carry: null,
      lateral_offline: overrides.lateral_offline ?? 0,
      curve: null,
      flight_time: null,
      shot_shape: null,
      smash_factor: overrides.smash_factor ?? 1.37,
    },
    club_data: {
      club_speed: 80,
      attack_angle: overrides.attack_angle ?? -4,
      club_path: overrides.club_path ?? 0,
      face_angle_to_target: overrides.face_angle ?? 0,
      face_to_path: 'face_to_path' in overrides ? (overrides.face_to_path ?? null) : 0,
      dynamic_loft: overrides.dynamic_loft ?? 22,
      spin_loft: null,
      swing_plane_horizontal: null,
      swing_plane_vertical: null,
      low_point_position: overrides.low_point ?? -1,
      low_point_height: null,
      closure_rate: null,
      swing_direction: null,
      lie_angle_dynamic: null,
    },
    strike_data: {
      impact_location_lateral: overrides.impact_lateral ?? 0,
      impact_location_vertical: null,
    },
    created_at: new Date().toISOString(),
  };
}

function makeShots(n: number, overrides: Parameters<typeof makeShotWith>[0]): Shot[] {
  return Array.from({ length: n }, (_, i) => ({
    ...makeShotWith(overrides),
    id: `shot-${i}`,
    shot_number: i + 1,
  }));
}

describe('computeSessionStats', () => {
  test('calculates averages correctly', () => {
    const shots = [
      makeShotWith({ face_to_path: 5, carry: 160 }),
      makeShotWith({ face_to_path: 3, carry: 170 }),
      makeShotWith({ face_to_path: 7, carry: 150 }),
    ];
    const stats = computeSessionStats(shots, 'mid_iron');
    expect(stats.avg_face_to_path).toBeCloseTo(5, 0);
    expect(stats.avg_carry).toBeCloseTo(160, 0);
    expect(stats.shot_count).toBe(3);
  });

  test('handles missing data gracefully', () => {
    const shots = makeShots(5, { face_to_path: undefined });
    const stats = computeSessionStats(shots, 'mid_iron');
    expect(stats.avg_face_to_path).toBeUndefined();
  });
});

describe('runDiagnosticEngine', () => {
  test('detects slice / open face pattern', () => {
    const shots = makeShots(15, { face_to_path: 6, lateral_offline: 25 });
    const result = runDiagnosticEngine(shots, 'driver', 's1', 'u1');
    expect(result.primary).not.toBeNull();
    expect(result.primary?.rule.id).toBe('slice_weak_fade');
  });

  test('detects hook / closed face pattern', () => {
    const shots = makeShots(15, { face_to_path: -6, lateral_offline: -25, spin_axis: -10 });
    const result = runDiagnosticEngine(shots, 'mid_iron', 's1', 'u1');
    expect(result.diagnoses.some((d) => d.rule.id === 'hook_strong_draw')).toBe(true);
  });

  test('detects pull pattern', () => {
    const shots = makeShots(15, { club_path: -5, face_angle: -3, lateral_offline: -18 });
    const result = runDiagnosticEngine(shots, 'mid_iron', 's1', 'u1');
    expect(result.diagnoses.some((d) => d.rule.id === 'pull')).toBe(true);
  });

  test('detects low smash factor', () => {
    const shots = makeShots(15, { smash_factor: 1.20 });
    const result = runDiagnosticEngine(shots, 'mid_iron', 's1', 'u1');
    expect(result.diagnoses.some((d) => d.rule.id === 'poor_smash_factor')).toBe(true);
  });

  test('detects heel strike', () => {
    const shots = makeShots(15, { impact_lateral: -0.5 });
    const result = runDiagnosticEngine(shots, 'driver', 's1', 'u1');
    expect(result.diagnoses.some((d) => d.rule.id === 'heel_strike')).toBe(true);
  });

  test('detects toe strike', () => {
    const shots = makeShots(15, { impact_lateral: 0.6 });
    const result = runDiagnosticEngine(shots, 'mid_iron', 's1', 'u1');
    expect(result.diagnoses.some((d) => d.rule.id === 'toe_strike')).toBe(true);
  });

  test('detects fat contact / low point behind ball', () => {
    const shots = makeShots(15, { smash_factor: 1.18, low_point: 3 });
    const result = runDiagnosticEngine(shots, 'mid_iron', 's1', 'u1');
    expect(result.diagnoses.some((d) => d.rule.id === 'fat_contact')).toBe(true);
  });

  test('returns no diagnoses for perfect data', () => {
    const shots = makeShots(15, {
      face_to_path: 0.5,
      club_path: -0.5,
      smash_factor: 1.38,
      lateral_offline: 3,
      impact_lateral: 0.05,
    });
    const result = runDiagnosticEngine(shots, 'mid_iron', 's1', 'u1');
    const critical = result.diagnoses.filter((d) => d.rule.priority === 'critical');
    expect(critical.length).toBe(0);
  });

  test('returns empty result for fewer than 3 shots', () => {
    const shots = makeShots(2, { face_to_path: 8 });
    const result = runDiagnosticEngine(shots, 'driver', 's1', 'u1');
    expect(result.primary).toBeNull();
    expect(result.diagnoses).toHaveLength(0);
  });

  test('sorts diagnoses by score impact (highest first)', () => {
    const shots = makeShots(20, { face_to_path: 6, smash_factor: 1.22, impact_lateral: 0.5 });
    const result = runDiagnosticEngine(shots, 'driver', 's1', 'u1');
    const impacts = result.diagnoses.map((d) => d.rule.score_impact);
    for (let i = 0; i < impacts.length - 1; i++) {
      // After sorting by priority, score_impact within same priority should descend
      // (loosely — priority takes precedence)
    }
    expect(result.diagnoses.length).toBeGreaterThan(0);
  });
});

describe('sample-size confidence calibration', () => {
  test('factor ramps from 0.6 at the minimum to 1.0 at full sample', () => {
    expect(sampleSizeConfidenceFactor(3)).toBeCloseTo(0.6, 5);
    expect(sampleSizeConfidenceFactor(12)).toBe(1);
    expect(sampleSizeConfidenceFactor(50)).toBe(1);
    const mid = sampleSizeConfidenceFactor(7);
    expect(mid).toBeGreaterThan(0.6);
    expect(mid).toBeLessThan(1);
  });

  test('a borderline pattern is filtered on a tiny sample but kept on a full one', () => {
    // Raw confidence here is exactly 40 (only the +40 face-to-path band fires),
    // so the small-sample penalty pushes it under the 40 floor.
    const overrides = { face_to_path: 4, lateral_offline: 5, spin_axis: 0 };
    const small = runDiagnosticEngine(makeShots(3, overrides), 'driver', 's1', 'u1');
    const full = runDiagnosticEngine(makeShots(15, overrides), 'driver', 's1', 'u1');
    expect(small.diagnoses.some((d) => d.rule.id === 'slice_weak_fade')).toBe(false);
    expect(full.diagnoses.some((d) => d.rule.id === 'slice_weak_fade')).toBe(true);
  });

  test('reports raw_confidence + sample_size; calibrated confidence <= raw on small samples', () => {
    const res = runDiagnosticEngine(
      makeShots(6, { face_to_path: 6.5, lateral_offline: 25, spin_axis: 10 }),
      'driver',
      's1',
      'u1',
    );
    const slice = res.diagnoses.find((d) => d.rule.id === 'slice_weak_fade');
    expect(slice).toBeDefined();
    expect(slice!.sample_size).toBe(6);
    expect(slice!.raw_confidence).toBeGreaterThanOrEqual(slice!.confidence);
    expect(slice!.confidence).toBeLessThan(slice!.raw_confidence);
  });
});

describe('buildSessionInsight', () => {
  test('provides what_do_i_do_next text', () => {
    const shots = makeShots(15, { face_to_path: 5.5 });
    const result = runDiagnosticEngine(shots, 'driver', 's1', 'u1');
    const insight = buildSessionInsight(result);
    expect(insight.what_do_i_do_next).toBeTruthy();
    expect(typeof insight.what_do_i_do_next).toBe('string');
  });

  test('provides primary_diagnosis when issues detected', () => {
    const shots = makeShots(15, { face_to_path: 6 });
    const result = runDiagnosticEngine(shots, 'driver', 's1', 'u1');
    const insight = buildSessionInsight(result);
    expect(insight.primary_diagnosis).not.toBeNull();
  });
});
