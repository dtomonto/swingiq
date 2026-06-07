// ============================================================
// Regression: recordSnapshot must be idempotent per day.
//
// useAthleticJourney records a daily snapshot from an effect that ALSO
// subscribes to this store and feeds it into the dashboard memo. If
// recordSnapshot wrote (and notified subscribers) on every call — even when
// today's snapshot is unchanged — the write would re-fire that effect and spin
// an infinite render loop (React error #185, "Maximum update depth exceeded"),
// which took the whole /journey page down in production.
//
// The guarantee these tests pin down: an unchanged same-day record is a no-op
// (the history reference stays identical → no subscriber notification → no
// loop), while a genuine change still writes.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { JourneySnapshot } from '../types';
import { recordSnapshot, getHistory, clearJourneyStore } from '../store';

const SPORT = 'golf' as SportId;

const snap = (over: Partial<JourneySnapshot> = {}): JourneySnapshot => ({
  date: '2026-06-07',
  stageCode: 'G3',
  stageOrder: 3,
  momentum: 62,
  confidence: 'medium',
  ...over,
});

describe('recordSnapshot — idempotent daily write (React #185 guard)', () => {
  beforeEach(() => clearJourneyStore());

  it('records today when nothing is on file', () => {
    recordSnapshot(SPORT, snap());
    const history = getHistory(SPORT);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ date: '2026-06-07', stageCode: 'G3', momentum: 62 });
  });

  it('is a no-op when today is already recorded with identical values', () => {
    recordSnapshot(SPORT, snap());
    const before = getHistory(SPORT); // reference after the first (real) write

    recordSnapshot(SPORT, snap()); // identical → must NOT churn the store
    const after = getHistory(SPORT);

    // Same array reference == no write == no subscriber notification == no loop.
    expect(after).toBe(before);
    expect(after).toHaveLength(1);
  });

  it('writes when the same day has changed values', () => {
    recordSnapshot(SPORT, snap());
    const before = getHistory(SPORT);

    recordSnapshot(SPORT, snap({ momentum: 71 })); // momentum moved → real change
    const after = getHistory(SPORT);

    expect(after).not.toBe(before); // new reference (a write happened)
    expect(after).toHaveLength(1); // still one row for today (dedupes per day)
    expect(after[0].momentum).toBe(71);
  });

  it('appends a new row on a new calendar day', () => {
    recordSnapshot(SPORT, snap());
    recordSnapshot(SPORT, snap({ date: '2026-06-08', momentum: 64 }));
    const history = getHistory(SPORT);
    expect(history).toHaveLength(2);
    expect(history.map((s) => s.date)).toEqual(['2026-06-07', '2026-06-08']);
  });
});
