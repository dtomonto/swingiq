'use client';

import { useEffect, useRef, useState } from 'react';
import { evaluateFrameQuality } from '../engines/frame-quality-engine';
import { computeReadiness } from '../engines/readiness-score-engine';
import { LivePoseDetector, sampleFrameStats } from '../runtime/live-pose';
import type {
  CameraOrientation,
  FrameQualitySignals,
  FrameSignalInput,
  ReadinessScore,
  SportActionPreset,
} from '../types';

export interface GuidedCaptureState {
  quality: FrameQualitySignals | null;
  readiness: ReadinessScore | null;
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
}

const DETECTION_WINDOW = 30; // frames used for the rolling detection rate

/**
 * The live guidance loop: each tick samples the preview, runs on-device pose
 * (when enabled), derives frame-quality signals + the Frame Readiness Score,
 * and exposes them reactively. All inference is local; nothing is uploaded.
 */
export function useGuidedCapture(opts: UseGuidedCaptureOptions): GuidedCaptureState {
  const { videoRef, preset, orientation, active, poseEnabled, fps = 8 } = opts;
  const detectorRef = useRef<LivePoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const detectionHistory = useRef<boolean[]>([]);

  const [state, setState] = useState<GuidedCaptureState>({
    quality: null,
    readiness: null,
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

      const frame: FrameSignalInput = {
        frameWidth: video.videoWidth || 720,
        frameHeight: video.videoHeight || 1280,
        pose,
        luma: stats?.luma,
        contrast: stats?.contrast,
        // Camera-motion proxy is left undefined for the MVP (handled as
        // "unknown" by the engine); Phase 2 wires devicemotion / jitter.
        motion: undefined,
        orientation,
      };

      const quality = evaluateFrameQuality(frame, preset);
      const readiness = computeReadiness(quality, preset);
      setState((s) => ({ ...s, quality, readiness, detectionRate }));
    }

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
