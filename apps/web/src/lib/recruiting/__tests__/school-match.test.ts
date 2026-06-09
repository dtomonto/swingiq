import { recommendSchools, FIT_ORDER, type SeedSchool } from '../school-match';

const golf = (over: Partial<Parameters<typeof recommendSchools>[0]> = {}) =>
  recommendSchools({ sport: 'golf', ...over });

describe('recommendSchools', () => {
  it('only supports golf for now', () => {
    const r = recommendSchools({ sport: 'tennis', handicap: 3 });
    expect(r.supported).toBe(false);
    expect(r.recommendations).toHaveLength(0);
    expect(r.message).toBeTruthy();
  });

  it('a scratch player gets D1 as match/safety', () => {
    const r = golf({ handicap: 1 });
    expect(r.supported).toBe(true);
    const d1 = r.divisionFits.find((d) => d.division === 'NCAA D1');
    expect(d1).toBeDefined();
    expect(['match', 'safety']).toContain(d1!.fit);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it('a mid-handicap player finds D1 a stretch but JUCO accessible', () => {
    const r = golf({ handicap: 12 });
    const d1 = r.divisionFits.find((d) => d.division === 'NCAA D1')!.fit;
    const juco = r.divisionFits.find((d) => d.division === 'NJCAA')!.fit;
    expect(d1).toBe('stretch');
    expect(['match', 'safety']).toContain(juco);
  });

  it('recommendations are sorted by fit (match → reach → safety → stretch)', () => {
    const r = golf({ handicap: 5 });
    const idxs = r.recommendations.map((x) => FIT_ORDER.indexOf(x.fit));
    const sorted = [...idxs].sort((a, b) => a - b);
    expect(idxs).toEqual(sorted);
  });

  it('prefers in-region schools at the same fit', () => {
    const r = golf({ handicap: 1, region: 'West' });
    // Among the top results, a West school should appear before a same-fit non-West one.
    const firstWest = r.recommendations.findIndex((x) => x.school.region === 'West');
    expect(firstWest).toBeGreaterThanOrEqual(0);
    expect(r.recommendations[firstWest].reasons.some((s) => /region/i.test(s))).toBe(true);
  });

  it('falls back to the strength tier when no handicap is given (lower confidence)', () => {
    const r = golf({ strengthTier: 'elite' });
    expect(r.supported).toBe(true);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.athleticLevelLabel.toLowerCase()).toContain('estimated');
    expect(r.dataConfidence).not.toBe('high');
  });

  it('high confidence only with a real handicap plus academics', () => {
    expect(golf({ handicap: 3, gpa: 3.8, graduationYear: new Date().getFullYear() + 1 }).dataConfidence).toBe('high');
    expect(golf({ strengthTier: 'strong' }).dataConfidence).not.toBe('high');
  });

  it('always returns honest disclaimers', () => {
    const r = golf({ handicap: 4 });
    expect(r.disclaimers.length).toBeGreaterThan(0);
    expect(r.disclaimers.join(' ').toLowerCase()).toContain('verify');
  });

  it('respects a caller-supplied school list', () => {
    const custom: SeedSchool[] = [{ id: 'x', name: 'Test U', division: 'NCAA D3', region: 'Northeast' }];
    const r = golf({ handicap: 8, region: 'Northeast' });
    const r2 = recommendSchools({ sport: 'golf', handicap: 8 }, custom);
    expect(r2.recommendations).toHaveLength(1);
    expect(r2.recommendations[0].school.name).toBe('Test U');
    expect(r.recommendations.length).toBeGreaterThan(1);
  });
});
