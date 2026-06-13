// ============================================================
// Deterministic Diagnosis — analytics emitter tests
// ============================================================

import { ANALYTICS_EVENTS } from '@swingiq/core';

const trackMock = jest.fn();
jest.mock('@/lib/analytics', () => ({
  track: (...args: unknown[]) => trackMock(...args),
  ANALYTICS_EVENTS: jest.requireActual('@swingiq/core').ANALYTICS_EVENTS,
}));

import { trackDeterministicAnalysis } from './analytics';
import { analyzeDeterministicSession } from './diagnose';

beforeEach(() => trackMock.mockClear());

describe('trackDeterministicAnalysis', () => {
  it('emits completed + escalation-skipped for a confident, uncontested read', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'fat', skillLevel: 'intermediate' });
    expect(d.escalateToAI).toBe(false);
    trackDeterministicAnalysis(d, { surface: 'start_here' });

    const events = trackMock.mock.calls.map((c) => c[0]);
    expect(events).toContain(ANALYTICS_EVENTS.DETERMINISTIC_ANALYSIS_COMPLETED);
    expect(events).toContain(ANALYTICS_EVENTS.DETERMINISTIC_AI_ESCALATION_SKIPPED);
    expect(events).not.toContain(ANALYTICS_EVENTS.DETERMINISTIC_AI_ESCALATION_RECOMMENDED);

    const completed = trackMock.mock.calls.find((c) => c[0] === ANALYTICS_EVENTS.DETERMINISTIC_ANALYSIS_COMPLETED)!;
    expect(completed[1]).toMatchObject({
      sport: 'golf',
      diagnosis: 'fat_contact',
      confidence_label: d.confidenceLabel,
      escalation_recommended: false,
      surface: 'start_here',
    });
  });

  it('emits the recommended event when escalation fires', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'shank', priorFailedAttempts: 2 });
    expect(d.escalateToAI).toBe(true);
    trackDeterministicAnalysis(d);
    const events = trackMock.mock.calls.map((c) => c[0]);
    expect(events).toContain(ANALYTICS_EVENTS.DETERMINISTIC_AI_ESCALATION_RECOMMENDED);
    expect(events).not.toContain(ANALYTICS_EVENTS.DETERMINISTIC_AI_ESCALATION_SKIPPED);
  });

  it('only sends non-PII engine metadata (no free-text, identity, or video)', () => {
    const d = analyzeDeterministicSession({ sport: 'tennis', issue: 'net_errors' });
    trackDeterministicAnalysis(d);
    for (const [, props] of trackMock.mock.calls) {
      const keys = Object.keys(props ?? {});
      // Allowed, bounded, non-PII property surface.
      const allowed = new Set([
        'sport', 'skill_level', 'diagnosis', 'confidence_score', 'confidence_label',
        'rule_count_triggered', 'missing_data_count', 'escalation_recommended',
        'engine_version', 'reason', 'surface',
      ]);
      for (const k of keys) expect(allowed.has(k)).toBe(true);
    }
  });
});
