import { classifyPlayerStage } from '../classify';
import { compareRatingAlignment, normalizeRatingValue } from '../rating';
import { GOLF_CONFIG } from '../config';
import { makeSignals, metric, recentIso } from './helpers';

describe('normalizeRatingValue', () => {
  it('accepts in-range values and rejects out-of-range ones', () => {
    expect(normalizeRatingValue('golf_handicap', 14)).toBe(14);
    expect(normalizeRatingValue('golf_handicap', -4)).toBe(-4); // plus handicap
    expect(normalizeRatingValue('golf_handicap', 60)).toBeNull(); // > USGA max 54
    expect(normalizeRatingValue('utr', 6.0)).toBe(6.0);
    expect(normalizeRatingValue('utr', 0.5)).toBeNull();
    expect(normalizeRatingValue('utr', 17)).toBeNull();
    expect(normalizeRatingValue('ntrp', 4.0)).toBe(4.0);
    expect(normalizeRatingValue('ntrp', 1.0)).toBeNull();
    expect(normalizeRatingValue('ntrp', 8)).toBeNull();
  });
});

describe('compareRatingAlignment', () => {
  it('returns unknown (and an inviting message) with no rating', () => {
    const sig = makeSignals('golf');
    const res = compareRatingAlignment(null, classifyPlayerStage(sig, GOLF_CONFIG), GOLF_CONFIG);
    expect(res.alignment).toBe('unknown');
    expect(res.explanation).toMatch(/handicap/i);
  });

  it('flags performance BELOW the rating when the game lags', () => {
    const sig = makeSignals('golf', {
      rating: { sport: 'golf', ratingType: 'golf_handicap', value: 4, source: 'self_reported', dateRecorded: recentIso() },
      metrics: [metric({ metricName: 'swing_quality', category: 'technique', value: 30, score: 30 })],
    });
    const res = compareRatingAlignment(sig.rating, classifyPlayerStage(sig, GOLF_CONFIG), GOLF_CONFIG);
    expect(res.alignment).toBe('below');
    // self-reported caveat must be present
    expect(res.explanation).toMatch(/self-reported/i);
  });

  it('flags performance ABOVE the rating when ability outpaces results', () => {
    const sig = makeSignals('golf', {
      rating: { sport: 'golf', ratingType: 'golf_handicap', value: 24, source: 'imported', dateRecorded: recentIso() },
      metrics: [metric({ metricName: 'swing_quality', category: 'technique', value: 88, score: 88 })],
    });
    const res = compareRatingAlignment(sig.rating, classifyPlayerStage(sig, GOLF_CONFIG), GOLF_CONFIG);
    expect(res.alignment).toBe('above');
  });
});
