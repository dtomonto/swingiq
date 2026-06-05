// ============================================================
// SwingVantage — pose3d: Single-View 3D Lifting (inference)
// ------------------------------------------------------------
// Runs the trained MLP to infer a torso-relative DEPTH for each joint
// from a single view's 2D landmarks. Inputs are torso-normalized
// exactly as in training (translation/scale invariant), so the learned
// structural prior transfers to real MediaPipe landmarks.
//
// HONESTY: this is a learned PRIOR trained on synthetic projections —
// basis 'ai_inferred'. It improves the single-camera depth estimate but
// is not a measurement. Multi-view triangulation remains the 'measured'
// path.
// ============================================================

import { fromJson, forward, type MLP, type MLPJson } from './mlp';
import { NUM_JOINTS, normalizeInput } from './synth';
import weightsJson from './weights/lift3d.json';

let cachedNet: MLP | null = null;
function net(): MLP {
  if (!cachedNet) cachedNet = fromJson(weightsJson as MLPJson);
  return cachedNet;
}

/** Whether real trained weights are loaded (vs the zeros placeholder). */
export function isLiftModelTrained(): boolean {
  const meta = (weightsJson as MLPJson).meta;
  return Boolean(meta && (meta as { trained?: boolean }).trained);
}

export interface LM2D { x: number; y: number; visibility?: number }

/**
 * Predict distance-relative depth per joint from one view's 2D landmarks
 * (hip plane ≈ 0). Uses the exact same torso normalization as training.
 * Returns null when the input is unusable or the model is untrained.
 */
export function predictRelativeDepths(lm: LM2D[]): number[] | null {
  if (!isLiftModelTrained() || lm.length < NUM_JOINTS) return null;
  const input = normalizeInput(lm);
  if (!input) return null;
  const { y } = forward(net(), input);
  return Array.from(y);
}

export { weightsJson as liftWeights };
