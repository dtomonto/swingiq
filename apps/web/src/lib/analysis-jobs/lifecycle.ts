// ============================================================
// SwingVantage — Analysis Job lifecycle: pure status machine
// ------------------------------------------------------------
// No I/O, no storage, no React — just the rules that govern how a job
// moves between statuses. Kept pure so it is trivially unit-testable
// and shared by the device store, the recorder, and any later server
// mirror. Mirrors the REAL client pipeline stages (AnalysisStage) so a
// job never claims a step the analyzer does not actually perform.
// ============================================================

import type { AnalysisStage } from '@/components/video/AnalysisProgress';
import type { JobStatus } from './types';

/**
 * Confidence at/below which a COMPLETED analysis is auto-flagged for human
 * review (Phase 4 human-review queue). Conservative: a low-confidence
 * diagnosis should get a second look rather than be presented as certain.
 * Honest analyses are routinely 0.5–0.8, so this stays deliberately low.
 */
export const LOW_CONFIDENCE_REVIEW_THRESHOLD = 0.45;

/** Ordered active steps the pipeline actually runs, queued → completed. */
export const ACTIVE_STEP_ORDER: JobStatus[] = [
  'queued',
  'preparing',
  'extracting_frames',
  'extracting_pose',
  'analyzing',
  'generating_report',
  'completed',
];

/** Statuses that mean the job is finished (no more work will happen). */
const TERMINAL: ReadonlySet<JobStatus> = new Set<JobStatus>([
  'completed',
  'not_configured',
  'failed',
  'cancelled',
]);

/** Statuses that mean work is actively in flight. */
const ACTIVE: ReadonlySet<JobStatus> = new Set<JobStatus>([
  'queued',
  'preparing',
  'extracting_frames',
  'extracting_pose',
  'analyzing',
  'generating_report',
]);

export function isTerminal(status: JobStatus): boolean {
  return TERMINAL.has(status);
}

export function isActive(status: JobStatus): boolean {
  return ACTIVE.has(status);
}

/**
 * Map a real pipeline stage to its job status. The pipeline emits
 * preparing → extracting → measuring → inspecting → building → plan → done;
 * `building` and `plan` both fold into generating_report (one report step).
 */
export function mapStageToStatus(stage: AnalysisStage): JobStatus {
  switch (stage) {
    case 'preparing':
      return 'preparing';
    case 'extracting':
      return 'extracting_frames';
    case 'measuring':
      return 'extracting_pose';
    case 'inspecting':
      return 'analyzing';
    case 'building':
    case 'plan':
      return 'generating_report';
    case 'done':
      return 'completed';
    default:
      return 'preparing';
  }
}

/** Coarse 0–1 progress for a status, for the monitor's progress hint. */
export function progressFor(status: JobStatus): number {
  switch (status) {
    case 'queued':
      return 0;
    case 'preparing':
      return 0.05;
    case 'extracting_frames':
      return 0.25;
    case 'extracting_pose':
      return 0.45;
    case 'analyzing':
      return 0.65;
    case 'generating_report':
      return 0.9;
    case 'completed':
    case 'not_configured':
    case 'needs_human_review':
      return 1;
    case 'failed':
    case 'cancelled':
    case 'rerun_requested':
      return 0;
    default:
      return 0;
  }
}

/** Whether a COMPLETED job's confidence should auto-flag it for review. */
export function shouldFlagForReview(confidence: number | null): boolean {
  return typeof confidence === 'number' && confidence <= LOW_CONFIDENCE_REVIEW_THRESHOLD;
}

/**
 * Whether a status transition is allowed. Permissive about forward motion
 * along the active order, but blocks nonsense (e.g. resurrecting a completed
 * job to "preparing" without going through rerun_requested first). Used by the
 * store to keep persisted jobs honest; never throws.
 */
export function canTransition(from: JobStatus, to: JobStatus): boolean {
  if (from === to) return true;

  // A rerun request can come from any terminal/flagged state, and from it the
  // job may legitimately restart its active sequence.
  if (to === 'rerun_requested') return isTerminal(from) || from === 'needs_human_review';
  if (from === 'rerun_requested') return to === 'queued' || ACTIVE.has(to);

  // Review flag/clear can only attach to a finished analysis. (A review →
  // rerun_requested move is already allowed by the `to === 'rerun_requested'`
  // branch above, so it isn't repeated here.)
  if (to === 'needs_human_review') return from === 'completed' || from === 'not_configured';
  if (from === 'needs_human_review') return to === 'completed';

  // Cancel/fail can interrupt any active step.
  if (to === 'cancelled' || to === 'failed') return ACTIVE.has(from);

  // Otherwise only allow forward (or same-place) motion along the active order.
  const fi = ACTIVE_STEP_ORDER.indexOf(from);
  const ti = ACTIVE_STEP_ORDER.indexOf(to);
  if (fi === -1 || ti === -1) return false;
  return ti >= fi;
}

export interface StatusDescriptor {
  label: string;
  /** Maps to StatusBadge tones (admin OS severity scale). */
  tone: 'critical' | 'warning' | 'watch' | 'routine' | 'healthy' | 'neutral';
}

/** Human-facing label + badge tone for a status (admin monitor). */
export function describeStatus(status: JobStatus): StatusDescriptor {
  switch (status) {
    case 'completed':
      return { label: 'Completed', tone: 'healthy' };
    case 'not_configured':
      return { label: 'No AI (keyless)', tone: 'neutral' };
    case 'needs_human_review':
      return { label: 'Needs review', tone: 'warning' };
    case 'failed':
      return { label: 'Failed', tone: 'critical' };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'neutral' };
    case 'rerun_requested':
      return { label: 'Rerun requested', tone: 'watch' };
    case 'queued':
      return { label: 'Queued', tone: 'watch' };
    case 'preparing':
      return { label: 'Preparing', tone: 'watch' };
    case 'extracting_frames':
      return { label: 'Extracting frames', tone: 'watch' };
    case 'extracting_pose':
      return { label: 'Measuring pose', tone: 'watch' };
    case 'analyzing':
      return { label: 'AI analyzing', tone: 'watch' };
    case 'generating_report':
      return { label: 'Building report', tone: 'watch' };
    default:
      return { label: status, tone: 'neutral' };
  }
}
