// ============================================================
// GET /api/social/run-scheduled — cron entry point.
//
// Vercel Cron hits this (GET) with `Authorization: Bearer <CRON_SECRET>`.
// Also callable manually by a logged-in admin. This path is allow-listed
// in middleware.ts (cron has no Supabase session) and self-protects via
// the secret / admin check. Publishes any due scheduled posts.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { runScheduledPublish } from '@/lib/social/schedule-runner';
import { safeEqual } from '@/lib/security/constant-time';

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  // Constant-time compare — a plain === leaks the secret's matching prefix
  // through response timing. Mirrors api/research/run.
  if (secret && safeEqual(req.headers.get('authorization'), `Bearer ${secret}`)) return true;
  if (await isAuthorizedAdmin(req)) return true;
  // Dev convenience: no secret set + not production → allow.
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const summary = await runScheduledPublish();
  return NextResponse.json(summary);
}

// Allow manual POST too (admin "run now").
export const POST = GET;
