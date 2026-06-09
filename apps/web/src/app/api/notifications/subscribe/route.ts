// ============================================================
// POST /api/notifications/subscribe   — save a browser push subscription
// POST /api/notifications/unsubscribe — handled in ../unsubscribe
// ------------------------------------------------------------
// Requires a signed-in user. Stores the subscription against their account so
// the server can send practice-reminder / re-engagement push. Honest 503 when
// push isn't configured (no VAPID) or storage is unavailable.
// ============================================================

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isPushConfigured } from '@/lib/notifications/web-push';
import { savePushSubscription, pushStoreAvailable } from '@/lib/notifications/push-subscriptions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!isPushConfigured() || !pushStoreAvailable()) {
    return NextResponse.json(
      { error: 'push-not-configured', message: 'Push is not configured on this deployment.' },
      { status: 503 },
    );
  }

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'invalid subscription' }, { status: 400 });
  }

  const ok = await savePushSubscription(user.id, { endpoint, p256dh, auth });
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'save-failed' }, { status: 500 });
}
