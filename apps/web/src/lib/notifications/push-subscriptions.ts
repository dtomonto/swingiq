// ============================================================
// Web-push subscriptions store (SERVER-ONLY)
// ------------------------------------------------------------
// Persists browser PushSubscriptions in Supabase (table: push_subscriptions,
// see supabase-push-subscriptions.sql). Honest-off: when the service role isn't
// configured (or the table doesn't exist yet) every call no-ops gracefully —
// nothing is faked. NEVER import from a client component.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Whether subscriptions can be persisted (service role configured). */
export function pushStoreAvailable(): boolean {
  return createSupabaseAdminClient() !== null;
}

/** Upsert a subscription for a user (keyed by endpoint). Returns success. */
export async function savePushSubscription(
  userId: string,
  sub: StoredPushSubscription,
): Promise<boolean> {
  const client = createSupabaseAdminClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('push_subscriptions')
      .upsert(
        { user_id: userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { onConflict: 'endpoint' },
      );
    return !error;
  } catch {
    return false;
  }
}

/** Every stored subscription for a user (empty when unavailable). */
export async function listPushSubscriptions(userId: string): Promise<StoredPushSubscription[]> {
  const client = createSupabaseAdminClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data as StoredPushSubscription[];
  } catch {
    return [];
  }
}

/** Remove a subscription by endpoint (e.g. on unsubscribe or 410 Gone). */
export async function deletePushSubscription(endpoint: string): Promise<void> {
  const client = createSupabaseAdminClient();
  if (!client) return;
  try {
    await client.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch {
    /* best-effort */
  }
}
