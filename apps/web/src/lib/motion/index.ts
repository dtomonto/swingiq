// ============================================================
// SwingIQ — Motion Engine: Public API (barrel)
// ------------------------------------------------------------
// The provider seam + honest data-basis labeling over a browser-side
// motion pipeline. Real pose estimation lives in `@/lib/pose` (the
// single source of truth); the on-device provider here adapts it to
// the seam, with MoveNet / WebGPU / a server model able to drop in
// later behind the same interface. Import from '@/lib/motion'.
// ============================================================

export * from './types';
export {
  detectMotionCapabilities,
  weakestBasis,
  computeMotionScore,
  buildSwingFingerprint,
  computeMotionScoreFromPose,
  swingFingerprintFromPose,
  type PoseProvider,
  type PoseEstimateInput,
  type MotionEngineCapabilities,
} from './engine';
export { mockPoseProvider, getActivePoseProvider } from './providers';
export { onDevicePoseProvider } from './onDevicePoseProvider';
