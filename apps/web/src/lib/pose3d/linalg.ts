// ============================================================
// SwingIQ — pose3d: Linear Algebra Core
// ------------------------------------------------------------
// Small, dependency-free matrix/vector primitives used by the camera
// model and multi-view triangulation. Includes a Jacobi eigensolver
// for symmetric matrices (used to solve the homogeneous DLT system
// A·X = 0 by taking the smallest eigenvector of AᵀA).
// ============================================================

export type Vec = number[];
export type Mat = number[][];

export function zeros(r: number, c: number): Mat {
  return Array.from({ length: r }, () => new Array(c).fill(0));
}

export function identity(n: number): Mat {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m[i][i] = 1;
  return m;
}

export function transpose(a: Mat): Mat {
  const r = a.length;
  const c = a[0].length;
  const t = zeros(c, r);
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) t[j][i] = a[i][j];
  return t;
}

export function matMul(a: Mat, b: Mat): Mat {
  const r = a.length;
  const n = b.length;
  const c = b[0].length;
  const out = zeros(r, c);
  for (let i = 0; i < r; i++) {
    for (let k = 0; k < n; k++) {
      const aik = a[i][k];
      if (aik === 0) continue;
      for (let j = 0; j < c; j++) out[i][j] += aik * b[k][j];
    }
  }
  return out;
}

/** Multiply a matrix by a column vector. */
export function matVec(a: Mat, x: Vec): Vec {
  return a.map((row) => row.reduce((s, v, j) => s + v * x[j], 0));
}

// ── vec3 helpers ──────────────────────────────────────────────
export function sub3(a: Vec, b: Vec): Vec {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function add3(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function scale3(a: Vec, s: number): Vec {
  return [a[0] * s, a[1] * s, a[2] * s];
}
export function dot3(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function cross3(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export function norm3(a: Vec): number {
  return Math.hypot(a[0], a[1], a[2]);
}
export function normalize3(a: Vec): Vec {
  const n = norm3(a);
  return n > 1e-9 ? scale3(a, 1 / n) : [0, 0, 0];
}

// ── Rotations ─────────────────────────────────────────────────
export function rotX(rad: number): Mat {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [[1, 0, 0], [0, c, -s], [0, s, c]];
}
export function rotY(rad: number): Mat {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
}
export function rotZ(rad: number): Mat {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}
/** Z-Y-X intrinsic Euler rotation (yaw, pitch, roll), radians. */
export function euler(yaw: number, pitch: number, roll: number): Mat {
  return matMul(matMul(rotY(yaw), rotX(pitch)), rotZ(roll));
}

// ── Symmetric eigensolver (cyclic Jacobi) ─────────────────────
/**
 * Eigen-decomposition of a small symmetric matrix. Returns eigenvalues and
 * eigenvectors (columns of `vectors`). Robust for the 4×4 systems we solve.
 */
export function jacobiEigenSymmetric(input: Mat, maxSweeps = 100): { values: Vec; vectors: Mat } {
  const n = input.length;
  const a = input.map((row) => row.slice());
  const v = identity(n);

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    // off-diagonal magnitude
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off < 1e-20) break;

    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-18) continue;
        const app = a[p][p], aqq = a[q][q], apq = a[p][q];
        const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
        const c = Math.cos(phi), s = Math.sin(phi);

        for (let i = 0; i < n; i++) {
          const aip = a[i][p], aiq = a[i][q];
          a[i][p] = c * aip - s * aiq;
          a[i][q] = s * aip + c * aiq;
        }
        for (let i = 0; i < n; i++) {
          const api = a[p][i], aqi = a[q][i];
          a[p][i] = c * api - s * aqi;
          a[q][i] = s * api + c * aqi;
        }
        for (let i = 0; i < n; i++) {
          const vip = v[i][p], viq = v[i][q];
          v[i][p] = c * vip - s * viq;
          v[i][q] = s * vip + c * viq;
        }
      }
    }
  }

  const values = a.map((row, i) => row[i]);
  return { values, vectors: v };
}

/** The eigenvector of the smallest eigenvalue of a symmetric matrix. */
export function smallestEigenvector(symmetric: Mat): Vec {
  const { values, vectors } = jacobiEigenSymmetric(symmetric);
  let idx = 0;
  for (let i = 1; i < values.length; i++) if (values[i] < values[idx]) idx = i;
  return vectors.map((row) => row[idx]);
}
