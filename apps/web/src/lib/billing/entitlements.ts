// ============================================================
// SwingVantage — Per-user entitlements (who is on which paid plan)
//
// Reads/writes the `subscriptions` table via the service-role client.
// The Stripe webhook WRITES here; the app READS here to gate Pro/Team
// features per user. Degrades to the Free tier whenever Supabase isn't
// configured, so nothing breaks in keyless/local mode.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { effectiveTier } from './plan';
import type { TierId } from './tiers';

export interface Entitlement {
  /** The access level the user should have right now (free if not active). */
  tier: TierId;
  /** The plan they subscribed to (may differ from `tier` if past_due/canceled). */
  planTier: TierId;
  /** Raw Stripe subscription status. */
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  /** ISO timestamp of when the current paid period ends, if known. */
  currentPeriodEnd: string | null;
}

const FREE_ENTITLEMENT: Entitlement = {
  tier: 'free',
  planTier: 'free',
  status: 'inactive',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
};

interface SubscriptionRow {
  tier: string | null;
  status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

/** Look up a user's entitlement. Always resolves (Free when unknown). */
export async function getUserEntitlement(userId: string): Promise<Entitlement> {
  const admin = createSupabaseAdminClient();
  if (!admin) return FREE_ENTITLEMENT;

  const { data, error } = await admin
    .from('subscriptions')
    .select('tier,status,stripe_customer_id,stripe_subscription_id,current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  const row = (data ?? null) as SubscriptionRow | null;
  if (error || !row) return FREE_ENTITLEMENT;

  const planTier = (row.tier as TierId) ?? 'free';
  return {
    tier: effectiveTier(row.status, planTier),
    planTier,
    status: row.status ?? 'inactive',
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodEnd: row.current_period_end,
  };
}

/** Convenience: the effective tier for a user id. */
export async function getUserTier(userId: string): Promise<TierId> {
  return (await getUserEntitlement(userId)).tier;
}

/** The current request's authenticated user entitlement (Free if signed out). */
export async function getCurrentUserEntitlement(): Promise<Entitlement> {
  const user = await getAuthenticatedUser();
  if (!user) return FREE_ENTITLEMENT;
  return getUserEntitlement(user.id);
}

/** True when the signed-in user currently has Pro or Team access. */
export async function currentUserHasPaidAccess(): Promise<boolean> {
  const { tier } = await getCurrentUserEntitlement();
  return tier !== 'free';
}

export interface UpsertEntitlementParams {
  userId: string;
  tier: TierId;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
}

/** Insert or update a user's entitlement (called by the Stripe webhook). */
export async function upsertEntitlement(
  params: UpsertEntitlementParams,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, error: 'Supabase service role not configured.' };

  const row: Record<string, unknown> = {
    user_id: params.userId,
    tier: params.tier,
    status: params.status,
    updated_at: new Date().toISOString(),
  };
  if (params.stripeCustomerId !== undefined) row.stripe_customer_id = params.stripeCustomerId;
  if (params.stripeSubscriptionId !== undefined) row.stripe_subscription_id = params.stripeSubscriptionId;
  if (params.currentPeriodEnd !== undefined) row.current_period_end = params.currentPeriodEnd;

  const { error } = await admin.from('subscriptions').upsert(row, { onConflict: 'user_id' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Reverse lookup used by subscription webhooks that lack user metadata. */
export async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  const row = (data ?? null) as { user_id: string } | null;
  return row?.user_id ?? null;
}
