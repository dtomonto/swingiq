// WS-05 — POST /api/friends/requests/[id]/decline
import { NextRequest, NextResponse } from 'next/server';
import { declineRequest } from '@/lib/friends/service';
import { getFriendsContext, isResponse, friendsRateLimit, friendsError } from '../../../_shared';

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const limited = await friendsRateLimit(req, 'decline', 60);
  if (limited) return limited;
  const ctx = await getFriendsContext();
  if (isResponse(ctx)) return ctx;
  const { id } = await ctxArg.params;
  try {
    await declineRequest(ctx.server, ctx.userId, id);
    return NextResponse.json({ status: 'declined' });
  } catch (e) {
    return friendsError(e);
  }
}
