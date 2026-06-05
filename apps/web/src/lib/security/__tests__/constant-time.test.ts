import { safeEqual } from '../constant-time';

describe('safeEqual', () => {
  test('returns true for identical strings', () => {
    expect(safeEqual('s3cr3t-value', 's3cr3t-value')).toBe(true);
    expect(safeEqual('', '')).toBe(true);
  });

  test('returns false for differing strings', () => {
    expect(safeEqual('s3cr3t-value', 's3cr3t-valuE')).toBe(false);
    expect(safeEqual('short', 'a-much-longer-secret')).toBe(false);
    expect(safeEqual('Bearer abc', 'Bearer abd')).toBe(false);
  });

  test('returns false (never throws) for null/undefined/non-string inputs', () => {
    expect(safeEqual(null, 'x')).toBe(false);
    expect(safeEqual('x', null)).toBe(false);
    expect(safeEqual(undefined, undefined)).toBe(false);
    expect(safeEqual(null, null)).toBe(false);
  });

  test('does not throw when inputs differ in length (digests are fixed-size)', () => {
    expect(() => safeEqual('a', 'a'.repeat(10_000))).not.toThrow();
    expect(safeEqual('a', 'a'.repeat(10_000))).toBe(false);
  });

  test('is unicode-safe', () => {
    expect(safeEqual('café', 'café')).toBe(true);
    expect(safeEqual('café', 'cafe')).toBe(false);
  });
});
