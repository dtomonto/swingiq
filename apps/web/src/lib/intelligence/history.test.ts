// ============================================================
// Diagnosis history — pure record + summary tests
// (localStorage paths are no-ops under the node test env by design)
// ============================================================

import { toDiagnosisRecord, summarizeDiagnosisHistory, type DiagnosisRecord } from './history';
import { analyzeDeterministicSession } from './diagnose';

describe('toDiagnosisRecord', () => {
  it('maps a diagnosis into a stable, non-PII record', () => {
    const at = new Date('2026-06-13T12:00:00Z');
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'fat', skillLevel: 'intermediate' });
    const r = toDiagnosisRecord(d, at);
    expect(r.id).toBe('golf::fat_contact::2026-06-13');
    expect(r.sport).toBe('golf');
    expect(r.faultId).toBe('fat_contact');
    expect(r.confidence).toBe(d.confidence);
    expect(r.escalated).toBe(d.escalateToAI);
    // Only the bounded non-PII surface.
    expect(Object.keys(r).sort()).toEqual(
      ['at', 'confidence', 'confidenceLabel', 'engineVersion', 'escalated', 'faultId', 'faultName', 'id', 'missingDataCount', 'ruleVersion', 'severity', 'sport'],
    );
  });
});

describe('summarizeDiagnosisHistory', () => {
  function rec(faultId: string, confidence: number, escalated: boolean, day: string): DiagnosisRecord {
    return {
      id: `golf::${faultId}::${day}`, at: `${day}T12:00:00Z`, sport: 'golf', faultId, faultName: faultId,
      confidence, confidenceLabel: 'moderate', severity: 'notable', escalated, missingDataCount: 1,
      engineVersion: '1.0.0', ruleVersion: '2026.06',
    };
  }

  it('returns an empty summary for no records', () => {
    const s = summarizeDiagnosisHistory([]);
    expect(s.total).toBe(0);
    expect(s.averageConfidence).toBeNull();
    expect(s.byFault).toEqual([]);
  });

  it('ranks most-common causes and computes escalation rate + avg confidence', () => {
    const s = summarizeDiagnosisHistory([
      rec('slice', 60, false, '2026-06-10'),
      rec('slice', 50, true, '2026-06-11'),
      rec('fat_contact', 70, false, '2026-06-12'),
    ]);
    expect(s.total).toBe(3);
    expect(s.byFault[0]).toMatchObject({ faultId: 'slice', count: 2 });
    expect(s.escalationRate).toBeCloseTo(1 / 3, 2);
    expect(s.averageConfidence).toBe(60);
    expect(s.confidenceTrend).toHaveLength(3);
    expect(s.lastDiagnosedAt).toBe('2026-06-12T12:00:00Z');
  });
});
