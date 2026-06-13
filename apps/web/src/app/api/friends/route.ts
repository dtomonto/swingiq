// WS-05 — GET /api/friends  (accepted friends list)
import { NextRequest, NextResponse } from 'next/server';
import { listFriends } from '@/lib/friends/service';
import { getFriendsContext, isResponse, friendsRateLimit, friendsError } from './_shared';

export async function GET(req: NextRequest) {
  const limited = await friendsRateLimit(req, 'list', 120);
  if (limited) return limited;
  const ctx = await getFriendsContext();
  if (isResponse(ctx)) return ctx;
  try {
    const friends = await listFriends(ctx.server, ctx.admin, ctx.userId);
    return NextResponse.json({ friends });
  } catch (e) {
    return friendsError(e);
  }
}
