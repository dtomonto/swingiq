// ============================================================
// Diagnostic engine — robustness + dispersion-aware confidence
// (Intelligence upgrade Sprint 1, recommendations #10 + #11)
// ============================================================

import {
  computeSessionStats,
  runDiagnosticEngine,
  dispersionConfidenceFactor,
} from './engine';
import type { Shot } from '../types';

function shot(faceToPath: number, extra: Partial<{ carry: number }> = {}): Shot {
  return {
    id: 'x',
    session_id: 's',
    user_id: 'u',
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
      carry_distance: extra.carry ?? 160,
      total_distance: null,
      roll_distance: null,
      ball_speed: 110,
      launch_angle_vertical: null,
      launch_direction_horizontal: null,
      spin_rate: 7000,
      spin_axis: 0,
      apex_height: null,
      descent_angle: null,
      side_carry: null,
      lateral_offline: 0,
      curve: null,
      flight_time: null,
      shot_shape: null,
      smash_factor: 1.37,
    },
    club_data: {
      club_speed: 80,
      attack_angle: -4,
      club_path: 0,
      face_angle_to_target: 0,
      face_to_path: faceToPath,
      dynamic_loft: 22,
      spin_loft: null,
      swing_plane_horizontal: null,
      swing_plane_vertical: null,
      low_point_position: -1,
      low_point_height: null,
      closure_rate: null,
      swing_direction: null,
      lie_angle_dynamic: null,
    },
    strike_data: { impact_location_lateral: 0, impact_location_vertical: null },
    created_at: new Date().toISOString(),
  };
}

const tile = (vals: number[]): Shot[] => vals.map((v) => shot(v));

describe('#10 robust mean in computeSessionStats', () => {
  it('drops a single >2σ mishit from the session average', () => {
    // Twelve tidy 5° shots + one 50° shank.
    const shots = [...Array(12).fill(5), 50].map((v) => shot(v));
    const stats = computeSessionStats(shots, 'mid_iron');
    // Plain mean would be (60+50)/13 ≈ 8.46; robust mean drops the shank → 5.0.
    expect(stats.avg_face_to_path).toBeCloseTo(5, 1);
  });

  it('is identical to a plain mean for clean data (nothing beyond 2σ)', () => {
    const vals = [4, 5, 6, 4, 5, 6, 4, 5, 6, 5];
    const plain = vals.reduce((a, b) => a + b, 0) / vals.length;
    const stats = computeSessionStats(tile(vals), 'mid_iron');
    expect(stats.avg_face_to_path).toBeCloseTo(plain, 6);
  });

  it('leaves small samples (<5) as a plain mean', () => {
    const vals = [2, 20]; // would-be outlier kept — too few shots to judge
    const stats = computeSessionStats(tile(vals), 'mid_iron');
    expect(stats.avg_face_to_path).toBeCloseTo(11, 6);
  });

  it('reports shot-to-shot dispersion for the primary drivers', () => {
    const stats = computeSessionStats(tile([2, 11, 2, 11, 2, 11]), 'mid_iron');
    expect(stats.face_to_path_std_dev).toBeGreaterThan(0);
    expect(stats.club_path_std_dev).toBeDefined();
  });
});

describe('#11 dispersionConfidenceFactor', () => {
  it('is 1.0 for a tight, repeatable delivery', () => {
    expect(dispersionConfidenceFactor({ shot_count: 12, club_category: 'mid_iron', face_to_path_std_dev: 0, club_path_std_dev: 0 })).toBe(1);
  });

  it('drops toward 0.7 as the delivery gets noisier', () => {
    const noisy = dispersionConfidenceFactor({ shot_count: 12, club_category: 'mid_iron', face_to_path_std_dev: 10 });
    expect(noisy).toBeCloseTo(0.7, 5);
    const mid = dispersionConfidenceFactor({ shot_count: 12, club_category: 'mid_iron', face_to_path_std_dev: 4.75 });
    expect(mid).toBeLessThan(1);
    expect(mid).toBeGreaterThan(0.7);
  });

  it('applies no penalty when dispersion is unknown', () => {
    expect(dispersionConfidenceFactor({ shot_count: 12, club_category: 'mid_iron' })).toBe(1);
  });

  it('lets the noisiest of the two drivers govern', () => {
    const f = dispersionConfidenceFactor({ shot_count: 12, club_category: 'mid_iron', face_to_path_std_dev: 0, club_path_std_dev: 10 });
    expect(f).toBeCloseTo(0.7, 5);
  });
});

describe('#11 end-to-end: noisy swings earn lower confidence', () => {
  it('a scattered slice scores lower confidence than a tight slice with the same average', () => {
    const tight = runDiagnosticEngine(tile(Array(12).fill(6.5)), 'mid_iron', 's', 'u');
    // Same 6.5° average, but spread ±4.5° (none beyond 2σ, so average is preserved).
    const noisy = runDiagnosticEngine(tile([2, 11, 2, 11, 2, 11, 2, 11, 2, 11, 2, 11]), 'mid_iron', 's', 'u');

    expect(tight.primary?.rule.id).toBe('slice_weak_fade');
    expect(noisy.primary?.rule.id).toBe('slice_weak_fade');
    expect(noisy.primary!.confidence).toBeLessThan(tight.primary!.confidence);
    // Both still clear the 40 floor and surface a diagnosis.
    expect(noisy.primary!.confidence).toBeGreaterThanOrEqual(40);
  });
});
