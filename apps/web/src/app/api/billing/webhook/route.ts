// ============================================================
// POST /api/billing/webhook — Stripe subscription events
//
// Stripe calls this after a checkout completes or a subscription
// changes. We verify the signature (SDK-free), then record the user's
// current tier in the `subscriptions` table so the app can gate Pro
// features per user. Configure the endpoint URL + signing secret in
// the Stripe dashboard → Developers → Webhooks.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isConfigured } from '@/lib/capabilities';
import { verifyStripeSignature } from '@/lib/billing/webhook-signature';
import { priceIdToTier } from '@/lib/billing/plan';
import { upsertEntitlement, findUserIdByCustomer } from '@/lib/billing/entitlements';
import type { TierId } from '@/lib/billing/tiers';

export const runtime = 'nodejs';

// ── Minimal, defensive readers for the untyped Stripe event JSON ──
type Json = Record<string, unknown>;
const asObj = (v: unknown): Json | undefined =>
  v && typeof v === 'object' ? (v as Json) : undefined;
const asStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const asNum = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);

function firstPriceId(subscription: Json): string | undefined {
  const items = asObj(subscription.items);
  const data = items?.data;
  if (Array.isArray(data) && data.length > 0) {
    const price = asObj(asObj(data[0])?.price);
    return asStr(price?.id);
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isConfigured(secret)) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 400 });
  }

  // Raw body is required for signature verification — never parse first.
  const rawBody = await req.text();
  const verdict = verifyStripeSignature(rawBody, req.headers.get('stripe-signature'), secret as string);
  if (!verdict.ok) {
    return NextResponse.json({ error: `Invalid signature (${verdict.reason}).` }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Json } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const object = event.data?.object ?? {};

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const meta = asObj(object.metadata);
        const userId = asStr(object.client_reference_id) ?? asStr(meta?.user_id);
        const tier = (asStr(meta?.tier) as TierId | undefined) ?? 'pro';
        if (userId) {
          await upsertEntitlement({
            userId,
            tier,
            status: 'active',
            stripeCustomerId: asStr(object.customer) ?? null,
            stripeSubscriptionId: asStr(object.subscription) ?? null,
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const meta = asObj(object.metadata);
        const customerId = asStr(object.customer) ?? null;
        let userId = asStr(meta?.user_id);
        if (!userId && customerId) {
          userId = (await findUserIdByCustomer(customerId)) ?? undefined;
        }
        if (userId) {
          const tier =
            priceIdToTier(firstPriceId(object)) ?? (asStr(meta?.tier) as TierId | undefined) ?? 'free';
          const status =
            event.type === 'customer.subscription.deleted'
              ? 'canceled'
              : asStr(object.status) ?? 'inactive';
          const periodEnd = asNum(object.current_period_end);
          await upsertEntitlement({
            userId,
            tier,
            status,
            stripeCustomerId: customerId,
            stripeSubscriptionId: asStr(object.id) ?? null,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined,
          });
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch {
    // Returning 500 tells Stripe to retry later (transient DB issues etc.).
    return NextResponse.json({ error: 'Handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
