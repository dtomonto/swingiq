/**
 * SwingVantage Supabase Server Client
 *
 * SERVER-SIDE ONLY — for use in Server Components, Route Handlers, and
 * Server Actions. NEVER import this module from a client component.
 *
 * In Next.js 15, cookies() from 'next/headers' is async.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client configured for server-side use.
 * Returns null if Supabase env vars are not configured (graceful degradation).
 */
export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — cookies are read-only.
          // The middleware handles refreshing the session cookie.
        }
      },
    },
  });
}

/**
 * Returns the currently authenticated user, or null if not authenticated
 * or Supabase is not configured.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
