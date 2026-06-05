// ============================================================
// SwingVantage — pose3d: Lift Provider Seam
// ------------------------------------------------------------
// The interchangeable boundary between Motion Lab and whatever produces
// single-view 3D depth. Today the trained MLP implements it; a future
// ONNX model (onnxruntime-web) or a server endpoint can drop in behind
// the SAME interface with no downstream changes — exactly the "clean
// adapter + documented extension point" the product brief asked for.
// ============================================================

import { type LM2D, isLiftModelTrained, predictRelativeDepths } from './lift3d';

export interface Lift3DProvider {
  id: string;
  label: string;
  /** Cheap, synchronous availability check (weights present / runtime ready). */
  isAvailable(): boolean;
  /** Distance-relative depth per joint from one view's 2D landmarks, or null. */
  liftDepths(landmarks: LM2D[]): number[] | null;
}

/** The shipping provider: our from-scratch MLP trained on synthetic projections. */
export const trainedLiftProvider: Lift3DProvider = {
  id: 'mlp-synth',
  label: 'SwingVantage lift (trained, synthetic)',
  isAvailable: () => isLiftModelTrained(),
  liftDepths: (lm) => predictRelativeDepths(lm),
};

/**
 * Stub for a future ONNX-runtime model fine-tuned on real motion-capture.
 * It is intentionally inert until `onnxruntime-web` + a `.onnx` model are
 * wired in — see docs/pose3d.md. Kept here so the seam is real, not theoretical.
 */
export const onnxLiftProvider: Lift3DProvider = {
  id: 'onnx',
  label: 'ONNX lift (production, not configured)',
  isAvailable: () => false,
  liftDepths: () => null,
};

const REGISTRY: Lift3DProvider[] = [onnxLiftProvider, trainedLiftProvider];

/** The best available lift provider (prefers a configured production model). */
export function getActiveLiftProvider(): Lift3DProvider | null {
  return REGISTRY.find((p) => p.isAvailable()) ?? null;
}
