// ============================================================
// Vision spend gate (intelligence upgrade Sprint 4, #19)
// ============================================================

import { assessVisionGate } from '../quality';
import type { CameraQualityReport } from '../types';

function report(over: Partial<CameraQualityReport>): CameraQualityReport {
  return {
    score: 80,
    verdict: 'good',
    analyzable: true,
    subjectVisiblePct: 95,
    fullBodyVisible: true,
    estimatedFps: 60,
    resolution: '1080x1920',
    estimatedView: 'face_on',
    items: [],
    recommendations: ['tip'],
    ...over,
  };
}

describe('#19 assessVisionGate', () => {
  it('proceeds on a good clip', () => {
    const d = assessVisionGate(report({ verdict: 'good' }));
    expect(d.proceed).toBe(true);
    expect(d.severity).toBe('ok');
  });

  it('proceeds with a caveat on a fair clip', () => {
    const d = assessVisionGate(report({ verdict: 'fair', score: 55 }));
    expect(d.proceed).toBe(true);
    expect(d.severity).toBe('caveat');
  });

  it('blocks a poor-quality clip before the paid call', () => {
    const d = assessVisionGate(report({ verdict: 'poor', score: 30 }));
    expect(d.proceed).toBe(false);
    expect(d.severity).toBe('blocked');
    expect(d.guidance).toMatch(/re-record/i);
  });

  it('blocks an un-analyzable clip regardless of verdict', () => {
    const d = assessVisionGate(report({ analyzable: false, verdict: 'fair' }));
    expect(d.proceed).toBe(false);
    expect(d.severity).toBe('blocked');
    expect(d.title).toMatch(/no swing/i);
  });

  it('passes the report recommendations through for re-capture tips', () => {
    const d = assessVisionGate(report({ verdict: 'poor', recommendations: ['brighter light', 'full body'] }));
    expect(d.recommendations).toEqual(['brighter light', 'full body']);
  });
});
