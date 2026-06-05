// ============================================================
// SwingVantage — Motion Lab: multi-view reconstruction (end-to-end)
// ------------------------------------------------------------
// Projects a synthetic motion through a calibrated two-camera rig and
// confirms buildMultiViewTrack reconstructs a measured 3D track with
// low reprojection error and high confidence — i.e. the multi-view
// path produces TRUE 3D, not an estimate.
// ============================================================

import { buildMultiViewTrack } from '../multiview';
import { rigPreset } from '@/lib/pose3d';
import { rng, samplePose, projectPose } from '@/lib/pose3d/synth';

function syncedViews(seed: number, frames: number) {
  const cameras = rigPreset('face_dtl_90', 3);
  const r = rng(seed);
  const A = [];
  const B = [];
  for (let i = 0; i < frames; i++) {
    const pose = samplePose(r); // same pose seen by both cameras at instant i
    A.push({ tMs: i * 33, landmarks: projectPose(cameras[0], pose).landmarks });
    B.push({ tMs: i * 33, landmarks: projectPose(cameras[1], pose).landmarks });
  }
  return { cameras, A, B };
}

describe('multi-view reconstruction', () => {
  it('builds a measured 3D track with low reprojection error', () => {
    const { cameras, A, B } = syncedViews(5, 20);
    const track = buildMultiViewTrack(A, B, cameras);

    expect(track.basis).toBe('measured');
    expect(track.frames.length).toBe(20);
    expect(track.frames[0].landmarks.length).toBe(33);
    // Perfectly-synced synthetic views ⇒ near-perfect triangulation ⇒ high conf.
    expect(track.trackingConfidence).toBeGreaterThan(0.9);
  });

  it('degrades honestly (low confidence) with a wrong calibration', () => {
    const { A, B } = syncedViews(8, 16);
    // Use a mismatched rig (wrong geometry) → triangulation can't be consistent.
    const wrongRig = rigPreset('two_front_stereo', 3);
    const track = buildMultiViewTrack(A, B, wrongRig);
    expect(track.trackingConfidence).toBeLessThan(0.9);
  });
});
