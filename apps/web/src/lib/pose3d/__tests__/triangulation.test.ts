// ============================================================
// SwingVantage — pose3d: triangulation correctness (ground-truth)
// ------------------------------------------------------------
// Generates a known 3D skeleton, projects it through two calibrated
// cameras, triangulates, and asserts the original 3D is recovered.
// This proves the multi-view path produces TRUE 3D (not estimated).
// ============================================================

import { rigPreset } from '../camera';
import { samplePose, projectPose, NUM_JOINTS, rng } from '../synth';
import { triangulateSkeleton, viewsFromCameras } from '../triangulate';
import { smallestEigenvector } from '../linalg';

describe('linalg eigensolver', () => {
  it('finds the smallest eigenvector of a symmetric matrix', () => {
    // diag(4,1,9) → smallest eigenvalue 1 → eigenvector ~ e2
    const v = smallestEigenvector([[4, 0, 0], [0, 1, 0], [0, 0, 9]]);
    expect(Math.abs(v[1])).toBeGreaterThan(0.99);
    expect(Math.abs(v[0])).toBeLessThan(0.05);
    expect(Math.abs(v[2])).toBeLessThan(0.05);
  });
});

describe('multi-view triangulation recovers true 3D', () => {
  it('recovers a known skeleton from two views within sub-millimetre error', () => {
    const cameras = rigPreset('face_dtl_90', 3);
    const pose = samplePose(rng(42));
    const views = viewsFromCameras(cameras, [
      projectPose(cameras[0], pose).landmarks,
      projectPose(cameras[1], pose).landmarks,
    ]);

    const { points, meanReprojError } = triangulateSkeleton(views);

    let recovered = 0;
    let maxErr = 0;
    for (let j = 0; j < NUM_JOINTS; j++) {
      const p = points[j];
      if (!p) continue;
      const err = Math.hypot(p[0] - pose[j][0], p[1] - pose[j][1], p[2] - pose[j][2]);
      maxErr = Math.max(maxErr, err);
      recovered++;
    }

    expect(recovered).toBe(NUM_JOINTS);
    expect(maxErr).toBeLessThan(1e-3); // < 1 mm
    expect(meanReprojError).toBeLessThan(1e-5);
  });

  it('still recovers most joints across many random poses', () => {
    const cameras = rigPreset('face_dtl_45', 3.2);
    let worst = 0;
    for (let s = 0; s < 25; s++) {
      const pose = samplePose(rng(1000 + s));
      const views = viewsFromCameras(cameras, [
        projectPose(cameras[0], pose).landmarks,
        projectPose(cameras[1], pose).landmarks,
      ]);
      const { points } = triangulateSkeleton(views);
      for (let j = 0; j < NUM_JOINTS; j++) {
        const p = points[j];
        if (!p) continue;
        worst = Math.max(worst, Math.hypot(p[0] - pose[j][0], p[1] - pose[j][1], p[2] - pose[j][2]));
      }
    }
    expect(worst).toBeLessThan(5e-3); // < 5 mm worst-case across 25 poses
  });
});
