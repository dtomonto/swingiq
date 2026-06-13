// ============================================================
// WS-04/05 — GET/PUT /api/player-profile/handle
// The caller's public handle (used so friends can find them). GET returns
// the current handle; PUT claims/updates it (validated + unique). Owner-only
// via the RLS-scoped server client; the user id is derived from the session.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { normalizeHandle, isValidHandle } from '@/lib/friends/service';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const server = await createSupabaseServerClient();
  if (!server) return NextResponse.json({ handle: null });
  const { data } = await server
    .from('player_profiles')
    .select('handle')
    .eq('user_id', user.id)
    .maybeSingle();
  return NextResponse.json({ handle: (data as { handle: string | null } | null)?.handle ?? null });
}

export async function PUT(req: NextRequest) {
  const rl = await checkRateLimit(`${clientIp(req)}:handle-set`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const server = await createSupabaseServerClient();
  if (!server) return NextResponse.json({ error: 'Cloud sync is not configured.' }, { status: 503 });

  let body: { handle?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const handle = normalizeHandle(typeof body.handle === 'string' ? body.handle : '');
  if (!isValidHandle(handle)) {
    return NextResponse.json(
      { error: 'Handles are 3–20 characters: lowercase letters, numbers, and underscores.' },
      { status: 400 },
    );
  }

  // Upsert the caller's profile row (keyed by user_id). A unique-violation on
  // the handle index means someone else already claimed it.
  const { error } = await server
    .from('player_profiles')
    .upsert({ user_id: user.id, handle }, { onConflict: 'user_id' });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That handle is already taken.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not save your handle.' }, { status: 400 });
  }
  return NextResponse.json({ handle });
}
