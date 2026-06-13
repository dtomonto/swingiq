// WS-05 — DELETE /api/friends/[id] (remove) · PATCH /api/friends/[id] (permissions)
import { NextRequest, NextResponse } from 'next/server';
import { removeFriend, updatePermissions } from '@/lib/friends/service';
import type { FriendPermissions } from '@/lib/friends/types';
import { getFriendsContext, isResponse, friendsRateLimit, friendsError } from '../_shared';

export async function DELETE(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const limited = await friendsRateLimit(req, 'remove', 60);
  if (limited) return limited;
  const ctx = await getFriendsContext();
  if (isResponse(ctx)) return ctx;
  const { id } = await ctxArg.params;
  try {
    await removeFriend(ctx.server, ctx.userId, id);
    return NextResponse.json({ status: 'removed' });
  } catch (e) {
    return friendsError(e);
  }
}

const ALLOWED_KEYS: (keyof FriendPermissions)[] = ['view_profile', 'view_reports', 'allow_upload_for_me'];

export async function PATCH(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const limited = await friendsRateLimit(req, 'permissions', 60);
  if (limited) return limited;
  const ctx = await getFriendsContext();
  if (isResponse(ctx)) return ctx;
  const { id } = await ctxArg.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  // Whitelist + coerce to booleans — ignore any unknown keys from the client.
  const patch: Partial<FriendPermissions> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) patch[key] = Boolean(body[key]);
  }

  try {
    const permissions = await updatePermissions(ctx.server, ctx.userId, id, patch);
    return NextResponse.json({ permissions });
  } catch (e) {
    return friendsError(e);
  }
}
