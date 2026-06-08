// ============================================================
// SwingVantage — Guardian Consent: types
// ------------------------------------------------------------
// A real consent WORKFLOW for young athletes — not just messaging. The app
// already knows a user's usage_category (adult / parent_guardian / coach /
// minor_13_17), but nothing captured a guardian's consent, recorded it, or
// gated on it. This module adds the record + the rules.
//
// Honest-first: this is a clear, documented affirmation flow with a dated,
// versioned record the guardian controls — not a claim of legally-verified
// identity. It is the right first step for a free, low-data, pre-revenue app.
// ============================================================

/** Coarse age band that drives the consent requirement. */
export type AgeBand = 'under_13' | '13_17' | '18_plus' | 'unknown';

/**
 * A recorded guardian consent. Stored local-first in its own namespace (and
 * cloud-syncable later) — it never touches the main store/backup schema.
 */
export interface GuardianConsentRecord {
  version: 1;
  /** The athlete's age band the guardian is consenting for. */
  ageBand: AgeBand;
  /** "I am this athlete's parent or legal guardian." */
  guardianAffirmed: boolean;
  guardianName: string;
  /** Guardian contact — required for under-13. */
  guardianEmail: string;
  /** "I understand SwingVantage gives practice guidance, not medical advice." */
  acknowledgedNotMedical: boolean;
  /** "I'll supervise practice in an age-appropriate way." */
  agreesToSupervise: boolean;
  /** Optional injury / physical limitations to keep practice safe (plan §15). */
  injuryLimitations: string;
  /** ISO timestamp consent was recorded; null until saved. */
  consentedAt: string | null;
  /** The consent-terms version this record satisfies (re-consent on change). */
  termsVersion: string;
}

/** What a given age band requires before the athlete should use the app. */
export interface ConsentRequirement {
  /** Whether guardian consent must be recorded for this athlete. */
  required: boolean;
  /** Whether a guardian email must be collected (stricter, for under-13). */
  needsGuardianEmail: boolean;
  /** Plain-English reason, shown to the user. */
  reason: string;
}
