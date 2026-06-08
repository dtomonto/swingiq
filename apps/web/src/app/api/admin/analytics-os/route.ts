// ============================================================
// /api/admin/analytics-os — Analytics OS live data & management
// ------------------------------------------------------------
// The server boundary for the PostHog control center. Keeps the personal
// API key server-side and re-asserts admin (+ RBAC) on every call.
//
//   GET                      → live snapshot (web analytics, top lists,
//                              feature flags, resource counts). Honest
//                              "needs-read-key" when only the public key
//                              is set; honest per-section errors otherwise.
//   POST { action:'test' }   → validate ingest key + personal key live.
//   POST { action:'query' }  → run a read-only HogQL query.
//   POST { action:'toggle-flag', id, active } → enable/disable a flag.
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { getConnection, getReadConfig, getIngestConfig } from '@/lib/posthog/config';
import {
  fetchWebOverview,
  fetchTopNamed,
  fetchResourceCount,
  listFeatureFlags,
  patchFeatureFlag,
  runHogQL,
  testIngest,
  testRead,
  type ReadClientConfig,
} from '@/lib/posthog/client';
import { safeDays, validateHogQL } from '@/lib/posthog/queries';
import type { LiveSnapshot } from '@/lib/posthog/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Build the server-only client config, or null when not fully configured. */
function readClient(): ReadClientConfig | null {
  const read = getReadConfig();
  if (!read.configured || !read.personalKey || !read.projectId) return null;
  return { apiBaseUrl: read.apiBaseUrl, projectId: read.projectId, personalKey: read.personalKey };
}

// ── GET: live snapshot ────────────────────────────────────────

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'analytics.view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const connection = getConnection();
  const cfg = readClient();
  if (!cfg) {
    return NextResponse.json({ ok: true, connection, live: null, reason: 'needs-read-key' });
  }

  const days = safeDays(Number(new URL(req.url).searchParams.get('days') ?? 30));
  const errors: Record<string, string> = {};

  const [overview, pages, events, referrers, flags, surveys, experiments, cohorts, dashboards] =
    await Promise.all([
      fetchWebOverview(cfg, days),
      fetchTopNamed(cfg, 'pages', days),
      fetchTopNamed(cfg, 'events', days),
      fetchTopNamed(cfg, 'referrers', days),
      listFeatureFlags(cfg),
      fetchResourceCount(cfg, 'surveys'),
      fetchResourceCount(cfg, 'experiments'),
      fetchResourceCount(cfg, 'cohorts'),
      fetchResourceCount(cfg, 'dashboards'),
    ]);

  if (!overview.ok && overview.error) errors.webOverview = overview.error;
  if (!pages.ok && pages.error) errors.topPages = pages.error;
  if (!events.ok && events.error) errors.topEvents = events.error;
  if (!referrers.ok && referrers.error) errors.topReferrers = referrers.error;
  if (!flags.ok && flags.error) errors.featureFlags = flags.error;

  const live: LiveSnapshot = {
    webOverview: overview.data,
    topPages: pages.data ?? [],
    topEvents: events.data ?? [],
    topReferrers: referrers.data ?? [],
    featureFlags: flags.data?.flags ?? [],
    counts: {
      surveys: surveys.data,
      experiments: experiments.data,
      cohorts: cohorts.data,
      dashboards: dashboards.data,
    },
    errors,
    rangeDays: days,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, connection, live });
}

// ── POST: test / query / toggle-flag ──────────────────────────

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { action?: string; hogql?: string; id?: number; active?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const action = body.action;

  // ── Test connection (ingest + read) ──
  if (action === 'test') {
    if (!contextCan(admin, 'analytics.view')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const ingest = getIngestConfig();
    const read = getReadConfig();

    const ingestResult = ingest.configured && ingest.key
      ? await testIngest(ingest.ingestHost, ingest.key)
      : null;

    const cfg = readClient();
    const readResult = cfg ? await testRead(cfg) : null;

    return NextResponse.json({
      ok: true,
      ingest: {
        configured: ingest.configured,
        ok: ingestResult?.ok ?? false,
        status: ingestResult?.status ?? 0,
        error: ingestResult?.error ?? null,
        host: ingest.ingestHost,
        region: ingest.region,
      },
      read: {
        configured: read.configured,
        ok: readResult?.ok ?? false,
        status: readResult?.status ?? 0,
        error: readResult?.error ?? null,
        projectName: readResult?.ok ? readResult.data?.name ?? null : null,
        hasKey: read.hasKey,
        hasProjectId: read.hasProjectId,
      },
    });
  }

  // ── Read-only HogQL ──
  if (action === 'query') {
    if (!contextCan(admin, 'analytics.view')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const cfg = readClient();
    if (!cfg) {
      return NextResponse.json(
        { error: 'needs-read-key', message: 'Add a PostHog personal API key + project id to run queries.' },
        { status: 400 },
      );
    }
    const guard = validateHogQL(body.hogql ?? '');
    if (!guard.ok) return NextResponse.json({ error: 'invalid-query', message: guard.error }, { status: 400 });

    const res = await runHogQL(cfg, (body.hogql ?? '').trim());
    if (!res.ok) {
      return NextResponse.json({ error: 'query-failed', message: res.error }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      columns: res.data?.columns ?? [],
      rows: (res.data?.results ?? []).slice(0, 200),
      truncated: (res.data?.results?.length ?? 0) > 200,
    });
  }

  // ── Toggle a feature flag (management) ──
  if (action === 'toggle-flag') {
    if (!contextCan(admin, 'flags.manage')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const cfg = readClient();
    if (!cfg) {
      return NextResponse.json(
        { error: 'needs-read-key', message: 'Add a PostHog personal API key + project id to manage flags.' },
        { status: 400 },
      );
    }
    if (typeof body.id !== 'number' || typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'invalid', message: 'id (number) and active (boolean) required' }, { status: 400 });
    }
    const res = await patchFeatureFlag(cfg, body.id, body.active);
    if (!res.ok) {
      return NextResponse.json({ error: 'toggle-failed', message: res.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: body.id, active: body.active, actor: admin.email ?? 'header-admin' });
  }

  return NextResponse.json({ error: 'unknown-action' }, { status: 400 });
}
