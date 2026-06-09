// ============================================================
// Unified next-best-action ranker (intelligence upgrade Sprint 5, #22)
// ============================================================

import {
  rankNextActions,
  scoreCandidate,
  DEFAULT_SOURCE_WEIGHTS,
  type ActionCandidate,
} from './rank';

const cand = (over: Partial<ActionCandidate> & Pick<ActionCandidate, 'id' | 'source'>): ActionCandidate => ({
  title: over.id,
  severity: 0.8,
  confidence: 0.8,
  ...over,
});

describe('#22 scoreCandidate', () => {
  it('rewards higher severity, confidence, recency, and source weight', () => {
    const strong = scoreCandidate(cand({ id: 'a', source: 'keystone', severity: 0.9, confidence: 0.9, recency: 1 }));
    const weak = scoreCandidate(cand({ id: 'b', source: 'drill', severity: 0.4, confidence: 0.4, recency: 0 }));
    expect(strong).toBeGreaterThan(weak);
  });

  it('keeps scores in 0–1 and tolerates out-of-range inputs', () => {
    const s = scoreCandidate(cand({ id: 'x', source: 'priority', severity: 5, confidence: -1 }));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe('#22 rankNextActions', () => {
  it('puts the highest-leverage action first as primary', () => {
    const feed = rankNextActions([
      cand({ id: 'drill1', source: 'drill', severity: 0.7, confidence: 0.7 }),
      cand({ id: 'keystone1', source: 'keystone', severity: 0.8, confidence: 0.8 }),
      cand({ id: 'funnel1', source: 'funnel', severity: 0.5, confidence: 0.9 }),
    ]);
    expect(feed.primary?.id).toBe('keystone1');
    expect(feed.actions[0].rank).toBe(1);
    expect(feed.actions.map((a) => a.score)).toEqual([...feed.actions.map((a) => a.score)].sort((x, y) => y - x));
  });

  it('respects tunable weights', () => {
    const candidates = [
      cand({ id: 'd', source: 'drill', severity: 0.8, confidence: 0.8 }),
      cand({ id: 'k', source: 'keystone', severity: 0.8, confidence: 0.8 }),
    ];
    // Crank drill weight far above keystone → drill should now lead.
    const feed = rankNextActions(candidates, { weights: { drill: 2, keystone: 0.1 } });
    expect(feed.primary?.id).toBe('d');
  });

  it('de-dupes by id keeping the highest-scoring instance', () => {
    const feed = rankNextActions([
      cand({ id: 'same', source: 'drill', severity: 0.3, confidence: 0.3 }),
      cand({ id: 'same', source: 'priority', severity: 0.9, confidence: 0.9 }),
    ]);
    expect(feed.actions).toHaveLength(1);
    expect(feed.actions[0].source).toBe('priority');
  });

  it('honors the limit and returns an empty feed gracefully', () => {
    const feed = rankNextActions(
      [cand({ id: 'a', source: 'priority' }), cand({ id: 'b', source: 'drill' }), cand({ id: 'c', source: 'funnel' })],
      { limit: 2 },
    );
    expect(feed.actions).toHaveLength(2);
    expect(rankNextActions([]).primary).toBeNull();
  });

  it('ships sane default weights with the keystone leading', () => {
    expect(DEFAULT_SOURCE_WEIGHTS.keystone).toBeGreaterThanOrEqual(DEFAULT_SOURCE_WEIGHTS.priority);
    expect(DEFAULT_SOURCE_WEIGHTS.priority).toBeGreaterThan(DEFAULT_SOURCE_WEIGHTS.drill);
  });
});
