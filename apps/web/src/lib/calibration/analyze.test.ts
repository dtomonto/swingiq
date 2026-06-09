// ============================================================
// Confidence calibration (intelligence upgrade Sprint 1, #16)
// ============================================================

import {
  computeCalibration,
  MIN_RESOLVED_FOR_REPORT,
  type CalibrationEntry,
  type CalibrationOutcome,
} from './analyze';

let seq = 0;
function entry(predictedConfidence: number, outcome: CalibrationOutcome | null): CalibrationEntry {
  return {
    id: `e${seq++}`,
    diagnosisId: 'slice_weak_fade',
    diagnosisName: 'Slice',
    predictedConfidence,
    sport: 'golf',
    recordedAt: new Date().toISOString(),
    outcome,
    resolvedAt: outcome ? new Date().toISOString() : null,
  };
}

/** n entries at a confidence, `confirmed` of them confirmed, rest refuted. */
function batch(confidence: number, n: number, confirmed: number): CalibrationEntry[] {
  return Array.from({ length: n }, (_, i) => entry(confidence, i < confirmed ? 'confirmed' : 'refuted'));
}

describe('#16 computeCalibration', () => {
  it('reports insufficient below the minimum resolved sample', () => {
    const r = computeCalibration(batch(80, MIN_RESOLVED_FOR_REPORT - 1, 5));
    expect(r.reliability).toBe('insufficient');
    expect(r.tendency).toBe('insufficient');
  });

  it('counts pending (unresolved) entries separately', () => {
    const r = computeCalibration([...batch(80, 10, 8), entry(70, null), entry(90, null)]);
    expect(r.totalResolved).toBe(10);
    expect(r.totalPending).toBe(2);
  });

  it('flags a well-calibrated predictor (80% confidence → ~80% confirmed)', () => {
    const r = computeCalibration(batch(80, 10, 8));
    expect(r.reliability).toBe('well-calibrated');
    expect(r.tendency).toBe('calibrated');
    const band = r.bands.find((b) => b.label === '80–100%')!;
    expect(band.observedRate).toBeCloseTo(0.8, 5);
    expect(Math.abs(band.gap)).toBeLessThan(0.05);
  });

  it('detects overconfidence (predicts 90%, only 30% pan out)', () => {
    const r = computeCalibration(batch(90, 10, 3));
    expect(r.tendency).toBe('overconfident');
    expect(r.reliability).toBe('poorly-calibrated');
    expect(r.bands.find((b) => b.label === '80–100%')!.gap).toBeLessThan(0);
  });

  it('detects underconfidence (predicts ~50%, 90% pan out)', () => {
    const r = computeCalibration(batch(50, 10, 9));
    expect(r.tendency).toBe('underconfident');
    expect(r.bands.find((b) => b.label === '40–59%')!.gap).toBeGreaterThan(0);
  });

  it('buckets predictions into the right confidence bands', () => {
    const r = computeCalibration([...batch(45, 4, 2), ...batch(70, 4, 2), ...batch(95, 4, 2)]);
    expect(r.bands.map((b) => b.n)).toEqual([4, 4, 4]);
  });
});
