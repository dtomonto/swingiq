// ============================================================
// Deterministic intake questions tests
// ============================================================

import { getIntakeQuestions, intakeAnswerSymptoms } from './intake';
import { analyzeDeterministicSession } from './diagnose';

describe('getIntakeQuestions', () => {
  it('returns a short, capped set of questions per sport', () => {
    const qs = getIntakeQuestions('golf');
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(2);
    for (const q of qs) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      // Every question has an honest "not sure" (no symptom) option.
      expect(q.options.some((o) => !o.symptom)).toBe(true);
    }
  });

  it('excludes already-asked questions', () => {
    const all = getIntakeQuestions('golf', { max: 5 });
    const rest = getIntakeQuestions('golf', { askedIds: [all[0].id], max: 5 });
    expect(rest.find((q) => q.id === all[0].id)).toBeUndefined();
  });

  it('covers every sport', () => {
    for (const sport of ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'] as const) {
      expect(getIntakeQuestions(sport).length).toBeGreaterThan(0);
    }
  });
});

describe('intakeAnswerSymptoms', () => {
  it('collects chosen symptoms and drops "not sure"', () => {
    expect(intakeAnswerSymptoms({ golf_curve: 'slice', golf_contact: undefined })).toEqual(['slice']);
  });
});

describe('intake sharpens the diagnosis before AI', () => {
  it('a corroborating answer raises confidence', () => {
    const base = analyzeDeterministicSession({ sport: 'golf', issue: 'slice' });
    const symptoms = intakeAnswerSymptoms({ golf_curve: 'slice', golf_path: 'pull' });
    const sharpened = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', symptoms });
    expect(sharpened.confidence).toBeGreaterThanOrEqual(base.confidence);
  });

  it('a contradicting answer surfaces the conflict and escalates', () => {
    const symptoms = intakeAnswerSymptoms({ golf_curve: 'hook' });
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', symptoms });
    expect(d.contradictingEvidence.length).toBeGreaterThan(0);
    expect(d.escalateToAI).toBe(true);
  });
});
