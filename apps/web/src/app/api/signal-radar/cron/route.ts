// ============================================================
// SignalRadar OS — scheduled feed collection entry point
// GET  /api/signal-radar/cron      — Vercel Cron (Bearer CRON_SECRET) or admin
// POST /api/signal-radar/cron      — admin "run now" with { feeds: string[] }
// ------------------------------------------------------------
// GET reads the deploy-configured SIGNALRADAR_FEEDS env (comma/newline
// separated feed URLs) and ingests new signals. POST lets a logged-in
// admin run their Settings-curated feed list on demand. Allow-listed in
// middleware (cron has no Supabase session); self-protects via CRON_SECRET
// or the admin guard. Keyless + ToS-safe (RSS only); a no-op when the
// durable store is absent. Never throws to the caller.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { runFeedCollection } from '@/lib/signal-radar/poll.server';
import { parseFeedList } from '@/lib/signal-radar/feed-url';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true;
  if (await isAuthorizedAdmin(req)) return true;
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const feeds = parseFeedList(process.env.SIGNALRADAR_FEEDS);
  const result = await runFeedCollection(feeds, new Date().toISOString());
  return NextResponse.json({ ok: true, source: 'env', ...result });
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let feeds: string[] = [];
  try {
    const body = (await req.json()) as { feeds?: unknown };
    if (Array.isArray(body.feeds)) feeds = parseFeedList(body.feeds.filter((f): f is string => typeof f === 'string').join('\n'));
  } catch {
    /* empty / invalid body → empty feed list */
  }
  const result = await runFeedCollection(feeds, new Date().toISOString());
  return NextResponse.json({ ok: true, source: 'manual', ...result });
}
