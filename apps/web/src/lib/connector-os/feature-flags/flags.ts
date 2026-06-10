// ============================================================
// ConnectorOS — connector feature flags (keyless-first)
// ------------------------------------------------------------
// A tiny, typed enumeration of every ConnectorOS connector and a
// uniform way to ask "is this connector configured?". This is NOT a
// second feature-flag system — operator kill-switches live in
// /admin/feature-flags and the runtime capability checks live in
// lib/capabilities.ts. This file simply names the connectors so the
// status registry, admin surface and docs all share one vocabulary.
// ============================================================

/** Every ConnectorOS connector, by stable id. */
export type ConnectorFlag =
  // Analytics & growth
  | 'posthog'
  | 'ga4'
  | 'plausible'
  | 'clarity'
  // Reliability
  | 'sentry'
  | 'vercelAnalytics'
  | 'speedInsights'
  // SEO / indexing
  | 'gscVerification'
  | 'bingVerification'
  | 'indexnow'
  // Trust / security
  | 'turnstile'
  // Video / media
  | 'mediapipe'
  | 'mux'
  | 'cloudinary'
  // Monetization (future, already flag-gated in lib/capabilities)
  | 'adsense'
  | 'stripe'
  | 'beehiiv'
  | 'rewardful';

export const CONNECTOR_FLAGS: readonly ConnectorFlag[] = [
  'posthog', 'ga4', 'plausible', 'clarity',
  'sentry', 'vercelAnalytics', 'speedInsights',
  'gscVerification', 'bingVerification', 'indexnow',
  'turnstile',
  'mediapipe', 'mux', 'cloudinary',
  'adsense', 'stripe', 'beehiiv', 'rewardful',
] as const;
