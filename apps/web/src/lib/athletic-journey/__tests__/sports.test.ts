import type { SportId } from '@swingiq/core';
import {
  AVAILABLE_SPORTS,
  IN_DEVELOPMENT_SPORTS,
  getSportAvailability,
  getSportConfig,
  isJourneyLive,
  GOLF_CONFIG,
  TENNIS_CONFIG,
} from '../config';

describe('sport availability', () => {
  it('exposes (at least) golf and tennis as live journeys', () => {
    // The selector is config-driven; additional live sports may be registered
    // by parallel work. The spec only requires golf + tennis to be live.
    expect(AVAILABLE_SPORTS).toEqual(expect.arrayContaining(['golf', 'tennis']));
    expect(isJourneyLive('golf')).toBe(true);
    expect(isJourneyLive('tennis')).toBe(true);
  });

  it('represents baseball + softball as in-development, never live', () => {
    expect(IN_DEVELOPMENT_SPORTS).toEqual(['baseball', 'softball_fast', 'softball_slow']);
    for (const s of IN_DEVELOPMENT_SPORTS) {
      const a = getSportAvailability(s);
      expect(a.status).toBe('in_development');
      expect(a.journeyEnabled).toBe(false);
      expect(isJourneyLive(s)).toBe(false);
      // No config → no fake scoring is possible.
      expect(getSportConfig(s)).toBeNull();
    }
  });

  it('returns a safe fallback availability for unknown/future sports', () => {
    // A sport id with no registered availability falls back to a safe,
    // never-faked "in development" entry.
    const a = getSportAvailability('lacrosse' as unknown as SportId);
    expect(a.status).toBe('in_development');
    expect(a.journeyEnabled).toBe(false);
  });
});

describe('rating → stage-order guideposts', () => {
  it('maps golf handicaps across the full range', () => {
    const map = (v: number) =>
      GOLF_CONFIG.ratingToStageOrder({ sport: 'golf', ratingType: 'golf_handicap', value: v, source: 'self_reported', dateRecorded: '' });
    expect(map(54)).toBe(0);
    expect(map(30)).toBe(2);
    expect(map(14)).toBe(4);
    expect(map(5)).toBe(6);
    expect(map(0)).toBe(7);
    expect(map(-4)).toBe(8);
    expect(map(-6)).toBe(9);
    expect(map(-8)).toBe(10);
  });

  it('maps tennis UTR + NTRP across the full range', () => {
    const utr = (v: number) =>
      TENNIS_CONFIG.ratingToStageOrder({ sport: 'tennis', ratingType: 'utr', value: v, source: 'imported', dateRecorded: '' });
    expect(utr(1.5)).toBe(0);
    expect(utr(6.0)).toBe(4);
    expect(utr(10.5)).toBe(7);
    expect(utr(15.0)).toBe(10);

    const ntrp = (v: number) =>
      TENNIS_CONFIG.ratingToStageOrder({ sport: 'tennis', ratingType: 'ntrp', value: v, source: 'self_reported', dateRecorded: '' });
    expect(ntrp(2.5)).toBe(2);
    expect(ntrp(4.0)).toBe(5);
    expect(ntrp(5.0)).toBe(7);
    expect(ntrp(7.0)).toBe(10);
  });
});

describe('stage configs', () => {
  it('each live sport has exactly 11 ordered stages', () => {
    for (const cfg of [GOLF_CONFIG, TENNIS_CONFIG]) {
      expect(cfg.stages).toHaveLength(11);
      cfg.stages.forEach((s, i) => expect(s.order).toBe(i));
    }
  });

  it('category weights sum to ~1.0', () => {
    for (const cfg of [GOLF_CONFIG, TENNIS_CONFIG]) {
      const sum = Object.values(cfg.weights).reduce((a, b) => a + (b ?? 0), 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });
});
