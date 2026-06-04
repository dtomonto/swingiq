// ============================================================
// SwingIQ — On-device Pose Detection (MediaPipe)
//
// Runs Google's MediaPipe Pose Landmarker entirely in the browser to
// detect real body landmarks on the extracted swing frames. The model
// is loaded lazily (dynamic import + CDN model) and inference runs
// locally — frames are NOT sent anywhere for pose detection.
//
// Everything here is best-effort and NEVER throws: if the model can't
// load (offline, blocked CDN, unsupported device) the analysis simply
// proceeds without pose data.
// ============================================================

import type { PoseLandmarker } from '@mediapipe/tasks-vision';

// Pin the WASM bundle to the installed package version.
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

/** Pose model accuracy/speed tier. lite = fastest, heavy = most accurate. */
export type PoseModelQuality = 'lite' | 'full' | 'heavy';

const MODEL_URLS: Record<PoseModelQuality, string> = {
  lite: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  full: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
  heavy: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
};

export interface PoseLandmark {
  x: number; // normalized 0–1 (left→right)
  y: number; // normalized 0–1 (top→bottom)
  z: number;
  visibility: number; // 0–1
}

export interface PoseFrame {
  timestampSeconds: number;
  landmarks: PoseLandmark[];
}

export interface PoseDetectInput {
  dataUrl: string;
  timestampSeconds: number;
}

// Memoize one landmarker per quality tier (each downloads a different model).
const landmarkerPromises = new Map<PoseModelQuality, Promise<PoseLandmarker | null>>();

/** Lazily create (and memoize) the pose landmarker for a quality. Null on failure. */
async function getLandmarker(quality: PoseModelQuality): Promise<PoseLandmarker | null> {
  const existing = landmarkerPromises.get(quality);
  if (existing) return existing;
  const promise = (async () => {
    try {
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
      const make = (delegate: 'GPU' | 'CPU') =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URLS[quality], delegate },
          runningMode: 'IMAGE',
          numPoses: 1,
        });
      try {
        return await make('GPU');
      } catch {
        return await make('CPU');
      }
    } catch (err) {
      console.warn('[pose] MediaPipe unavailable — proceeding without pose data.', err);
      return null;
    }
  })();
  landmarkerPromises.set(quality, promise);
  return promise;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Pre-load (and memoize) the pose model without running detection. Calling this
 * early — e.g. while the user is still on the configure screen — moves the
 * one-time WASM + model download off the critical path, so the first real
 * detection is fast. Best-effort and never throws.
 */
export async function warmupPose(quality: PoseModelQuality = 'lite'): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await getLandmarker(quality);
  } catch {
    // Ignore — detection will simply proceed without pose data later.
  }
}

/**
 * Detect pose landmarks on each frame. Returns only the frames where a
 * pose was actually found (so empty ⇒ no usable pose). Never throws.
 *
 * @param quality model tier — 'lite' (default, fastest) | 'full' | 'heavy'.
 */
export async function detectPoses(
  frames: PoseDetectInput[],
  quality: PoseModelQuality = 'lite',
): Promise<PoseFrame[]> {
  if (typeof window === 'undefined' || frames.length === 0) return [];
  const landmarker = await getLandmarker(quality);
  if (!landmarker) return [];

  const out: PoseFrame[] = [];
  for (const f of frames) {
    try {
      const img = await loadImage(f.dataUrl);
      if (!img) continue;
      const result = landmarker.detect(img);
      const lm = result.landmarks?.[0];
      if (lm && lm.length > 0) {
        out.push({
          timestampSeconds: f.timestampSeconds,
          landmarks: lm.map((p) => ({
            x: p.x,
            y: p.y,
            z: p.z ?? 0,
            visibility: p.visibility ?? 0,
          })),
        });
      }
    } catch {
      // Skip this frame; keep going.
    }
  }
  return out;
}
