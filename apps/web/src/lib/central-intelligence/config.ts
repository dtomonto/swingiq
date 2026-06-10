// ============================================================
// CentralIntelligenceOS — Configuration constants
// ------------------------------------------------------------
// The platform's ethical intelligence brain. This file holds the
// campaign-wide constants and ethical guarantees so they live in
// ONE place and never drift across the server, the global banner,
// the admin command center, and the tests.
//
// DESIGN: keyless-first, local-first — mirrors the rest of the app.
// Everything here is a plain constant with no secrets and no DOM.
// ============================================================

/** Number of qualified Founding Members the launch campaign accepts. */
export const FOUNDING_REQUIRED_COUNT = 100;

/** Valid sessions a user must record to qualify (alongside a complete profile). */
export const FOUNDING_REQUIRED_SESSIONS = 10;

/**
 * Launch baseline for the PUBLIC founding counter. 0 = show the ACTUAL number of
 * qualified members (no seeded head-start): the first real Founding Member is
 * #001 and the counter reflects real signups only. Single-sourced — change it
 * here and it flows everywhere (counter, badge numbers, cap math).
 */
export const FOUNDING_COUNTER_BASELINE = 0;

/**
 * The Founding-Member reward: the first FOUNDING_REQUIRED_COUNT athletes who
 * complete the Founding Journey lock in a free account FOR LIFE — even after
 * paid membership tiers launch. Surfaced wherever we explain the campaign.
 */
export const FOUNDING_PERK = 'A free account for life — locked in, even after membership tiers launch.';
export const FOUNDING_PERK_SHORT = 'Free for life';

/**
 * Profile completion threshold (percent) that counts as "fully complete"
 * for campaign qualification. Kept slightly below 100 so a single optional
 * field never blocks a genuinely complete athlete, but high enough that the
 * coaching-critical fields are all present.
 */
export const PROFILE_COMPLETE_THRESHOLD = 100;

/**
 * Ethical data-use guarantees. These are the product's promises, surfaced in
 * user-facing copy and the admin Data Governance center. Centralized so the
 * language is consistent everywhere and can be reviewed in one place.
 */
export const DATA_ETHICS = {
  neverSold: 'We never sell your personal data.',
  ownExperience:
    'Your data is used only to personalize your coaching and improve SwingVantage.',
  noCrossUser: 'Your private data is never exposed to other users.',
  rights: 'You can view, export, or delete your data at any time.',
  aggregateAnonymized:
    'Product insights use anonymized, aggregated data only — never individual records.',
} as const;

/**
 * Minimum cohort size before an anonymized aggregate may be shown. Below this
 * threshold a small group could re-identify an individual, so the aggregate is
 * suppressed. (k-anonymity style guard.)
 */
export const AGGREGATE_MIN_COHORT = 10;

/** Stable analytics + record key for the Founding Fathers campaign. */
export const FOUNDING_CAMPAIGN_KEY = 'founding-fathers';

/** Inclusive, welcoming public name. The internal key stays "founding-fathers". */
export const FOUNDING_CAMPAIGN_PUBLIC_NAME = 'Founding Members';

/** Format a raw member index as a zero-padded badge number, e.g. 7 -> "#007". */
export function formatMemberNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';
  return `#${String(Math.floor(n)).padStart(3, '0')}`;
}
