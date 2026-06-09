import { classifyFaultConsistency, adjustConfidence, patternLabel } from '../consistency';
import { computeAthletePriorities, type DiagnosisLike, type PriorityInput } from '../engine';

const diag = (id: string, name: string, priority: string, confidence: number, sample = 12): DiagnosisLike => ({
  rule: { id, name, priority, likely_cause: `${name} cause` },
  confidence,
  sample_size: sample,
});

describe('classifyFaultConsistency', () => {
  it('a single session is "new" and never adjusted', () => {
    const r = classifyFaultConsistency({ occurrences: 1, totalSessions: 1, inLatest: true });
    expect(r.pattern).toBe('new');
    expect(r.factor).toBe(1);
  });

  it('a recent first appearance is "new" (not punished)', () => {
    const r = classifyFaultConsistency({ occurrences: 1, totalSessions: 5, inLatest: true });
    expect(r.pattern).toBe('new');
    expect(r.factor).toBe(1);
  });

  it('a stale single occurrence is a dampened "one-off"', () => {
    const r = classifyFaultConsistency({ occurrences: 1, totalSessions: 5, inLatest: false });
    expect(r.pattern).toBe('one-off');
    expect(r.factor).toBeLessThan(1);
  });

  it('high hit-rate including the latest is a boosted "persistent" pattern', () => {
    const r = classifyFaultConsistency({ occurrences: 5, totalSessions: 6, inLatest: true });
    expect(r.pattern).toBe('persistent');
    expect(r.factor).toBeGreaterThan(1);
  });

  it('sporadic-but-recent reads as "recurring" (neutral)', () => {
    const r = classifyFaultConsistency({ occurrences: 2, totalSessions: 6, inLatest: true });
    expect(r.pattern).toBe('recurring');
    expect(r.factor).toBe(1);
  });

  it('comes-and-goes, not recent, is a dampened "intermittent"', () => {
    const r = classifyFaultConsistency({ occurrences: 2, totalSessions: 8, inLatest: false });
    expect(r.pattern).toBe('intermittent');
    expect(r.factor).toBeLessThan(1);
  });

  it('adjustConfidence clamps to 0..100', () => {
    expect(adjustConfidence(95, 1.1)).toBe(100);
    expect(adjustConfidence(50, 0.8)).toBe(40);
    expect(adjustConfidence(0, 1.1)).toBe(0);
  });

  it('patternLabel is human-readable', () => {
    expect(patternLabel('persistent')).toMatch(/consistent/i);
    expect(patternLabel('one-off')).toMatch(/one-off/i);
  });
});

describe('priority engine — consistency adjustment', () => {
  const NOW = '2026-03-02T00:00:00Z';
  const input: PriorityInput = {
    sessions: [
      { id: 's3', date: '2026-03-01T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'high', 70)] },
      { id: 's2', date: '2026-02-20T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'high', 70), diag('thin', 'Thin', 'high', 70)] },
      { id: 's1', date: '2026-02-12T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'high', 70)] },
    ],
    now: NOW,
  };

  it('labels a fault in every session (incl. latest) as a persistent pattern', () => {
    const r = computeAthletePriorities(input);
    const slice = r.all.find((p) => p.id === 'slice')!;
    expect(slice.pattern).toBe('persistent');
  });

  it('labels a stale single-session fault as a dampened one-off', () => {
    const r = computeAthletePriorities(input);
    const thin = r.all.find((p) => p.id === 'thin')!;
    const slice = r.all.find((p) => p.id === 'slice')!;
    expect(thin.pattern).toBe('one-off');
    // The one-off is dampened below its ~70 raw read; the persistent recurring
    // fault outranks it — the false-positive guard at work.
    expect(thin.confidence).toBeLessThan(70);
    expect(slice.score).toBeGreaterThan(thin.score);
    expect(slice.evidence.some((e) => e.label === 'Pattern')).toBe(true);
  });
});
