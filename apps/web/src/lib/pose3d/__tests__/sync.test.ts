// ============================================================
// SwingIQ — pose3d: temporal sync correctness
// ============================================================

import { bestLag, syncViews, motionSignal } from '../sync';
import { rng, samplePose, projectPose } from '../synth';
import { rigPreset } from '../camera';

describe('temporal sync', () => {
  it('recovers a known lag from a 1-D signal via cross-correlation', () => {
    const base = Array.from({ length: 40 }, (_, i) => Math.sin(i * 0.4) + 0.3 * Math.sin(i * 0.13));
    const shift = 4;
    const a = base.slice(shift);            // a starts 4 frames "later"
    const b = base.slice(0, base.length - shift);
    // a[i] ≈ b[i+shift]  → bestLag(a,b) ≈ +shift
    expect(bestLag(a, b, 8)).toBe(shift);
  });

  it('syncs two views generated with a known frame offset', () => {
    const cam = rigPreset('face_dtl_90', 3)[0];
    const r = rng(4);
    const poses = Array.from({ length: 30 }, () => samplePose(r));
    const offset = 3;
    // viewA sees poses[offset..], viewB sees poses[0..] (B leads by `offset`).
    const viewA = poses.slice(offset).map((p, i) => ({ tMs: i * 33, landmarks: projectPose(cam, p).landmarks }));
    const viewB = poses.slice(0, poses.length - offset).map((p, i) => ({ tMs: i * 33, landmarks: projectPose(cam, p).landmarks }));

    const { lag, a, b } = syncViews(viewA, viewB, 8);
    expect(Math.abs(lag - offset)).toBeLessThanOrEqual(1);
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThan(10);
  });

  it('motionSignal is non-trivial for a real motion', () => {
    const cam = rigPreset('face_dtl_90', 3)[0];
    const r = rng(9);
    const frames = Array.from({ length: 20 }, () => samplePose(r)).map((p) => ({ landmarks: projectPose(cam, p).landmarks }));
    const sig = motionSignal(frames);
    expect(sig.length).toBe(20);
    expect(Math.max(...sig)).toBeGreaterThan(0);
  });
});
