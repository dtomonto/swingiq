// ============================================================
// SwingIQ — Motion Engine: On-device Pose Provider
// ------------------------------------------------------------
// Adapts the real on-device pose engine (`@/lib/pose`) to the motion
// seam's PoseProvider interface. This makes `lib/pose` the SINGLE
// source of truth for actual pose estimation: it runs Google's
// MediaPipe Pose Landmarker locally in the browser (installed npm
// package, GPU→CPU fallback, never throws) — frames are never
// uploaded for detection. The motion engine just consumes its output
// through the provider seam.
//
// HONESTY: single-camera 2D pose is an ESTIMATE, not a lab
// measurement — the returned sequence is basis 'estimated', so any
// Motion Score derived from it keeps its disclaimer.
// ============================================================

import { detectMotionCapabilities } from './engine';
import type { PoseEstimateInput, PoseProvider } from './engine';
import type { PoseFrame, PoseSequence } from './types';
import { detectPoses, type PoseDetectInput } from '@/lib/pose';

export const onDevicePoseProvider: PoseProvider = {
  id: 'ondevice',
  label: 'On-device Pose (estimated)',
  isAvailable() {
    // The pose engine only runs in a browser with WebAssembly. Cheap & sync,
    // matching the conditions under which `@/lib/pose` can actually detect.
    return typeof window !== 'undefined' && detectMotionCapabilities().wasm;
  },
  async estimate(input: PoseEstimateInput): Promise<PoseSequence> {
    const fps = input.fps ?? 30;

    // Adapt the motion seam's frames (timestampMs + encoded image) to the
    // pose engine's input (dataUrl + timestampSeconds).
    const detectInput: PoseDetectInput[] = input.frames.map((f) => ({
      dataUrl: f.image,
      timestampSeconds: f.timestampMs / 1000,
    }));

    // `@/lib/pose` owns the real detection and never throws — it returns only
    // the frames where a pose was actually found (empty ⇒ no usable pose).
    const detected = await detectPoses(detectInput);

    let visSum = 0;
    let visCount = 0;
    const frames: PoseFrame[] = detected.map((d) => {
      for (const lm of d.landmarks) {
        visSum += lm.visibility;
        visCount++;
      }
      return {
        timestampMs: Math.round(d.timestampSeconds * 1000),
        landmarks: d.landmarks.map((p) => ({
          x: p.x,
          y: p.y,
          z: p.z,
          visibility: p.visibility,
        })),
      };
    });

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
