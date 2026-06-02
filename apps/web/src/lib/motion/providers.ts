// ============================================================
// SwingIQ — Motion Engine: Provider Seam (scaffolding)
// ------------------------------------------------------------
// The interchangeable boundary between the app and a pose model.
// A real provider (MediaPipe / MoveNet / a server endpoint) just
// implements PoseProvider. Until one is wired, `mockPoseProvider`
// returns clearly-flagged placeholder data so pipelines can be
// built and tested without a model — and without faking results.
// ============================================================

import type { MotionEngineCapabilities, PoseEstimateInput, PoseProvider, PoseSequence } from './engine';
import { mediapipePoseProvider } from './mediapipeProvider';

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
 * The active provider: the real MediaPipe provider when it's enabled and
 * available (flag on, browser, WASM), otherwise the honest mock.
 */
export function getActivePoseProvider(): PoseProvider {
  return mediapipePoseProvider.isAvailable() ? mediapipePoseProvider : mockPoseProvider;
}
