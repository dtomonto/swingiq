// ============================================================
// SwingIQ — Stripe Billing Scaffold (server-only)
// ------------------------------------------------------------
// A thin, dependency-free Stripe wrapper that activates ONLY when keys
// are present. With no key it returns a clear "not configured" result —
// it never fakes a checkout. Uses Stripe's REST API via fetch (no SDK),
// matching the AI-vision provider's honesty pattern.
//
// Wiring a real billing flow still needs the owner to: create products
// + prices in Stripe, set the env vars, and add a webhook endpoint.
// See docs/INTEGRATIONS_SETUP.md.
// ============================================================

import { stripeConfigured, type Env } from '@/lib/config/integrations';

export const STRIPE_NOT_CONFIGURED =
  'Billing is not set up yet. Add your Stripe keys to enable paid plans. ' +
  'SwingIQ stays fully free until billing is configured.';

export interface StripeConfig {
  configured: boolean;
  secretKey?: string;
  publishableKey?: string;
}

export function getStripeConfig(env: Env = process.env): StripeConfig {
  return {
    configured: stripeConfigured(env),
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };
}

export interface CheckoutParams {
  /** A Stripe Price ID (e.g. from STRIPE_PRICE_PRO). */
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  /** Optional customer email to prefill. */
  customerEmail?: string;
  mode?: 'subscription' | 'payment';
}

export type CheckoutOutcome =
  | { configured: false; reason: string }
  | { configured: true; ok: true; url: string; sessionId: string }
  | { configured: true; ok: false; error: string };

/**
 * Create a Stripe Checkout session. Returns `configured:false` (never an
 * error, never a fake URL) when Stripe isn't set up.
 */
export async function createCheckoutSession(
  params: CheckoutParams,
  env: Env = process.env,
): Promise<CheckoutOutcome> {
  const cfg = getStripeConfig(env);
  if (!cfg.configured || !cfg.secretKey) {
    return { configured: false, reason: STRIPE_NOT_CONFIGURED };
  }

  // Stripe's API is form-encoded.
  const form = new URLSearchParams();
  form.set('mode', params.mode ?? 'subscription');
  form.set('line_items[0][price]', params.priceId);
  form.set('line_items[0][quantity]', '1');
  form.set('success_url', params.successUrl);
  form.set('cancel_url', params.cancelUrl);
  if (params.customerEmail) form.set('customer_email', params.customerEmail);

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };
    if (!res.ok || !data.url || !data.id) {
      return {
        configured: true,
        ok: false,
        error: data.error?.message ?? `Stripe returned ${res.status}.`,
      };
    }
    return { configured: true, ok: true, url: data.url, sessionId: data.id };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      error: `Could not reach Stripe: ${err instanceof Error ? err.message : 'network error'}`,
    };
  }
}
