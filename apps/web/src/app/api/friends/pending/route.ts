// WS-05 — GET /api/friends/pending  (incoming + outgoing requests)
import { NextRequest, NextResponse } from 'next/server';
import { listPending } from '@/lib/friends/service';
import { getFriendsContext, isResponse, friendsRateLimit, friendsError } from '../_shared';

export async function GET(req: NextRequest) {
  const limited = await friendsRateLimit(req, 'pending', 120);
  if (limited) return limited;
  const ctx = await getFriendsContext();
  if (isResponse(ctx)) return ctx;
  try {
    const pending = await listPending(ctx.server, ctx.admin, ctx.userId);
    return NextResponse.json(pending);
  } catch (e) {
    return friendsError(e);
  }
}
