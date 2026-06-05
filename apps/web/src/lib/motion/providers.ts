// ============================================================
// SwingVantage — Motion Engine: Provider Seam
// ------------------------------------------------------------
// The interchangeable boundary between the app and a pose model.
// A real provider (MediaPipe / MoveNet / a server endpoint) just
// implements PoseProvider. The real one today is `onDevicePoseProvider`,
// which delegates to `@/lib/pose` — the single source of truth for
// actual pose estimation. When it can't run (no browser / no WASM),
// `mockPoseProvider` returns clearly-flagged placeholder data so
// pipelines still work — and without faking results.
// ============================================================

import type { MotionEngineCapabilities, PoseEstimateInput, PoseProvider, PoseSequence } from './engine';
import { onDevicePoseProvider } from './onDevicePoseProvider';

// (Types live in engine.ts to keep the provider seam dependency-light;
//  re-exported here for ergonomic imports.)
export type { PoseProvider, PoseEstimateInput, MotionEngineCapabilities };

/**
 * A no-op pose provider. It is always "available" but returns an empty,
 * placeholder-basis sequence with zero confidence — the UI must treat its
 * output as demo data, never as a measurement.
 */
export const mockPoseProvider: PoseProvider = {
  id: 'mock',
  label: 'Mock (no model)',
  isAvailable: () => true,
  async estimate(input: PoseEstimateInput): Promise<PoseSequence> {
    const fps = input.fps ?? 30;
    return {
      schema: input.schema ?? 'generic',
      fps,
      frameCount: input.frames.length,
      // Intentionally empty — we do not invent landmark positions.
      frames: [],
      basis: 'placeholder',
      confidence: 0,
    };
  },
};

/**
 * The active provider: the real on-device pose engine (`@/lib/pose`) when it
 * can run (browser + WASM), otherwise the honest mock. The on-device provider
 * reports basis 'estimated', so any score derived from it keeps its disclaimer.
 */
export function getActivePoseProvider(): PoseProvider {
  return onDevicePoseProvider.isAvailable() ? onDevicePoseProvider : mockPoseProvider;
}
