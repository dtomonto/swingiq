// ============================================================
// SwingVantage Core Types — Universal Golf Swing Data Schema
// ============================================================

export type Handedness = 'right' | 'left';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type SwingType =
  | 'chip'
  | 'pitch'
  | 'half'
  | 'three_quarter'
  | 'full'
  | 'punch'
  | 'stock'
  | 'flighted'
  | 'driver'
  | 'tee_shot';
export type CameraAngle = 'down_the_line' | 'face_on' | 'rear' | 'overhead' | 'multi_angle';
export type IndoorOutdoor = 'indoor' | 'outdoor';
export type MatGrass = 'mat' | 'grass';
export type ShotShape =
  | 'straight'
  | 'draw'
  | 'fade'
  | 'hook'
  | 'slice'
  | 'push'
  | 'pull'
  | 'push_draw'
  | 'pull_fade';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'monitor' | 'ignore';
export type ClubCategory =
  | 'driver'
  | 'fairway_wood'
  | 'hybrid'
  | 'long_iron'
  | 'mid_iron'
  | 'short_iron'
  | 'wedge'
  | 'putter';
export type ShaftFlex = 'ladies' | 'senior' | 'regular' | 'stiff' | 'x_stiff' | 'tour_x';
export type LaunchMonitorBrand =
  | 'flightscope'
  | 'trackman'
  | 'foresight'
  | 'skytrak'
  | 'uneekor'
  | 'garmin'
  | 'rapsodo'
  | 'full_swing'
  | 'golfzon'
  | 'bushnell'
  | 'manual'
  | 'other';

// ============================================================
// Golfer Profile
// ============================================================

export interface GolferProfile {
  id: string;
  user_id: string;
  name: string;
  handedness: Handedness;
  handicap: number | null;
  scoring_average: number | null;
  low_round: number | null;
  primary_goal: string;
  current_miss: string;
  desired_shot_shape: ShotShape;
  practice_frequency: string;
  practice_environment: string;
  launch_monitor_owned: LaunchMonitorBrand | null;
  home_simulator: boolean;
  indoor_outdoor: IndoorOutdoor;
  ball_used: string;
  mat_or_grass: MatGrass;
  skill_level: SkillLevel;
  coaching_style: 'data_first' | 'feel_first' | 'balanced';
  data_sophistication: SkillLevel;
  injury_notes: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerDNA {
  distance_profile: ProfileRating;
  accuracy_profile: ProfileRating;
  face_path_profile: ProfileRating;
  strike_profile: ProfileRating;
  low_point_profile: ProfileRating;
  launch_spin_profile: ProfileRating;
  short_game_profile: ProfileRating;
  putting_profile: ProfileRating;
  consistency_profile: ProfileRating;
  practice_priority_stack: string[];
  score_impact_ranking: ScoreImpactItem[];
}

export interface ProfileRating {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  summary: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ScoreImpactItem {
  area: string;
  strokes_gained_opportunity: number;
  priority: InsightPriority;
  description: string;
}

// ============================================================
// Golf Club
// ============================================================

export interface Club {
  id: string;
  bag_id: string;
  user_id: string;
  club_name: string;
  club_category: ClubCategory;
  brand: string;
  model: string;
  loft: number | null;
  lie_angle: number | null;
  length: number | null;
  shaft: string;
  shaft_flex: ShaftFlex | null;
  shaft_weight: number | null;
  grip: string;
  typical_carry: number | null;
  typical_total: number | null;
  confidence_score: number; // 0-100
  dispersion_score: number; // 0-100
  current_primary_miss: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GolfBag {
  id: string;
  user_id: string;
  name: string;
  clubs: Club[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// Session & Shot Data
// ============================================================

export interface Session {
  id: string;
  user_id: string;
  name: string;
  date_time: string;
  launch_monitor_brand: LaunchMonitorBrand;
  launch_monitor_model: string;
  software_source: string;
  indoor_outdoor: IndoorOutdoor;
  mat_or_grass: MatGrass;
  ball_type: string;
  weather_condition: string;
  altitude: number | null;
  temperature: number | null;
  wind_speed: number | null;
  wind_direction: string;
  notes: string;
  shot_count: number;
  clubs_used: string[];
  primary_diagnosis_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shot {
  id: string;
  session_id: string;
  user_id: string;
  club_id: string | null;
  club_name: string;
  club_category: ClubCategory;
  shot_number: number;
  date_time: string;
  swing_type: SwingType;
  intended_shot_shape: ShotShape | null;
  actual_shot_shape: ShotShape | null;
  is_outlier: boolean;
  user_notes: string;
  ball_data: BallData;
  club_data: ClubDeliveryData;
  strike_data: StrikeData;
  created_at: string;
}

export interface BallData {
  carry_distance: number | null;
  total_distance: number | null;
  roll_distance: number | null;
  ball_speed: number | null;
  launch_angle_vertical: number | null;
  launch_direction_horizontal: number | null;
  spin_rate: number | null;
  spin_axis: number | null;
  apex_height: number | null;
  descent_angle: number | null;
  side_carry: number | null;
  lateral_offline: number | null;
  curve: number | null;
  flight_time: number | null;
  shot_shape: ShotShape | null;
  smash_factor: number | null;
}

export interface ClubDeliveryData {
  club_speed: number | null;
  attack_angle: number | null;
  club_path: number | null;
  face_angle_to_target: number | null;
  face_to_path: number | null;
  dynamic_loft: number | null;
  spin_loft: number | null;
  swing_plane_horizontal: number | null;
  swing_plane_vertical: number | null;
  low_point_position: number | null;
  low_point_height: number | null;
  closure_rate: number | null;
  swing_direction: number | null;
  lie_angle_dynamic: number | null;
}

export interface StrikeData {
  impact_location_lateral: number | null; // negative=heel, positive=toe
  impact_location_vertical: number | null; // negative=low, positive=high
}

// ============================================================
// Diagnostic Engine
// ============================================================

export type DiagnosisCategory =
  | 'slice_weak_fade'
  | 'hook_strong_draw'
  | 'pull'
  | 'push'
  | 'fat_contact'
  | 'thin_contact'
  | 'dynamic_loft_high'
  | 'dynamic_loft_low'
  | 'heel_strike'
  | 'toe_strike'
  | 'low_point_behind'
  | 'attack_angle_steep'
  | 'attack_angle_shallow'
  | 'driver_attack_angle_down'
  | 'spin_too_high'
  | 'spin_too_low'
  | 'launch_too_high'
  | 'launch_too_low'
  | 'launch_angle_low'
  | 'distance_loss'
  | 'inconsistent_carry'
  | 'poor_smash_factor'
  | 'equipment_concern'
  | 'optimal';

export interface Diagnosis {
  id: string;
  session_id: string | null;
  club_id: string | null;
  user_id: string;
  category: DiagnosisCategory;
  primary_issue: string;
  supporting_data: SupportingDataPoint[];
  likely_swing_cause: string;
  confidence_score: number; // 0-100
  score_impact: number; // estimated strokes
  urgency: InsightPriority;
  practice_priority: number; // 1 = highest
  drill_categories: string[];
  retest_protocol: RetestProtocol;
  what_improvement_looks_like: string;
  is_swing_issue: boolean;
  is_strike_issue: boolean;
  is_equipment_concern: boolean;
  is_setup_issue: boolean;
  created_at: string;
}

export interface SupportingDataPoint {
  metric: string;
  value: number | string;
  unit: string;
  target_min: number | null;
  target_max: number | null;
  deviation: number | null;
  interpretation: string;
}

export interface RetestProtocol {
  shot_count: number;
  club: string;
  focus_metrics: string[];
  success_criteria: string;
  notes: string;
}

// ============================================================
// Training Routines
// ============================================================

export interface TrainingRoutine {
  id: string;
  diagnosis_category: DiagnosisCategory;
  name: string;
  goal: string;
  data_point_being_improved: string;
  why_it_matters: string;
  skill_level: SkillLevel;
  setup: string;
  drill_steps: string[];
  ball_count: number;
  intensity: 'low' | 'medium' | 'high';
  feedback_metric: string;
  success_criteria: string;
  common_mistakes: string[];
  progression: string;
  retest_protocol: RetestProtocol;
  drill_recommendations: DrillRecommendation[];
  estimated_duration_minutes: number;
}

export interface DrillRecommendation {
  id: string;
  name: string;
  category: string;
  difficulty: SkillLevel;
  why_this_matches: string;
  youtube_search_query: string;
  youtube_search_url: string;
  warning: string | null;
  curated_video_id: string | null;
  coach_channel: string | null;
}

// ============================================================
// Swing Video & Analysis
// ============================================================

export type SwingPhase =
  | 'setup_address'
  | 'takeaway'
  | 'club_parallel_back'
  | 'lead_arm_parallel'
  | 'top_of_backswing'
  | 'transition'
  | 'lead_arm_parallel_downswing'
  | 'shaft_parallel_downswing'
  | 'impact'
  | 'post_impact'
  | 'finish';

export type PhaseGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SwingVideo {
  id: string;
  session_id: string | null;
  user_id: string;
  file_url: string;
  camera_angle: CameraAngle;
  frame_rate: number;
  duration_seconds: number;
  thumbnail_url: string | null;
  analysis_status: 'pending' | 'processing' | 'complete' | 'failed';
  created_at: string;
}

export interface SwingPhaseGrade {
  id: string;
  video_id: string;
  phase: SwingPhase;
  phase_label: string;
  grade: PhaseGrade;
  score: number; // 0-100
  timestamp_seconds: number;
  what_looks_good: string[];
  potential_issues: string[];
  supporting_data_points: string[];
  recommended_drill: string;
  youtube_search_url: string;
  retest_metric: string;
  is_estimated: boolean; // true if inferred, not directly measured
  notes: string;
}

// ============================================================
// Progress Tracking
// ============================================================

export interface ProgressSnapshot {
  id: string;
  user_id: string;
  date: string;
  period: '7_day' | '30_day' | '90_day';
  overall_score: number;
  driver_score: number;
  iron_score: number;
  wedge_score: number;
  short_game_score: number;
  putting_score: number;
  face_control_score: number;
  path_control_score: number;
  strike_quality_score: number;
  distance_control_score: number;
  consistency_score: number;
  most_improved_metric: string;
  most_regressed_metric: string;
  primary_weakness: string;
  session_count: number;
  total_shots: number;
}

// ============================================================
// Launch Monitor Import
// ============================================================

export interface ImportSession {
  source: LaunchMonitorBrand;
  raw_rows: Record<string, string>[];
  column_mapping: ColumnMapping;
  validation_warnings: ImportWarning[];
  shots_parsed: number;
  shots_valid: number;
  missing_fields: string[];
}

export interface ColumnMapping {
  [universalField: string]: string; // universalField -> csv column name
}

export interface ImportWarning {
  type: 'missing_field' | 'invalid_value' | 'duplicate' | 'unit_mismatch';
  field: string;
  message: string;
  row_number: number | null;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================
// Scoring Outputs
// ============================================================

export interface SwingScores {
  overall: number;
  driver: number;
  iron: number;
  wedge: number;
  short_game: number;
  putting: number;
  face_control: number;
  path_control: number;
  strike_quality: number;
  distance_control: number;
  launch_spin_optimization: number;
  dispersion: number;
  consistency: number;
  video_mechanics: number;
  practice_compliance: number;
}
