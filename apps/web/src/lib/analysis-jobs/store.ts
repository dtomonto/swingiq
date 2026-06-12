// ============================================================
// SwingVantage — Analysis Job store (local-first, device)
// ------------------------------------------------------------
// A tiny, self-contained localStorage record of analysis jobs, in the
// same shape and spirit as video/history.ts. It lives in its OWN key,
// touches no Zustand slice or backup schema, and is safe to be missing,
// corrupt, or cleared at any time — it never throws.
//
// Privacy: jobs hold only non-PII operational metadata (sport label,
// status, confidence, provider/model, timestamps). The original video,
// frames, and analysis prose live elsewhere and never enter this store.
//
// This is the canonical job record for THIS device. A fleet-wide admin
// view would mirror this metadata to an optional Supabase analysis_jobs
// table (deferred), exactly as the audit-log store notes for itself.
// ============================================================

import type { AnalysisJob, JobStats, JobStatus, NewAnalysisJob } from './types';
import { canTransition, isTerminal, progressFor, shouldFlagForReview } from './lifecycle';

const KEY = 'swingiq-analysis-jobs-v1';

/** Cap the number of stored jobs so localStorage stays small. */
const MAX_ENTRIES = 50;

// ── ids ───────────────────────────────────────────────────────
function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isValid(value: unknown): value is AnalysisJob {
  if (!value || typeof value !== 'object') return false;
  const j = value as Partial<AnalysisJob>;
  return (
    j.version === 1 &&
    typeof j.id === 'string' &&
    typeof j.sport === 'string' &&
    typeof j.status === 'string' &&
    typeof j.createdAt === 'string'
  );
}

// ── change notification (powers useAnalysisJobs) ───────────────
const listeners = new Set<() => void>();
let storeVersion = 0;

export function getJobsVersion(): number {
  return storeVersion;
}

function notifyChange(): void {
  storeVersion++;
  for (const l of listeners) l();
}

/** Subscribe to job changes (same-tab + cross-tab). Returns an unsubscribe. */
export function subscribeJobs(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notifyChange();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

// ── read / write ───────────────────────────────────────────────
/** Read all jobs, newest first. Never throws. */
export function loadJobs(): AnalysisJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid);
  } catch {
    return [];
  }
}

function writeAll(jobs: AnalysisJob[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(jobs.slice(0, MAX_ENTRIES)));
    notifyChange();
  } catch {
    /* storage full / unavailable — non-critical */
  }
}

/** Apply a patch to one job by id (no-op if not found). Never throws. */
function patch(id: string, fn: (job: AnalysisJob) => AnalysisJob): AnalysisJob | null {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  const next = fn(jobs[idx]);
  jobs[idx] = next;
  writeAll(jobs);
  return next;
}

// ── lifecycle mutations ────────────────────────────────────────

/** Open a new job in the `queued` state. Returns the job (or null if no storage). */
export function createJob(input: NewAnalysisJob): AnalysisJob | null {
  if (typeof window === 'undefined') return null;
  const job: AnalysisJob = {
    version: 1,
    id: makeId(),
    createdAt: nowIso(),
    startedAt: null,
    completedAt: null,
    failedAt: null,
    sport: input.sport,
    sportLabel: input.sportLabel,
    emoji: input.emoji,
    declaredCameraAngle: input.declaredCameraAngle,
    comparedToPrevious: input.comparedToPrevious ?? false,
    status: 'queued',
    currentStep: 'queued',
    progress: 0,
    retryCount: 0,
    rerunReason: null,
    failureReason: null,
    confidenceScore: null,
    humanReview: 'none',
    adminNotes: null,
    provider: null,
    model: null,
    latencyMs: null,
    savedAnalysisId: null,
  };
  writeAll([job, ...loadJobs()].slice(0, MAX_ENTRIES));
  return job;
}

/**
 * Advance a job to an active pipeline status (validated by the lifecycle
 * machine — an illegal jump is ignored, keeping the record honest).
 */
export function advanceJob(id: string, status: JobStatus): AnalysisJob | null {
  return patch(id, (job) => {
    if (!canTransition(job.status, status)) return job;
    const startedAt = job.startedAt ?? (status !== 'queued' ? nowIso() : null);
    return {
      ...job,
      status,
      currentStep: status,
      progress: progressFor(status),
      startedAt,
    };
  });
}

/** Finalize a job as completed (with AI) or not_configured (keyless). */
export function completeJob(
  id: string,
  result: {
    confidenceScore: number | null;
    provider: string | null;
    model: string | null;
    latencyMs: number | null;
    savedAnalysisId: string | null;
    /** True when no AI ran (keyless / paused / budget). */
    notConfigured: boolean;
  },
): AnalysisJob | null {
  return patch(id, (job) => {
    const base: AnalysisJob = {
      ...job,
      completedAt: nowIso(),
      progress: 1,
      confidenceScore: result.confidenceScore,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      savedAnalysisId: result.savedAnalysisId,
    };
    if (result.notConfigured) {
      return { ...base, status: 'not_configured', currentStep: 'not_configured' };
    }
    // Auto-route low-confidence diagnoses to human review.
    if (shouldFlagForReview(result.confidenceScore)) {
      return { ...base, status: 'needs_human_review', currentStep: 'completed', humanReview: 'flagged' };
    }
    return { ...base, status: 'completed', currentStep: 'completed' };
  });
}

/** Mark a job failed with a sanitized reason. */
export function failJob(id: string, reason: string): AnalysisJob | null {
  return patch(id, (job) => {
    if (isTerminal(job.status)) return job;
    return { ...job, status: 'failed', currentStep: 'failed', failedAt: nowIso(), failureReason: reason };
  });
}

/** Mark a job cancelled (user aborted before completion). */
export function cancelJob(id: string): AnalysisJob | null {
  return patch(id, (job) => {
    if (isTerminal(job.status)) return job;
    return { ...job, status: 'cancelled', currentStep: 'cancelled' };
  });
}

/** Record an operator/user rerun request against a finished job. */
export function requestRerun(id: string, reason: string): AnalysisJob | null {
  return patch(id, (job) => {
    if (!canTransition(job.status, 'rerun_requested')) return job;
    return {
      ...job,
      status: 'rerun_requested',
      currentStep: 'rerun_requested',
      rerunReason: reason,
      retryCount: job.retryCount + 1,
    };
  });
}

/** Set the human-review state (queue workflow). */
export function setHumanReview(
  id: string,
  review: AnalysisJob['humanReview'],
): AnalysisJob | null {
  return patch(id, (job) => {
    // Clearing review on a flagged-but-otherwise-complete job returns it to completed.
    const status: JobStatus =
      review === 'cleared' && job.status === 'needs_human_review' ? 'completed' : job.status;
    const next: JobStatus =
      review === 'flagged' && job.status === 'completed' ? 'needs_human_review' : status;
    return { ...job, humanReview: review, status: next, currentStep: next };
  });
}

/** Attach/replace operator notes on a job. */
export function setAdminNotes(id: string, notes: string): AnalysisJob | null {
  return patch(id, (job) => ({ ...job, adminNotes: notes.trim() || null }));
}

/** Remove a single job. Never throws. */
export function deleteJob(id: string): void {
  writeAll(loadJobs().filter((j) => j.id !== id));
}

/** Clear all jobs. Never throws. */
export function clearJobs(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    notifyChange();
  } catch {
    /* ignore */
  }
}

// ── aggregation ────────────────────────────────────────────────
const ALL_STATUSES: JobStatus[] = [
  'queued', 'preparing', 'extracting_frames', 'extracting_pose', 'analyzing',
  'generating_report', 'completed', 'not_configured', 'needs_human_review',
  'failed', 'cancelled', 'rerun_requested',
];

/** Summary counts for the admin monitor's stat tiles. Pure over a job list. */
export function computeStats(jobs: AnalysisJob[]): JobStats {
  const byStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<JobStatus, number>;
  let active = 0;
  for (const j of jobs) {
    byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
    if (
      j.status !== 'completed' && j.status !== 'not_configured' &&
      j.status !== 'failed' && j.status !== 'cancelled' &&
      j.status !== 'needs_human_review' && j.status !== 'rerun_requested'
    ) {
      active += 1;
    }
  }
  return {
    total: jobs.length,
    active,
    completed: byStatus.completed,
    failed: byStatus.failed,
    needsReview: byStatus.needs_human_review,
    notConfigured: byStatus.not_configured,
    byStatus,
  };
}
