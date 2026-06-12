// ============================================================
// SwingVantage — findSportRetestTarget (analyzer auto-detect)
// ------------------------------------------------------------
// Picks the open due/overdue retest for one sport, ignoring
// active-but-not-yet-due findings and other sports — so the
// video analyzer only auto-arms "compare" on a genuine retest.
// ============================================================

import { findSportRetestTarget } from '../targets';
import type { RetestStatus, RetestTarget } from '../types';

// findSportRetestTarget reads only sport + status.status; keep fixtures minimal.
function target(sport: RetestTarget['sport'], status: RetestStatus, id = `${sport}-${status}`): RetestTarget {
  return { id, sport, status: { status } } as RetestTarget;
}

describe('findSportRetestTarget', () => {
  it('returns null when there are no targets', () => {
    expect(findSportRetestTarget([], 'golf')).toBeNull();
  });

  it('matches a due target for the requested sport', () => {
    const targets = [target('tennis', 'due'), target('golf', 'due')];
    expect(findSportRetestTarget(targets, 'golf')?.sport).toBe('golf');
  });

  it('matches an overdue target', () => {
    expect(findSportRetestTarget([target('golf', 'overdue')], 'golf')?.status.status).toBe('overdue');
  });

  it('ignores active (not-yet-due) findings — re-filming early is not a retest', () => {
    expect(findSportRetestTarget([target('golf', 'active')], 'golf')).toBeNull();
  });

  it('does not cross sports', () => {
    expect(findSportRetestTarget([target('baseball', 'overdue')], 'golf')).toBeNull();
  });

  it('returns the first due/overdue match (targets arrive urgency-sorted)', () => {
    const targets = [target('golf', 'overdue', 'first'), target('golf', 'due', 'second')];
    expect(findSportRetestTarget(targets, 'golf')?.id).toBe('first');
  });
});
