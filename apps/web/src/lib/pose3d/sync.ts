// ============================================================
// SwingIQ — pose3d: Temporal Sync (motion cross-correlation)
// ------------------------------------------------------------
// Two phones don't start recording at the same instant. Before
// triangulating, we estimate the global frame offset between the views
// by cross-correlating a per-frame motion signal (mean landmark speed)
// — the standard "sync two videos by motion" technique — then pair
// frames at that lag. Per-frame reprojection search (in multiview.ts)
// then mops up any residual jitter.
// ============================================================

export interface FrameLm {
  landmarks: Array<{ x: number; y: number; visibility: number }>;
}

/** Per-frame whole-body motion energy (mean visible landmark speed). */
export function motionSignal(frames: FrameLm[]): number[] {
  const out = new Array(frames.length).fill(0);
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1].landmarks;
    const b = frames[i].landmarks;
    const m = Math.min(a.length, b.length);
    let sum = 0;
    let w = 0;
    for (let j = 0; j < m; j++) {
      const vis = Math.min(a[j].visibility, b[j].visibility);
      if (vis < 0.3) continue;
      sum += vis * Math.hypot(b[j].x - a[j].x, b[j].y - a[j].y);
      w += vis;
    }
    out[i] = w > 0 ? sum / w : 0;
  }
  if (out.length > 1) out[0] = out[1];
  return out;
}

/** Normalized cross-correlation of a vs b shifted by lag L (a[i] ↔ b[i+L]). */
function corrAt(a: number[], b: number[], L: number): number {
  const lo = Math.max(0, -L);
  const hi = Math.min(a.length, b.length - L);
  if (hi - lo < 4) return -Infinity;
  let ma = 0, mb = 0;
  for (let i = lo; i < hi; i++) { ma += a[i]; mb += b[i + L]; }
  const n = hi - lo;
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = lo; i < hi; i++) {
    const xa = a[i] - ma;
    const xb = b[i + L] - mb;
    num += xa * xb; da += xa * xa; db += xb * xb;
  }
  return num / (Math.sqrt(da * db) + 1e-9);
}

/** Best integer lag L (in [-maxLag, maxLag]) aligning a to b. */
export function bestLag(a: number[], b: number[], maxLag: number): number {
  let best = 0;
  let bestCorr = -Infinity;
  for (let L = -maxLag; L <= maxLag; L++) {
    const c = corrAt(a, b, L);
    if (c > bestCorr) { bestCorr = c; best = L; }
  }
  return best;
}

/** Pair items at the given lag, returning equal-length aligned slices. */
export function alignByLag<T>(a: T[], b: T[], lag: number): { a: T[]; b: T[] } {
  const lo = Math.max(0, -lag);
  const hi = Math.min(a.length, b.length - lag);
  if (hi - lo < 2) return { a: a.slice(), b: b.slice(0, a.length) };
  return { a: a.slice(lo, hi), b: b.slice(lo + lag, hi + lag) };
}

/** Convenience: estimate lag from two view sequences and return aligned views. */
export function syncViews<T extends FrameLm>(viewA: T[], viewB: T[], maxLag = 6): { a: T[]; b: T[]; lag: number } {
  const lag = bestLag(motionSignal(viewA), motionSignal(viewB), Math.min(maxLag, Math.max(1, Math.floor(Math.min(viewA.length, viewB.length) / 3))));
  const aligned = alignByLag(viewA, viewB, lag);
  return { a: aligned.a, b: aligned.b, lag };
}
