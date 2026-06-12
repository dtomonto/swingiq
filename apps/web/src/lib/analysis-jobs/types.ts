// ============================================================
// SwingVantage — Analysis Job lifecycle: types (isomorphic)
// ------------------------------------------------------------
// Every swing analysis becomes a traceable JOB with an honest
// lifecycle status, a confidence score, a (non-PII) provider trace,
// retry/rerun bookkeeping, and a human-review flag. This makes the
// product promise observable: an analysis is no longer fire-and-forget.
//
// HONESTY: analysis runs ON-DEVICE (the video never leaves the
// browser). A job therefore records only what actually happened —
// the stages that really ran, the AI provider/model the route used,
// and the analysis's own overall confidence. We never invent a queue
// position, a server job id, or a "validating" step the pipeline does
// not perform. `not_configured` is a real outcome (frames + pose ran,
// but no AI provider), distinct from `failed`.
//
// No 'use client' and no server-only imports here so the pure status
// machine (lifecycle.ts), the device store (store.ts), tests, and any
// later server mirror can all share this shape.
// ============================================================

import type { VisualSport } from '@swingiq/core';

/**
 * The lifecycle status of an analysis job. Active steps mirror the real
 * client pipeline (see AnalysisStage); the rest are operational outcomes.
 *
 *   queued             — created, work not started yet
 *   preparing          — reading the clip in the browser
 *   extracting_frames  — sampling the motion as still frames
 *   extracting_pose    — on-device MediaPipe pose (stays on device)
 *   analyzing          — AI vision model reviewing the frames
 *   generating_report  — building the diagnosis + practice plan
 *   completed          — finished with an AI diagnosis
 *   not_configured     — finished WITHOUT AI (keyless / paused / budget);
 *                        frames + pose still ran. Honest, not a failure.
 *   needs_human_review — completed but confidence is low → flagged
 *   failed             — an error stopped the analysis
 *   cancelled          — the user aborted before completion
 *   rerun_requested    — an operator/user asked for a fresh run
 */
export type JobStatus =
  | 'queued'
  | 'preparing'
  | 'extracting_frames'
  | 'extracting_pose'
  | 'analyzing'
  | 'generating_report'
  | 'completed'
  | 'not_configured'
  | 'needs_human_review'
  | 'failed'
  | 'cancelled'
  | 'rerun_requested';

/** Human-review state for a job (Phase 4 "human review queue"). */
export type HumanReviewStatus = 'none' | 'flagged' | 'in_review' | 'cleared';

/**
 * A single analysis job. Persisted device-local (store.ts). All fields are
 * non-PII operational metadata — never frames, prompts, or analysis prose.
 */
export interface AnalysisJob {
  version: 1;
  id: string;
  /** ISO timestamps for the lifecycle. */
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;

  // ── What was analyzed (labels only) ──
  sport: VisualSport;
  sportLabel: string;
  emoji?: string;
  /** The camera angle the user declared at capture. */
  declaredCameraAngle: string;
  /** Whether this run had a previous swing to compare against. */
  comparedToPrevious: boolean;

  // ── Live lifecycle ──
  status: JobStatus;
  /** The most advanced active step reached (== status while running). */
  currentStep: JobStatus;
  /** Coarse 0–1 progress for the UI. */
  progress: number;

  // ── Bookkeeping ──
  retryCount: number;
  rerunReason: string | null;
  failureReason: string | null;

  // ── Result signals ──
  /** The analysis's own overall confidence, 0–1 (null until known). */
  confidenceScore: number | null;
  humanReview: HumanReviewStatus;
  adminNotes: string | null;

  // ── Provider trace summary (non-PII) ──
  provider: string | null;
  model: string | null;
  latencyMs: number | null;

  /** Device-local id of the saved analysis this job produced, if any. */
  savedAnalysisId: string | null;
}

/** Input needed to open a new job (everything else is derived/defaulted). */
export interface NewAnalysisJob {
  sport: VisualSport;
  sportLabel: string;
  emoji?: string;
  declaredCameraAngle: string;
  comparedToPrevious?: boolean;
}

/** Aggregate counts for the admin monitor's stat tiles. */
export interface JobStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  needsReview: number;
  notConfigured: number;
  byStatus: Record<JobStatus, number>;
}
