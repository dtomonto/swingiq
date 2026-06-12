'use client';

// ============================================================
// SwingVantage — Analysis Job recorder (pipeline bridge)
// ------------------------------------------------------------
// Glue between the running analysis (lib/video/run-analysis) and the
// device job store. It opens a job when an analysis starts, mirrors each
// pipeline stage onto the job through a wrapped progress sink, and
// finalizes the job on success/failure/cancel.
//
// EVERYTHING here is best-effort and fully guarded: a store failure must
// NEVER affect the analysis. Recording is gated by the operator
// kill-switch `analysis_jobs.enabled` (default on) — when off, begin*
// returns null and the pipeline runs exactly as before.
// ============================================================

import { isFlagEnabled } from '@/lib/admin/stores/feature-flags';
import type { AnalysisProgressSink } from '@/lib/video/run-analysis';
import type { SwingAnalysisResult } from '@/lib/video/run-analysis';
import {
  advanceJob,
  cancelJob,
  completeJob,
  createJob,
  failJob,
} from './store';
import { mapStageToStatus } from './lifecycle';
import type { NewAnalysisJob } from './types';

export const ANALYSIS_JOBS_FLAG = 'analysis_jobs.enabled';

function recordingEnabled(): boolean {
  try {
    return isFlagEnabled(ANALYSIS_JOBS_FLAG);
  } catch {
    // If the flag store is unavailable, default to recording (cheap + local).
    return true;
  }
}

/**
 * Open a job for an analysis run. Returns the job id, or null when recording
 * is off / unavailable. Never throws.
 */
export function beginAnalysisJob(input: NewAnalysisJob): string | null {
  if (!recordingEnabled()) return null;
  try {
    return createJob(input)?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Wrap a progress sink so each stage the pipeline reports is mirrored onto the
 * job. The wrapper delegates to the original sink unchanged, then records the
 * status as a side effect (guarded). Returns the original sink if there is no
 * job to record to.
 */
export function recordedSink(jobId: string | null, base: AnalysisProgressSink): AnalysisProgressSink {
  if (!jobId) return base;
  return {
    ...base,
    setStage: (stage) => {
      base.setStage(stage);
      try {
        advanceJob(jobId, mapStageToStatus(stage));
      } catch {
        /* never let recording break analysis */
      }
    },
  };
}

/** Finalize a job from a successful analysis result. Never throws. */
export function finishAnalysisJob(jobId: string | null, result: SwingAnalysisResult): void {
  if (!jobId) return;
  try {
    completeJob(jobId, {
      confidenceScore: result.analysis?.overallConfidence ?? null,
      provider: result.aiMeta?.provider ?? null,
      model: result.aiMeta?.model ?? null,
      latencyMs: result.aiMeta?.latencyMs ?? null,
      savedAnalysisId: result.savedRecord?.id ?? null,
      // No analysis object + a not-configured message → AI never ran.
      notConfigured: result.analysis == null,
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Finalize a job from a thrown error. A user abort (AbortError) becomes
 * `cancelled`; anything else becomes `failed` with a sanitized reason
 * (message only — never stack traces or payloads). Never throws.
 */
export function failAnalysisJob(jobId: string | null, err: unknown): void {
  if (!jobId) return;
  try {
    if (err instanceof DOMException && err.name === 'AbortError') {
      cancelJob(jobId);
      return;
    }
    const reason =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown analysis error';
    failJob(jobId, reason.slice(0, 300));
  } catch {
    /* best-effort */
  }
}
