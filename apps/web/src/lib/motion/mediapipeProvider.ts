// ============================================================
// SwingIQ — Motion Engine: MediaPipe Pose Provider (flagged)
// ------------------------------------------------------------
// A REAL pose provider behind a feature flag. It loads MediaPipe
// Tasks-Vision from a CDN at RUNTIME (no npm dependency, so the
// bundle and build are unaffected) and only when:
//   - NEXT_PUBLIC_ENABLE_POSE === '1', and
//   - it's running in a browser with WebAssembly.
//
// HONESTY: single-camera 2D pose is an ESTIMATE, not a lab
// measurement — the returned sequence is basis 'estimated', so any
// Motion Score derived from it keeps its disclaimer.
// ============================================================

import { detectMotionCapabilities } from './engine';
import type { PoseEstimateInput, PoseProvider } from './engine';
import type { PoseFrame, PoseSequence } from './types';

/** Pinned CDN build of MediaPipe tasks-vision (loaded only when enabled). */
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/** The feature flag — pose estimation is OFF unless explicitly enabled. */
export function isPoseEngineEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_POSE === '1';
}

/**
 * Opaque dynamic import so the bundler never tries to resolve the CDN URL at
 * build time (it isn't an installed package). Kept in one place, clearly
 * marked. Evaluated only after the availability checks pass.
 */
const cdnImport = new Function('url', 'return import(url)') as (url: string) => Promise<unknown>;

/** Load an image string (data URL / URL) into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

let landmarkerPromise: Promise<unknown> | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getLandmarker(): Promise<any> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision: any = await cdnImport(`${CDN_BASE}/vision_bundle.mjs`);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${CDN_BASE}/wasm`);
      return vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL },
        runningMode: 'IMAGE',
        numPoses: 1,
      });
    })();
  }
  return landmarkerPromise;
}

export const mediapipePoseProvider: PoseProvider = {
  id: 'mediapipe',
  label: 'MediaPipe Pose (estimated)',
  isAvailable() {
    return isPoseEngineEnabled() && typeof window !== 'undefined' && detectMotionCapabilities().wasm;
  },
  async estimate(input: PoseEstimateInput): Promise<PoseSequence> {
    const fps = input.fps ?? 30;
    const landmarker = await getLandmarker();

    const frames: PoseFrame[] = [];
    let visSum = 0;
    let visCount = 0;

    for (const f of input.frames) {
      try {
        const img = await loadImage(f.image);
        const result: any = landmarker.detect(img);
        const landmarks = (result?.landmarks?.[0] ?? []).map((p: any) => {
          if (typeof p.visibility === 'number') {
            visSum += p.visibility;
            visCount++;
          }
          return { x: p.x, y: p.y, z: p.z, visibility: p.visibility };
        });
        if (landmarks.length > 0) frames.push({ timestampMs: f.timestampMs, landmarks });
      } catch {
        // Skip unreadable frames rather than fabricating landmarks.
      }
    }

    return {
      schema: 'mediapipe_pose_33',
      fps,
      frameCount: input.frames.length,
      frames,
      // 2D single-camera pose is an estimate, never a lab measurement.
      basis: 'estimated',
      confidence: visCount > 0 ? visSum / visCount : 0,
    };
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */
