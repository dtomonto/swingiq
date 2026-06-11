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
