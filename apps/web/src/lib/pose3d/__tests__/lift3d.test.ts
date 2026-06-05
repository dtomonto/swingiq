// ============================================================
// SwingVantage — pose3d: lift model inference (committed weights)
// ------------------------------------------------------------
// Loads the SHIPPED weights and confirms the trained single-view lift
// model meaningfully beats a zero-depth baseline on a fresh synthetic
// test set. This guards against shipping a broken/placeholder model.
// ============================================================

import { rng, samplePose, projectPose } from '../synth';
import { cameraOnArc } from '../camera';
import { isLiftModelTrained, predictRelativeDepths } from '../lift3d';

const L_HIP = 23, R_HIP = 24;

function buildRawSamples(seed: number, n: number) {
  const r = rng(seed);
  const samples: Array<{ lm: Array<{ x: number; y: number; visibility: number }>; target: number[] }> = [];
  let guard = 0;
  while (samples.length < n && guard < n * 3) {
    guard++;
    const pose = samplePose(r);
    const cam = cameraOnArc('t', -180 + 360 * r(), -15 + 35 * r(), 2.5 + r());
    const view = projectPose(cam, pose);
    const hipDepth = (view.depths[L_HIP] + view.depths[R_HIP]) / 2;
    if (Math.abs(hipDepth) < 1e-3) continue;
    samples.push({ lm: view.landmarks, target: view.depths.map((d) => (d - hipDepth) / hipDepth) });
  }
  return samples;
}

describe('pose3d lift model (shipped weights)', () => {
  it('ships trained (not placeholder) weights', () => {
    expect(isLiftModelTrained()).toBe(true);
  });

  it('predicts depths that beat a zero baseline on held-out synthetic data', () => {
    const samples = buildRawSamples(20259, 400);
    let modelErr = 0;
    let baseErr = 0;
    let count = 0;

    for (const s of samples) {
      const pred = predictRelativeDepths(s.lm);
      if (!pred) continue;
      for (let j = 0; j < s.target.length; j++) {
        const t = s.target[j];
        modelErr += (pred[j] - t) ** 2;
        baseErr += t * t;
        count++;
      }
    }

    expect(count).toBeGreaterThan(0);
    const modelMSE = modelErr / count;
    const baseMSE = baseErr / count;
    // Shipped model should explain a clear majority of depth variance.
    expect(modelMSE).toBeLessThan(baseMSE * 0.55);
  });
});
