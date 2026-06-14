// ============================================================
// Retest → Diagnosis feedback loop tests
// ============================================================

import { deriveRetestSignals } from './retest-feedback';
import { analyzeDeterministicSession } from './diagnose';
import type { RetestResult, RetestOutcome } from '@/lib/retest/types';

function result(focus: string, outcome: RetestOutcome, daysAgo: number, sport: RetestResult['sport'] = 'golf'): RetestResult {
  const d = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  return {
    id: `${focus}-${daysAgo}`,
    sport,
    sportLabel: 'Golf',
    priorFocus: focus,
    priorDate: d,
    currentDate: d,
    comparison: {
      outcome,
      headline: 'x',
      detail: 'x',
      sameConditionsMet: true,
      cautions: [],
      confidenceNote: 'directional',
    },
  };
}

describe('deriveRetestSignals', () => {
  it('returns empty signals when there is no matching history', () => {
    const s = deriveRetestSignals('slice', 'golf', []);
    expect(s.lastRetestOutcome).toBeUndefined();
    expect(s.priorFailedAttempts).toBe(0);
  });

  it('counts persisting/regressed outcomes for the same issue as failed attempts', () => {
    const history = [
      result('Slice', 'persisting', 14),
      result('Slice', 'persisting', 7),
      result('Fat contact', 'persisting', 3), // different issue — ignored
    ];
    const s = deriveRetestSignals('slice', 'golf', history);
    expect(s.priorFailedAttempts).toBe(2);
    expect(s.lastRetestOutcome).toBe('persisting');
  });

  it('takes the most recent matching outcome', () => {
    const history = [result('Slice', 'persisting', 10), result('Slice', 'improved', 1)];
    expect(deriveRetestSignals('slice', 'golf', history).lastRetestOutcome).toBe('improved');
  });

  it('ignores results from other sports', () => {
    const history = [result('Late contact', 'persisting', 2, 'tennis')];
    expect(deriveRetestSignals('slice', 'golf', history).priorFailedAttempts).toBe(0);
  });
});

describe('feedback loop changes the diagnosis', () => {
  it('repeated failed retests escalate and lower confidence on the same miss', () => {
    const history = [result('Slice', 'persisting', 14), result('Slice', 'persisting', 7)];
    const signals = deriveRetestSignals('slice', 'golf', history);

    const fresh = analyzeDeterministicSession({ sport: 'golf', issue: 'slice' });
    const afterFailures = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', ...signals });

    expect(afterFailures.escalateToAI).toBe(true);
    expect(afterFailures.confidence).toBeLessThan(fresh.confidence);
    expect(afterFailures.escalationReasons.some((r) => /failed/i.test(r))).toBe(true);
  });

  it('a regressed retest raises urgency and escalates', () => {
    const history = [result('Slice', 'regressed', 2)];
    const signals = deriveRetestSignals('slice', 'golf', history);
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', ...signals });
    expect(d.escalateToAI).toBe(true);
    expect(d.urgency).not.toBe('low');
  });
});
