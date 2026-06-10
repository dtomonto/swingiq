// ============================================================
// SwingVantage — RecordAssist runtime: live pose detector
// ------------------------------------------------------------
// A thin wrapper over MediaPipe Pose Landmarker in VIDEO running-mode for
// real-time, on-device detection on the live camera preview. Mirrors the
// model/WASM resolution of lib/pose/pose-detection.ts (same env knobs,
// same self-host story) but runs `detectForVideo` per animation frame.
//
// Privacy: inference is 100% on-device; preview pixels are NOT uploaded.
// Best-effort and never throws — callers fall back to manual framing.
// ============================================================

import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import type { PoseSample } from '../types';

const DEFAULT_WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const DEFAULT_MODEL_BASE = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker';
const stripTrailingSlash = (s: string): string => s.replace(/\/+$/, '');

const WASM_CDN = stripTrailingSlash(
  process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_BASE || DEFAULT_WASM_BASE,
);
const MODEL_BASE = stripTrailingSlash(
  process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_BASE || DEFAULT_MODEL_BASE,
);
// Live preview uses the lite model — lowest latency for real-time guidance.
const MODEL_URL = `${MODEL_BASE}/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`;

function mediapipeEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_MEDIAPIPE_ENABLED ?? '') !== 'false';
}

export class LivePoseDetector {
  private landmarker: PoseLandmarker | null = null;
  private ready = false;
  private failed = false;

  /** Load the model once. Returns false if pose is unavailable. */
  async init(): Promise<boolean> {
    if (this.ready) return true;
    if (this.failed || !mediapipeEnabled() || typeof window === 'undefined') return false;
    try {
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
      const make = (delegate: 'GPU' | 'CPU') =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          // Allow up to 2 so we can WARN when extra people are in frame.
          numPoses: 2,
        });
      try {
        this.landmarker = await make('GPU');
      } catch {
        this.landmarker = await make('CPU');
      }
      this.ready = true;
      return true;
    } catch (err) {
      console.warn('[record-assist] live pose unavailable — manual framing only.', err);
      this.failed = true;
      return false;
    }
  }

  get isReady(): boolean {
    return this.ready;
  }

  /**
   * Detect on a video frame. Returns the primary person's pose (+ how many
   * people were seen) or null. `timestampMs` must be monotonically increasing.
   */
  detect(video: HTMLVideoElement, timestampMs: number): PoseSample | null {
    if (!this.landmarker || !this.ready) return null;
    try {
      const result = this.landmarker.detectForVideo(video, timestampMs);
      const people = result.landmarks ?? [];
      const primary = people[0];
      if (!primary || primary.length === 0) {
        return { landmarks: [], personCount: people.length, timestampMs };
      }
      return {
        landmarks: primary.map((p) => ({
          x: p.x,
          y: p.y,
          z: p.z ?? 0,
          visibility: p.visibility ?? 0,
        })),
        personCount: people.length,
        timestampMs,
      };
    } catch {
      return null;
    }
  }

  close(): void {
    try {
      this.landmarker?.close();
    } catch {
      /* ignore */
    }
    this.landmarker = null;
    this.ready = false;
  }
}

// ── Lightweight pixel sampling (lighting / contrast) ────────

let sampleCanvas: HTMLCanvasElement | null = null;

/**
 * Sample mean luma (0–1) and a normalized contrast proxy (0–1) from a video
 * frame using a tiny downscaled canvas. Cheap enough to run each frame.
 * Returns null when the canvas/2D context is unavailable.
 */
export function sampleFrameStats(
  video: HTMLVideoElement,
): { luma: number; contrast: number } | null {
  if (typeof document === 'undefined') return null;
  const w = 32;
  const h = 32;
  try {
    if (!sampleCanvas) sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = w;
    sampleCanvas.height = h;
    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let sum = 0;
    const lumas: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      lumas.push(l);
      sum += l;
    }
    const mean = sum / lumas.length;
    let varSum = 0;
    for (const l of lumas) varSum += (l - mean) ** 2;
    const std = Math.sqrt(varSum / lumas.length);
    return { luma: mean, contrast: Math.min(1, std * 2) };
  } catch {
    return null;
  }
}
