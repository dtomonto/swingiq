// ============================================================
// POST /api/video-studio/jobs  — start a generation job
// GET  /api/video-studio/jobs  — list jobs
// Admin-only. Uses the resolved provider (mock by default) + cost guardrail.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { runGenerationJob, getRepo, makeAuditLog, JobRequestSchema } from '@/lib/video-studio';
import { requireAdmin, limited } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const tooMany = await limited(req, 'video-studio-jobs', 20);
  if (tooMany) return tooMany;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = JobRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid job request.', issues: parsed.error.issues }, { status: 400 });
  }

  const repo = getRepo();
  const brief = await repo.getBrief(parsed.data.briefId);
  if (!brief) return NextResponse.json({ error: 'Brief not found. Generate a brief first.' }, { status: 404 });

  const { job, asset } = await runGenerationJob({
    brief,
    opportunityId: brief.opportunityId,
    providerId: parsed.data.providerId,
  });

  await repo.saveJob(job);
  if (asset) {
    await repo.saveAsset(asset);
    await repo.saveVersion({
      id: `ver_${asset.id}`,
      assetId: asset.id,
      version: asset.version,
      changeReason: 'Initial generation.',
      briefId: brief.id,
      createdAt: asset.createdAt,
      isCurrent: true,
    });
  }
  await repo.appendAudit(
    makeAuditLog('job_started', job.id, `Generation job ${job.status} on "${job.providerId}".`, {
      actor: 'admin',
      detail: { briefId: brief.id, assetId: asset?.id, status: job.status },
    }),
  );

  return NextResponse.json({ job, asset, persistent: repo.isPersistent() });
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const repo = getRepo();
  return NextResponse.json({ jobs: await repo.listJobs() });
}
