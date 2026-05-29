// ============================================================
// SwingIQ Video Analysis — Extended Types
// These extend the base types in packages/core/src/types/index.ts
// ============================================================

import type { SwingPhase, CameraAngle, SkillLevel } from '../types';

// ──────────────────────────────────────────────────────────────
// Video metadata (extracted client-side before upload)
// ──────────────────────────────────────────────────────────────

export interface SwingVideoMetadata {
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds: number;
  width: number;
  height: number;
  frame_rate_estimated: number | null;
  camera_angle: CameraAngle | 'unknown';
}

// ──────────────────────────────────────────────────────────────
// Heuristic pose estimation (labeled as estimated, no ML lib)
// ──────────────────────────────────────────────────────────────

/** A 2-D point in normalised [0,1] video coordinates (x=right, y=down). */
export interface NormalizedPoint {
  x: number;
  y: number;
  confidence: number; // 0–1; heuristic = 0.3, future ML = higher
}

export interface EstimatedPoseLandmarks {
  head: NormalizedPoint | null;
  left_shoulder: NormalizedPoint | null;
  right_shoulder: NormalizedPoint | null;
  left_hip: NormalizedPoint | null;
  right_hip: NormalizedPoint | null;
  left_knee: NormalizedPoint | null;
  right_knee: NormalizedPoint | null;
  left_ankle: NormalizedPoint | null;
  right_ankle: NormalizedPoint | null;
  left_wrist: NormalizedPoint | null;
  right_wrist: NormalizedPoint | null;
  club_shaft_tip: NormalizedPoint | null;  // estimated from wrists
  club_grip: NormalizedPoint | null;       // estimated from wrists
  is_estimated: true; // always true for heuristic; future: remove when real ML lands
  estimation_method: 'heuristic' | 'mediapipe' | 'movenet';
}

// ──────────────────────────────────────────────────────────────
// Swing phase segmentation
// ──────────────────────────────────────────────────────────────

export interface SwingPhaseSegment {
  phase: SwingPhase;
  label: string;
  start_time: number;  // seconds from video start
  end_time: number;
  key_frame_time: number; // best representative frame
  is_estimated: boolean;
}

// ──────────────────────────────────────────────────────────────
// Canvas overlay (rendered over the video)
// ──────────────────────────────────────────────────────────────

export interface OverlayPoint {
  x: number; // 0-1 normalised
  y: number;
}

export interface OverlayLine {
  from: OverlayPoint;
  to: OverlayPoint;
  color: string;
  width: number;
  dashed?: boolean;
}

export interface OverlayArc {
  center: OverlayPoint;
  radius: number; // 0-1 normalised
  start_angle: number;
  end_angle: number;
  color: string;
  width: number;
}

export interface OverlayLabel {
  position: OverlayPoint;
  text: string;
  color: string;
  fontSize: number;
  background?: string;
}

export interface SwingOverlayData {
  timestamp: number; // matches video.currentTime
  landmarks: EstimatedPoseLandmarks | null;
  lines: OverlayLine[];
  arcs: OverlayArc[];
  labels: OverlayLabel[];
  swing_plane_line: OverlayLine | null;
  shaft_angle_line: OverlayLine | null;
  estimated_badge_visible: boolean; // always true if any landmarks shown
}

// ──────────────────────────────────────────────────────────────
// Detected issues (from heuristic analysis of visual data)
// ──────────────────────────────────────────────────────────────

export type VisualIssueId =
  | 'early_extension'
  | 'sway_slide'
  | 'reverse_pivot'
  | 'casting'
  | 'chicken_winging'
  | 'over_the_top'
  | 'flying_elbow'
  | 'head_movement_excessive'
  | 'weight_forward_setup'
  | 'grip_too_strong_visual'
  | 'grip_too_weak_visual'
  | 'open_stance'
  | 'closed_stance'
  | 'ball_position_forward'
  | 'ball_position_back'
  | 'poor_spine_angle'
  | 'flat_backswing'
  | 'steep_backswing'
  | 'short_backswing'
  | 'overswing'
  | 'loss_of_posture'
  | 'slide_through_impact';

export type VisualIssueSeverity = 'critical' | 'notable' | 'minor' | 'watch';

export interface DetectedSwingIssue {
  id: VisualIssueId;
  label: string;
  severity: VisualIssueSeverity;
  affected_phases: SwingPhase[];
  description: string;
  likely_cause: string;
  confidence: number;       // 0-1
  is_estimated: true;
  visual_indicator: string; // what to look for on screen
}

// ──────────────────────────────────────────────────────────────
// Drill recommendations (video-analysis flavour)
// ──────────────────────────────────────────────────────────────

export interface VideoDrillRecommendation {
  id: string;
  issue_id: VisualIssueId | null;
  phase: SwingPhase | null;
  name: string;
  goal: string;
  steps: string[];
  reps_or_duration: string;
  skill_level: SkillLevel;
  youtube_search_query: string;
  youtube_search_url: string;
  coach_channel_hint: string; // e.g. "Rotary Swing" — do NOT hardcode URL
  focus_feel: string;         // internal feel cue
}

// ──────────────────────────────────────────────────────────────
// Full analysis result
// ──────────────────────────────────────────────────────────────

export interface SwingVideoAnalysis {
  id: string;
  video_id: string;
  user_id: string;
  session_id: string | null;
  camera_angle: CameraAngle | 'unknown';
  metadata: SwingVideoMetadata;
  phase_segments: SwingPhaseSegment[];
  detected_issues: DetectedSwingIssue[];
  drill_recommendations: VideoDrillRecommendation[];
  overall_visual_score: number;     // 0-100
  primary_issue: DetectedSwingIssue | null;
  ai_narrative: string | null;      // populated server-side if AI enabled
  is_fully_estimated: true;         // always true until real ML integrated
  analysis_version: string;         // semver of engine used
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────
// Responsible learning — feedback & personalisation
// ──────────────────────────────────────────────────────────────

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;
export type DrillOutcome = 'felt_helpful' | 'too_hard' | 'too_easy' | 'irrelevant' | 'not_tried';

export interface AnalysisFeedback {
  id: string;
  analysis_id: string;
  user_id: string;
  overall_rating: FeedbackRating;
  most_useful_insight: string | null;
  least_useful_insight: string | null;
  free_text: string | null;
  submitted_at: string;
}

export interface RecommendationInteraction {
  id: string;
  drill_id: string;
  user_id: string;
  analysis_id: string;
  outcome: DrillOutcome;
  tried_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface UserLearningProfile {
  user_id: string;
  skill_level: SkillLevel;
  preferred_cue_style: 'visual' | 'feel' | 'technical' | 'mixed';
  responded_well_to_issues: VisualIssueId[];
  persistent_issues: VisualIssueId[];
  completed_drills: string[];
  skipped_drills: string[];
  average_feedback_rating: number;
  total_analyses: number;
  last_updated: string;
}

export interface PromptEvaluationLog {
  id: string;
  user_id: string;
  analysis_id: string;
  prompt_version: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  user_rating: FeedbackRating | null;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}
