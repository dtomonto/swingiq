// Shared demo data for the dev-only /design-lab previews. Lets the real
// auth-gated components (dashboard, diagnose) mount with realistic-but-fake
// data so the design can be reviewed without a Supabase session. Pure builders;
// nothing here ships to production (the /design-lab pages 404 in prod).

import type { GolferProfileInput, Shot, BallData, ClubDeliveryData, StrikeData } from '@swingiq/core';
import type { LocalSession } from '@/store';

export const DEMO_PROFILE: GolferProfileInput = {
  name: 'Demo Player',
  handedness: 'right',
  handicap: 12,
  scoring_average: 88,
  low_round: 79,
  primary_goal: 'Break 85 consistently',
  current_miss: 'Slice with the driver',
  desired_shot_shape: 'draw',
  practice_frequency: 'weekly',
  practice_environment: 'range',
  launch_monitor_owned: 'rapsodo',
  home_simulator: false,
  indoor_outdoor: 'outdoor',
  ball_used: 'Pro V1',
  mat_or_grass: 'grass',
  skill_level: 'intermediate',
  data_sophistication: 'intermediate',
  coaching_style: 'balanced',
  injury_notes: '',
};

/** Three score-only sessions — enough for the dashboard's Overall ring
 *  (useOverallScore needs only swing_score, not shots/diagnoses). */
export function demoScoreSessions(): LocalSession[] {
  const now = Date.now();
  const day = 86_400_000;
  return [86, 81, 79].map((score, i) => ({
    id: `demo-session-${i}`,
    name: `Range Session ${3 - i}`,
    date: new Date(now - i * day).toISOString().slice(0, 10),
    sport: 'golf',
    club_name: '7 Iron',
    club_category: 'iron',
    launch_monitor: 'Manual',
    indoor_outdoor: 'outdoor',
    mat_or_grass: 'grass',
    notes: '',
    shot_count: 12,
    shots: [],
    diagnoses: [],
    swing_score: score,
    created_at: new Date(now - i * day).toISOString(),
  }));
}

// ── A session WITH real shots, so the diagnostic engine produces scores ──────

const ballData = (o: Partial<BallData>): BallData => ({
  carry_distance: null, total_distance: null, roll_distance: null, ball_speed: null,
  launch_angle_vertical: null, launch_direction_horizontal: null, spin_rate: null,
  spin_axis: null, apex_height: null, descent_angle: null, side_carry: null,
  lateral_offline: null, curve: null, flight_time: null, shot_shape: null, smash_factor: null,
  ...o,
});

const clubData = (o: Partial<ClubDeliveryData>): ClubDeliveryData => ({
  club_speed: null, attack_angle: null, club_path: null, face_angle_to_target: null,
  face_to_path: null, dynamic_loft: null, spin_loft: null, swing_plane_horizontal: null,
  swing_plane_vertical: null, low_point_position: null, low_point_height: null,
  closure_rate: null, swing_direction: null, lie_angle_dynamic: null,
  ...o,
});

const strikeData = (o: Partial<StrikeData> = {}): StrikeData => ({
  impact_location_lateral: null, impact_location_vertical: null, ...o,
});

/** A 7-iron shot with a mild fade pattern + deterministic per-shot variation
 *  (so std-dev/dispersion stats compute realistically). */
function makeShot(i: number): Shot {
  const j = (base: number, spread: number) => +(base + Math.sin(i * 1.7) * spread).toFixed(1);
  return {
    id: `demo-shot-${i}`,
    session_id: 'demo-diag',
    user_id: 'demo',
    club_id: null,
    club_name: '7 Iron',
    club_category: 'mid_iron',
    shot_number: i + 1,
    date_time: new Date().toISOString(),
    swing_type: 'full',
    intended_shot_shape: 'straight',
    actual_shot_shape: 'fade',
    is_outlier: false,
    user_notes: '',
    ball_data: ballData({
      carry_distance: j(165, 6), total_distance: j(172, 6), ball_speed: j(118, 2.5),
      launch_angle_vertical: j(17, 1), spin_rate: j(6400, 350), lateral_offline: j(6, 5),
      apex_height: j(28, 2), smash_factor: 1.38, shot_shape: 'fade',
    }),
    club_data: clubData({
      club_speed: j(85, 1.5), attack_angle: j(-4, 1), club_path: j(-2.5, 1.2),
      face_angle_to_target: j(1, 1.5), face_to_path: j(3.5, 1), dynamic_loft: j(28, 1),
    }),
    strike_data: strikeData({ impact_location_lateral: j(2, 3), impact_location_vertical: j(-1, 2) }),
    created_at: new Date().toISOString(),
  };
}

/** A single diagnosable session: 9 shots → the engine computes real scores. */
export function demoDiagnoseSession(): LocalSession {
  const shots = Array.from({ length: 9 }, (_, i) => makeShot(i));
  return {
    id: 'demo-diag',
    name: 'Range Session — 7 Iron',
    date: new Date().toISOString().slice(0, 10),
    sport: 'golf',
    club_name: '7 Iron',
    club_category: 'mid_iron',
    launch_monitor: 'Rapsodo',
    indoor_outdoor: 'outdoor',
    mat_or_grass: 'grass',
    notes: '',
    shot_count: shots.length,
    shots,
    diagnoses: [],
    swing_score: 82,
    created_at: new Date().toISOString(),
  };
}
