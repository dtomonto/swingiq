// ============================================================
// SwingIQ — Motion Engine: Public API (barrel)
// ------------------------------------------------------------
// Readiness scaffolding for a future browser-side motion pipeline.
// No model runs yet; the provider seam + honest data-basis labeling
// let MediaPipe / MoveNet / WebGPU / a server model drop in later.
// Import from '@/lib/motion'.
// ============================================================

export * from './types';
export {
  detectMotionCapabilities,
  weakestBasis,
  computeMotionScore,
  buildSwingFingerprint,
  type PoseProvider,
  type PoseEstimateInput,
  type MotionEngineCapabilities,
} from './engine';
export { mockPoseProvider, getActivePoseProvider } from './providers';
