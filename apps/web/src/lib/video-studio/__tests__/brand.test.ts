import { vetClaims, isOnBrand } from '../brand';

describe('vetClaims', () => {
  it('blocks guarantees', () => {
    const f = vetClaims(['We guarantee you lower scores.']);
    expect(f.some((x) => x.severity === 'block')).toBe(true);
  });

  it('blocks medical claims', () => {
    expect(vetClaims(['This will prevent injury.']).some((x) => x.severity === 'block')).toBe(true);
  });

  it('blocks the inaccurate "never leaves your device" claim', () => {
    expect(vetClaims(['Your data never leaves your device.']).some((x) => x.severity === 'block')).toBe(true);
  });

  it('warns (not blocks) on "measured" / hype', () => {
    const f = vetClaims(['Your swing is measured exactly.']);
    expect(f.length).toBeGreaterThan(0);
    expect(f.every((x) => x.severity === 'warn')).toBe(true);
  });

  it('passes clean, on-brand copy', () => {
    expect(vetClaims(['See your top fix and a smart starting point.'])).toEqual([]);
  });
});

describe('isOnBrand', () => {
  it('is false when a block-level claim is present', () => {
    expect(isOnBrand(['Guaranteed results.'])).toBe(false);
  });
  it('is true for clean copy (even with warnings)', () => {
    expect(isOnBrand(['An estimate, not a measurement.'])).toBe(true);
  });
});
