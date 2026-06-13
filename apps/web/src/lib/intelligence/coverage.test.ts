// ============================================================
// Deterministic Engine — coverage & scenario summary tests
// ============================================================

import { getDeterministicEngineStatus, runGoldenScenarios } from './coverage';

describe('getDeterministicEngineStatus', () => {
  it('reports healthy coverage for all seven sports', () => {
    const status = getDeterministicEngineStatus();
    expect(status.sportCount).toBe(7);
    expect(status.totalSymptoms).toBeGreaterThan(0);
    for (const s of status.sports) {
      expect(s.symptomCount).toBeGreaterThan(0);
      expect(s.candidateFaultCount).toBeGreaterThan(0);
      // Pickleball & padel used to be zero — now they must carry curated faults.
      expect(s.curatedFaultCount).toBeGreaterThan(0);
      expect(s.missingDataPromptCount).toBeGreaterThanOrEqual(0);
      expect(s.healthy).toBe(true);
    }
  });
});

describe('runGoldenScenarios', () => {
  it('runs all golden scenarios and they all pass', () => {
    const summary = runGoldenScenarios();
    expect(summary.total).toBeGreaterThanOrEqual(19);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(summary.total);
    const labelTotal = summary.byConfidence.low + summary.byConfidence.moderate + summary.byConfidence.high;
    expect(labelTotal).toBe(summary.total);
    // At least one escalation scenario (shank / contradiction) is represented.
    expect(summary.escalationCount).toBeGreaterThan(0);
  });
});
