// ============================================================
// SwingVantage — Pure billing/plan helpers (no I/O, easy to unit-test)
//
// These functions translate between Stripe concepts (price ids,
// subscription statuses) and SwingVantage tiers. They take all inputs
// explicitly so they can be tested without a database or network.
// ============================================================

import type { TierId } from './tiers';

/** Stripe subscription statuses that should grant the paid tier. */
export const ACTIVE_STATUSES = ['active', 'trialing'] as const;

/**
 * The tier a user should effectively have right now, given the plan they
 * subscribed to and their current Stripe status. Anything that isn't an
 * active/trialing paid plan resolves to 'free' — conservative by design.
 */
export function effectiveTier(
  status: string | null | undefined,
  planTier: TierId | null | undefined,
): TierId {
  if (!planTier || planTier === 'free') return 'free';
  if (status && (ACTIVE_STATUSES as readonly string[]).includes(status)) return planTier;
  return 'free';
}

/**
 * Map a Stripe price id back to a SwingVantage tier using the configured env.
 * Returns null when the price doesn't match a known tier price.
 */
export function priceIdToTier(
  priceId: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): TierId | null {
  if (!priceId) return null;
  if (env.STRIPE_PRICE_PRO && priceId === env.STRIPE_PRICE_PRO) return 'pro';
  if (env.STRIPE_PRICE_TEAM && priceId === env.STRIPE_PRICE_TEAM) return 'team';
  return null;
}
