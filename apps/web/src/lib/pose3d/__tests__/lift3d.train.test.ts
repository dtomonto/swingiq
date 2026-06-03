// ============================================================
// SwingIQ — pose3d: lift model TRAINER (offline, gated)
// ------------------------------------------------------------
// Trains the single-view 3D lifting MLP on procedurally-generated
// synthetic projections, validates it explains most held-out depth
// variance, and writes the committed weights JSON. Gated behind
// TRAIN_POSE3D=1 so it never slows normal test runs.
//
//   Run:  TRAIN_POSE3D=1 npx jest lift3d.train
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { rng, samplePose, projectPose, toLiftSample } from '../synth';
import { cameraOnArc } from '../camera';
import { createMLP, train, meanMSE, toJson } from '../mlp';

const RUN = !!process.env.TRAIN_POSE3D;
const suite = RUN ? describe : describe.skip;

function buildDataset(seed: number, n: number): { X: number[][]; Y: number[][] } {
  const r = rng(seed);
  const X: number[][] = [];
  const Y: number[][] = [];
  let guard = 0;
  while (X.length < n && guard < n * 3) {
    guard++;
    const pose = samplePose(r);
    const az = -180 + 360 * r();
    const el = -15 + 35 * r();
    const dist = 2.5 + r();
    const cam = cameraOnArc('train', az, el, dist);
    const view = projectPose(cam, pose);
    const sample = toLiftSample(view, pose);
    if (sample) {
      X.push(sample.input);
      Y.push(sample.target);
    }
  }
  return { X, Y };
}

/** Baseline MSE if we predicted zero depth for every joint (= target variance). */
function baselineMSE(Y: number[][]): number {
  let s = 0, n = 0;
  for (const row of Y) for (const v of row) { s += v * v; n++; }
  return s / n;
}

suite('pose3d lift model — training', () => {
  jest.setTimeout(180000);

  it('trains on synthetic data, beats baseline, and writes weights', () => {
    const train_ = buildDataset(7, 4500);
    const test_ = buildDataset(99, 900);

    const base = baselineMSE(test_.Y);
    const r = rng(123);
    const net = createMLP(66, 96, 33, r);

    let lastLoss = Infinity;
    train(net, train_.X, train_.Y, {
      epochs: 60, batch: 64, lr: 8e-4, r,
      onEpoch: (e, loss) => { lastLoss = loss; if (e % 10 === 0) console.log(`epoch ${e} train MSE ${loss.toFixed(5)}`); },
    });

    const testMSE = meanMSE(net, test_.X, test_.Y);
    console.log(`baseline(test) ${base.toFixed(5)} | trained(test) ${testMSE.toFixed(5)} | train ${lastLoss.toFixed(5)}`);

    // The learned prior must explain the large majority of depth variance.
    expect(testMSE).toBeLessThan(base * 0.5);

    const outPath = path.join(__dirname, '..', 'weights', 'lift3d.json');
    const json = toJson(net, {
      trained: true,
      arch: 'mlp-66-96-33-relu',
      trainedOn: 'synthetic-skeleton-projections',
      trainSamples: train_.X.length,
      testSamples: test_.X.length,
      baselineTestMSE: +base.toFixed(5),
      trainedTestMSE: +testMSE.toFixed(5),
      varianceExplained: +(1 - testMSE / base).toFixed(3),
      createdAt: new Date().toISOString(),
      note: 'Self-contained lifting prior trained on synthetic projections. Honest basis: ai_inferred. Fine-tune on real mocap for production grade.',
    });
    fs.writeFileSync(outPath, JSON.stringify(json));
    console.log(`wrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);

    const reread = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    expect(reread.hidden).toBe(96);
    expect(reread.meta.trained).toBe(true);
  });
});
