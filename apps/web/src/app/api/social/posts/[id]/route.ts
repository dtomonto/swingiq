// ============================================================
// PATCH /api/social/posts/[id] — update a saved post's final text
// and/or status (records an edit version). Admin-only, rate-limited.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getPostVersions, persistenceAvailable, updatePost } from '@/lib/social/store';
import type { PostStatus } from '@/lib/social/types';

const STATUSES: PostStatus[] = [
  'draft', 'pending_review', 'approved', 'rejected', 'scheduled', 'published',
];

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`${ip}:social-versions`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!persistenceAvailable()) return NextResponse.json({ versions: [] });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const versions = await getPostVersions(id);
  return NextResponse.json({ versions });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`${ip}:social-patch`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!persistenceAvailable()) {
    return NextResponse.json({ error: 'Persistence not configured.' }, { status: 503 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { finalText, status, note, scheduledAt } = (body ?? {}) as {
    finalText?: unknown;
    status?: unknown;
    note?: unknown;
    scheduledAt?: unknown;
  };

  if (status !== undefined && !(STATUSES as string[]).includes(status as string)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const ok = await updatePost(id, {
    finalText: typeof finalText === 'string' ? finalText : undefined,
    status: status as PostStatus | undefined,
    note: typeof note === 'string' ? note : undefined,
    scheduledAt:
      typeof scheduledAt === 'string' ? scheduledAt : scheduledAt === null ? null : undefined,
  });
  if (!ok) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
