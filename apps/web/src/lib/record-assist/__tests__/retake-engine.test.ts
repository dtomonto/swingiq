import { evaluateRetake } from '../engines/retake-engine';
import { evaluateFrameQuality } from '../engines/frame-quality-engine';
import { getPreset } from '../engines/sport-preset-engine';
import { makeFrame } from './fixtures';
import type { FrameQualitySignals } from '../types';

const golfIron = getPreset('golf', 'iron');
const goodQ = evaluateFrameQuality(makeFrame({ orientation: 'landscape' }), golfIron);

describe('RetakeEngine', () => {
  it('accepts a clean, well-framed clip', () => {
    const rec = evaluateRetake({
      quality: goodQ,
      readiness: 92,
      detectionRate: 0.95,
      durationSeconds: 4,
    });
    expect(rec.recommended).toBe(false);
    expect(rec.reasons).toHaveLength(0);
    expect(rec.confidence).toBe('high');
  });

  it('blocks an extremely short clip', () => {
    const rec = evaluateRetake({
      quality: goodQ,
      readiness: 90,
      detectionRate: 0.9,
      durationSeconds: 0.4,
    });
    expect(rec.recommended).toBe(true);
    expect(rec.reasons.some((r) => r.id === 'too_short' && r.severity === 'blocking')).toBe(true);
    expect(rec.confidence).toBe('insufficient');
  });

  it('blocks when the body could not be tracked', () => {
    const rec = evaluateRetake({
      quality: goodQ,
      readiness: 80,
      detectionRate: 0.2,
      durationSeconds: 3,
    });
    expect(rec.recommended).toBe(true);
    expect(rec.reasons.some((r) => r.id === 'low_detection')).toBe(true);
  });

  it('warns about cut-off feet', () => {
    const q: FrameQualitySignals = { ...goodQ, fullBodyVisible: false, feetVisible: 'cut_off' };
    const rec = evaluateRetake({ quality: q, readiness: 75, detectionRate: 0.9, durationSeconds: 3 });
    expect(rec.reasons.some((r) => r.id === 'feet_cut')).toBe(true);
  });

  it('warns about implement risk, low light, shaky, and multiple people', () => {
    const q: FrameQualitySignals = {
      ...goodQ,
      implementRisk: 'high',
      lighting: 'low',
      stability: 'shaky',
      personCount: 2,
    };
    const rec = evaluateRetake({ quality: q, readiness: 50, detectionRate: 0.9, durationSeconds: 3 });
    const ids = rec.reasons.map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['implement_risk', 'low_light', 'shaky', 'multiple_people']));
    expect(rec.recommended).toBe(true);
  });

  it('recommends a retake on low readiness even without blocking issues', () => {
    const rec = evaluateRetake({ quality: goodQ, readiness: 40, detectionRate: 0.85, durationSeconds: 3 });
    expect(rec.recommended).toBe(true);
  });
});
