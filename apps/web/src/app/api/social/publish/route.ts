// ============================================================
// POST /api/social/publish — publish ONE approved post to its channel.
// Admin-guarded, rate-limited. The engine's kill-switch
// (SOCIAL_AUTOPUBLISH) is the real gate; with it off this is a no-op.
// If the post is persisted (postId), its status flips to "published".
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { publishPost } from '@/lib/social/publishers';
import { persistenceAvailable, updatePost } from '@/lib/social/store';
import type { GeneratedPost } from '@/lib/social/types';

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:social-publish`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { post, postId } = (body ?? {}) as { post?: Partial<GeneratedPost>; postId?: unknown };
  if (!post || typeof post.platform !== 'string' || typeof post.text !== 'string' || !post.text.trim()) {
    return NextResponse.json({ error: 'Invalid post payload.' }, { status: 400 });
  }

  const result = await publishPost(post as GeneratedPost);

  if (
    (result.outcome === 'published' || result.outcome === 'queued') &&
    typeof postId === 'string' &&
    persistenceAvailable()
  ) {
    await updatePost(postId, { status: 'published' });
  }

  return NextResponse.json(result);
}
