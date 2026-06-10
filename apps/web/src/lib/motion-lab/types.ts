// ============================================================
// SwingVantage — Motion Lab: Domain Types
// ------------------------------------------------------------
// The Motion Lab is a browser-side 3D motion-analysis pipeline that
// builds ON TOP of the app's real infrastructure:
//   • frame extraction  (@/lib/frame-extraction)
//   • on-device pose     (@/lib/pose — MediaPipe, real x/y/z)
//   • sport registry     (@swingiq/core — phases, drills, benchmarks)
//
// HONESTY FIRST: single-camera 2D+depth pose is an ESTIMATE, never a
// lab measurement. Every metric, phase, and score carries a `basis`
// and a `confidence`, and the UI is required to surface them. Nothing
// here claims medical, injury, or tour-grade validation.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { MotionSkillLevel } from './reference-ranges';

/** How trustworthy a value is. Mirrors the motion-engine basis ladder. */
export type MotionBasis = 'measured' | 'estimated' | 'ai_inferred' | 'user_entered' | 'placeholder';

export type { SportId, MotionSkillLevel };

/** The motion a user is analysing (sport-specific). */
export type MotionTypeId = string;

export type CameraView = 'face_on' | 'down_the_line' | 'side' | 'rear' | 'unknown';
export type Handedness = 'right' | 'left' | 'unknown';

// ── Capture context ───────────────────────────────────────────

export interface CaptureContext {
  sport: SportId;
  motionType: MotionTypeId;
  view: CameraView;
  handedness: Handedness;
  /** Skill level — drives which reference range a metric is scored against. */
  skillLevel?: MotionSkillLevel;
  /** Optional self-reported height in cm (improves stride/scale proxies). */
  heightCm?: number | null;
  /** Optional implement label (club/bat/racket type). */
  implement?: string | null;
}

// ── Pose track (compact, replayable) ──────────────────────────

/** One landmark: normalized image x/y (0–1), model depth z, visibility 0–1. */
export interface MotionLandmark {
  x: number;
  y: number;
  z: number;
  v: number;
}

/** A single tracked frame in the motion. */
export interface MotionPoseFrame {
  /** Milliseconds from clip start. */
  tMs: number;
  landmarks: MotionLandmark[];
}

/** The full pose track for a motion (MediaPipe 33-point schema). */
export interface MotionPoseTrack {
  schema: 'mediapipe_pose_33';
  fps: number;
  /** Frames where a usable pose was actually found. */
  frames: MotionPoseFrame[];
  /** Frames we attempted to analyse (>= frames.length). */
  attemptedFrames: number;
  /** Mean landmark visibility across the track (0–1). */
  trackingConfidence: number;
  basis: MotionBasis;
}

// ── Camera-quality gate ───────────────────────────────────────

export type QualityVerdict = 'good' | 'fair' | 'poor';

export interface QualityCheckItem {
  id: string;
  label: string;
  status: QualityVerdict;
  detail: string;
}

export interface CameraQualityReport {
  /** 0–100 — overall capture quality. */
  score: number;
  verdict: QualityVerdict;
  /** Whether analysis can proceed usefully (poor still allowed, just flagged). */
  analyzable: boolean;
  subjectVisiblePct: number;
  fullBodyVisible: boolean;
  estimatedFps: number | null;
  resolution: string;
  estimatedView: CameraView;
  items: QualityCheckItem[];
  recommendations: string[];
}

// ── Phases ────────────────────────────────────────────────────

export interface MotionPhaseSegment {
  key: string;
  label: string;
  shortLabel: string;
  startFrame: number;
  endFrame: number;
  startMs: number;
  endMs: number;
  /** Index of the representative key frame for this phase. */
  keyFrame: number;
  confidence: number;
  basis: MotionBasis;
  /** Plain-language note about what this phase shows for this athlete. */
  interpretation: string;
}

// ── Metrics ───────────────────────────────────────────────────

export interface MotionMetric {
  id: string;
  name: string;
  /** null when not derivable from the available pose data. */
  value: number | null;
  unit: string;
  /** 0–100 normalized quality score for this metric (null when no value). */
  normalizedScore: number | null;
  confidence: number;
  basis: MotionBasis;
  /** Which phase this is most associated with (or 'overall'). */
  phase: string;
  /** What the number means, in plain language. */
  explanation: string;
  /** Why a player should care. */
  whyItMatters: string;
  /** The single best fix when this metric is weak. */
  recommendedFix: string;
  /** Drill id (resolved against the drill engine), if any. */
  drillId: string | null;
  /** Honest caveat about the proxy. */
  limitations: string;
  /** Skill-level target range for this metric, if defined (e.g. "70–110° (intermediate)"). */
  target?: string | null;
  /** Per-frame series for charts / the 3D viewer (optional, compact). */
  series?: number[];
}

// ── Scores ────────────────────────────────────────────────────

export interface MotionScoreComponent {
  id: string;
  label: string;
  score: number; // 0–100
  weight: number;
  /** One-line read on what drove this score. */
  note: string;
}

export interface MotionScoreboard {
  overall: number;
  components: MotionScoreComponent[];
  confidence: number;
  basis: MotionBasis;
  disclaimer: string | null;
}

// ── Coaching report ───────────────────────────────────────────

export type CoachingTone = 'beginner' | 'athlete' | 'coach' | 'youth' | 'data';

export interface CoachingFix {
  rank: number;
  title: string;
  problem: string;
  fix: string;
  metricIds: string[];
  phase: string;
  drillId: string | null;
}

export interface CoachingReport {
  executiveSummary: string;
  diagnosis: string;
  rootCause: string;
  phaseBreakdown: Array<{ phase: string; label: string; note: string; confidence: number }>;
  topFixes: CoachingFix[];
  whatNotToChange: string[];
  practicePlan: string[];
  /** Tone-specific phrasings of the headline takeaway. */
  tones: Record<CoachingTone, string>;
  limitations: string[];
  confidence: number;
}

// ── Drill prescription ────────────────────────────────────────

export interface PrescribedDrill {
  id: string;
  name: string;
  kind: 'immediate' | 'feel' | 'technical' | 'constraint';
  sport: SportId;
  motionType: MotionTypeId;
  problemItSolves: string;
  setup: string;
  steps: string[];
  repsOrDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  commonMistake: string;
  successCue: string;
  progression: string;
  regression: string;
  equipment: string;
  estimatedMinutes: number;
  videoSearchUrl: string | null;
}

export interface DrillPlan {
  immediate: PrescribedDrill;
  feel: PrescribedDrill;
  technical: PrescribedDrill;
  constraint: PrescribedDrill;
  weeklyPlan: Array<{ day: string; focus: string; minutes: number }>;
}

// ── Session ───────────────────────────────────────────────────

export type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'failed';

/** The full, persistable analysis of one motion. */
export interface MotionSession {
  version: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  capture: CaptureContext;
  sportLabel: string;
  motionLabel: string;
  emoji: string;
  /** Compact pose track for replay + comparison (subsampled). */
  poseTrack: MotionPoseTrack;
  quality: CameraQualityReport;
  phases: MotionPhaseSegment[];
  metrics: MotionMetric[];
  scoreboard: MotionScoreboard;
  report: CoachingReport;
  drills: DrillPlan;
  /** Key fault headline for quick lists. */
  keyFault: string;
  /**
   * Estimated implement (club/bat/racket) path + contact zone. Optional so
   * older saved sessions remain valid. See lib/motion-lab/object-tracking.
   */
  objectTracking?: import('./object-tracking').ObjectTrackingResult;
  /**
   * Kinetic chain sequencing (lower body → torso → arms → implement) with
   * power-leak flags. Optional for backward-compat. See lib/motion-lab/kinetic-chain.
   */
  kineticChain?: import('./kinetic-chain').KineticChainScore;
  /**
   * Temporal intelligence: phase durations, contact-window stability, tempo,
   * deceleration. Optional for backward-compat. See lib/motion-lab/temporal.
   */
  temporal?: import('./temporal').TemporalIntelligence;
  /**
   * Continuous-movement intelligence (ready → contact → recover → next-ready)
   * for the rally sports (tennis / pickleball / padel). Undefined for discrete
   * swing sports and for older saved sessions. See lib/motion-lab/continuous-movement.
   */
  continuousMovement?: import('./continuous-movement').ContinuousMovementSummary;
  status: ProcessingStatus;
  analysisVersion: string;
  modelVersion: string;
  /** End-to-end client analysis time in ms (debug/transparency). */
  processingMs?: number;
  /** Coach notes (local only). */
  coachNotes?: string;
  /** Free-form fault tags a coach can add. */
  tags?: string[];
  /** Links this session to a roster athlete (local only). See lib/motion-lab/roster. */
  athleteId?: string | null;
}

/** A compact list-card view of a session. */
export interface MotionSessionSummary {
  id: string;
  createdAt: string;
  sport: SportId;
  sportLabel: string;
  motionLabel: string;
  emoji: string;
  overall: number;
  confidence: number;
  keyFault: string;
}

// ── Comparison ────────────────────────────────────────────────

export interface MetricDelta {
  id: string;
  name: string;
  unit: string;
  before: number | null;
  after: number | null;
  delta: number | null;
  /** True when the change is an improvement for this metric. */
  improved: boolean | null;
}

/** A cross-session change in a structured read (sequencing, timing, …). */
export interface ComparisonHighlight {
  id: string;
  label: string;
  before: string;
  after: string;
  direction: 'up' | 'down' | 'flat';
  /** True = better, false = worse, null = neutral / ambiguous. */
  improved: boolean | null;
  note: string;
}

export interface MotionComparison {
  baseId: string;
  compareId: string;
  overallDelta: number;
  metricDeltas: MetricDelta[];
  biggestImprovement: MetricDelta | null;
  biggestRegression: MetricDelta | null;
  /** Cross-session changes in the kinetic-chain + temporal reads. */
  highlights: ComparisonHighlight[];
  recommendation: string;
}
