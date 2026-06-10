// ============================================================
// /api/admin/publishing/execute — deploy-backed publish executor (ADMIN-ONLY)
// ------------------------------------------------------------
// POST → open a GitHub PR that promotes a publish decision to a committed
//        override (jobType git_pr). Returns the recorded PublishJob.
// GET  → recent PublishJobs (optionally ?entityId=).
//
// Requires `devops.manage` (the executor writes to the repo). When the executor
// is not configured (no GITHUB_TOKEN/REPO) it returns { configured:false } with
// a clear message — it never attempts a write. Responses are no-store and never
// contain the token.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkExecutorAccess } from '@/lib/publishing/executor/access.server';
import { runOverridePromotion } from '@/lib/publishing/executor/run.server';
import { isExecutorConfigured } from '@/lib/publishing/executor/config.server';
import { listJobs } from '@/lib/publishing/executor/jobs.server';
import { PUBLISHABLE_AREAS } from '@/lib/publishing/entity-registry';
import type { PublishEntityType } from '@/lib/publishing/types';

/** Only publishable areas can be deploy-backed. */
const VALID_ENTITY_TYPES = new Set<string>(PUBLISHABLE_AREAS.map((a) => a.entityType));

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(req: NextRequest) {
  const { ok } = await checkExecutorAccess();
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });
  const entityId = new URL(req.url).searchParams.get('entityId') ?? undefined;
  const [jobs, configured] = await Promise.all([listJobs(entityId), isExecutorConfigured()]);
  return NextResponse.json({ configured, jobs }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const { ok, ctx } = await checkExecutorAccess();
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });

  let body: { entityType?: unknown; entityId?: unknown; published?: unknown; title?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400, headers: NO_STORE });
  }

  const entityType = typeof body.entityType === 'string' ? body.entityType : '';
  const entityId = typeof body.entityId === 'string' ? body.entityId.trim() : '';
  if (!VALID_ENTITY_TYPES.has(entityType) || !entityId) {
    return NextResponse.json({ error: 'A valid publishable entityType and entityId are required.' }, { status: 400, headers: NO_STORE });
  }

  const result = await runOverridePromotion({
    entityType: entityType as PublishEntityType,
    entityId,
    published: body.published !== false, // default publish; explicit false unpublishes
    title: typeof body.title === 'string' ? body.title : undefined,
    actorEmail: ctx.email ?? undefined,
  });

  if (!result.configured) {
    return NextResponse.json({ configured: false, message: result.reason }, { status: 200, headers: NO_STORE });
  }
  const status = result.ok ? 200 : 502;
  return NextResponse.json(result, { status, headers: NO_STORE });
}
