// ============================================================
// SwingVantage — Second pose engine: MoveNet (optional, OFF by default)
// ------------------------------------------------------------
// A fast 17-keypoint validator that the fusion layer compares against the
// MediaPipe baseline on hard frames. It is OFF by default and ships NO new
// runtime dependency: TensorFlow.js is an OPTIONAL peer that is dynamically
// imported ONLY when an operator opts in via NEXT_PUBLIC_MOTION_SECOND_ENGINE
// AND has installed it. If the flag is off, the import fails, or anything
// throws, this degrades to "unavailable" — the default on-device path is
// completely untouched (no bundle cost, no behaviour change).
//
// To enable (operator):
//   1. npm i @tensorflow-models/pose-detection @tensorflow/tfjs-core \
//          @tensorflow/tfjs-converter @tensorflow/tfjs-backend-webgl
//   2. set NEXT_PUBLIC_MOTION_SECOND_ENGINE=movenet
//   3. allow the model host in the CSP (see next.config.mjs / .env.example)
//
// Privacy note: inference still runs ON-DEVICE (WebGL in the browser); only the
// MODEL WEIGHTS are fetched once. Output stays basis 'estimated' (single camera).
/* eslint-disable @typescript-eslint/no-explicit-any -- TF.js is an optional, untyped-at-build-time peer dependency loaded via dynamic import. */
// ============================================================

import type { PoseDetectInput, PoseFrame } from './pose-detection';
import { movenetTo33, type MoveNetKeypoint } from './keypoint-map';

/** True when an operator has opted into the MoveNet second engine. */
export function secondEngineEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_MOTION_SECOND_ENGINE ?? '').toLowerCase() === 'movenet';
}

function loadImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

let detectorPromise: Promise<any | null> | null = null;

/** Lazily create the MoveNet detector. Null when disabled/unavailable. */
async function getDetector(): Promise<any | null> {
  if (typeof window === 'undefined' || !secondEngineEnabled()) return null;
  if (detectorPromise) return detectorPromise;
  detectorPromise = (async () => {
    try {
      // String-typed specifiers keep TS/the bundler from requiring these
      // optional peers at build time — they resolve only at runtime when present.
      const backendSpec: string = '@tensorflow/tfjs-backend-webgl';
      const poseSpec: string = '@tensorflow-models/pose-detection';
      await import(/* webpackIgnore: true */ backendSpec);
      const pd: any = await import(/* webpackIgnore: true */ poseSpec);
      return await pd.createDetector(pd.SupportedModels.MoveNet, {
        modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
    } catch (err) {
      console.warn('[pose] MoveNet second engine unavailable (optional dependency missing or blocked).', err);
      return null;
    }
  })();
  return detectorPromise;
}

/**
 * Detect with MoveNet over the frames, returning poses mapped onto the
 * MediaPipe-33 index space (so the fusion layer can compare them directly).
 * Best-effort and never throws; [] when disabled or unavailable.
 */
export async function detectMoveNet(frames: PoseDetectInput[]): Promise<PoseFrame[]> {
  if (typeof window === 'undefined' || frames.length === 0 || !secondEngineEnabled()) return [];
  const detector = await getDetector();
  if (!detector) return [];

  const out: PoseFrame[] = [];
  for (const f of frames) {
    try {
      const img = await loadImage(f.dataUrl);
      if (!img || !img.width || !img.height) continue;
      const poses: any[] = await detector.estimatePoses(img);
      const kp = poses?.[0]?.keypoints;
      if (Array.isArray(kp) && kp.length >= 17) {
        // MoveNet returns PIXEL coordinates — normalize to 0–1 like MediaPipe.
        const norm: MoveNetKeypoint[] = kp.map((k: any) => ({
          x: (k?.x ?? 0) / img.width,
          y: (k?.y ?? 0) / img.height,
          score: k?.score ?? 0,
        }));
        out.push({
          timestampSeconds: f.timestampSeconds,
          personCount: poses.length,
          landmarks: movenetTo33(norm),
        });
      }
    } catch {
      // Skip this frame; keep going.
    }
  }
  return out;
}
