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
import { detectPoses, type PoseModelQuality } from '@/lib/pose';
import { profileVideoQuality, type VideoQualityProfile } from './preflight';
import { routePoseDetection } from './pose-router';
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
import { computeContinuousMovement } from './continuous-movement';
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

// Landmark indices (MediaPipe 33-point) for the full-body visibility check.
const L_HIP = 23;
const R_HIP = 24;
const L_ANKLE = 27;
const R_ANKLE = 28;

/** Mean visibility of a single landmark index across the track. */
function meanVisAt(frames: MotionPoseFrame[], idx: number): number {
  let s = 0;
  let n = 0;
  for (const f of frames) {
    const lm = f.landmarks[idx];
    if (lm) {
      s += lm.v;
      n++;
    }
  }
  return n ? s / n : 0;
}

/** Whether head-to-feet appears visible (mirrors the quality gate's thresholds). */
function fullBodyVisibleFrom(frames: MotionPoseFrame[]): boolean {
  const ankleVis = (meanVisAt(frames, L_ANKLE) + meanVisAt(frames, R_ANKLE)) / 2;
  const hipVis = (meanVisAt(frames, L_HIP) + meanVisAt(frames, R_HIP)) / 2;
  return ankleVis > 0.45 && hipVis > 0.5;
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

  // 2) On-device pose detection with worst-case recovery — primary-athlete
  //    selection + a low-light enhance-and-retry that's adopted only when it
  //    recovers more real poses. Centralised in the pose ROUTER so the roadmap's
  //    cross-frame tracker and second-engine fusion plug in there, not here.
  onProgress?.('detecting');
  const routed = await routePoseDetection(extraction.frames, extraction.frameStats, modelQuality);
  const detected = routed.detected;
  const enhancementApplied = routed.enhancementApplied;
  const multiplePeople = routed.multiplePeople;
  const attempted = extraction.frames.length;

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

  // Carry the clip's real frame rate when we have it (falling back to a nominal
  // 30) so anything reading track.fps — tempo/duration labels — reflects the
  // actual capture, not a hard-coded guess. Frame-level math still keys off the
  // measured tMs timestamps.
  const nominalFps =
    options.estimatedFps && options.estimatedFps > 0 ? Math.round(options.estimatedFps) : 30;

  let track: MotionPoseTrack = {
    schema: 'mediapipe_pose_33',
    fps: nominalFps,
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
  if (enhancementApplied) depthModel += '+enhanced';

  // Build the honest video-quality profile (tier, issues, dynamic capture fixes)
  // from the signals we actually measured. Surfaced in the result and folded into
  // the capture recommendations so the user always knows what to fix next.
  const videoQuality = profileVideoQuality({
    frameStats: extraction.frameStats ?? [],
    subjectCoverage: attempted > 0 ? frames.length / attempted : 0,
    fullBodyVisible: fullBodyVisibleFrom(frames),
    trackingConfidence: track.trackingConfidence,
    multiplePeople,
    resolution: extraction.resolution,
    estimatedFps: options.estimatedFps ?? null,
    durationSeconds: extraction.durationSeconds,
    swingWindowDetected: extraction.swingWindowDetected,
    sport: capture.sport,
    view: capture.view,
  });

  return assembleSession(track, capture, {
    resolution: extraction.resolution,
    durationSeconds: extraction.durationSeconds,
    attemptedFrames: extraction.frames.length,
    swingWindowDetected: extraction.swingWindowDetected,
    estimatedFps: options.estimatedFps ?? null,
  }, depthModel, startedAt, onProgress, { videoQuality });
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
 * Analyse an ALREADY-BUILT pose track (no video extraction or pose detection).
 * The clean seam used by the sample/demo builder and by future providers that
 * supply their own landmarks — it runs the exact same downstream engine as the
 * video pipelines, so a sample is the engine's honest read of that track, never
 * hand-authored numbers.
 */
export function analyzePoseTrack(
  track: MotionPoseTrack,
  capture: CaptureContext,
  options: { qualitySource?: Partial<QualitySourceInput>; modelVersion?: string } = {},
): MotionSession {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const lastMs = track.frames.length > 0 ? track.frames[track.frames.length - 1].tMs : 0;
  const qualitySource: QualitySourceInput = {
    resolution: options.qualitySource?.resolution ?? '1080x1920',
    durationSeconds: options.qualitySource?.durationSeconds ?? +(lastMs / 1000).toFixed(2),
    attemptedFrames: options.qualitySource?.attemptedFrames ?? track.frames.length,
    swingWindowDetected: options.qualitySource?.swingWindowDetected ?? true,
    estimatedFps: options.qualitySource?.estimatedFps ?? track.fps,
  };
  return assembleSession(track, capture, qualitySource, options.modelVersion ?? 'synthetic-track-1.0.0', startedAt);
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
  extras: { videoQuality?: VideoQualityProfile } = {},
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
  // Lead the capture recommendations with the profiler's dynamic, problem-specific
  // fixes (deduped) so the most actionable retest guidance shows first.
  if (extras.videoQuality) {
    quality.recommendations = [
      ...new Set([...extras.videoQuality.recommendedFixes, ...quality.recommendations]),
    ].slice(0, 6);
  }
  // Estimated implement (club/bat/racket) path + contact zone. Never throws.
  const objectTracking = estimateImplementPath({ track, capture, series, phases });
  // Kinetic chain sequencing (lower body → torso → arms → implement). Never throws.
  const kineticChain = computeKineticChain(track, capture, series, objectTracking);
  // Temporal intelligence (durations, contact-window stability, tempo). Never throws.
  const temporal = computeTemporal(track, capture, series, phases);
  // Continuous-movement read for rally sports (null for discrete swings). Never throws.
  const continuousMovement = computeContinuousMovement(track, capture, series, phases) ?? undefined;

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
    videoQuality: extras.videoQuality,
    phases,
    metrics,
    scoreboard,
    report,
    drills,
    keyFault: keyFaultLine(metrics),
    objectTracking,
    kineticChain,
    temporal,
    continuousMovement,
    status: 'complete',
    analysisVersion: ANALYSIS_VERSION,
    modelVersion,
    processingMs: Math.round(endedAt - startedAt),
  };
}
