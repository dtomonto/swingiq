// ============================================================
// SwingVantage — Video Studio: Generation Job Lifecycle
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This runs a generation job through its states — queued → processing
//   → completed (or failed → retry → failed). It enforces the spending
//   ceiling BEFORE calling a provider, retries transient failures, and
//   turns a successful provider result into a finished VideoAsset record.
//
//   It is written as pure-ish functions over records (no hidden global
//   state) so it's fully testable and so persistence (repo.ts) stays a
//   separate concern. The mock provider makes the happy path key-free.
// ============================================================

import {
  type VideoGenerationJob,
  type VideoAsset,
  type VideoCreativeBrief,
  type JobStatus,
  type JobEvent,
} from './types';
import {
  resolveProvider,
  globalMaxCostCents,
  type ProviderAssetParts,
  type VideoProvider,
} from './providers';

type Env = Record<string, string | undefined>;

let jobSeq = 0;
function jobId(now: Date): string {
  jobSeq += 1;
  return `job_${now.getTime().toString(36)}_${jobSeq}`;
}

function event(status: JobStatus, message: string, now: Date): JobEvent {
  return { at: now.toISOString(), status, message };
}

export interface RunJobInput {
  brief: VideoCreativeBrief;
  opportunityId: string;
  providerId?: string;
  env?: Env;
  now?: Date;
  maxAttempts?: number;
  /** Test seam: inject a provider instead of resolving from env. */
  provider?: VideoProvider;
}

/** Map provider parts → a draft VideoAsset record. */
export function assembleAsset(
  brief: VideoCreativeBrief,
  opportunityId: string,
  providerId: string,
  jobIdValue: string,
  parts: ProviderAssetParts,
  now: Date,
  version = 1,
): VideoAsset {
  const iso = now.toISOString();
  return {
    id: `asset_${brief.id}_v${version}`,
    briefId: brief.id,
    opportunityId,
    providerId,
    jobId: jobIdValue,
    title: brief.seo.title,
    description: brief.seo.description,
    src: parts.src,
    mp4Src: parts.mp4Src,
    webmSrc: parts.webmSrc,
    hlsSrc: parts.hlsSrc,
    poster: parts.poster,
    thumbnail: parts.thumbnail,
    captions: parts.captions,
    transcript: parts.transcript,
    durationSec: parts.durationSec || brief.durationTargetSec,
    aspectRatio: brief.aspectRatio,
    isPlaceholder: parts.isPlaceholder,
    published: false, // draft by default — admin publishes explicitly
    lifecycle: 'experimental',
    version,
    seoUploadDate: iso,
    seoUpdatedDate: iso,
    createdAt: iso,
    updatedAt: iso,
  };
}

/**
 * Run a generation job to a terminal state. Honors the cost ceiling
 * (refuses before spending), retries transient failures up to maxAttempts,
 * and returns the final job plus the produced asset (when completed).
 */
export async function runGenerationJob(
  input: RunJobInput,
): Promise<{ job: VideoGenerationJob; asset?: VideoAsset }> {
  const env = input.env ?? process.env;
  const now = input.now ?? new Date();
  const maxAttempts = input.maxAttempts ?? 2;
  const provider = input.provider ?? resolveProvider(env, input.providerId);

  const id = jobId(now);
  const job: VideoGenerationJob = {
    id,
    briefId: input.brief.id,
    opportunityId: input.opportunityId,
    providerId: provider.id,
    status: 'queued',
    progress: 0,
    attempts: 0,
    maxAttempts,
    estimatedCostCents: provider.maxCostPerJobCents,
    history: [event('queued', `Queued on provider "${provider.label}".`, now)],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // ── Cost guardrail (before any spend) ──────────────────────
  const budget = globalMaxCostCents(env);
  if (provider.maxCostPerJobCents > budget) {
    job.status = 'failed';
    job.error = `Estimated cost ${provider.maxCostPerJobCents}¢ exceeds budget ${budget}¢. Raise VIDEO_STUDIO_MAX_COST_CENTS to allow paid generation.`;
    job.history.push(event('failed', job.error, now));
    job.updatedAt = now.toISOString();
    return { job };
  }

  // ── Run with retry ─────────────────────────────────────────
  let asset: VideoAsset | undefined;
  while (job.attempts < maxAttempts) {
    job.attempts += 1;
    job.status = 'processing';
    job.history.push(event('processing', `Attempt ${job.attempts} of ${maxAttempts}.`, now));

    try {
      const result = await provider.generateVideo(input.brief);
      if (result.ok && result.status === 'completed') {
        const parts = result.asset ?? (await provider.retrieveAsset(result.providerJobId));
        if (!parts) throw new Error('Provider reported completion but returned no asset.');
        job.providerJobId = result.providerJobId;
        job.progress = 100;
        job.estimatedCostCents = result.estimatedCostCents;
        job.status = 'completed';
        asset = assembleAsset(input.brief, input.opportunityId, provider.id, job.id, parts, now, input.brief.version);
        job.assetId = asset.id;
        job.history.push(event('completed', result.message ?? 'Asset generated.', now));
        break;
      }
      if (result.status === 'manual_review') {
        job.status = 'manual_review';
        job.providerJobId = result.providerJobId;
        job.history.push(event('manual_review', result.message ?? 'Held for manual review.', now));
        break;
      }
      // Async provider: not done yet → caller should poll. We surface pending.
      if (result.status === 'pending' || result.status === 'processing' || result.status === 'queued') {
        job.status = 'pending';
        job.providerJobId = result.providerJobId;
        job.history.push(event('pending', result.message ?? 'Submitted; awaiting provider.', now));
        break;
      }
      throw new Error(result.message ?? 'Provider returned a failure.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown generation error.';
      if (job.attempts < maxAttempts) {
        job.status = 'retry';
        job.history.push(event('retry', `${message} — will retry.`, now));
      } else {
        job.status = 'failed';
        job.error = message;
        job.history.push(event('failed', message, now));
      }
    }
  }

  job.updatedAt = now.toISOString();
  return { job, asset };
}

/**
 * Poll a pending async job and, when complete, assemble its asset. Used by
 * the job-status API for real providers; the mock completes synchronously so
 * this is a no-op for it.
 */
export async function pollGenerationJob(
  job: VideoGenerationJob,
  brief: VideoCreativeBrief,
  env: Env = process.env,
  now: Date = new Date(),
): Promise<{ job: VideoGenerationJob; asset?: VideoAsset }> {
  if (job.status !== 'pending' && job.status !== 'processing') return { job };
  const provider = resolveProvider(env, job.providerId);
  if (!job.providerJobId) return { job };

  const status = await provider.checkJobStatus(job.providerJobId);
  job.progress = status.progress;
  job.status = status.status;
  job.history.push(event(status.status, status.message ?? `Progress ${status.progress}%.`, now));
  job.updatedAt = now.toISOString();

  if (status.status === 'completed') {
    const parts = await provider.retrieveAsset(job.providerJobId);
    if (parts) {
      const asset = assembleAsset(brief, job.opportunityId, provider.id, job.id, parts, now, brief.version);
      job.assetId = asset.id;
      return { job, asset };
    }
  }
  return { job };
}
