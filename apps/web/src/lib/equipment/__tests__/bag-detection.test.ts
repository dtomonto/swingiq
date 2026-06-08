import {
  inferBagCategory,
  detectBagFromSessions,
  reconcileBag,
  type BagSession,
  type ExistingClub,
} from '../bag-detection';

const shot = (club: string, carry: number | null, total: number | null = null) => ({
  club_name: club,
  ball_data: { carry_distance: carry, total_distance: total },
});

describe('inferBagCategory', () => {
  it('classifies common club names', () => {
    expect(inferBagCategory('Driver')).toBe('driver');
    expect(inferBagCategory('3 Wood')).toBe('wood');
    expect(inferBagCategory('4 Hybrid')).toBe('hybrid');
    expect(inferBagCategory('7 Iron')).toBe('iron');
    expect(inferBagCategory('7i')).toBe('iron');
    expect(inferBagCategory('PW')).toBe('wedge');
    expect(inferBagCategory('56°')).toBe('wedge');
    expect(inferBagCategory('Putter')).toBe('putter');
    expect(inferBagCategory('7')).toBe('iron'); // bare number → iron
    expect(inferBagCategory('Frisbee')).toBe('other');
  });
});

describe('detectBagFromSessions', () => {
  const sessions: BagSession[] = [
    { shots: [shot('Driver', 258), shot('Driver', 262), shot('Driver', 300 /* fluke */), shot('Driver', 200 /* mishit */), shot('7 Iron', 160), shot('7 Iron', 162)] },
    { shots: [shot('Driver', 260), shot('7 Iron', 158), shot('PW', 130), shot('Unknown', 100)] },
  ];

  it('groups shots by club and infers category', () => {
    const bag = detectBagFromSessions(sessions);
    const names = bag.map((c) => c.name);
    expect(names).toContain('Driver');
    expect(names).toContain('7 Iron');
    expect(names).toContain('PW');
    expect(names).not.toContain('Unknown'); // ignored
    expect(bag.find((c) => c.name === 'Driver')!.category).toBe('driver');
  });

  it('computes a robust carry (drops the high+low fluke/mishit)', () => {
    const bag = detectBagFromSessions(sessions);
    const driver = bag.find((c) => c.name === 'Driver')!;
    // 5 carries [258,262,300,200,260] → drop 200 & 300 → mean(258,262,260)=260
    expect(driver.carryAvg).toBe(260);
    expect(driver.shotCount).toBe(5);
  });

  it('assigns confidence by sample size', () => {
    const bag = detectBagFromSessions(sessions);
    expect(bag.find((c) => c.name === 'Driver')!.confidence).toBe('medium'); // 5 shots
    const big = detectBagFromSessions([{ shots: Array.from({ length: 9 }, () => shot('Driver', 260)) }]);
    expect(big[0]!.confidence).toBe('high');
  });

  it('sorts by carry desc with putters last', () => {
    const bag = detectBagFromSessions([
      { shots: [shot('Putter', null), shot('7 Iron', 160), shot('Driver', 260)] },
    ]);
    expect(bag.map((c) => c.name)).toEqual(['Driver', '7 Iron', 'Putter']);
  });
});

describe('reconcileBag', () => {
  const detected = detectBagFromSessions([
    { shots: [shot('Driver', 260), shot('Driver', 260), shot('7 Iron', 160), shot('7 Iron', 160)] },
  ]);

  it('flags clubs not in the bag as new', () => {
    const existing: ExistingClub[] = [{ id: 'c1', name: 'Driver', typical_carry: 260 }];
    const { newClubs } = reconcileBag(existing, detected);
    expect(newClubs.map((c) => c.name)).toEqual(['7 Iron']);
  });

  it('suggests a baseline update when imported carry differs beyond threshold', () => {
    const existing: ExistingClub[] = [{ id: 'c1', name: '7 Iron', typical_carry: 150 }];
    const { baselineUpdates } = reconcileBag(existing, detected);
    const upd = baselineUpdates.find((u) => u.name === '7 Iron');
    expect(upd).toBeDefined();
    expect(upd!.importedCarry).toBe(160);
    expect(upd!.currentCarry).toBe(150);
  });

  it('does not suggest an update within the threshold', () => {
    const existing: ExistingClub[] = [{ id: 'c1', name: '7 Iron', typical_carry: 158 }]; // within 5
    expect(reconcileBag(existing, detected).baselineUpdates).toHaveLength(0);
  });

  it('flags user-confirmed carries so the UI can warn before overriding', () => {
    const existing: ExistingClub[] = [{ id: 'c1', name: '7 Iron', typical_carry: 140, source_of_truth: 'user' }];
    const { baselineUpdates } = reconcileBag(existing, detected);
    expect(baselineUpdates[0]!.userConfirmed).toBe(true);
  });
});
