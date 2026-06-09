// ============================================================
// /api/admin/clarity — Clarity OS live data
// ------------------------------------------------------------
// The server boundary for the Microsoft Clarity control center. Keeps the
// Data Export API token server-side and re-asserts admin (+ RBAC) on every
// call.
//
//   GET ?days=1..3[&dimension=Browser]
//                            → live snapshot (traffic, engagement, quality
//                              signals, optional breakdown). Honest
//                              "needs-read-key" when only the project id is
//                              set; honest error on failure.
//   POST { action:'test' }   → validate the Data Export token live.
//
// Clarity caps exports at ~10 calls/day per project and only covers the last
// 1–3 days, so the UI fetches on demand (never on a timer) and says so.
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { getConnection, getReadConfig } from '@/lib/clarity/config';
import { fetchLiveInsights, testConnection, safeNumOfDays } from '@/lib/clarity/client';
import { CLARITY_DIMENSIONS } from '@/lib/clarity/capabilities';
import type { ClarityLiveSnapshot } from '@/lib/clarity/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_DIMENSIONS = new Set(CLARITY_DIMENSIONS.map((d) => d.id));

// ── Budget guard (Clarity caps exports at ~10 calls/day per project) ──
// Best-effort, in-memory, per-server-instance: a short cache dedupes repeat
// loads/refreshes, and a UTC-daily counter stops an admin clicking through
// the entire daily budget. Not a hard guarantee across serverless instances,
// but it protects the common case and the count is surfaced honestly in the UI.
const DAILY_LIMIT = 10;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry { snapshot: ClarityLiveSnapshot; at: number }
const snapshotCache = new Map<string, CacheEntry>();
let callDay = '';
let callsToday = 0;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}
/** Roll the counter over at UTC midnight. */
function rollDay(): void {
  const d = utcDay();
  if (d !== callDay) {
    callDay = d;
    callsToday = 0;
  }
}

// ── GET: live snapshot ────────────────────────────────────────

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'analytics.view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const connection = getConnection();
  const read = getReadConfig();
  if (!read.configured || !read.token) {
    return NextResponse.json({ ok: true, connection, live: null, reason: 'needs-read-key' });
  }

  const url = new URL(req.url);
  const days = safeNumOfDays(Number(url.searchParams.get('days') ?? 3));
  const dimParam = url.searchParams.get('dimension') ?? undefined;
  const dimension = dimParam && ALLOWED_DIMENSIONS.has(dimParam) ? dimParam : undefined;

  rollDay();
  const cacheKey = `${days}|${dimension ?? ''}`;
  const cached = snapshotCache.get(cacheKey);
  const budget = { callsUsedToday: callsToday, dailyLimit: DAILY_LIMIT };

  // Fresh cache hit → serve without spending a call.
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ ok: true, connection, live: cached.snapshot, cached: true, ...budget });
  }

  // Out of budget → serve a stale snapshot if we have one, else say so.
  if (callsToday >= DAILY_LIMIT) {
    if (cached) {
      return NextResponse.json({ ok: true, connection, live: cached.snapshot, cached: true, stale: true, ...budget });
    }
    return NextResponse.json(
      {
        ok: false,
        connection,
        live: null,
        ...budget,
        message: `Daily Clarity export limit reached (${DAILY_LIMIT}/day). Try again after UTC midnight.`,
      },
      { status: 429 },
    );
  }

  const res = await fetchLiveInsights(read.token, days, dimension);
  callsToday += 1;
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, connection, live: null, message: res.error, callsUsedToday: callsToday, dailyLimit: DAILY_LIMIT },
      { status: 502 },
    );
  }
  snapshotCache.set(cacheKey, { snapshot: res.data!, at: Date.now() });
  return NextResponse.json({
    ok: true,
    connection,
    live: res.data,
    cached: false,
    callsUsedToday: callsToday,
    dailyLimit: DAILY_LIMIT,
  });
}

// ── POST: test connection ─────────────────────────────────────

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'analytics.view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  if (body.action === 'test') {
    const read = getReadConfig();
    rollDay();
    const result = read.token ? await testConnection(read.token) : null;
    if (result) callsToday += 1; // the test makes a real export call
    return NextResponse.json({
      ok: true,
      ingest: {
        configured: getConnection().ingestConfigured,
        projectId: getConnection().projectId,
      },
      read: {
        configured: read.configured,
        ok: result?.ok ?? false,
        status: result?.status ?? 0,
        error: result?.error ?? null,
        metrics: result?.ok ? result.data?.metrics ?? 0 : null,
        hasToken: read.hasToken,
      },
    });
  }

  return NextResponse.json({ error: 'unknown-action' }, { status: 400 });
}
