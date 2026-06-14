// WS-05 — POST /api/friends/requests  (send a request by handle)
// Body: { handle: string }. The actor is ALWAYS derived from the session;
// an unknown handle returns the same generic shape as success to prevent
// handle enumeration.
import { NextRequest, NextResponse } from 'next/server';
import { sendRequestByHandle } from '@/lib/friends/service';
import { getFriendsContext, isResponse, friendsRateLimit, friendsError } from '../_shared';

export async function POST(req: NextRequest) {
  const limited = await friendsRateLimit(req, 'send', 20);
  if (limited) return limited;
  const ctx = await getFriendsContext();
  if (isResponse(ctx)) return ctx;

  let body: { handle?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const handle = typeof body.handle === 'string' ? body.handle : '';
  if (!handle) return NextResponse.json({ error: 'A handle is required.' }, { status: 400 });

  try {
    const result = await sendRequestByHandle(ctx.server, ctx.admin, ctx.userId, handle);
    if (result.status === 'self') {
      return NextResponse.json({ error: "You can't add yourself." }, { status: 400 });
    }
    if (result.status === 'already_friends') {
      return NextResponse.json({ status: 'already_friends' });
    }
    if (result.status === 'already_pending') {
      return NextResponse.json({ status: 'already_pending' });
    }
    // 'sent' and 'not_found' both report a neutral "sent" to the client so an
    // attacker cannot probe which handles exist.
    return NextResponse.json({ status: 'sent' });
  } catch (e) {
    return friendsError(e);
  }
}
