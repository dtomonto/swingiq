// ============================================================
// SwingIQ — pose3d: bundle-adjustment refinement
// ------------------------------------------------------------
// Starts from a PERTURBED relative pose and confirms refinePose drives
// the reprojection error back down (and never worsens it).
// ============================================================

import { refinePose, poseReprojError } from '../bundle';
import { rigPreset } from '../camera';
import { matMul, transpose, axisAngleToR, normalize3, type Mat, type Vec } from '../linalg';
import { rng } from '../synth';

// Project a calibrated 3D point (K = I) to (x/z, y/z).
function proj(R: Mat, t: Vec, X: Vec): [number, number] {
  const x = R[0][0] * X[0] + R[0][1] * X[1] + R[0][2] * X[2] + t[0];
  const y = R[1][0] * X[0] + R[1][1] * X[1] + R[1][2] * X[2] + t[1];
  const z = R[2][0] * X[0] + R[2][1] * X[1] + R[2][2] * X[2] + t[2];
  return [x / z, y / z];
}

describe('bundle-adjustment refinement', () => {
  it('reduces reprojection error from a perturbed pose', () => {
    const cams = rigPreset('face_dtl_90', 3);
    const Rtrue = matMul(cams[1].R, transpose(cams[0].R));
    const ttrue = normalize3([1, 0.2, 0.1]);

    // Random points in front of both cameras → noise-free correspondences.
    const r = rng(17);
    const pts1: [number, number][] = [];
    const pts2: [number, number][] = [];
    for (let i = 0; i < 80; i++) {
      const X: Vec = [(r() - 0.5) * 1.5, (r() - 0.5) * 1.5, 2 + r() * 2];
      pts1.push(proj([[1, 0, 0], [0, 1, 0], [0, 0, 1]], [0, 0, 0], X));
      pts2.push(proj(Rtrue, ttrue, X));
    }

    // Perturb the starting pose.
    const Rstart = matMul(axisAngleToR([0.06, -0.05, 0.04]), Rtrue);
    const tstart = normalize3([1.1, 0.05, 0.25]);
    const startErr = poseReprojError(Rstart, tstart, pts1, pts2);

    const refined = refinePose(Rstart, tstart, pts1, pts2, { iterations: 60 });

    // Monotonic: refinement can never worsen the pose...
    expect(refined.error).toBeLessThanOrEqual(refined.improvedFrom);
    // ...and here it meaningfully reduces reprojection error from the perturbed start.
    expect(refined.error).toBeLessThan(startErr * 0.6);
    expect(refined.error).toBeLessThan(0.1);
  });
});
