// ============================================================
// SwingVantage — pose3d: public API (barrel)
// ------------------------------------------------------------
// Proprietary 3D pose reconstruction:
//   • Multi-view DLT triangulation  → TRUE metric 3D (basis 'measured')
//   • Trained single-view lift model → learned depth ('ai_inferred')
//   • Camera model + calibration presets, validation, synthetic trainer
// ============================================================

export * from './linalg';
export {
  type Camera,
  type CameraIntrinsics,
  type RigPreset,
  defaultIntrinsics,
  projectionMatrix,
  projectPoint,
  cameraOnArc,
  rigPreset,
} from './camera';
export {
  type ViewObservation,
  type TriangulatedJoint,
  triangulateJoint,
  triangulateSkeleton,
  reprojectionError,
  viewsFromCameras,
} from './triangulate';
export {
  type LM2D,
  isLiftModelTrained,
  predictRelativeDepths,
} from './lift3d';
export {
  type Lm3,
  type MultiViewReconstruction,
  liftAvailable,
  enrichFrameWithLift,
  reconstructMultiViewFrame,
  worldPointsToViewerLandmarks,
  reprojConfidence,
} from './engine';
export { NUM_JOINTS } from './synth';
export {
  type P2,
  estimateEssential,
  ransacEssential,
  sampsonDistance,
} from './eightpoint';
export { type Pose, essentialToPoses, recoverPose } from './decompose';
export { type RefinedPose, refinePose, poseReprojError } from './bundle';
export { type SelfCalibration, selfCalibrate } from './selfcalibrate';
export {
  type FrameLm,
  motionSignal,
  bestLag,
  alignByLag,
  syncViews,
} from './sync';
export {
  type Lift3DProvider,
  trainedLiftProvider,
  onnxLiftProvider,
  getActiveLiftProvider,
} from './providers';
