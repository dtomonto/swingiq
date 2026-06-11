// ============================================================
// SwingVantage — Multi-Sport Types
// Foundation types shared across all sports supported by SwingVantage.
// Golf types remain in video-analysis/types.ts and types/index.ts.
// ============================================================

import type { SkillLevel } from '../types';

// ──────────────────────────────────────────────────────────────
// Sport identity
// ──────────────────────────────────────────────────────────────

export type SportId =
  | 'golf'
  | 'tennis'
  | 'pickleball'
  | 'padel'
  | 'baseball'
  | 'softball_slow'
  | 'softball_fast';

// ──────────────────────────────────────────────────────────────
// Sport taxonomy (category grouping — single source of truth)
// ──────────────────────────────────────────────────────────────

export type SportCategory = 'club_sport' | 'racket_sport' | 'bat_sport';

export type SportStatus = 'supported' | 'in_development';

export interface SportTaxonomyEntry {
  id: SportId;
  name: string;
  category: SportCategory;
  status: SportStatus;
}

/**
 * Canonical, ordered taxonomy of every sport SwingVantage supports.
 * Display order: Golf → Tennis → Pickleball → Padel → Baseball →
 * Slow-Pitch Softball → Fast-Pitch Softball. Categories group the
 * marketing surface, filters, and internal-linking strategy.
 */
export const SPORT_TAXONOMY: SportTaxonomyEntry[] = [
  { id: 'golf', name: 'Golf', category: 'club_sport', status: 'supported' },
  { id: 'tennis', name: 'Tennis', category: 'racket_sport', status: 'supported' },
  { id: 'pickleball', name: 'Pickleball', category: 'racket_sport', status: 'supported' },
  { id: 'padel', name: 'Padel', category: 'racket_sport', status: 'supported' },
  { id: 'baseball', name: 'Baseball', category: 'bat_sport', status: 'supported' },
  { id: 'softball_slow', name: 'Slow-Pitch Softball', category: 'bat_sport', status: 'supported' },
  { id: 'softball_fast', name: 'Fast-Pitch Softball', category: 'bat_sport', status: 'supported' },
];

export const SPORT_CATEGORY_LABELS: Record<SportCategory, string> = {
  club_sport: 'Club Sport',
  racket_sport: 'Racket Sports',
  bat_sport: 'Bat Sports',
};

export function getSportsByCategory(category: SportCategory): SportTaxonomyEntry[] {
  return SPORT_TAXONOMY.filter((s) => s.category === category);
}

export function getSportTaxonomy(id: SportId): SportTaxonomyEntry | undefined {
  return SPORT_TAXONOMY.find((s) => s.id === id);
}

export type SportIssueId =
  // Tennis — original
  | 'late_contact'
  | 'open_hips_early'
  | 'wrist_rollover'
  | 'bent_arm_contact'
  | 'follow_through_short'
  | 'head_pull_tennis'
  | 'loop_timing_off'
  | 'feet_not_moving'
  // Tennis — extended
  | 'poor_split_step'
  | 'weak_unit_turn'
  | 'poor_loading'
  | 'off_balance_contact'
  | 'poor_racquet_path'
  | 'excessive_wrist'
  | 'inconsistent_swing_plane'
  | 'poor_extension'
  | 'short_follow_through'
  | 'poor_recovery'
  | 'over_rotation'
  | 'poor_footwork'
  | 'falling_away'
  | 'serve_toss_inconsistency'
  | 'serve_trophy_breakdown'
  | 'late_preparation'
  // Baseball — original
  | 'casting_hands'
  | 'lunging_forward'
  | 'hip_stall'
  | 'arm_bar_lead'
  | 'chopping_swing'
  | 'extreme_uppercut'
  | 'early_shoulder_pull'
  | 'head_off_ball'
  // Baseball — extended
  | 'poor_stance_setup'
  | 'late_load'
  | 'early_load'
  | 'poor_stride_direction'
  | 'over_striding'
  | 'under_striding'
  | 'poor_hip_shoulder_separation'
  | 'drifting_swaying'
  | 'collapsing_back_side'
  | 'long_swing_path'
  | 'steep_bat_path'
  | 'flat_bat_path'
  | 'weak_bat_acceleration'
  | 'contact_too_forward'
  | 'pull_off_early'
  // Softball — original (shared with baseball where applicable)
  | 'dropping_back_shoulder'
  | 'high_hands_load'
  | 'contact_too_deep'
  | 'no_hip_drive_soft'
  | 'arm_short_follow'
  // Softball slow pitch — extended
  | 'sp_poor_stance_setup'
  | 'sp_poor_pitch_tracking'
  | 'sp_mistimed_load_arc'
  | 'sp_poor_stride_timing'
  | 'sp_over_striding'
  | 'sp_poor_weight_transfer'
  | 'sp_lunging_ball'
  | 'sp_poor_hip_rotation'
  | 'sp_long_looping_swing'
  | 'sp_too_steep_contact'
  | 'sp_too_uppercut'
  | 'sp_poor_bat_path_zone'
  | 'sp_pulling_off_early'
  | 'sp_poor_opposite_field'
  | 'sp_poor_finish_balance'
  | 'sp_poor_pitch_arc_timing'
  // Fast pitch softball — extended
  | 'fp_poor_stance_setup'
  | 'fp_late_load'
  | 'fp_early_load'
  | 'fp_poor_stride_timing'
  | 'fp_poor_stride_direction'
  | 'fp_over_striding'
  | 'fp_under_striding'
  | 'fp_poor_separation'
  | 'fp_poor_weight_transfer'
  | 'fp_lunging'
  | 'fp_drifting_swaying'
  | 'fp_hand_drop'
  | 'fp_steep_attack_pattern'
  | 'fp_poor_attack_angle'
  | 'fp_contact_too_deep'
  | 'fp_contact_too_forward'
  | 'fp_poor_extension_contact'
  // Pickleball — compact paddle mechanics + non-volley-zone strategy
  | 'pb_long_backswing'
  | 'pb_open_paddle_face'
  | 'pb_popping_up_dinks'
  | 'pb_netting_third_drop'
  | 'pb_driving_long'
  | 'pb_wristy_contact'
  | 'pb_contact_too_low'
  | 'pb_late_volley'
  | 'pb_poor_reset'
  | 'pb_speed_up_error'
  | 'pb_no_split_step'
  | 'pb_kitchen_footwork'
  | 'pb_off_balance_contact'
  | 'pb_poor_transition_zone'
  | 'pb_attackable_ball_misread'
  // Padel — wall-based racket mechanics + doubles court positioning
  | 'pd_late_after_wall'
  | 'pd_open_racket_face'
  | 'pd_weak_bandeja'
  | 'pd_overhit_smash'
  | 'pd_poor_lob_depth'
  | 'pd_volley_error'
  | 'pd_poor_net_transition'
  | 'pd_bad_court_position'
  | 'pd_partner_spacing'
  | 'pd_poor_wall_read'
  | 'pd_no_split_step'
  | 'pd_flat_vibora_path'
  | 'pd_off_balance_contact'
  | 'pd_rushing_points'
  // Generic fallback for new issues not yet in the union
  | string;

export type SportIssueSeverity = 'critical' | 'notable' | 'minor' | 'watch';

// ──────────────────────────────────────────────────────────────
// Phase definitions (sport-agnostic shell)
// ──────────────────────────────────────────────────────────────

export interface SportPhaseDefinition {
  phase: string;
  label: string;
  short_label: string;
  description: string;
  key_checkpoints: string[];
  common_errors: string[];
  coaching_cue: string;
  technical_cue: string;
  estimated_pct_of_swing: number; // 0-1
}

export interface SportPhaseSegment {
  phase: string;
  label: string;
  start_time: number;  // seconds from video start
  end_time: number;
  key_frame_time: number;
  is_estimated: boolean;
  sport_id: SportId;
}

// ──────────────────────────────────────────────────────────────
// Detected issues
// ──────────────────────────────────────────────────────────────

export interface SportDetectedIssue {
  id: SportIssueId;
  label: string;
  severity: SportIssueSeverity;
  affected_phases: string[];
  description: string;
  likely_cause: string;
  confidence: number;       // 0-1 (heuristic always 0.3-0.65)
  /**
   * Single-camera analysis is always an ESTIMATE (2D, depth reconstructed) —
   * this stays `true` even for pose-derived detections.
   */
  is_estimated: true;
  /**
   * How the issue was detected:
   *   - 'metadata' (default): heuristic from clip duration / camera angle only.
   *   - 'pose': from actual MediaPipe pose geometry (real landmark motion), with
   *     a calibrated confidence. Still estimated, but grounded in measured motion.
   */
  detection_basis?: 'metadata' | 'pose';
  visual_indicator: string;
  sport_id: SportId;
}

// ──────────────────────────────────────────────────────────────
// Drill recommendations (multi-sport)
// ──────────────────────────────────────────────────────────────

export interface SportDrillRecommendation {
  id: string;
  sport_id: SportId;
  issue_id: SportIssueId | null;
  phase: string | null;
  name: string;
  goal: string;
  steps: string[];
  reps_or_duration: string;
  skill_level: SkillLevel;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment_needed: string;
  safety_note: string | null;
  youtube_search_query: string;
  youtube_search_url: string;
  coach_channel_hint: string;
  focus_feel: string;
  source_ids: string[];
  last_reviewed: string; // ISO date
}

// ──────────────────────────────────────────────────────────────
// Benchmark windows (sport + skill-level segmented)
// ──────────────────────────────────────────────────────────────

export interface SportBenchmarkWindow {
  min: number;
  target: number;
  max: number;
  unit: string;
  description: string;
  confidence_note: string;
}

export type SportSkillSegment = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export interface SportBenchmarks {
  sport_id: SportId;
  version: string;
  segmented: Record<SportSkillSegment, Record<string, SportBenchmarkWindow>>;
  notes: string;
}

// ──────────────────────────────────────────────────────────────
// Full analysis result for any non-golf sport
// ──────────────────────────────────────────────────────────────

export interface SportSwingAnalysis {
  id: string;
  sport_id: SportId;
  video_id: string;
  user_id: string;
  session_id: string | null;
  camera_angle: string;
  metadata: {
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    duration_seconds: number;
    width: number;
    height: number;
    frame_rate_estimated: number | null;
    camera_angle: string;
  };
  phase_segments: SportPhaseSegment[];
  detected_issues: SportDetectedIssue[];
  drill_recommendations: SportDrillRecommendation[];
  overall_visual_score: number;     // 0-100
  primary_issue: SportDetectedIssue | null;
  ai_narrative: string | null;
  is_fully_estimated: true;
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────
// Sport configuration (registered in sport-registry.ts)
// ──────────────────────────────────────────────────────────────

export interface SportConfig {
  id: SportId;
  name: string;
  short_name: string;
  emoji: string;
  description: string;
  tagline: string;
  color_class: string;  // Tailwind class for highlights
  accent_hex: string;   // for canvas overlay colors
  phases: Record<string, SportPhaseDefinition>;
  phase_sequence: string[];
  benchmarks: SportBenchmarks;
  camera_angle_guidance: Record<string, string>;
  evidence_note: string;
  benchmark_version: string;
}

// ──────────────────────────────────────────────────────────────
// Input to the analysis runner
// ──────────────────────────────────────────────────────────────

export interface SportVideoMetadata {
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds: number;
  width: number;
  height: number;
  frame_rate_estimated: number | null;
  camera_angle: string;
}

/**
 * Camera-agnostic pose descriptors derived from a MediaPipe pose track (the
 * same proxies `lib/pose/pose-metrics.ts` computes on-device). Real measured
 * motion — passed in so the deterministic analyzers can detect faults from
 * geometry instead of clip-duration/camera heuristics. All are proxies, not
 * lab measurements (single camera, 2D).
 */
export interface SportPoseFeatures {
  /** Frames a usable pose was detected in (more = more reliable). */
  framesWithPose: number;
  /** Range of the shoulder-line angle across frames (rotation proxy), degrees. */
  shoulderTurnRangeDeg: number;
  /** Range of spine tilt (shoulder-mid → hip-mid) across frames (posture-change proxy), degrees. */
  spineAngleRangeDeg: number;
  /** Horizontal range of the head across frames, % of frame width (head stability). */
  headSwayPct: number;
  /** Horizontal range of the hip midpoint across frames, % of frame width (sway/slide). */
  hipSwayPct: number;
}

export interface SportAnalysisInput {
  sport_id: SportId;
  metadata: SportVideoMetadata;
  user_id: string;
  skill_level?: SkillLevel;
  /**
   * Optional on-device pose descriptors. When present, the analyzer adds
   * pose-derived detections (detection_basis: 'pose') from real motion.
   */
  pose?: SportPoseFeatures;
}
