'use client';

import { useEffect, useRef, useState } from 'react';
import { evaluateFrameQuality } from '../engines/frame-quality-engine';
import { computeReadiness } from '../engines/readiness-score-engine';
import { LivePoseDetector, sampleFrameStats } from '../runtime/live-pose';
import { LM } from '../engines/landmarks';
import type {
  CameraOrientation,
  FrameQualitySignals,
  FrameSignalInput,
  PoseLandmark,
  PoseSample,
  ReadinessScore,
  SportActionPreset,
} from '../types';

/** One per-frame motion sample (for auto-trim + Phase 3 biomechanics). */
export interface CaptureSample {
  tMs: number;
  energy: number;
  personDetected: boolean;
  /**
   * The frame's pose landmarks when a person was detected. Phase 3 buffers
   * these during recording to feed the biomechanics bridge. Undefined when
   * no pose was found that tick.
   */
  landmarks?: PoseLandmark[];
}

export interface GuidedCaptureState {
  quality: FrameQualitySignals | null;
  readiness: ReadinessScore | null;
  /** Latest pose (for the live skeletal overlay), or null. */
  pose: PoseSample | null;
  /** True once the pose model has loaded (or false if unavailable). */
  poseReady: boolean;
  /** Rolling fraction of recent frames with a detected person (0–1). */
  detectionRate: number;
}

export interface UseGuidedCaptureOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  preset?: SportActionPreset;
  orientation: CameraOrientation;
  /** Master switch — only runs the loop while in the setup/recording phase. */
  active: boolean;
  /** When false (e.g. degraded device), skip pose + report manual mode. */
  poseEnabled: boolean;
  /** Approx detections per second (default 8 — smooth but battery-friendly). */
  fps?: number;
  /** Per-frame motion sample sink (used by auto-trim during recording). */
  onSample?: (sample: CaptureSample) => void;
  /**
   * Camera-shake proxy getter (0 = steady … 1 = very shaky), read each tick
   * and fed into the frame's `motion` signal so stability stops being scored
   * as "unknown". Undefined return = not measurable. See runtime/devicemotion.
   */
  cameraMotion?: () => number | undefined;
}

const DETECTION_WINDOW = 30; // frames used for the rolling detection rate

// Joints whose frame-to-frame displacement defines "motion energy".
const ENERGY_JOINTS = [
  LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
  LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP,
];

/** Mean displacement of key joints between two frames (0 when unavailable). */
function motionEnergy(prev: PoseLandmark[] | null, curr: PoseLandmark[] | null): number {
  if (!prev || !curr || prev.length === 0 || curr.length === 0) return 0;
  let sum = 0;
  let n = 0;
  for (const j of ENERGY_JOINTS) {
    const a = prev[j];
    const b = curr[j];
    if (a && b && a.visibility >= 0.4 && b.visibility >= 0.4) {
      sum += Math.hypot(a.x - b.x, a.y - b.y);
      n += 1;
    }
  }
  return n > 0 ? sum / n : 0;
}

/**
 * The live guidance loop: each tick samples the preview, runs on-device pose
 * (when enabled), derives frame-quality signals + the Frame Readiness Score,
 * and exposes them reactively. All inference is local; nothing is uploaded.
 */
export function useGuidedCapture(opts: UseGuidedCaptureOptions): GuidedCaptureState {
  const { videoRef, preset, orientation, active, poseEnabled, fps = 8, onSample, cameraMotion } = opts;
  const detectorRef = useRef<LivePoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const detectionHistory = useRef<boolean[]>([]);
  const prevLandmarksRef = useRef<PoseLandmark[] | null>(null);
  const startRef = useRef(0);
  const onSampleRef = useRef(onSample);
  onSampleRef.current = onSample;
  const cameraMotionRef = useRef(cameraMotion);
  cameraMotionRef.current = cameraMotion;

  const [state, setState] = useState<GuidedCaptureState>({
    quality: null,
    readiness: null,
    pose: null,
    poseReady: false,
    detectionRate: 0,
  });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const interval = 1000 / fps;

    async function setup() {
      if (poseEnabled) {
        const detector = new LivePoseDetector();
        const ok = await detector.init();
        if (cancelled) {
          detector.close();
          return;
        }
        detectorRef.current = ok ? detector : null;
        setState((s) => ({ ...s, poseReady: ok }));
      }
      loop();
    }

    function pushDetection(detected: boolean): number {
      const hist = detectionHistory.current;
      hist.push(detected);
      if (hist.length > DETECTION_WINDOW) hist.shift();
      const hits = hist.filter(Boolean).length;
      return hist.length ? hits / hist.length : 0;
    }

    function loop(now = 0) {
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastTickRef.current < interval) return;
      lastTickRef.current = now;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const detector = detectorRef.current;
      const pose = detector
        ? detector.detect(video, performance.now())
        : null;

      const stats = sampleFrameStats(video);
      const personDetected = !!pose && pose.landmarks.length > 0;
      const detectionRate = pushDetection(personDetected);

      // Motion energy between consecutive detected frames → auto-trim signal.
      const currLandmarks = personDetected ? pose!.landmarks : null;
      const energy = motionEnergy(prevLandmarksRef.current, currLandmarks);
      prevLandmarksRef.current = currLandmarks;
      if (onSampleRef.current) {
        onSampleRef.current({
          tMs: now - startRef.current,
          energy,
          personDetected,
          // Phase 3: retain the landmarks so the recording buffer can drive
          // the biomechanics bridge once the clip is done.
          landmarks: currLandmarks ?? undefined,
        });
      }

      const frame: FrameSignalInput = {
        frameWidth: video.videoWidth || 720,
        frameHeight: video.videoHeight || 1280,
        pose,
        luma: stats?.luma,
        contrast: stats?.contrast,
        // Camera-shake proxy (devicemotion) when available, else undefined —
        // the engine scores stability as "unknown" rather than over-claiming.
        motion: cameraMotionRef.current?.(),
        orientation,
      };

      const quality = evaluateFrameQuality(frame, preset);
      const readiness = computeReadiness(quality, preset);
      setState((s) => ({ ...s, quality, readiness, pose, detectionRate }));
    }

    startRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    void setup();

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      detectorRef.current?.close();
      detectorRef.current = null;
      detectionHistory.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, poseEnabled, preset, orientation, fps]);

  return state;
}
