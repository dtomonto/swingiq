// ============================================================
// SwingIQ — Motion Engine: Pose Provider Adapters (Cloud + MoveNet)
// ------------------------------------------------------------
// Completes the named adapter set behind the `PoseProvider` seam so a
// different model can be swapped in WITHOUT touching the app:
//
//   • cloudPoseProvider  — posts frames to a configurable endpoint. OFF
//     by default (the app stays private/on-device unless an operator sets
//     NEXT_PUBLIC_POSE_CLOUD_URL). Validates the response and degrades to
//     an honest placeholder on any error — it never throws or fabricates.
//   • moveNetPoseProvider — a documented PLACEHOLDER for a TensorFlow.js
//     MoveNet model. Not wired (no TF.js dependency shipped); it reports
//     unavailable and returns a placeholder so the seam is complete and
//     the upgrade path is concrete.
//
// HONESTY: a cloud pose model is still single-camera, so its output is
// basis 'estimated' (never 'measured'). Privacy: enabling the cloud
// adapter means frames ARE sent to the configured endpoint — that is an
// explicit operator choice, clearly off by default.
// ============================================================

import type { PoseEstimateInput, PoseProvider } from './engine';
import type { PoseFrame, PoseLandmark, PoseSequence } from './types';
import { mockPoseProvider } from './providers';
import { onDevicePoseProvider } from './onDevicePoseProvider';

/** The configured cloud endpoint, or undefined when not set. */
export function cloudPoseEndpoint(): string | undefined {
  const url = process.env.NEXT_PUBLIC_POSE_CLOUD_URL;
  return url && url.length > 0 ? url : undefined;
}

function placeholderSequence(input: PoseEstimateInput): PoseSequence {
  return {
    schema: input.schema ?? 'generic',
    fps: input.fps ?? 30,
    frameCount: input.frames.length,
    frames: [],
    basis: 'placeholder',
    confidence: 0,
  };
}

function clamp01(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

/** Coerce an untrusted cloud response into a safe PoseSequence (or null). */
function parsePoseResponse(data: unknown, input: PoseEstimateInput): PoseSequence | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.frames)) return null;

  const frames: PoseFrame[] = [];
  for (const raw of d.frames) {
    if (!raw || typeof raw !== 'object') continue;
    const f = raw as Record<string, unknown>;
    if (!Array.isArray(f.landmarks)) continue;
    const landmarks: PoseLandmark[] = f.landmarks
      .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object')
      .map((l) => ({
        x: typeof l.x === 'number' ? l.x : 0,
        y: typeof l.y === 'number' ? l.y : 0,
        z: typeof l.z === 'number' ? l.z : 0,
        visibility: clamp01(l.visibility),
      }));
    frames.push({ timestampMs: typeof f.timestampMs === 'number' ? f.timestampMs : 0, landmarks });
  }

  const schema =
    d.schema === 'movenet_17' || d.schema === 'mediapipe_pose_33' || d.schema === 'generic'
      ? d.schema
      : input.schema ?? 'generic';

  return {
    schema,
    fps: input.fps ?? 30,
    frameCount: input.frames.length,
    frames,
    // A cloud pose model is still single-camera → an estimate, never "measured".
    basis: 'estimated',
    confidence: clamp01(d.confidence),
  };
}

/** CloudPoseAdapter — posts frames to a configurable endpoint (opt-in). */
export const cloudPoseProvider: PoseProvider = {
  id: 'cloud',
  label: 'Cloud Pose (estimated)',
  isAvailable() {
    return typeof fetch !== 'undefined' && !!cloudPoseEndpoint();
  },
  async estimate(input: PoseEstimateInput): Promise<PoseSequence> {
    const url = cloudPoseEndpoint();
    if (!url || typeof fetch === 'undefined') return placeholderSequence(input);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          frames: input.frames,
          fps: input.fps ?? 30,
          schema: input.schema ?? 'generic',
        }),
      });
      if (!res.ok) return placeholderSequence(input);
      const data = await res.json();
      return parsePoseResponse(data, input) ?? placeholderSequence(input);
    } catch {
      // Network/parse failure — degrade honestly, never throw.
      return placeholderSequence(input);
    }
  },
};

/**
 * MoveNetPoseAdapter — PLACEHOLDER. To wire a real TensorFlow.js MoveNet:
 *   1. add `@tensorflow-models/pose-detection` + a tfjs backend,
 *   2. create the detector (SINGLEPOSE_LIGHTNING / THUNDER),
 *   3. in `estimate`, decode each `input.frames[].image` to an ImageBitmap,
 *      run `detector.estimatePoses`, map the 17 keypoints to PoseLandmark,
 *      and return `{ schema: 'movenet_17', basis: 'estimated', … }`.
 * Until then it reports unavailable so the selector falls through.
 */
export const moveNetPoseProvider: PoseProvider = {
  id: 'movenet',
  label: 'MoveNet (not configured)',
  isAvailable: () => false,
  async estimate(input: PoseEstimateInput): Promise<PoseSequence> {
    return placeholderSequence(input);
  },
};

/** Every known provider — for the admin/debug picker. */
export function listPoseProviders(): PoseProvider[] {
  return [onDevicePoseProvider, cloudPoseProvider, moveNetPoseProvider, mockPoseProvider];
}

/**
 * Choose a provider: on-device first (private, default), then the cloud adapter
 * if an operator configured it, then the honest mock. `force` overrides the
 * selection for testing/admin. Falls back to mock if a forced provider can't run.
 */
export function selectPoseProvider(force?: PoseProvider['id']): PoseProvider {
  if (force) {
    const found = listPoseProviders().find((p) => p.id === force);
    if (found && found.isAvailable()) return found;
  }
  if (onDevicePoseProvider.isAvailable()) return onDevicePoseProvider;
  if (cloudPoseProvider.isAvailable()) return cloudPoseProvider;
  return mockPoseProvider;
}
