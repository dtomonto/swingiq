import { aggregateLearning, topHook, rankedPlatforms } from '../learning';
import type { LearningRow } from '../store';

const rows: LearningRow[] = [
  { platform: 'linkedin', hookType: 'data', ctaType: 'see_breakdown', impressions: 1000, clicks: 50, engagements: 20 },
  { platform: 'x', hookType: 'contrarian', ctaType: 'read_guide', impressions: 1000, clicks: 10, engagements: 5 },
  { platform: 'linkedin', hookType: 'data', ctaType: 'see_breakdown', impressions: 1000, clicks: 70, engagements: 30 },
];

describe('aggregateLearning', () => {
  it('ranks dimensions by CTR, best first', () => {
    const p = aggregateLearning(rows);
    expect(p.hasData).toBe(true);
    // data hook: (50+70)/2000 = 6% vs contrarian 1%
    expect(p.hooks[0].key).toBe('data');
    expect(p.hooks[0].samples).toBe(2);
    expect(topHook(p)).toBe('data');
    expect(rankedPlatforms(p)[0]).toBe('linkedin');
  });

  it('is empty (no data) for no rows', () => {
    const p = aggregateLearning([]);
    expect(p.hasData).toBe(false);
    expect(p.hooks).toEqual([]);
    expect(topHook(p)).toBeUndefined();
    expect(rankedPlatforms(p)).toEqual([]);
  });
});
