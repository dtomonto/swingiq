// ============================================================
// SwingVantage — Billing Tiers (data, client-safe)
//
// Tier definitions used by the pricing page and the checkout flow.
// SwingVantage is fully usable on the Free tier forever. Monetization order is
// free → ads → membership tiers (docs/MONETIZATION_STRATEGY.md), so these
// paid tiers are Phase 3: the pricing page shows them as "Coming Soon"
// (optional email notify) until Stripe keys are configured (see
// lib/billing/stripe.ts and /api/billing/checkout) — no charges ever
// happen without keys.
// ============================================================

export type TierId = 'free' | 'pro' | 'team';

export interface BillingTier {
  id: TierId;
  name: string;
  /** Monthly price in USD, or null for the free tier. */
  priceMonthly: number | null;
  tagline: string;
  features: string[];
  /** True for the highlighted tier. */
  popular?: boolean;
  /** Env var holding the Stripe price ID (server reads it). */
  stripePriceEnv?: 'STRIPE_PRICE_PRO' | 'STRIPE_PRICE_TEAM';
}

export const BILLING_TIERS: BillingTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    tagline: 'Everything you need to improve — forever free.',
    features: [
      'All 7 sports (golf, tennis, pickleball, padel, baseball, softball)',
      'AI swing analysis & priority-issue diagnosis',
      'Athlete General Intelligence — your cross-sport priority + coach-shareable report',
      'Drill recommendations + practice plans',
      'Session history & progress tracking',
      'Data backup & restore',
      'Side-by-side swing comparison',
      'Local data storage (no account needed)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 12,
    tagline: 'For serious, data-driven athletes.',
    popular: true,
    stripePriceEnv: 'STRIPE_PRICE_PRO',
    features: [
      'Everything in Free',
      'Cloud sync across devices',
      'Video storage & history',
      'OCR / image data extraction',
      'Verified professional swing library',
      'Unlimited AI narrative coaching',
      'PDF reports & coach sharing',
      'Priority support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    priceMonthly: 49,
    tagline: 'For coaches, facilities, and academies.',
    stripePriceEnv: 'STRIPE_PRICE_TEAM',
    features: [
      'Everything in Pro',
      'Up to 20 athletes',
      'Coach dashboard & athlete invites',
      'Aggregate team analytics',
      'White-label option',
    ],
  },
];

export function getTier(id: TierId): BillingTier | undefined {
  return BILLING_TIERS.find((t) => t.id === id);
}

// ── Tier rollout (gradual launch) ─────────────────────────────
// The paid tiers (Pro = "Tier 2", Team = "Tier 3") are launched gradually.
// A single admin-controlled mode decides whether they are purchasable yet:
//   'free' → only Free is active; paid tiers show a "join the waitlist" CTA
//            so interested (signed-in) users can be counted before rollout.
//   'full' → every tier is rolled out and purchasable (checkout / notify).
// Free is ALWAYS active in either mode.
export type TierRolloutMode = 'free' | 'full';

/** The default rollout state: paid tiers gated behind the waitlist. */
export const DEFAULT_TIER_ROLLOUT_MODE: TierRolloutMode = 'free';

/** Whether a tier is rolled out (purchasable/active) under the given mode. */
export function isTierRolledOut(id: TierId, mode: TierRolloutMode): boolean {
  if (id === 'free') return true;
  return mode === 'full';
}

/** The paid tiers that can collect waitlist interest while gated. */
export const WAITLIST_TIER_IDS: TierId[] = BILLING_TIERS.filter((t) => t.id !== 'free').map((t) => t.id);

/** Type guard for a user-supplied tier id. */
export function isTierId(value: unknown): value is TierId {
  return value === 'free' || value === 'pro' || value === 'team';
}
