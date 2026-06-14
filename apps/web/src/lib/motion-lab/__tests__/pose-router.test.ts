// ============================================================
// Tests for the pose router's pure decision helpers (no DOM).
// ============================================================

import {
  trackVisibility,
  aggregateStats,
  shouldAttemptRecovery,
  chooseBetterPass,
  detectedHasMultiplePeople,
  describeEnginePath,
} from '../pose-router';
import type { PoseFrame } from '@/lib/pose';
import type { EnhancementPlan } from '@/lib/frame-enhance';

const frame = (vis: number[], personCount = 1): PoseFrame => ({
  timestampSeconds: 0,
  personCount,
  landmarks: vis.map((v) => ({ x: 0.5, y: 0.5, z: 0, visibility: v })),
});

const PLAN: EnhancementPlan = { gamma: 0.6, blackPoint: 0, whitePoint: 255, sharpen: false, reason: 'test' };

describe('trackVisibility', () => {
  it('is 0 for no frames', () => expect(trackVisibility([])).toBe(0));
  it('averages landmark visibility across frames', () => {
    expect(trackVisibility([frame([0.4, 0.6]), frame([0.5, 0.5])])).toBeCloseTo(0.5, 5);
  });
});

describe('aggregateStats', () => {
  it('returns null when no stats were measured', () => {
    expect(aggregateStats(undefined)).toBeNull();
    expect(aggregateStats([])).toBeNull();
  });
  it('averages each luma field', () => {
    const a = aggregateStats([
      { brightness: 0.2, contrast: 0.1, sharpness: 0.3 },
      { brightness: 0.4, contrast: 0.3, sharpness: 0.5 },
    ]);
    expect(a).not.toBeNull();
    expect(a!.brightness).toBeCloseTo(0.3, 6);
    expect(a!.contrast).toBeCloseTo(0.2, 6);
    expect(a!.sharpness).toBeCloseTo(0.4, 6);
  });
});

describe('shouldAttemptRecovery', () => {
  it('never recovers without an enhancement plan', () => {
    expect(shouldAttemptRecovery(2, 10, 0.2, null)).toBe(false);
  });
  it('recovers when coverage is low', () => {
    expect(shouldAttemptRecovery(3, 10, 0.8, PLAN)).toBe(true); // 3 < ceil(10*0.6)=6
  });
  it('recovers when confidence is low', () => {
    expect(shouldAttemptRecovery(9, 10, 0.4, PLAN)).toBe(true);
  });
  it('does not recover a strong first pass', () => {
    expect(shouldAttemptRecovery(9, 10, 0.8, PLAN)).toBe(false);
  });
  it('does not recover with no attempted frames', () => {
    expect(shouldAttemptRecovery(0, 0, 0, PLAN)).toBe(false);
  });
});

describe('chooseBetterPass (keep-if-better)', () => {
  it('adopts the retry when it recovers more poses', () => {
    expect(chooseBetterPass({ posed: 4, confidence: 0.8 }, { posed: 7, confidence: 0.5 })).toBe('retry');
  });
  it('adopts the retry on equal count with clearly higher confidence', () => {
    expect(chooseBetterPass({ posed: 6, confidence: 0.5 }, { posed: 6, confidence: 0.6 })).toBe('retry');
  });
  it('keeps the original on equal count and similar confidence', () => {
    expect(chooseBetterPass({ posed: 6, confidence: 0.5 }, { posed: 6, confidence: 0.51 })).toBe('first');
  });
  it('keeps the original when the retry recovers fewer poses', () => {
    expect(chooseBetterPass({ posed: 8, confidence: 0.4 }, { posed: 5, confidence: 0.9 })).toBe('first');
  });
});

describe('detectedHasMultiplePeople', () => {
  it('is true when any frame saw more than one person', () => {
    expect(detectedHasMultiplePeople([frame([0.9], 1), frame([0.9], 2)])).toBe(true);
  });
  it('is false for single-person frames', () => {
    expect(detectedHasMultiplePeople([frame([0.9], 1), frame([0.9], 1)])).toBe(false);
  });
});

describe('describeEnginePath', () => {
  it('names the engine, primary selection, and enhancement', () => {
    expect(describeEnginePath('lite', false)).toBe('mediapipe-lite(primary-of-2)');
    expect(describeEnginePath('heavy', true)).toBe('mediapipe-heavy(primary-of-2)+enhanced');
  });
});
