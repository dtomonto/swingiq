// ============================================================
// Tests for the pose-fusion layer (model agreement + best-source selection).
// ============================================================

import { fusePoses } from '../pose-fusion';
import type { PoseFrame, PoseLandmark } from '@/lib/pose';
import { SHARED_MP_INDICES } from '@/lib/pose';

/** A 33-landmark frame: all joints at (bx,by) with `vis`, optional per-index overrides. */
function poseFrame(
  t: number,
  bx: number,
  by: number,
  vis: number,
  overrides: Record<number, Partial<PoseLandmark>> = {},
): PoseFrame {
  const landmarks: PoseLandmark[] = Array.from({ length: 33 }, () => ({ x: bx, y: by, z: 0, visibility: vis }));
  for (const [idx, o] of Object.entries(overrides)) {
    landmarks[+idx] = { x: o.x ?? bx, y: o.y ?? by, z: 0, visibility: o.visibility ?? vis };
  }
  return { timestampSeconds: t, personCount: 1, landmarks };
}

describe('fusePoses', () => {
  it('returns the primary unchanged when there is no validator', () => {
    const primary = [poseFrame(0, 0.5, 0.5, 0.9)];
    const r = fusePoses(primary, []);
    expect(r.frames).toBe(primary);
    expect(r.agreementLabel).toBe('none');
    expect(r.jointsComparable).toBe(0);
  });

  it('scores identical tracks as high agreement with no outliers', () => {
    const primary = [poseFrame(0, 0.5, 0.5, 0.8), poseFrame(0.1, 0.5, 0.5, 0.8)];
    const validator = [poseFrame(0, 0.5, 0.5, 0.8), poseFrame(0.1, 0.5, 0.5, 0.8)];
    const r = fusePoses(primary, validator);
    expect(r.modelAgreementScore).toBeCloseTo(1, 3);
    expect(r.agreementLabel).toBe('high');
    expect(r.outliersRejected).toBe(0);
    expect(r.jointsComparable).toBe(2 * SHARED_MP_INDICES.length);
  });

  it('fills a joint the primary missed using the validator', () => {
    // Primary cannot see the left wrist (idx 15); validator can.
    const primary = [poseFrame(0, 0.5, 0.5, 0.8, { 15: { visibility: 0.05 } })];
    const validator = [poseFrame(0, 0.5, 0.5, 0.8, { 15: { x: 0.3, y: 0.6, visibility: 0.9 } })];
    const r = fusePoses(primary, validator);
    expect(r.jointsFromValidator).toBeGreaterThanOrEqual(1);
    expect(r.frames[0].landmarks[15].x).toBeCloseTo(0.3);
    expect(r.frames[0].landmarks[15].visibility).toBeCloseTo(0.9);
  });

  it('rejects a gross-disagreement (outlier) joint instead of trusting it blindly', () => {
    // Validator puts the left wrist far away with HIGHER confidence than primary.
    const primary = [poseFrame(0, 0.5, 0.5, 0.6, { 15: { x: 0.5, y: 0.5, visibility: 0.6 } })];
    const validator = [poseFrame(0, 0.5, 0.5, 0.6, { 15: { x: 0.95, y: 0.95, visibility: 0.95 } })];
    const r = fusePoses(primary, validator);
    expect(r.outliersRejected).toBeGreaterThanOrEqual(1);
    // The far validator point is adopted only because it's higher-confidence,
    // but it's COUNTED as an outlier so the agreement score drops.
    expect(r.modelAgreementScore).toBeLessThan(1);
  });

  it('labels low agreement when the engines consistently disagree', () => {
    const primary = [poseFrame(0, 0.3, 0.3, 0.8)];
    const validator = [poseFrame(0, 0.5, 0.5, 0.8)]; // ~0.28 away on every joint
    const r = fusePoses(primary, validator);
    expect(['low', 'none']).toContain(r.agreementLabel);
    expect(r.modelAgreementScore).toBeLessThan(0.6);
  });

  it('skips validator frames that cannot be time-aligned', () => {
    const primary = [poseFrame(0, 0.5, 0.5, 0.8)];
    const validator = [poseFrame(5, 0.5, 0.5, 0.8)]; // 5s away — outside tolerance
    const r = fusePoses(primary, validator);
    expect(r.jointsComparable).toBe(0);
    expect(r.frames[0]).toBe(primary[0]); // untouched
  });
});
