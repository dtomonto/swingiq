// ============================================================
// SwingVantage — Guardian Consent: policy (pure)
// ------------------------------------------------------------
// All the consent rules in one pure, testable place: classify an age band,
// say what it requires, and decide whether a record satisfies it. No storage,
// no React.
// ============================================================
import type { AgeBand, ConsentRequirement, GuardianConsentRecord } from './types';

/** Bump when the consent disclosures change; older records must re-consent. */
export const CONSENT_TERMS_VERSION = '2026-06-07';

/** Map the existing settings.usage_category to a sensible default age band. */
export function ageBandFromUsageCategory(category: string | null | undefined): AgeBand {
  switch (category) {
    case 'minor_13_17':
      return '13_17';
    case 'adult':
    case 'coach':
    case 'parent_guardian':
      // The account holder is an adult; the athlete's band is set in the flow.
      return '18_plus';
    default:
      return 'unknown';
  }
}

export function consentRequirementFor(ageBand: AgeBand): ConsentRequirement {
  if (ageBand === 'under_13') {
    return {
      required: true,
      needsGuardianEmail: true,
      reason:
        'SwingVantage is not directed to children under 13. A parent or guardian must set up and manage this account and record consent here.',
    };
  }
  if (ageBand === '13_17') {
    return {
      required: true,
      needsGuardianEmail: false,
      reason:
        'For a young athlete (13–17), a parent or guardian should review how SwingVantage works and record their consent.',
    };
  }
  // 18_plus or unknown-adult: nothing to gate.
  return { required: false, needsGuardianEmail: false, reason: '' };
}

/** A blank record for a given band, stamped with the current terms version. */
export function emptyConsent(ageBand: AgeBand = 'unknown'): GuardianConsentRecord {
  return {
    version: 1,
    ageBand,
    guardianAffirmed: false,
    guardianName: '',
    guardianEmail: '',
    acknowledgedNotMedical: false,
    agreesToSupervise: false,
    injuryLimitations: '',
    consentedAt: null,
    termsVersion: CONSENT_TERMS_VERSION,
  };
}

function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

/**
 * The list of still-missing items for a draft, given the athlete's age band.
 * Empty array = ready to record. Used to drive the Save button + inline help.
 */
export function consentGaps(draft: GuardianConsentRecord, ageBand: AgeBand): string[] {
  const req = consentRequirementFor(ageBand);
  if (!req.required) return [];
  const gaps: string[] = [];
  if (!draft.guardianName.trim()) gaps.push('guardian name');
  if (req.needsGuardianEmail && !isEmail(draft.guardianEmail)) gaps.push('a valid guardian email');
  if (!draft.guardianAffirmed) gaps.push('the parent/guardian affirmation');
  if (!draft.acknowledgedNotMedical) gaps.push('the not-medical-advice acknowledgment');
  if (!draft.agreesToSupervise) gaps.push('the supervision agreement');
  return gaps;
}

/**
 * Whether a stored record fully satisfies the requirement for an age band under
 * the CURRENT terms. Adults are always satisfied; a terms-version bump forces
 * re-consent.
 */
export function isConsentSatisfied(
  record: GuardianConsentRecord | null,
  ageBand: AgeBand,
): boolean {
  const req = consentRequirementFor(ageBand);
  if (!req.required) return true;
  if (!record || !record.consentedAt) return false;
  if (record.termsVersion !== CONSENT_TERMS_VERSION) return false;
  return consentGaps(record, ageBand).length === 0;
}
