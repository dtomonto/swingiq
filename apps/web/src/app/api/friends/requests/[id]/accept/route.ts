// WS-05 — POST /api/friends/requests/[id]/accept
import { NextRequest, NextResponse } from 'next/server';
import { acceptRequest } from '@/lib/friends/service';
import { getFriendsContext, isResponse, friendsRateLimit, friendsError } from '../../../_shared';

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const limited = await friendsRateLimit(req, 'accept', 60);
  if (limited) return limited;
  const ctx = await getFriendsContext();
  if (isResponse(ctx)) return ctx;
  const { id } = await ctxArg.params;
  try {
    await acceptRequest(ctx.server, ctx.userId, id);
    return NextResponse.json({ status: 'accepted' });
  } catch (e) {
    return friendsError(e);
  }
}
