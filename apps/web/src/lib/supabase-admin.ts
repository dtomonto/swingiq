// ============================================================
// SwingIQ — Supabase Service-Role (admin) client
//
// SERVER-SIDE ONLY. Uses the SERVICE_ROLE key, which BYPASSES Row
// Level Security. Only import this from trusted server code that has
// already authorized the action itself — e.g. the Stripe webhook,
// which is authenticated by signature, not by a user session.
//
// NEVER import this from a client component or expose its results.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isConfigured } from '@/lib/capabilities';

/**
 * Returns a service-role Supabase client, or null when Supabase / the
 * service-role key isn't configured (graceful degradation — callers treat
 * null as "no cloud storage available").
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isConfigured(url) || !isConfigured(serviceRoleKey)) return null;

  return createClient(url as string, serviceRoleKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
