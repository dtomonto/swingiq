// ============================================================
// SwingIQ — Multi-Sport Types
// Foundation types shared across all sports supported by SwingIQ.
// Golf types remain in video-analysis/types.ts and types/index.ts.
// ============================================================

import type { SkillLevel } from '../types';

// ──────────────────────────────────────────────────────────────
// Sport identity
// ──────────────────────────────────────────────────────────────

export type SportId =
  | 'golf'
  | 'tennis'
  | 'baseball'
  | 'softball_slow'
  | 'softball_fast';

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
  is_estimated: true;
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

export interface SportAnalysisInput {
  sport_id: SportId;
  metadata: SportVideoMetadata;
  user_id: string;
  skill_level?: SkillLevel;
}
