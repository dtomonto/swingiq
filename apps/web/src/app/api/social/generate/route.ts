// ============================================================
// SwingVantage — POST /api/social/generate
//
// Generates platform-native social posts for one blog post. Admin-only
// (mirrors the /admin guard), rate-limited, and input-validated. The
// only user input is `slug`, which must match an existing post — the
// blog content itself is trusted static data and is passed to the model
// as delimited DATA (see lib/social/prompt.ts).
//
// Never publishes anything — it only returns generated drafts.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { safeEqual } from '@/lib/security/constant-time';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { BLOG_POSTS } from '@/data/blog-posts';
import { generateSocial } from '@/lib/social/generate';
import { sanitizeOptions } from '@/lib/social/options';

/** Mirror the /admin layout guard: require x-admin-secret in prod; open in dev. */
function isAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return safeEqual(req.headers.get('x-admin-secret'), secret);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`${ip}:social-generate`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const slug = (body as { slug?: unknown })?.slug;
  if (typeof slug !== 'string' || !slug.trim()) {
    return NextResponse.json({ error: 'Missing blog post slug.' }, { status: 400 });
  }

  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) {
    return NextResponse.json({ error: 'Unknown blog post.' }, { status: 404 });
  }

  const options = sanitizeOptions((body as { options?: unknown })?.options);

  try {
    const result = await generateSocial(post, options);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[social/generate] generation failed', err);
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 });
  }
}
