// ============================================================
// SwingVantage — RecordAssist: Biomechanics bridge (Phase 3)
// ------------------------------------------------------------
// Phase 3 surfaces advanced biomechanics — tempo, hip-shoulder
// separation (X-factor), sway, finish balance, and kinematic
// sequencing — in the review step. Rather than re-implement that
// math, this bridge feeds the pose time-series captured during a
// guided recording straight into the platform's CANONICAL Motion
// Lab engine (`analyzePoseTrack`) and distills a small, honestly
// confidence-labelled summary for the RecordAssist UI.
//
// This is a BRIDGE (like sports.ts), so — unlike the pure
// `engines/*` — it is allowed to import Motion Lab + the core
// SportId. The pure engines stay dependency-free and untouched.
//
// HONESTY: single-camera reads are PROXIES. Motion Lab already
// drops to a 2D estimate and lowers confidence when depth is weak;
// we additionally cap RecordAssist's label at `medium` because the
// live VIDEO-mode capture is never multi-view "measured".
// ============================================================

import {
  analyzePoseTrack,
  type MotionPoseTrack,
  type MotionPoseFrame,
  type CaptureContext,
  type CameraView as MotionCameraView,
  type MotionSession,
  type MotionMetric,
} from '@/lib/motion-lab';
import { toPlatformSport } from './sports';
import type {
  CameraView,
  Handedness,
  KineticConfidenceLevel,
  MotionInsightKey,
  MotionInsightMetric,
  MotionInsights,
  PoseLandmark,
  SportActionPreset,
} from './types';

/** One captured frame of the recording: time + the 33 pose landmarks. */
export interface CapturedPoseFrame {
  /** Milliseconds from the start of recording. */
  tMs: number;
  landmarks: PoseLandmark[];
}

/** What the review surfaces consume: the raw session + the distilled card. */
export interface RecordAssistAnalysis {
  /** Full Motion Lab session (drives the stepper phases + comparison). */
  session: MotionSession;
  /** Distilled, confidence-labelled summary for the insights card. */
  insights: MotionInsights;
}

/** Minimum tracked frames before we'll claim any biomechanics read. */
const MIN_TRACKED_FRAMES = 8;

// RecordAssist action ids mostly match Motion Lab motion ids; these are the
// few that differ. Anything not listed falls through to the action id, and
// Motion Lab's getMotion() safely falls back to the sport's primary motion.
const MOTION_TYPE_OVERRIDES: Record<string, string> = {
  'golf:chipping': 'pitch_chip',
  'golf:putting': 'putt',
  // Baseball/softball cage variants all read as the batting swing.
  'baseball:tee_work': 'hitting',
  'baseball:front_toss': 'hitting',
  'baseball:cage': 'hitting',
  'softball:tee_work': 'hitting',
  'softball:front_toss': 'hitting',
  'softball:cage': 'hitting',
};

/** Map a RecordAssist camera view onto Motion Lab's narrower view vocabulary. */
function toMotionView(view: CameraView): MotionCameraView {
  switch (view) {
    case 'face_on':
    case 'down_the_line':
    case 'side':
    case 'rear':
      return view;
    // RecordAssist's 'front'/'baseline' read like a face-on capture; unknown
    // stays unknown so Motion Lab doesn't over-claim a viewpoint.
    case 'front':
    case 'baseline':
      return 'face_on';
    default:
      return 'unknown';
  }
}

/** Build the Motion Lab capture context from a RecordAssist preset. */
export function toCaptureContext(
  preset: SportActionPreset,
  handedness: Handedness = 'unknown',
): CaptureContext {
  const key = `${preset.sport}:${preset.action}`;
  const motionType = MOTION_TYPE_OVERRIDES[key] ?? preset.action;
  return {
    sport: toPlatformSport(preset.sport),
    motionType,
    view: toMotionView(preset.recommendedView),
    handedness,
  };
}

/**
 * Convert the captured RecordAssist pose frames into a Motion Lab pose track.
 * RecordAssist's PoseLandmark (`{x,y,z,visibility}`) maps 1:1 onto Motion
 * Lab's MotionLandmark (`{x,y,z,v}`). basis is always 'estimated' — a single
 * live camera is never lab-measured.
 */
export function toMotionPoseTrack(frames: CapturedPoseFrame[], fps = 8): MotionPoseTrack {
  const poseFrames: MotionPoseFrame[] = frames.map((f) => ({
    tMs: f.tMs,
    landmarks: f.landmarks.map((l) => ({ x: l.x, y: l.y, z: l.z, v: l.visibility })),
  }));
  let visSum = 0;
  let visN = 0;
  for (const f of frames) {
    for (const l of f.landmarks) {
      visSum += l.visibility;
      visN += 1;
    }
  }
  const trackingConfidence = visN > 0 ? +(visSum / visN).toFixed(3) : 0;
  return {
    schema: 'mediapipe_pose_33',
    fps,
    frames: poseFrames,
    attemptedFrames: poseFrames.length,
    trackingConfidence,
    basis: 'estimated',
  };
}

const LEVEL_ORDER: KineticConfidenceLevel[] = ['insufficient', 'low', 'medium', 'high'];

/**
 * Map a Motion Lab metric's numeric confidence + basis onto RecordAssist's
 * honest label. Capped at `medium` for single-view captures (never 'measured').
 */
function levelFromMetric(m: MotionMetric | undefined): KineticConfidenceLevel {
  if (!m || m.value == null || m.basis === 'placeholder') return 'insufficient';
  const c = m.confidence;
  let level: KineticConfidenceLevel;
  if (c >= 0.6) level = 'medium';
  else if (c >= 0.35) level = 'low';
  else level = 'insufficient';
  // Single live camera is a proxy — never upgrade to 'high'.
  return level;
}

interface InsightSpec {
  key: MotionInsightKey;
  metricId: string;
  label: string;
  format: (value: number) => string;
  read: (value: number) => string;
}

const INSIGHT_SPECS: InsightSpec[] = [
  {
    key: 'tempo',
    metricId: 'tempo_ratio',
    label: 'Tempo',
    format: (v) => `${v.toFixed(1)} : 1`,
    read: (v) =>
      v >= 2.6 && v <= 3.4
        ? 'Backswing-to-through ratio is in the classic ~3:1 range.'
        : v < 2.6
          ? 'Quicker through-swing relative to the backswing.'
          : 'Longer backswing relative to the through-swing.',
  },
  {
    key: 'separation',
    metricId: 'hip_shoulder_sep',
    label: 'Hip–Shoulder Separation',
    format: (v) => `${Math.round(v)}°`,
    read: (v) =>
      v >= 35
        ? 'Strong X-factor — hips and shoulders separate well through transition.'
        : 'Modest separation between the hip and shoulder lines.',
  },
  {
    key: 'sway',
    metricId: 'pelvis_sway',
    label: 'Pelvis Sway',
    format: (v) => `${Math.round(v)}% frame`,
    read: (v) =>
      v <= 12
        ? 'Pelvis stays centered — rotating more than sliding.'
        : 'Noticeable lateral pelvis slide during the motion.',
  },
  {
    key: 'balance',
    metricId: 'balance_finish',
    label: 'Finish Balance',
    format: (v) => `${Math.round(v)}% drift`,
    read: (v) =>
      v <= 10
        ? 'Head stays quiet into the finish — well balanced.'
        : 'Head drifts at the finish — balance could be steadier.',
  },
  {
    key: 'sequencing',
    metricId: 'sequencing',
    label: 'Kinematic Sequence',
    format: (v) => `${Math.round(v)}/100`,
    read: (v) =>
      v >= 80
        ? 'Hips → torso → hands fire in the right order.'
        : v >= 50
          ? 'Sequence is partly in order.'
          : 'Segments fire out of the textbook order.',
  },
];

/** Combine per-metric levels into one honest overall label, gated by frames. */
function overallLevel(
  metrics: MotionInsightMetric[],
  trackedFrames: number,
): KineticConfidenceLevel {
  if (trackedFrames < MIN_TRACKED_FRAMES) return 'insufficient';
  const present = metrics
    .map((m) => LEVEL_ORDER.indexOf(m.confidence))
    .filter((i) => i > 0);
  if (present.length === 0) return 'insufficient';
  // Median of the present levels — robust to a single noisy metric.
  present.sort((a, b) => a - b);
  const median = present[Math.floor((present.length - 1) / 2)];
  return LEVEL_ORDER[median];
}

/**
 * Distill a Motion Lab session's metrics into the RecordAssist summary.
 * Exposed for the admin QA simulator (run the real engine on a synthetic
 * session without a camera).
 */
export function distillInsights(session: MotionSession): MotionInsights {
  const byId = new Map(session.metrics.map((m) => [m.id, m] as const));
  const metrics: MotionInsightMetric[] = INSIGHT_SPECS.map((spec) => {
    const m = byId.get(spec.metricId);
    const confidence = levelFromMetric(m);
    const value = m?.value ?? null;
    return {
      key: spec.key,
      label: spec.label,
      value,
      unit: m?.unit ?? '',
      confidence,
      display: value != null ? spec.format(value) : '—',
      read: value != null ? spec.read(value) : 'Not enough tracking to read this.',
    };
  });
  const track = session.poseTrack;
  const trackedFrames = track?.frames.length ?? 0;
  return {
    trackedFrames,
    attemptedFrames: track?.attemptedFrames ?? trackedFrames,
    confidence: overallLevel(metrics, trackedFrames),
    metrics,
  };
}

/**
 * Analyze a guided recording's pose track: run the canonical Motion Lab
 * pipeline and distill the review summary. Returns null (honest "couldn't
 * measure") when too few frames were tracked to say anything.
 */
export function analyzeRecording(
  frames: CapturedPoseFrame[],
  preset: SportActionPreset,
  opts: { fps?: number; handedness?: Handedness } = {},
): RecordAssistAnalysis | null {
  const tracked = frames.filter((f) => f.landmarks.length > 0);
  if (tracked.length < MIN_TRACKED_FRAMES) return null;
  const track = toMotionPoseTrack(tracked, opts.fps ?? 8);
  const capture = toCaptureContext(preset, opts.handedness ?? 'unknown');
  const session = analyzePoseTrack(track, capture);
  return { session, insights: distillInsights(session) };
}
