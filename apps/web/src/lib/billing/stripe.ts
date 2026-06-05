// ============================================================
// SwingVantage — Stripe checkout (server-only, SDK-free)
//
// Talks to Stripe's REST API directly with fetch — no `stripe`
// npm dependency. Every function returns a "not configured" result
// when Stripe keys are absent, so the app degrades to the keyless
// waitlist with zero risk of a real charge.
// ============================================================

import { isStripeConfigured } from '@/lib/capabilities';
import { getTier, type TierId } from './tiers';

const STRIPE_API = 'https://api.stripe.com/v1';

export interface CheckoutResult {
  ok: boolean;
  /** Stripe-hosted checkout URL when ok. */
  url?: string;
  /** Machine-readable reason when not ok. */
  reason?: 'not_configured' | 'invalid_tier' | 'missing_price' | 'stripe_error' | 'auth_required';
  message?: string;
}

export interface CheckoutOptions {
  /** Supabase user id — links the payment to an account (the webhook reads this). */
  userId?: string;
  /** Prefill the customer's email at checkout. */
  email?: string;
}

export interface PortalResult {
  ok: boolean;
  /** Stripe-hosted billing-portal URL when ok. */
  url?: string;
  reason?: 'not_configured' | 'no_customer' | 'stripe_error';
  message?: string;
}

/** Encode a flat/nested object as application/x-www-form-urlencoded for Stripe. */
function formEncode(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * Create a Stripe Checkout session for a paid tier.
 * Returns { ok: false, reason: 'not_configured' } when Stripe is not set up.
 */
export async function createCheckoutSession(
  tierId: TierId,
  origin: string,
  opts: CheckoutOptions = {},
): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { ok: false, reason: 'not_configured', message: 'Paid plans are not enabled yet.' };
  }

  const tier = getTier(tierId);
  if (!tier || !tier.stripePriceEnv) {
    return { ok: false, reason: 'invalid_tier', message: 'Unknown plan.' };
  }

  const priceId = process.env[tier.stripePriceEnv];
  if (!priceId) {
    return { ok: false, reason: 'missing_price', message: `Set ${tier.stripePriceEnv} to enable ${tier.name}.` };
  }

  // Stamp the tier + user onto BOTH the checkout session and the resulting
  // subscription, so every webhook event can be traced back to an account.
  const params: Record<string, string> = {
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/dashboard?upgraded=${tierId}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    allow_promotion_codes: 'true',
    'metadata[tier]': tierId,
    'subscription_data[metadata][tier]': tierId,
  };
  if (opts.userId) {
    params.client_reference_id = opts.userId;
    params['metadata[user_id]'] = opts.userId;
    params['subscription_data[metadata][user_id]'] = opts.userId;
  }
  if (opts.email) {
    params.customer_email = opts.email;
  }

  try {
    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formEncode(params),
    });
    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) {
      return { ok: false, reason: 'stripe_error', message: data.error?.message ?? 'Stripe checkout failed.' };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, reason: 'stripe_error', message: 'Could not reach Stripe.' };
  }
}

/**
 * Create a Stripe Billing Portal session so a subscriber can update payment
 * details or cancel. Returns not_configured / no_customer instead of throwing.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<PortalResult> {
  if (!isStripeConfigured()) {
    return { ok: false, reason: 'not_configured', message: 'Billing is not enabled.' };
  }
  if (!customerId) {
    return { ok: false, reason: 'no_customer', message: 'No subscription found for this account.' };
  }

  try {
    const res = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formEncode({ customer: customerId, return_url: returnUrl }),
    });
    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) {
      return { ok: false, reason: 'stripe_error', message: data.error?.message ?? 'Could not open the billing portal.' };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, reason: 'stripe_error', message: 'Could not reach Stripe.' };
  }
}
