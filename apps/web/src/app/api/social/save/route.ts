// ============================================================
// POST /api/social/save — persist a generation + its posts.
// Admin-only, rate-limited. 503 if persistence isn't configured.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { BLOG_POSTS } from '@/data/blog-posts';
import { persistenceAvailable, saveGeneration } from '@/lib/social/store';
import type { SocialGeneration } from '@/lib/social/types';

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:social-save`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!(await isAuthorizedAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!persistenceAvailable()) {
    return NextResponse.json(
      { error: 'Persistence not configured. Run server/supabase_schema_social.sql and set Supabase env vars.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { generation, edits, statuses } = (body ?? {}) as {
    generation?: SocialGeneration;
    edits?: Record<string, string>;
    statuses?: Record<string, never>;
  };

  if (
    !generation ||
    typeof generation.blogSlug !== 'string' ||
    !Array.isArray(generation.posts) ||
    !BLOG_POSTS.some((p) => p.slug === generation.blogSlug)
  ) {
    return NextResponse.json({ error: 'Invalid generation payload.' }, { status: 400 });
  }

  const saved = await saveGeneration(generation, { edits, statuses });
  if (!saved) return NextResponse.json({ error: 'Save failed.' }, { status: 500 });
  return NextResponse.json(saved);
}
