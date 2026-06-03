// ============================================================
// SwingIQ — Motion Lab: Analysis Pipeline (orchestrator)
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
import { assessQuality } from './quality';
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
          sx += lm.x; sy += lm.y; sz += lm.z; sv = Math.max(sv, lm.v); count++;
        }
      }
      return count > 0
        ? { x: sx / count, y: sy / count, z: sz / count, v: sv }
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

  // 4) Segment phases from the real motion.
  onProgress?.('segmenting');
  const series = computeSeries(track, capture);
  const phases = detectPhases(track, capture, series);

  // 5) Metrics.
  onProgress?.('metrics');
  const metrics = computeMetrics(track, capture, series, phases);

  // 6) Scores + report + drills + quality.
  onProgress?.('report');
  const scoreboard = computeScoreboard(metrics);
  const drills = prescribeDrills(metrics, capture);
  const report = buildReport(capture, metrics, phases, scoreboard, drills);
  const quality = assessQuality(
    track,
    {
      resolution: extraction.resolution,
      durationSeconds: extraction.durationSeconds,
      attemptedFrames: extraction.frames.length,
      swingWindowDetected: extraction.swingWindowDetected,
      estimatedFps: options.estimatedFps ?? null,
    },
    capture,
  );

  onProgress?.('rendering');

  const sport = getSport(capture.sport);
  const motion = getMotion(capture.sport, capture.motionType);
  const now = new Date().toISOString();
  const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const processingMs = Math.round(endedAt - startedAt);

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
    status: 'complete',
    analysisVersion: ANALYSIS_VERSION,
    modelVersion: modelVersionFor(modelQuality),
    processingMs,
  };
}
