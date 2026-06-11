// ============================================================
// SwingVantage — RecordAssist Vision + Kinetic Tracking OS
// ------------------------------------------------------------
// Shared type vocabulary for the guided self-recording system.
//
// Design rule: this module (and the pure `engines/*`) deliberately
// import NOTHING from `@swingiq/core` or React so the engine unit
// tests run with zero build/runtime dependencies. The platform
// bridge (sports.ts) maps these local types onto the app's SportId.
// ============================================================

/** The six SwingVantage sports RecordAssist supports today. */
export type RecordAssistSport =
  | 'golf'
  | 'tennis'
  | 'baseball'
  | 'softball'
  | 'pickleball'
  | 'padel';

/** A sport-specific action/shot the user can frame for. */
export type SportActionId = string;

/** Camera framing orientations. */
export type CameraOrientation = 'portrait' | 'landscape';

/** Canonical camera viewpoints across sports. */
export type CameraView =
  | 'face_on'
  | 'down_the_line'
  | 'side'
  | 'rear'
  | 'front'
  | 'baseline'
  | 'unknown';

export type Handedness = 'right' | 'left' | 'unknown';

/**
 * Honest confidence label attached to every estimate. RecordAssist must
 * never overclaim precision — see docs/RECORD_ASSIST.md §Trust.
 */
export type KineticConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

// ── Pose ────────────────────────────────────────────────────

/** A single normalized landmark (MediaPipe BlazePose schema, 0–1 coords). */
export interface PoseLandmark {
  x: number; // 0–1, left→right
  y: number; // 0–1, top→bottom
  z: number; // relative depth (negative = toward camera)
  visibility: number; // 0–1 model confidence the point is visible
}

/** One detected pose for a frame (33 landmarks when present). */
export interface PoseSample {
  landmarks: PoseLandmark[];
  /** Number of distinct people the detector reported this frame. */
  personCount: number;
  /** Wall-clock ms when sampled (monotonic ok). */
  timestampMs: number;
}

// ── Raw frame signals ───────────────────────────────────────

/**
 * Everything an engine needs about the current preview frame. Produced
 * by the live runtime (or by tests) and consumed by the pure engines.
 * Keeping this a plain data bag is what makes the engines testable.
 */
export interface FrameSignalInput {
  /** Preview pixel dimensions. */
  frameWidth: number;
  frameHeight: number;
  /** The most recent pose, or null when nobody/nothing was detected. */
  pose: PoseSample | null;
  /**
   * Mean luma 0–1 of the frame (brightness proxy). Undefined when the
   * runtime could not sample pixels (e.g. pose-only fallback path).
   */
  luma?: number;
  /**
   * Background/foreground contrast 0–1 (stddev proxy). Undefined when
   * unavailable.
   */
  contrast?: number;
  /**
   * Camera motion proxy 0–1 (0 = rock steady, 1 = very shaky), derived
   * from frame-to-frame landmark jitter or devicemotion. Undefined when
   * not yet measurable.
   */
  motion?: number;
  /** Reported device orientation of the preview surface. */
  orientation: CameraOrientation;
}

// ── Frame quality (FrameQualityEngine output) ───────────────

export type VisibilityState = 'visible' | 'partial' | 'cut_off' | 'unknown';
export type DistanceState = 'too_close' | 'good' | 'too_far' | 'unknown';
export type CenteringState = 'left' | 'centered' | 'right' | 'unknown';

export interface FrameQualitySignals {
  /** True when a usable single-person pose was found this frame. */
  personDetected: boolean;
  /** >1 when extra people may be confusing detection. */
  personCount: number;
  /** Athlete bounding box in normalized 0–1 coords (null when no person). */
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  headVisible: VisibilityState;
  feetVisible: VisibilityState;
  fullBodyVisible: boolean;
  /** Horizontal centering of the body centerline. */
  centering: CenteringState;
  /** Normalized horizontal centerline 0–1 (null when no person). */
  centerlineX: number | null;
  /** Distance proxy from body height as a fraction of frame height. */
  distance: DistanceState;
  bodyHeightFraction: number | null;
  /** Lighting verdict. */
  lighting: 'good' | 'low' | 'unknown';
  /** Background contrast verdict. */
  background: 'clear' | 'busy' | 'unknown';
  /** Camera stability verdict. */
  stability: 'steady' | 'shaky' | 'unknown';
  /** Risk that the sport implement leaves the frame. */
  implementRisk: 'low' | 'medium' | 'high' | 'unknown';
  /** Whether the current orientation matches the preset recommendation. */
  orientationMatch: boolean;
}

// ── Readiness score (ReadinessScoreEngine output) ───────────

export type ReadinessState = 'not_usable' | 'needs_adjustment' | 'usable' | 'excellent';

/** One weighted contributor to the Frame Readiness Score. */
export interface ReadinessComponent {
  key: string;
  label: string;
  /** Points earned. */
  earned: number;
  /** Max points this component can contribute. */
  max: number;
}

export interface ReadinessScore {
  /** 0–100. */
  score: number;
  state: ReadinessState;
  components: ReadinessComponent[];
  /** Honest label for the whole estimate. */
  confidence: KineticConfidenceLevel;
}

// ── Voice guidance (VoiceGuidanceEngine) ────────────────────

export type VoiceMode = 'coach' | 'simple' | 'silent';

/** Priority categories — lower number = more urgent. */
export type GuidancePriority = number;

export interface VoiceGuidanceMessage {
  /** Stable id used for throttling + analytics + i18n key. */
  id: string;
  /** i18n key (for future translation). */
  i18nKey: string;
  /** Spoken / captioned text (English default). */
  text: string;
  /** Lower = higher priority. */
  priority: GuidancePriority;
  /** Optional haptic pattern (ms on/off) when supported. */
  haptic?: number[];
  /** Category for analytics/grouping. */
  category:
    | 'no_person'
    | 'multiple_people'
    | 'distance'
    | 'centering'
    | 'framing'
    | 'orientation'
    | 'lighting'
    | 'stability'
    | 'implement'
    | 'ready'
    | 'countdown';
}

// ── Sport presets (SportPresetEngine) ───────────────────────

export interface SportActionPreset {
  sport: RecordAssistSport;
  action: SportActionId;
  label: string;
  hint: string;
  recommendedOrientation: CameraOrientation;
  recommendedView: CameraView;
  /** Short, human setup steps shown on the instruction card. */
  setupSteps: string[];
  /** Landmarks that MUST be visible for this action (BlazePose indices). */
  requiredLandmarks: number[];
  /** Extra headroom (fraction of frame) needed above the head. */
  headroomFraction: number;
  /** Implement-visibility risk baseline for this action. */
  implementRiskBaseline: 'low' | 'medium' | 'high';
  /** Per-component score weight overrides (sums normalized by engine). */
  weightOverrides?: Partial<Record<ReadinessComponentKey, number>>;
  /** A short "why this matters" explainer. */
  why: string;
}

export type ReadinessComponentKey =
  | 'full_body'
  | 'implement'
  | 'centering'
  | 'distance'
  | 'lighting'
  | 'stability'
  | 'background'
  | 'angle';

// ── Retake (RetakeEngine) ───────────────────────────────────

export interface RetakeReason {
  id: string;
  /** Plain-English reason. */
  reason: string;
  /** Actionable fix. */
  fix: string;
  severity: 'blocking' | 'warning';
}

export interface RetakeRecommendation {
  /** True when we recommend re-recording. */
  recommended: boolean;
  reasons: RetakeReason[];
  /** Overall confidence the clip is analysis-ready. */
  confidence: KineticConfidenceLevel;
}

// ── Motion insights (Phase 3 — advanced biomechanics proxies) ─

/**
 * The biomechanics proxies surfaced in the review step. These are distilled
 * from the platform's Motion Lab engine (see lib/record-assist/biomechanics.ts)
 * so RecordAssist reuses the canonical math instead of reinventing it. Every
 * value carries an honest confidence label — single-camera reads are PROXIES,
 * never lab-grade motion capture.
 */
export type MotionInsightKey =
  | 'tempo'
  | 'separation'
  | 'sway'
  | 'balance'
  | 'sequencing';

export interface MotionInsightMetric {
  key: MotionInsightKey;
  label: string;
  /** Pre-formatted value for display (e.g. "3.0 : 1", "42°", "18% frame"). */
  display: string;
  /** Raw numeric (for trends / comparison), or null when not derivable. */
  value: number | null;
  unit: string;
  confidence: KineticConfidenceLevel;
  /** One-line plain-English read of what the number means. */
  read: string;
}

export interface MotionInsights {
  /** Frames a usable pose was actually tracked in. */
  trackedFrames: number;
  /** Frames we attempted to track (>= trackedFrames). */
  attemptedFrames: number;
  /** Overall honesty label across the whole read. */
  confidence: KineticConfidenceLevel;
  metrics: MotionInsightMetric[];
}

// ── Device compatibility (CompatibilityEngine) ──────────────

/** Injected capability snapshot so the engine stays pure/testable. */
export interface CompatibilityProbe {
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  hasMediaRecorder: boolean;
  hasSpeechSynthesis: boolean;
  hasVibration: boolean;
  hasWebGL: boolean;
  isSecureContext: boolean;
  userAgent: string;
}

export type CompatibilityTier = 'full' | 'degraded' | 'unsupported';

export interface DeviceCompatibilityResult {
  tier: CompatibilityTier;
  /** Can we run live pose detection (the premium path)? */
  poseSupported: boolean;
  /** Can we record at all? */
  recordingSupported: boolean;
  /** Can we speak guidance? */
  voiceSupported: boolean;
  /** Can we buzz? */
  hapticsSupported: boolean;
  /** Human-readable reasons for any downgrade. */
  notes: string[];
}

// ── Recording session ───────────────────────────────────────

export type RecordingPhase =
  | 'idle'
  | 'permission'
  | 'setup'
  | 'countdown'
  | 'recording'
  | 'review';

export interface RecordingSession {
  sport: RecordAssistSport;
  action: SportActionId;
  view: CameraView;
  handedness: Handedness;
  orientation: CameraOrientation;
  startedAt: number | null;
  durationMs: number | null;
  /** Readiness at the moment recording began. */
  readinessAtStart: number | null;
}

// ── Analytics ───────────────────────────────────────────────

export type RecordAssistAnalyticsEvent =
  | 'record_assist_started'
  | 'camera_permission_granted'
  | 'camera_permission_denied'
  | 'athlete_detected'
  | 'athlete_not_detected'
  | 'voice_guidance_played'
  | 'readiness_score_changed'
  | 'readiness_score_passed'
  | 'recording_started'
  | 'recording_completed'
  | 'auto_trim_applied'
  | 'retake_recommended'
  | 'retake_accepted'
  | 'retake_skipped'
  | 'analysis_started_after_guided_recording'
  | 'analysis_failed_due_to_video_quality'
  | 'sport_preset_selected'
  | 'angle_preset_selected'
  | 'mute_voice_enabled'
  | 'accessibility_caption_enabled'
  | 'unsupported_browser_detected'
  | 'device_compatibility_warning_shown'
  | 'saved_angle_preset_created'
  | 'retest_same_angle_started'
  // Phase 3 — advanced biomechanics review surfaces.
  | 'motion_insights_computed'
  | 'frame_step_used'
  | 'clip_comparison_viewed'
  | 'camera_shake_proxy_enabled';
