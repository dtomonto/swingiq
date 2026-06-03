// ============================================================
// SwingIQ — pose3d: Tiny MLP (forward + Adam backprop)
// ------------------------------------------------------------
// A dependency-free 2-layer perceptron (in → ReLU hidden → out) used
// for the single-view 3D lifting model. The same forward pass runs in
// the browser at inference time; the trainer here produces the weights
// (run offline via the gated training test, then committed as JSON).
// ============================================================

export interface MLP {
  inDim: number;
  hidden: number;
  outDim: number;
  W1: Float64Array; // [hidden * inDim]
  b1: Float64Array; // [hidden]
  W2: Float64Array; // [outDim * hidden]
  b2: Float64Array; // [outDim]
}

export interface MLPJson {
  inDim: number;
  hidden: number;
  outDim: number;
  W1: number[];
  b1: number[];
  W2: number[];
  b2: number[];
  meta?: Record<string, unknown>;
}

function randn(r: () => number): number {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function createMLP(inDim: number, hidden: number, outDim: number, r: () => number): MLP {
  const he1 = Math.sqrt(2 / inDim);
  const he2 = Math.sqrt(2 / hidden);
  const W1 = Float64Array.from({ length: hidden * inDim }, () => randn(r) * he1);
  const W2 = Float64Array.from({ length: outDim * hidden }, () => randn(r) * he2);
  return { inDim, hidden, outDim, W1, b1: new Float64Array(hidden), W2, b2: new Float64Array(outDim) };
}

export interface Forward {
  hPre: Float64Array;
  h: Float64Array;
  y: Float64Array;
}

export function forward(net: MLP, x: ArrayLike<number>): Forward {
  const { inDim, hidden, outDim, W1, b1, W2, b2 } = net;
  const hPre = new Float64Array(hidden);
  const h = new Float64Array(hidden);
  for (let o = 0; o < hidden; o++) {
    let s = b1[o];
    const base = o * inDim;
    for (let i = 0; i < inDim; i++) s += W1[base + i] * x[i];
    hPre[o] = s;
    h[o] = s > 0 ? s : 0;
  }
  const y = new Float64Array(outDim);
  for (let o = 0; o < outDim; o++) {
    let s = b2[o];
    const base = o * hidden;
    for (let i = 0; i < hidden; i++) s += W2[base + i] * h[i];
    y[o] = s;
  }
  return { hPre, h, y };
}

export function predict(net: MLP, x: ArrayLike<number>): number[] {
  return Array.from(forward(net, x).y);
}

export function toJson(net: MLP, meta?: Record<string, unknown>): MLPJson {
  return {
    inDim: net.inDim,
    hidden: net.hidden,
    outDim: net.outDim,
    W1: Array.from(net.W1, (v) => +v.toFixed(5)),
    b1: Array.from(net.b1, (v) => +v.toFixed(5)),
    W2: Array.from(net.W2, (v) => +v.toFixed(5)),
    b2: Array.from(net.b2, (v) => +v.toFixed(5)),
    meta,
  };
}

export function fromJson(j: MLPJson): MLP {
  return {
    inDim: j.inDim,
    hidden: j.hidden,
    outDim: j.outDim,
    W1: Float64Array.from(j.W1),
    b1: Float64Array.from(j.b1),
    W2: Float64Array.from(j.W2),
    b2: Float64Array.from(j.b2),
  };
}

export function meanMSE(net: MLP, X: number[][], Y: number[][]): number {
  let s = 0;
  for (let n = 0; n < X.length; n++) {
    const { y } = forward(net, X[n]);
    for (let o = 0; o < net.outDim; o++) {
      const d = y[o] - Y[n][o];
      s += d * d;
    }
  }
  return s / (X.length * net.outDim);
}

// ── Adam trainer ──────────────────────────────────────────────
export interface TrainOpts {
  epochs: number;
  batch: number;
  lr: number;
  r: () => number;
  onEpoch?: (epoch: number, loss: number) => void;
}

interface Adam {
  mW1: Float64Array; vW1: Float64Array;
  mb1: Float64Array; vb1: Float64Array;
  mW2: Float64Array; vW2: Float64Array;
  mb2: Float64Array; vb2: Float64Array;
}
function zerosLike(net: MLP): Adam {
  return {
    mW1: new Float64Array(net.W1.length), vW1: new Float64Array(net.W1.length),
    mb1: new Float64Array(net.b1.length), vb1: new Float64Array(net.b1.length),
    mW2: new Float64Array(net.W2.length), vW2: new Float64Array(net.W2.length),
    mb2: new Float64Array(net.b2.length), vb2: new Float64Array(net.b2.length),
  };
}

export function train(net: MLP, X: number[][], Y: number[][], opts: TrainOpts): number[] {
  const { inDim, hidden, outDim } = net;
  const adam = zerosLike(net);
  const b1c = 0.9, b2c = 0.999, eps = 1e-8;
  let step = 0;
  const N = X.length;
  const idx = Array.from({ length: N }, (_, i) => i);
  const history: number[] = [];

  // gradient accumulators
  const gW1 = new Float64Array(net.W1.length);
  const gb1 = new Float64Array(net.b1.length);
  const gW2 = new Float64Array(net.W2.length);
  const gb2 = new Float64Array(net.b2.length);

  const adamUpdate = (
    p: Float64Array, g: Float64Array, m: Float64Array, v: Float64Array, lr: number, t: number,
  ) => {
    const bc1 = 1 - Math.pow(b1c, t);
    const bc2 = 1 - Math.pow(b2c, t);
    for (let i = 0; i < p.length; i++) {
      m[i] = b1c * m[i] + (1 - b1c) * g[i];
      v[i] = b2c * v[i] + (1 - b2c) * g[i] * g[i];
      const mh = m[i] / bc1;
      const vh = v[i] / bc2;
      p[i] -= (lr * mh) / (Math.sqrt(vh) + eps);
    }
  };

  for (let epoch = 0; epoch < opts.epochs; epoch++) {
    // shuffle
    for (let i = N - 1; i > 0; i--) {
      const k = Math.floor(opts.r() * (i + 1));
      [idx[i], idx[k]] = [idx[k], idx[i]];
    }

    for (let b = 0; b < N; b += opts.batch) {
      const end = Math.min(N, b + opts.batch);
      const m = end - b;
      gW1.fill(0); gb1.fill(0); gW2.fill(0); gb2.fill(0);

      for (let s = b; s < end; s++) {
        const xi = X[idx[s]];
        const yi = Y[idx[s]];
        const { hPre, h, y } = forward(net, xi);

        // dL/dy  (MSE, averaged over batch * outDim)
        const dy = new Float64Array(outDim);
        for (let o = 0; o < outDim; o++) dy[o] = (2 * (y[o] - yi[o])) / (m * outDim);

        // output grads + backprop into hidden
        const dh = new Float64Array(hidden);
        for (let o = 0; o < outDim; o++) {
          const base = o * hidden;
          const dyo = dy[o];
          gb2[o] += dyo;
          for (let i = 0; i < hidden; i++) {
            gW2[base + i] += dyo * h[i];
            dh[i] += dyo * net.W2[base + i];
          }
        }
        // ReLU grad + input layer grads
        for (let o = 0; o < hidden; o++) {
          if (hPre[o] <= 0) continue;
          const dpre = dh[o];
          gb1[o] += dpre;
          const base = o * inDim;
          for (let i = 0; i < inDim; i++) gW1[base + i] += dpre * xi[i];
        }
      }

      // Global-norm gradient clipping for stability.
      const CLIP = 5;
      let gn = 0;
      for (const g of [gW1, gb1, gW2, gb2]) for (let i = 0; i < g.length; i++) gn += g[i] * g[i];
      gn = Math.sqrt(gn);
      if (gn > CLIP) {
        const scale = CLIP / gn;
        for (const g of [gW1, gb1, gW2, gb2]) for (let i = 0; i < g.length; i++) g[i] *= scale;
      }

      step++;
      adamUpdate(net.W1, gW1, adam.mW1, adam.vW1, opts.lr, step);
      adamUpdate(net.b1, gb1, adam.mb1, adam.vb1, opts.lr, step);
      adamUpdate(net.W2, gW2, adam.mW2, adam.vW2, opts.lr, step);
      adamUpdate(net.b2, gb2, adam.mb2, adam.vb2, opts.lr, step);
    }

    const loss = meanMSE(net, X, Y);
    history.push(loss);
    opts.onEpoch?.(epoch, loss);
  }
  return history;
}
