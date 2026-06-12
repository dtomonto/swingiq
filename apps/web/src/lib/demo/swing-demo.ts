// ============================================================
// SwingVantage — Demo swing data (production-safe)
//
// Canonical fake-but-realistic data used by:
//   • the public, no-login /demo experience (marketing) — so visitors
//     see the SAME report a registered user gets, run through the SAME
//     @swingiq/core engine (scores are computed, never hand-typed).
//   • the dev-only /design-lab previews (re-exported there).
//
// HONESTY: every number a visitor sees on /demo is either (a) computed
// by the real diagnostic/scoring engine from these sample shots, or
// (b) clearly labelled "sample data" in the UI. We never present this
// as a real athlete's result. See /demo's SampleBanner.
// ============================================================

import type {
  GolferProfileInput,
  Shot,
  BallData,
  ClubDeliveryData,
  StrikeData,
} from '@swingiq/core';
import type { LocalSession } from '@/store';

/** A representative intermediate golfer who fights a slice with the driver. */
export const DEMO_PROFILE: GolferProfileInput = {
  name: 'Alex Carter',
  handedness: 'right',
  handicap: 12,
  handicap_source: 'self_reported',
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

/** Three score-only sessions — enough for the dashboard's Overall ring. */
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

/** A 7-iron shot with a mild fade/open-face pattern + deterministic per-shot
 *  variation (so std-dev / dispersion stats compute realistically). */
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
      launch_angle_vertical: j(17, 1), spin_rate: j(6400, 350), lateral_offline: j(9, 4),
      spin_axis: j(7, 2), apex_height: j(28, 2), smash_factor: 1.38, shot_shape: 'fade',
    }),
    club_data: clubData({
      club_speed: j(85, 1.5), attack_angle: j(-4, 1), club_path: j(-2.5, 1.2),
      face_angle_to_target: j(2, 1.5), face_to_path: j(4.6, 1), dynamic_loft: j(28, 1),
    }),
    // Centred strike — so the diagnosis surfaces the open-face/slice pattern
    // (matching the demo profile's "slice with the driver" miss) rather than a
    // strike-quality issue.
    strike_data: strikeData({ impact_location_lateral: j(0, 1.4), impact_location_vertical: j(0, 1.2) }),
    created_at: new Date().toISOString(),
  };
}

/** A single diagnosable session: 12 shots → the engine computes real scores. */
export function demoDiagnoseSession(): LocalSession {
  const shots = Array.from({ length: 12 }, (_, i) => makeShot(i));
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
    notes: 'Worked the bucket with the 7-iron — trying to quiet the slice and start it left.',
    shot_count: shots.length,
    shots,
    diagnoses: [],
    swing_score: 82,
    created_at: new Date().toISOString(),
  };
}
