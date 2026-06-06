// ============================================================
// GET /api/social/list?slug=… — saved generations for a blog post.
// Admin-only, rate-limited. Returns an empty list when persistence is
// off, so the UI can call it unconditionally.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/social/admin-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { listGenerations, persistenceAvailable } from '@/lib/social/store';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`${ip}:social-list`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug.' }, { status: 400 });

  if (!persistenceAvailable()) return NextResponse.json({ generations: [], persistence: false });

  const generations = await listGenerations(slug);
  return NextResponse.json({ generations, persistence: true });
}
