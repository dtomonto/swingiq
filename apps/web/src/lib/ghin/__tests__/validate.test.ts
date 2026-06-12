import {
  normalizeGhinNumber,
  isValidGhinNumber,
  parseHandicapIndex,
  formatHandicapIndex,
  handicapDataSource,
  handicapSourceLabel,
} from '../validate';

describe('normalizeGhinNumber', () => {
  it('strips spaces and dashes', () => {
    expect(normalizeGhinNumber(' 12-34 567 ')).toBe('1234567');
  });
});

describe('isValidGhinNumber', () => {
  it('accepts 6–10 digit ids (incl. formatted input)', () => {
    expect(isValidGhinNumber('123456')).toBe(true);
    expect(isValidGhinNumber('1234567')).toBe(true);
    expect(isValidGhinNumber('1234567890')).toBe(true);
    expect(isValidGhinNumber('1234-567')).toBe(true);
  });

  it('rejects too short, too long, or non-numeric', () => {
    expect(isValidGhinNumber('12345')).toBe(false);
    expect(isValidGhinNumber('12345678901')).toBe(false);
    expect(isValidGhinNumber('abc1234')).toBe(false);
    expect(isValidGhinNumber('')).toBe(false);
  });
});

describe('parseHandicapIndex', () => {
  it('parses plain decimal indexes', () => {
    expect(parseHandicapIndex('12.3')).toBe(12.3);
    expect(parseHandicapIndex('0')).toBe(0);
    expect(parseHandicapIndex(8)).toBe(8);
  });

  it('treats a leading "+" as a better-than-scratch (negative) index', () => {
    expect(parseHandicapIndex('+2.4')).toBe(-2.4);
  });

  it('rejects out-of-range and unparseable values', () => {
    expect(parseHandicapIndex('99')).toBeNull();
    expect(parseHandicapIndex('-20')).toBeNull();
    expect(parseHandicapIndex('abc')).toBeNull();
    expect(parseHandicapIndex('')).toBeNull();
    expect(parseHandicapIndex(null)).toBeNull();
    expect(parseHandicapIndex(undefined)).toBeNull();
  });
});

describe('formatHandicapIndex', () => {
  it('renders the USGA plus convention to one decimal', () => {
    expect(formatHandicapIndex(12)).toBe('12.0');
    expect(formatHandicapIndex(12.34)).toBe('12.3');
    expect(formatHandicapIndex(-2.4)).toBe('+2.4');
    expect(formatHandicapIndex(null)).toBe('—');
    expect(formatHandicapIndex(undefined)).toBe('—');
  });
});

describe('source labeling', () => {
  it('maps ghin_verified to the platform-generated credibility source', () => {
    expect(handicapDataSource('ghin_verified')).toBe('platform_generated');
    expect(handicapDataSource('self_reported')).toBe('self_reported');
  });

  it('exposes a human label', () => {
    expect(handicapSourceLabel('ghin_verified')).toBe('Verified via GHIN');
    expect(handicapSourceLabel('self_reported')).toBe('Self-reported');
  });
});
