// ============================================================
// Deterministic Diagnosis Engine — unit tests
// ------------------------------------------------------------
// Verifies ranked diagnosis, confidence + reason, missing-data logic,
// AI-escalation decisions, urgency, the rule trace, multi-sport coverage,
// and that the engine is pure (token-free, deterministic, no I/O).
// ============================================================

import {
  analyzeDeterministicSession,
  calculateConfidence,
  shouldEscalateToAI,
  getTriggeredRuleTrace,
  runDeterministicScenarioTest,
} from './diagnose';
import { listDiagnosisSports, getSportDiagnosisConfig, getSymptomsForSport } from './symptom-rules';
import type { DiagnosisInput } from './diagnose-types';

const golfSlice: DiagnosisInput = { sport: 'golf', issue: 'slice', skillLevel: 'intermediate' };

describe('analyzeDeterministicSession — core output', () => {
  it('produces a complete, ranked, explainable diagnosis', () => {
    const d = analyzeDeterministicSession(golfSlice);
    expect(d.primary.faultId).toBe('slice');
    expect(d.ranked.length).toBeGreaterThanOrEqual(1);
    expect(d.confidence).toBeGreaterThan(0);
    expect(d.confidence).toBeLessThanOrEqual(100);
    expect(['low', 'moderate', 'high']).toContain(d.confidenceLabel);
    expect(d.confidenceReason).toMatch(/confidence is/i);
    expect(d.supportingEvidence.length).toBeGreaterThan(0);
    expect(d.disclaimer).toBeTruthy();
    expect(d.engineVersion).toBeTruthy();
  });

  it('ranks a secondary cause and surfaces drill families', () => {
    const d = analyzeDeterministicSession(golfSlice);
    expect(d.secondary?.faultId).toBe('over_the_top');
    expect(d.primary.share).toBeGreaterThanOrEqual(d.secondary!.share);
    expect(d.primary.drillFamilies.length).toBeGreaterThan(0);
  });

  it('reinforces confidence when corroborating symptoms agree', () => {
    const single = analyzeDeterministicSession({ sport: 'golf', issue: 'slice' });
    const corroborated = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', symptoms: ['pull'] });
    expect(corroborated.confidence).toBeGreaterThan(single.confidence);
  });

  it('lowers confidence and flags contradiction when symptoms conflict', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', symptoms: ['hook'] });
    expect(d.contradictingEvidence.length).toBeGreaterThan(0);
    expect(d.escalateToAI).toBe(true);
    expect(d.escalationReasons.some((r) => /contradict/i.test(r))).toBe(true);
  });

  it('surfaces missing-data prompts and recommends video when none is available', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice' });
    expect(d.missingData.some((m) => /video/i.test(m))).toBe(true);
    expect(d.missingDataPrompts.length).toBeGreaterThan(0);
    expect(d.recommendVideo).toBe(true);
  });

  it('raises urgency when a retest regressed', () => {
    const calm = analyzeDeterministicSession({ sport: 'golf', issue: 'low_launch' });
    const regressed = analyzeDeterministicSession({ sport: 'golf', issue: 'low_launch', lastRetestOutcome: 'regressed' });
    expect(regressed.urgency).not.toBe('low'); // bumped above the calm baseline
    expect(regressed.escalateToAI).toBe(true);
    expect(calm.urgency).toBe('low');
  });
});

describe('multi-sport coverage', () => {
  it('covers all seven sports with a usable diagnosis', () => {
    const probes: DiagnosisInput[] = [
      { sport: 'golf', issue: 'fat' },
      { sport: 'baseball', issue: 'pop_up' },
      { sport: 'softball_slow', issue: 'rollover' },
      { sport: 'softball_fast', issue: 'late' },
      { sport: 'tennis', issue: 'net_errors' },
      { sport: 'pickleball', issue: 'net_errors' },
      { sport: 'padel', issue: 'long_errors' },
    ];
    for (const p of probes) {
      const d = analyzeDeterministicSession(p);
      expect(d.primary.faultId).toBeTruthy();
      expect(d.primary.generated).toBe(false);
      expect(d.ranked.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('newly-covered pickleball & padel resolve to curated (non-generated) causes', () => {
    const pb = analyzeDeterministicSession({ sport: 'pickleball', issue: 'weak_serve' });
    const pd = analyzeDeterministicSession({ sport: 'padel', issue: 'poor_recovery' });
    expect(pb.primary.generated).toBe(false);
    expect(pd.primary.generated).toBe(false);
  });

  it('every diagnosis sport exposes intake symptoms and a config', () => {
    for (const sport of listDiagnosisSports()) {
      expect(getSportDiagnosisConfig(sport)).not.toBeNull();
      expect(getSymptomsForSport(sport).length).toBeGreaterThan(0);
    }
  });
});

describe('edge cases', () => {
  it('handles an unknown sport with an honest generated fallback', () => {
    const d = analyzeDeterministicSession({ sport: 'cricket' as never, issue: 'weird miss' });
    expect(d.primary.generated).toBe(true);
    expect(d.confidenceLabel).toBe('low');
  });

  it('handles an empty / nonsense issue with low confidence', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'zxqw nonsense pattern' });
    expect(d.primary).toBeTruthy();
    expect(d.confidence).toBeLessThan(50);
  });

  it('handles an empty issue string', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: '' });
    expect(d.primary).toBeTruthy();
    expect(d.confidenceLabel).toBe('low');
  });
});

describe('calculateConfidence', () => {
  it('returns a low generic score with no matched symptoms', () => {
    const c = calculateConfidence({
      matchedSymptomCount: 0, primary: null, secondary: null, contradictionCount: 0,
      skillLevel: 'intermediate', priorFailedAttempts: 0, videoAvailable: false,
    });
    expect(c.label).toBe('low');
    expect(c.reason).toBeTruthy();
  });
});

describe('shouldEscalateToAI', () => {
  const highConf = {
    confidence: 80,
    contradictingEvidence: [] as string[],
    primary: { share: 0.9 } as never,
    secondary: undefined,
  };

  it('does NOT escalate a confident, uncontested, common diagnosis', () => {
    const r = shouldEscalateToAI(highConf, { videoAvailable: false, skillLevel: 'intermediate' });
    expect(r.escalate).toBe(false);
  });

  it('escalates when a fix has failed repeatedly', () => {
    const r = shouldEscalateToAI(highConf, { priorFailedAttempts: 2 });
    expect(r.escalate).toBe(true);
  });

  it('escalates when confidence is below threshold', () => {
    const r = shouldEscalateToAI({ ...highConf, confidence: 40 }, {});
    expect(r.escalate).toBe(true);
  });
});

describe('rule trace (admin/debug)', () => {
  it('returns the rules that fired with weights and contributions', () => {
    const trace = getTriggeredRuleTrace(golfSlice);
    expect(trace.length).toBeGreaterThan(0);
    expect(trace[0]).toHaveProperty('symptom');
    expect(trace[0]).toHaveProperty('weight');
    expect(trace[0]).toHaveProperty('contribution');
  });
});

describe('purity / cost-saving (token-free, deterministic)', () => {
  it('is deterministic — identical input yields a deeply-equal result', () => {
    const a = analyzeDeterministicSession(golfSlice);
    const b = analyzeDeterministicSession(golfSlice);
    expect(a).toEqual(b);
  });

  it('returns synchronously (no Promise, so no awaited network/AI call)', () => {
    const r = analyzeDeterministicSession(golfSlice) as unknown;
    expect(r instanceof Promise).toBe(false);
  });
});

describe('runDeterministicScenarioTest', () => {
  it('passes a well-specified golden scenario', () => {
    const res = runDeterministicScenarioTest({
      name: 'golf slice',
      input: golfSlice,
      expect: { expectedPrimaryFaultIds: ['slice'], shouldEscalate: false },
    });
    expect(res.pass).toBe(true);
    expect(res.failures).toHaveLength(0);
  });

  it('reports failures without throwing', () => {
    const res = runDeterministicScenarioTest({
      name: 'wrong expectation',
      input: golfSlice,
      expect: { expectedPrimaryFaultIds: ['hook'] },
    });
    expect(res.pass).toBe(false);
    expect(res.failures.length).toBeGreaterThan(0);
  });
});
