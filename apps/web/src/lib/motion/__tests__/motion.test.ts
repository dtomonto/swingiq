// ============================================================
// SwingIQ — Motion Engine: Unit Tests (scaffolding)
// ------------------------------------------------------------
// Confirms the readiness layer is SSR-safe, refuses to fake
// precision, and produces deterministic fingerprints.
// ============================================================

import {
  detectMotionCapabilities,
  weakestBasis,
  computeMotionScore,
  buildSwingFingerprint,
  computeMotionScoreFromPose,
  swingFingerprintFromPose,
  mockPoseProvider,
  mediapipePoseProvider,
  isPoseEngineEnabled,
  getActivePoseProvider,
} from '..';
import type { PoseSequence } from '..';

describe('motion capabilities', () => {
  it('probes safely with no browser globals (returns booleans)', () => {
    const caps = detectMotionCapabilities();
    expect(typeof caps.webgpu).toBe('boolean');
    expect(typeof caps.webnn).toBe('boolean');
    expect(typeof caps.offscreenCanvas).toBe('boolean');
    // navigator is undefined in jsdom-less node → no GPU/ML.
    expect(caps.webgpu).toBe(false);
  });
});

describe('mock pose provider', () => {
  it('is available but returns placeholder, zero-confidence data', async () => {
    expect(mockPoseProvider.isAvailable()).toBe(true);
    const seq = await mockPoseProvider.estimate({
      frames: [{ timestampMs: 0, image: 'x' }, { timestampMs: 33, image: 'y' }],
    });
    expect(seq.basis).toBe('placeholder');
    expect(seq.confidence).toBe(0);
    expect(seq.frameCount).toBe(2);
    // It must NOT invent landmark positions.
    expect(seq.frames).toHaveLength(0);
  });
});

describe('data-basis honesty', () => {
  it('reports the weakest basis among inputs', () => {
    expect(weakestBasis(['measured', 'estimated'])).toBe('estimated');
    expect(weakestBasis(['measured', 'placeholder', 'user_entered'])).toBe('placeholder');
    expect(weakestBasis([])).toBe('placeholder');
  });

  it('keeps a disclaimer unless the score is measured', () => {
    const est = computeMotionScore(
      [{ id: 'a', label: 'A', score: 80, weight: 1 }],
      'estimated',
    );
    expect(est.overall).toBe(80);
    expect(est.disclaimer).toBeTruthy();

    const measured = computeMotionScore(
      [{ id: 'a', label: 'A', score: 80, weight: 1 }],
      'measured',
    );
    expect(measured.disclaimer).toBeNull();
  });

  it('clamps and weights the overall score', () => {
    const s = computeMotionScore([
      { id: 'a', label: 'A', score: 100, weight: 3 },
      { id: 'b', label: 'B', score: 0, weight: 1 },
    ], 'estimated');
    expect(s.overall).toBe(75);
  });
});

describe('mediapipe provider (flagged)', () => {
  it('is disabled by default and falls back to the mock', () => {
    expect(isPoseEngineEnabled()).toBe(false);
    expect(mediapipePoseProvider.isAvailable()).toBe(false);
    // With the flag off / no browser, the active provider is the honest mock.
    expect(getActivePoseProvider().id).toBe('mock');
  });
});

describe('pose → score / fingerprint', () => {
  function seq(partial: Partial<PoseSequence>): PoseSequence {
    return {
      schema: 'mediapipe_pose_33',
      fps: 30,
      frameCount: 4,
      frames: [],
      basis: 'estimated',
      confidence: 0,
      ...partial,
    };
  }

  it('derives a transparent, disclaimed score from an estimated sequence', () => {
    const s = seq({
      frameCount: 2,
      frames: [
        { timestampMs: 0, landmarks: [{ x: 0.4, y: 0.5, visibility: 0.9 }] },
        { timestampMs: 33, landmarks: [{ x: 0.6, y: 0.5, visibility: 0.7 }] },
      ],
    });
    const score = computeMotionScoreFromPose(s);
    expect(score.basis).toBe('estimated');
    expect(score.disclaimer).toBeTruthy();
    expect(score.overall).toBeGreaterThan(0);
  });

  it('produces a deterministic fingerprint inheriting the basis', () => {
    const s = seq({ frameCount: 2, frames: [{ timestampMs: 0, landmarks: [{ x: 0.5, y: 0.5, visibility: 0.8 }] }] });
    const fp = swingFingerprintFromPose('baseball', s);
    expect(fp.basis).toBe('estimated');
    expect(fp.signature).toMatch(/^fp_[0-9a-f]{8}$/);
  });

  it('placeholder (empty) sequence scores 0 and stays disclaimed', () => {
    const score = computeMotionScoreFromPose(seq({ basis: 'placeholder', frames: [], frameCount: 0 }));
    expect(score.overall).toBe(0);
    expect(score.disclaimer).toBeTruthy();
  });
});

describe('swing fingerprint', () => {
  it('is deterministic for the same descriptors regardless of timestamp', () => {
    const a = buildSwingFingerprint('golf', { tempoRatio: 3.1, seq: 0.7 }, 'estimated', '2026-01-01');
    const b = buildSwingFingerprint('golf', { seq: 0.7, tempoRatio: 3.1 }, 'estimated', '2026-06-01');
    expect(a.signature).toBe(b.signature);
    expect(a.signature).toMatch(/^fp_[0-9a-f]{8}$/);
  });

  it('changes when the movement pattern changes', () => {
    const a = buildSwingFingerprint('golf', { tempoRatio: 3.1 });
    const b = buildSwingFingerprint('golf', { tempoRatio: 2.4 });
    expect(a.signature).not.toBe(b.signature);
  });
});
