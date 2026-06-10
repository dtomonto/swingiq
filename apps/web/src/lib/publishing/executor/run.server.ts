// ============================================================
// PublishingOS executor — orchestrator (SERVER-ONLY)
// ------------------------------------------------------------
// The one entry point a publish flow calls to deploy-back a decision: resolve
// config → read+merge the existing manifest → build the plan → open the PR →
// record a PublishJob (running → succeeded/failed). Keyless-safe: returns
// {configured:false} (no write attempted) when GITHUB_TOKEN/REPO are absent.
// ============================================================

import { randomUUID } from 'node:crypto';
import type { PublishJob, PublishEntityType } from '../types';
import { resolveGithubConfig } from './config.server';
import { getFileContent, createPullRequestFromPlan } from './github';
import { buildOverridePromotionPlan, parseManifest, COMMITTED_OVERRIDES_PATH } from './plan';
import { upsertJob } from './jobs.server';

export interface PromoteInput {
  entityType: PublishEntityType;
  entityId: string;
  published: boolean;
  title?: string;
  actorEmail?: string;
}

export type RunResult =
  | { configured: false; reason: string }
  | { configured: true; ok: true; job: PublishJob; prUrl: string }
  | { configured: true; ok: false; job: PublishJob; error: string };

/**
 * Promote a runtime publish decision to a committed-override PR. Merges into the
 * repo's existing manifest so concurrent entries are preserved. Always records a
 * PublishJob for the audit trail.
 */
export async function runOverridePromotion(input: PromoteInput): Promise<RunResult> {
  const cfg = await resolveGithubConfig();
  if (!cfg) {
    return {
      configured: false,
      reason: 'GitHub executor not configured — set GITHUB_TOKEN + GITHUB_REPO in Keys & Secrets.',
    };
  }

  const existingManifest = parseManifest(await getFileContent(cfg, COMMITTED_OVERRIDES_PATH));
  const plan = buildOverridePromotionPlan({
    entityType: input.entityType,
    entityId: input.entityId,
    published: input.published,
    title: input.title,
    actorEmail: input.actorEmail,
    existingManifest,
  });

  let job: PublishJob = {
    id: randomUUID(),
    publishableEntityId: `${input.entityType}:${input.entityId}`,
    jobType: 'git_pr',
    publishMode: 'deploy_backed',
    status: 'running',
    startedAt: new Date().toISOString(),
    branch: plan.branch,
    retryCount: 0,
    metadata: { entityType: input.entityType, entityId: input.entityId, published: input.published },
  };
  await upsertJob(job);

  const result = await createPullRequestFromPlan(plan, cfg);
  const finishedAt = new Date().toISOString();

  if (result.ok) {
    job = { ...job, status: 'succeeded', completedAt: finishedAt, commitSha: result.commitSha, pullRequestUrl: result.prUrl };
    await upsertJob(job);
    return { configured: true, ok: true, job, prUrl: result.prUrl };
  }

  job = { ...job, status: 'failed', failedAt: finishedAt, errorMessage: `${result.step}: ${result.error}` };
  await upsertJob(job);
  return { configured: true, ok: false, job, error: job.errorMessage! };
}
