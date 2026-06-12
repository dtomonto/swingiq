// ============================================================
// SwingVantage — Retest next-action mapping
// ------------------------------------------------------------
// Every outcome must yield a productive next step with a real
// in-app destination, so a completed retest never dead-ends.
// ============================================================

import { nextActionFor } from '../next-action';
import type { RetestOutcome, RetestResult } from '../types';

function resultWith(outcome: RetestOutcome, priorFocus = 'Early extension'): RetestResult {
  return {
    id: 'a2',
    sport: 'golf',
    sportLabel: 'Golf',
    priorFocus,
    priorDate: '2026-06-01T00:00:00.000Z',
    currentDate: '2026-06-08T00:00:00.000Z',
    comparison: {
      outcome,
      headline: 'h',
      detail: 'd',
      sameConditionsMet: true,
      cautions: [],
      confidenceNote: 'n',
    },
  };
}

const REAL_ROUTES = new Set(['/video', '/drills', '/learn']);

describe('nextActionFor', () => {
  const outcomes: RetestOutcome[] = ['improved', 'persisting', 'regressed', 'inconclusive'];

  it.each(outcomes)('returns a real-route CTA + non-empty copy for "%s"', (outcome) => {
    const action = nextActionFor(resultWith(outcome));
    expect(action.title).toBeTruthy();
    expect(action.message).toBeTruthy();
    expect(action.cta.label).toBeTruthy();
    expect(REAL_ROUTES.has(action.cta.href)).toBe(true);
  });

  it('moves forward when improved (analyze a fresh swing)', () => {
    expect(nextActionFor(resultWith('improved')).cta.href).toBe('/video');
    expect(nextActionFor(resultWith('improved')).tone).toBe('progress');
  });

  it('keeps working the same fix when persisting, and names the focus', () => {
    const action = nextActionFor(resultWith('persisting', 'Casting'));
    expect(action.cta.href).toBe('/drills');
    expect(action.tone).toBe('persist');
    expect(action.message).toContain('Casting');
  });

  it('routes to fundamentals when regressed', () => {
    const action = nextActionFor(resultWith('regressed'));
    expect(action.cta.href).toBe('/learn');
    expect(action.tone).toBe('recover');
  });

  it('asks for a clean re-film when inconclusive', () => {
    const action = nextActionFor(resultWith('inconclusive'));
    expect(action.cta.href).toBe('/video');
    expect(action.tone).toBe('reconfirm');
  });
});
