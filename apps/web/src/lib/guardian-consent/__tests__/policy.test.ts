import {
  CONSENT_TERMS_VERSION,
  ageBandFromUsageCategory,
  consentRequirementFor,
  emptyConsent,
  consentGaps,
  isConsentSatisfied,
} from '../policy';
import type { AgeBand, GuardianConsentRecord } from '../types';

function complete(ageBand: AgeBand, over: Partial<GuardianConsentRecord> = {}): GuardianConsentRecord {
  return {
    version: 1,
    ageBand,
    guardianAffirmed: true,
    guardianName: 'Pat Parent',
    guardianEmail: 'pat@example.com',
    acknowledgedNotMedical: true,
    agreesToSupervise: true,
    injuryLimitations: '',
    consentedAt: '2026-06-07T00:00:00.000Z',
    termsVersion: CONSENT_TERMS_VERSION,
    ...over,
  };
}

describe('ageBandFromUsageCategory', () => {
  it('maps the existing usage_category values', () => {
    expect(ageBandFromUsageCategory('minor_13_17')).toBe('13_17');
    expect(ageBandFromUsageCategory('adult')).toBe('18_plus');
    expect(ageBandFromUsageCategory('coach')).toBe('18_plus');
    expect(ageBandFromUsageCategory('parent_guardian')).toBe('18_plus');
    expect(ageBandFromUsageCategory(null)).toBe('unknown');
    expect(ageBandFromUsageCategory('')).toBe('unknown');
  });
});

describe('consentRequirementFor', () => {
  it('requires consent + guardian email for under-13', () => {
    const r = consentRequirementFor('under_13');
    expect(r.required).toBe(true);
    expect(r.needsGuardianEmail).toBe(true);
    expect(r.reason).toMatch(/under 13/i);
  });
  it('requires consent but not email for 13–17', () => {
    const r = consentRequirementFor('13_17');
    expect(r.required).toBe(true);
    expect(r.needsGuardianEmail).toBe(false);
  });
  it('does not gate adults or unknown', () => {
    expect(consentRequirementFor('18_plus').required).toBe(false);
    expect(consentRequirementFor('unknown').required).toBe(false);
  });
});

describe('consentGaps', () => {
  it('is empty for adults', () => {
    expect(consentGaps(emptyConsent('18_plus'), '18_plus')).toEqual([]);
  });
  it('lists the missing affirmations for a 13–17 athlete (no email needed)', () => {
    const gaps = consentGaps(emptyConsent('13_17'), '13_17');
    expect(gaps).toContain('guardian name');
    expect(gaps).toContain('the parent/guardian affirmation');
    expect(gaps).not.toContain('a valid guardian email');
  });
  it('requires a valid guardian email for under-13', () => {
    const draft = { ...complete('under_13'), consentedAt: null, guardianEmail: 'not-an-email' };
    expect(consentGaps(draft, 'under_13')).toContain('a valid guardian email');
    expect(consentGaps({ ...draft, guardianEmail: 'p@x.co' }, 'under_13')).not.toContain('a valid guardian email');
  });
});

describe('isConsentSatisfied', () => {
  it('is satisfied for adults with no record', () => {
    expect(isConsentSatisfied(null, '18_plus')).toBe(true);
  });
  it('is unsatisfied for a minor with no record', () => {
    expect(isConsentSatisfied(null, '13_17')).toBe(false);
  });
  it('is satisfied by a complete, current record', () => {
    expect(isConsentSatisfied(complete('13_17'), '13_17')).toBe(true);
    expect(isConsentSatisfied(complete('under_13'), 'under_13')).toBe(true);
  });
  it('forces re-consent when the terms version changed', () => {
    expect(isConsentSatisfied(complete('13_17', { termsVersion: '2000-01-01' }), '13_17')).toBe(false);
  });
  it('is unsatisfied when an affirmation is missing', () => {
    expect(isConsentSatisfied(complete('13_17', { agreesToSupervise: false }), '13_17')).toBe(false);
  });
  it('is unsatisfied for under-13 without a guardian email', () => {
    expect(isConsentSatisfied(complete('under_13', { guardianEmail: '' }), 'under_13')).toBe(false);
  });
});
