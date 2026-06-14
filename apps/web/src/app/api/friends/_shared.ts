// ============================================================
// WS-05 — shared helpers for the friends API routes
// Centralizes auth gating, client construction, rate limiting, and error
// mapping so each route handler stays tiny and consistent. (Not a route —
// Next only treats `route.ts` files as endpoints.)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { FriendAuthError } from '@/lib/friends/authz';

export interface FriendsContext {
  userId: string;
  server: SupabaseClient;
  admin: SupabaseClient;
}

/**
 * Resolve the authenticated user + RLS-scoped server client + service-role
 * admin client (admin is used ONLY for exact handle resolution / minimal
 * public summaries — never to bypass app-level authorization).
 * Returns a NextResponse on any failure path.
 */
export async function getFriendsContext(): Promise<FriendsContext | NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to use friends.' }, { status: 401 });
  }
  const server = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!server || !admin) {
    return NextResponse.json(
      { error: 'Friends require cloud sync to be configured.' },
      { status: 503 },
    );
  }
  return { userId: user.id, server: server as unknown as SupabaseClient, admin };
}

export function isResponse(v: FriendsContext | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}

/** Standard rate-limit guard; returns a 429 response or null when allowed. */
export async function friendsRateLimit(
  req: NextRequest,
  bucket: string,
  limit = 60,
): Promise<NextResponse | null> {
  const rl = await checkRateLimit(`${clientIp(req)}:friends-${bucket}`, { limit, windowMs: 60_000 });
  return rl.allowed ? null : rateLimitResponse();
}

export function friendsError(e: unknown): NextResponse {
  if (e instanceof FriendAuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
}
