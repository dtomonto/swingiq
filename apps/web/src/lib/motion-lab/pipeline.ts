// ============================================================
// SwingVantage — Motion Lab: Analysis Pipeline (orchestrator)
// ------------------------------------------------------------
// The end-to-end browser pipeline that turns a video into a full
// MotionSession. It REUSES the app's real infrastructure:
//   • extractSwingFrames  — smart, motion-aware frame extraction
//   • detectPoses         — on-device MediaPipe pose (real x/y/z)
// then layers the Motion Lab engine on top (smoothing → phases →
// metrics → scoring → report → drills → quality).
//
// Runs entirely client-side. Never throws for "no pose found" — it
// degrades to an honest low-confidence result instead.
// ============================================================

import { extractSwingFrames } from '@/lib/frame-extraction';
import { detectPoses, type PoseDetectInput, type PoseModelQuality } from '@/lib/pose';
import { liftAvailable, enrichFrameWithLift, rigPreset, syncViews, selfCalibrate, type RigPreset } from '@/lib/pose3d';
import type { ViewLandmarks } from './multiview';
import type {
  MotionSession,
  CaptureContext,
  MotionPoseTrack,
  MotionPoseFrame,
} from './types';
import { getSport, getMotion } from './taxonomy';
import { computeSeries, computeMetrics } from './biomechanics';
import { detectPhases } from './phases';
import { computeScoreboard } from './scoring';
import { buildReport, keyFaultLine } from './reporting';
import { prescribeDrills } from './drills';
import { assessQuality, type QualitySourceInput } from './quality';
import { buildMultiViewTrack } from './multiview';
import { estimateImplementPath } from './object-tracking';
import { computeKineticChain } from './kinetic-chain';
import { computeTemporal } from './temporal';
import { newSessionId } from './persistence';

export const ANALYSIS_VERSION = 'motionlab-1.0.0';
export const MODEL_VERSION = 'mediapipe-pose-lite-0.10.35';

export type { PoseModelQuality };
const modelVersionFor = (q: PoseModelQuality) => `mediapipe-pose-${q}-0.10.35`;

export type MotionStage =
  | 'extracting'
  | 'detecting'
  | 'reconstructing'
  | 'segmenting'
  | 'metrics'
  | 'report'
  | 'rendering';

export interface PipelineOptions {
  estimatedFps?: number | null;
  frameCount?: number;
  /** Optional manual trim window (seconds) to focus analysis on the rep. */
  trimStartSeconds?: number | null;
  trimEndSeconds?: number | null;
  /** Pose model tier: 'lite' (fast) | 'full' (balanced) | 'heavy' (accurate). */
  modelQuality?: PoseModelQuality;
  /** Refine single-view depth with the trained 3D lift model (basis stays estimated). */
  proDepth?: boolean;
  onProgress?: (stage: MotionStage) => void;
}

/** Light moving-average smoothing on landmark positions to reduce jitter. */
function smoothTrack(track: MotionPoseTrack, window = 2): MotionPoseTrack {
  const frames = track.frames;
  if (frames.length < 3) return track;
  const n = frames[0].landmarks.length;
  const smoothed: MotionPoseFrame[] = frames.map((f, i) => {
    const lo = Math.max(0, i - window);
    const hi = Math.min(frames.length - 1, i + window);
    const landmarks = new Array(n).fill(null).map((_, j) => {
      let sx = 0, sy = 0, sz = 0, sv = 0, count = 0;
      for (let k = lo; k <= hi; k++) {
        const lm = frames[k].landmarks[j];
        if (lm) {
          sx += lm.x; sy += lm.y; sz += lm.z; sv += lm.v; count++;
        }
      }
      // The smoothed POSITION is the window average, so its confidence is the
      // average visibility of the contributing frames — not the single best one
      // (max would over-state how reliable an averaged point really is).
      return count > 0
        ? { x: sx / count, y: sy / count, z: sz / count, v: sv / count }
        : f.landmarks[j];
    });
    return { tMs: f.tMs, landmarks };
  });
  return { ...track, frames: smoothed };
}

/** Run the full analysis. Returns a complete (unsaved) MotionSession. */
export async function runMotionAnalysis(
  source: File | Blob | string,
  capture: CaptureContext,
  options: PipelineOptions = {},
): Promise<MotionSession> {
  const { onProgress } = options;
  const modelQuality: PoseModelQuality = options.modelQuality ?? 'lite';
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  // 1) Extract motion-aware still frames in the browser.
  onProgress?.('extracting');
  const extraction = await extractSwingFrames(source, {
    count: options.frameCount ?? 24,
    trimStartSeconds: options.trimStartSeconds ?? undefined,
    trimEndSeconds: options.trimEndSeconds ?? undefined,
  });

  // 2) On-device pose detection (real MediaPipe x/y/z). Best-effort.
  onProgress?.('detecting');
  const detectInput: PoseDetectInput[] = extraction.frames.map((f) => ({
    dataUrl: f.dataUrl,
    timestampSeconds: f.timestampSeconds,
  }));
  const detected = await detectPoses(detectInput, modelQuality);

  let visSum = 0;
  let visCount = 0;
  const frames: MotionPoseFrame[] = detected.map((d) => {
    for (const lm of d.landmarks) {
      visSum += lm.visibility;
      visCount++;
    }
    return {
      tMs: Math.round(d.timestampSeconds * 1000),
      landmarks: d.landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z, v: p.visibility })),
    };
  });

  let track: MotionPoseTrack = {
    schema: 'mediapipe_pose_33',
    fps: 30,
    frames,
    attemptedFrames: extraction.frames.length,
    trackingConfidence: visCount > 0 ? +(visSum / visCount).toFixed(3) : 0,
    basis: frames.length > 0 ? 'estimated' : 'placeholder',
  };

  // 3) Reconstruct / stabilise the 3D estimate (temporal smoothing).
  onProgress?.('reconstructing');
  track = smoothTrack(track);

  // 3b) Optional: refine per-joint depth with the trained single-view lift
  //     model. x/y stay MediaPipe estimates; only z is upgraded to a learned
  //     structural prior — so the track remains an honest 'estimated' result.
  let depthModel = modelVersionFor(modelQuality);
  if (options.proDepth && liftAvailable() && track.frames.length > 0) {
    track = {
      ...track,
      frames: track.frames.map((f) => ({ tMs: f.tMs, landmarks: enrichFrameWithLift(f.landmarks).landmarks })),
    };
    depthModel += '+lift3d';
  }

  return assembleSession(track, capture, {
    resolution: extraction.resolution,
    durationSeconds: extraction.durationSeconds,
    attemptedFrames: extraction.frames.length,
    swingWindowDetected: extraction.swingWindowDetected,
    estimatedFps: options.estimatedFps ?? null,
  }, depthModel, startedAt, onProgress);
}

export type { RigPreset };

export interface MultiViewOptions {
  rig?: RigPreset;
  rigDistance?: number;
  /** Self-calibrate from the data instead of using the rig preset (default true). */
  selfCalibrate?: boolean;
  modelQuality?: PoseModelQuality;
  frameCount?: number;
  trimStartSeconds?: number | null;
  trimEndSeconds?: number | null;
  estimatedFps?: number | null;
  onProgress?: (stage: MotionStage) => void;
}

/** Extract uniformly-spaced frames from a clip and detect poses (one view). */
async function extractAndDetect(
  source: File | Blob | string,
  count: number,
  quality: PoseModelQuality,
  trim: { start?: number | null; end?: number | null },
) {
  const extraction = await extractSwingFrames(source, {
    count,
    smart: false, // uniform sampling preserves cross-view temporal correspondence
    trimStartSeconds: trim.start ?? undefined,
    trimEndSeconds: trim.end ?? undefined,
  });
  const detected = await detectPoses(
    extraction.frames.map((f) => ({ dataUrl: f.dataUrl, timestampSeconds: f.timestampSeconds })),
    quality,
  );
  const view: ViewLandmarks[] = detected.map((d) => ({
    tMs: Math.round(d.timestampSeconds * 1000),
    landmarks: d.landmarks.map((p) => ({ x: p.x, y: p.y, visibility: p.visibility })),
  }));
  return { extraction, view };
}

/**
 * MULTI-VIEW analysis: two synchronized angles → TRUE triangulated 3D
 * (basis 'measured'). Calibration uses a rig preset (approximate extrinsics);
 * reprojection error drives the confidence so a bad capture reads low, not fake.
 */
export async function runMultiViewMotionAnalysis(
  sourceA: File | Blob | string,
  sourceB: File | Blob | string,
  capture: CaptureContext,
  options: MultiViewOptions = {},
): Promise<MotionSession> {
  const { onProgress } = options;
  const quality: PoseModelQuality = options.modelQuality ?? 'full';
  const count = options.frameCount ?? 24;
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const trim = { start: options.trimStartSeconds, end: options.trimEndSeconds };

  onProgress?.('extracting');
  const A = await extractAndDetect(sourceA, count, quality, trim);
  const B = await extractAndDetect(sourceB, count, quality, trim);

  onProgress?.('detecting');
  // Estimate the global time offset between the two clips and align them.
  const synced = syncViews(A.view, B.view);

  // Calibrate from the data when possible; fall back to the rig preset.
  let cameras = rigPreset(options.rig ?? 'face_dtl_90', options.rigDistance ?? 3);
  let calibMethod = 'preset';
  if (options.selfCalibrate !== false) {
    const calib = selfCalibrate(synced.a, synced.b);
    if (calib) {
      cameras = calib.cameras;
      calibMethod = `selfcal-in${Math.round(calib.inlierRatio * 100)}`;
    }
  }

  onProgress?.('reconstructing');
  const track = buildMultiViewTrack(synced.a, synced.b, cameras);

  return assembleSession(
    track,
    capture,
    {
      resolution: A.extraction.resolution,
      durationSeconds: A.extraction.durationSeconds,
      attemptedFrames: A.extraction.frames.length,
      swingWindowDetected: A.extraction.swingWindowDetected,
      estimatedFps: options.estimatedFps ?? null,
    },
    `mediapipe-pose-${quality}-multiview-dlt-${calibMethod}-lag${synced.lag}`,
    startedAt,
    onProgress,
  );
}

/**
 * Shared downstream: segment phases → metrics → scores → report → drills →
 * quality → MotionSession. Works for any track (single-view estimate OR
 * multi-view measured), so the two capture paths stay DRY.
 */
function assembleSession(
  track: MotionPoseTrack,
  capture: CaptureContext,
  qualitySource: QualitySourceInput,
  modelVersion: string,
  startedAt: number,
  onProgress?: (stage: MotionStage) => void,
): MotionSession {
  onProgress?.('segmenting');
  const series = computeSeries(track, capture);
  const phases = detectPhases(track, capture, series);

  onProgress?.('metrics');
  const metrics = computeMetrics(track, capture, series, phases);

  onProgress?.('report');
  const scoreboard = computeScoreboard(metrics);
  const drills = prescribeDrills(metrics, capture);
  const report = buildReport(capture, metrics, phases, scoreboard, drills);
  const quality = assessQuality(track, qualitySource, capture);
  // Estimated implement (club/bat/racket) path + contact zone. Never throws.
  const objectTracking = estimateImplementPath({ track, capture, series, phases });
  // Kinetic chain sequencing (lower body → torso → arms → implement). Never throws.
  const kineticChain = computeKineticChain(track, capture, series, objectTracking);
  // Temporal intelligence (durations, contact-window stability, tempo). Never throws.
  const temporal = computeTemporal(track, capture, series, phases);

  onProgress?.('rendering');

  const sport = getSport(capture.sport);
  const motion = getMotion(capture.sport, capture.motionType);
  const now = new Date().toISOString();
  const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    version: 1,
    id: newSessionId(),
    createdAt: now,
    updatedAt: now,
    capture,
    sportLabel: sport.name,
    motionLabel: motion.label,
    emoji: sport.emoji,
    poseTrack: track,
    quality,
    phases,
    metrics,
    scoreboard,
    report,
    drills,
    keyFault: keyFaultLine(metrics),
    objectTracking,
    kineticChain,
    temporal,
    status: 'complete',
    analysisVersion: ANALYSIS_VERSION,
    modelVersion,
    processingMs: Math.round(endedAt - startedAt),
  };
}
