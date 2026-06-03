// ============================================================
// SwingIQ — pose3d: self-calibration correctness
// ------------------------------------------------------------
// Projects a motion through a KNOWN two-camera rig, then recovers the
// relative pose purely from the 2D correspondences and confirms (a) the
// recovered rotation matches the true relative rotation and (b) the
// recovered cameras triangulate self-consistently (low reprojection).
// ============================================================

import { rigPreset, defaultIntrinsics } from '../camera';
import { rng, samplePose, projectPose } from '../synth';
import { selfCalibrate } from '../selfcalibrate';
import { buildMultiViewTrack } from '@/lib/motion-lab/multiview';
import { matMul, transpose, type Mat } from '../linalg';

function maxAbsDiff(a: Mat, b: Mat): number {
  let m = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m = Math.max(m, Math.abs(a[i][j] - b[i][j]));
  return m;
}

function makeViews(seed: number, frames: number) {
  const cameras = rigPreset('face_dtl_90', 3);
  const r = rng(seed);
  const A = [];
  const B = [];
  for (let i = 0; i < frames; i++) {
    const pose = samplePose(r);
    A.push({ tMs: i * 33, landmarks: projectPose(cameras[0], pose).landmarks });
    B.push({ tMs: i * 33, landmarks: projectPose(cameras[1], pose).landmarks });
  }
  // True relative rotation between the two cameras (A-centred frame).
  const Rrel = matMul(cameras[1].R, transpose(cameras[0].R));
  return { cameras, A, B, Rrel };
}

describe('pose3d self-calibration (8-point + decomposition)', () => {
  it('recovers the relative rotation from data alone', () => {
    const { A, B, Rrel } = makeViews(11, 24);
    const calib = selfCalibrate(A, B, defaultIntrinsics(), rng(7));
    expect(calib).not.toBeNull();
    expect(calib!.inlierRatio).toBeGreaterThan(0.8);
    // Recovered camera B rotation should match the true relative rotation.
    expect(maxAbsDiff(calib!.cameras[1].R, Rrel)).toBeLessThan(0.08);
  });

  it('produces cameras that triangulate self-consistently (high confidence)', () => {
    const { A, B } = makeViews(33, 24);
    const calib = selfCalibrate(A, B, defaultIntrinsics(), rng(2));
    expect(calib).not.toBeNull();
    const track = buildMultiViewTrack(A, B, calib!.cameras);
    expect(track.basis).toBe('measured');
    expect(track.trackingConfidence).toBeGreaterThan(0.85);
  });

  it('returns null when the two views are identical (degenerate, no baseline)', () => {
    const { A } = makeViews(5, 20);
    const calib = selfCalibrate(A, A, defaultIntrinsics(), rng(1));
    // No baseline ⇒ either null or very low front-ratio rejection.
    expect(calib).toBeNull();
  });
});
