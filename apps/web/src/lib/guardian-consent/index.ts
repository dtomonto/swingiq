// ============================================================
// SwingVantage — Guardian Consent: public API (barrel)
// ------------------------------------------------------------
// A real consent workflow + record for young athletes. Import from
// '@/lib/guardian-consent'.
// ============================================================
export * from './types';
export {
  CONSENT_TERMS_VERSION,
  ageBandFromUsageCategory,
  consentRequirementFor,
  emptyConsent,
  consentGaps,
  isConsentSatisfied,
} from './policy';
export {
  loadGuardianConsent,
  saveGuardianConsent,
  clearGuardianConsent,
  subscribeGuardianConsent,
  getGuardianConsentVersion,
} from './store';
export { useGuardianConsent, type GuardianConsentView } from './useGuardianConsent';
