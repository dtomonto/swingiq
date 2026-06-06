// BodySync — adults-only (18+) age gate
import { isKnownMinor } from '../constants';

describe('isKnownMinor', () => {
  it('blocks accounts classified as minors', () => {
    expect(isKnownMinor('minor_13_17')).toBe(true);
    expect(isKnownMinor('minor_under_13')).toBe(true);
  });

  it('allows adults / coaches / parents / unknown (gated by attestation instead)', () => {
    expect(isKnownMinor('adult')).toBe(false);
    expect(isKnownMinor('coach')).toBe(false);
    expect(isKnownMinor('parent_guardian')).toBe(false);
    expect(isKnownMinor(null)).toBe(false);
    expect(isKnownMinor(undefined)).toBe(false);
  });
});
