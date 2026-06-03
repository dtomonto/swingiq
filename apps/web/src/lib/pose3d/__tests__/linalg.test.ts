// ============================================================
// SwingIQ — pose3d: linalg (SVD) correctness
// ============================================================

import { svd3, matMul, transpose, diag3, det3, type Mat } from '../linalg';
import { rng } from '../synth';

function reconstruct(U: Mat, S: number[], V: Mat): Mat {
  return matMul(matMul(U, diag3(S[0], S[1], S[2])), transpose(V));
}
function maxAbsDiff(a: Mat, b: Mat): number {
  let m = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m = Math.max(m, Math.abs(a[i][j] - b[i][j]));
  return m;
}

describe('svd3', () => {
  it('reconstructs random 3x3 matrices (M = U·S·Vᵀ), S descending', () => {
    const r = rng(3);
    let worst = 0;
    for (let t = 0; t < 30; t++) {
      const M: Mat = [
        [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1],
        [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1],
        [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1],
      ];
      const { U, S, V } = svd3(M);
      expect(S[0]).toBeGreaterThanOrEqual(S[1] - 1e-9);
      expect(S[1]).toBeGreaterThanOrEqual(S[2] - 1e-9);
      // U, V orthonormal (det ≈ ±1)
      expect(Math.abs(Math.abs(det3(U)) - 1)).toBeLessThan(1e-6);
      expect(Math.abs(Math.abs(det3(V)) - 1)).toBeLessThan(1e-6);
      worst = Math.max(worst, maxAbsDiff(reconstruct(U, S, V), M));
    }
    expect(worst).toBeLessThan(1e-6);
  });

  it('handles a rank-2 matrix (smallest singular value ≈ 0)', () => {
    const M: Mat = [[1, 0, 0], [0, 2, 0], [0, 0, 0]];
    const { S } = svd3(M);
    expect(S[0]).toBeCloseTo(2, 5);
    expect(S[1]).toBeCloseTo(1, 5);
    expect(S[2]).toBeLessThan(1e-6);
  });
});
