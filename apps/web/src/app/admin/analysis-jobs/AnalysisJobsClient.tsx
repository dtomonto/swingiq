'use client';

// ============================================================
// /admin/analysis-jobs — interactive Job Monitor (client)
// ------------------------------------------------------------
// Reads the device-local analysis-job store reactively and lets an
// operator work the queue: send low-confidence runs to human review,
// request a rerun, annotate, or delete. Every mutating action is mirrored
// to the admin audit log. No data is fabricated — the table shows only
// what the on-device pipeline actually recorded.
// ============================================================

import { useMemo, useState } from 'react';
import { AlertTriangle, RotateCcw, StickyNote, Trash2, UserCheck } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import {
  useAnalysisJobs,
  describeStatus,
  requestRerun,
  setHumanReview,
  setAdminNotes,
  deleteJob,
  isActive,
} from '@/lib/analysis-jobs';
import type { AnalysisJob, JobStatus } from '@/lib/analysis-jobs';

const STATUS_FILTERS: { value: 'all' | JobStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'needs_human_review', label: 'Needs review' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
  { value: 'not_configured', label: 'No AI' },
  { value: 'rerun_requested', label: 'Rerun requested' },
];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

function confidenceLabel(c: number | null): string {
  return typeof c === 'number' ? `${Math.round(c * 100)}%` : '—';
}

export function AnalysisJobsClient({ actor }: { actor: string }) {
  const { jobs, stats, hydrated } = useAnalysisJobs();
  const [status, setStatus] = useState<'all' | JobStatus>('all');
  const [sport, setSport] = useState<string>('all');

  const sports = useMemo(() => {
    const map = new Map<string, string>();
    for (const j of jobs) map.set(j.sport, j.sportLabel || j.sport);
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [jobs]);

  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) => (status === 'all' || j.status === status) && (sport === 'all' || j.sport === sport),
      ),
    [jobs, status, sport],
  );

  function audit(action: string, job: AnalysisJob, summary: string, severity?: 'info' | 'warning') {
    recordAudit({ actor, action, entityType: 'analysis-job', entityId: job.id, summary, severity });
  }

  function onRequestRerun(job: AnalysisJob) {
    const reason = window.prompt('Reason for rerun (recorded against the job):', '')?.trim();
    if (reason == null) return;
    requestRerun(job.id, reason || 'Operator requested rerun');
    audit('analysis_job.rerun_requested', job, `Requested rerun for ${job.sportLabel} job (${reason || 'no reason'}).`, 'warning');
  }

  function onSendToReview(job: AnalysisJob) {
    setHumanReview(job.id, 'in_review');
    audit('analysis_job.review_started', job, `Sent ${job.sportLabel} job to human review.`);
  }

  function onClearReview(job: AnalysisJob) {
    setHumanReview(job.id, 'cleared');
    audit('analysis_job.review_cleared', job, `Cleared review on ${job.sportLabel} job.`);
  }

  function onNotes(job: AnalysisJob) {
    const notes = window.prompt('Operator notes for this job:', job.adminNotes ?? '');
    if (notes == null) return;
    setAdminNotes(job.id, notes);
    audit('analysis_job.note', job, `Annotated ${job.sportLabel} job.`);
  }

  function onDelete(job: AnalysisJob) {
    if (!window.confirm('Delete this job record? (Does not affect the saved analysis.)')) return;
    deleteJob(job.id);
    audit('analysis_job.delete', job, `Deleted ${job.sportLabel} job record.`, 'warning');
  }

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading jobs on this device…</p>;
  }

  return (
    <div className="space-y-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Active" value={stats.active} />
        <StatTile label="Completed" value={stats.completed} />
        <StatTile label="Needs review" value={stats.needsReview} tone={stats.needsReview > 0 ? 'warning' : undefined} />
        <StatTile label="Failed" value={stats.failed} tone={stats.failed > 0 ? 'critical' : undefined} />
        <StatTile label="No AI" value={stats.notConfigured} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | JobStatus)}
          className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          aria-label="Filter by sport"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
        >
          <option value="all">All sports</option>
          {sports.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} of {jobs.length}</span>
      </div>

      {/* Jobs */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {jobs.length === 0
            ? 'No analysis jobs recorded on this device yet. Run a swing analysis to populate this monitor.'
            : 'No jobs match these filters.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((job) => {
            const d = describeStatus(job.status);
            const active = isActive(job.status);
            const inReview = job.humanReview === 'in_review';
            return (
              <li
                key={job.id}
                className="rounded-lg border border-border bg-background p-3 sm:flex sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {job.emoji ? `${job.emoji} ` : ''}{job.sportLabel}
                    </span>
                    <StatusBadge tone={d.tone}>{d.label}</StatusBadge>
                    {job.humanReview === 'in_review' && <StatusBadge tone="watch">In review</StatusBadge>}
                    {job.retryCount > 0 && <StatusBadge tone="neutral">retry ×{job.retryCount}</StatusBadge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{relativeTime(job.createdAt)}</span>
                    <span>conf {confidenceLabel(job.confidenceScore)}</span>
                    <span>{job.provider ? `${job.provider}${job.model ? ` · ${job.model}` : ''}` : 'no AI provider'}</span>
                    {job.declaredCameraAngle && <span>{job.declaredCameraAngle}</span>}
                    {job.failureReason && (
                      <span className="inline-flex items-center gap-1 text-error-text">
                        <AlertTriangle className="h-3 w-3" /> {job.failureReason}
                      </span>
                    )}
                  </div>
                  {job.adminNotes && (
                    <p className="mt-1 text-xs italic text-muted-foreground">“{job.adminNotes}”</p>
                  )}
                </div>

                <div className="mt-2 flex shrink-0 flex-wrap items-center gap-1.5 sm:mt-0">
                  {(job.status === 'needs_human_review' || job.status === 'completed') && !inReview && (
                    <ActionBtn icon={UserCheck} label="Send to review" onClick={() => onSendToReview(job)} />
                  )}
                  {(inReview || job.status === 'needs_human_review') && (
                    <ActionBtn icon={UserCheck} label="Clear review" onClick={() => onClearReview(job)} />
                  )}
                  {!active && (
                    <ActionBtn icon={RotateCcw} label="Request rerun" onClick={() => onRequestRerun(job)} />
                  )}
                  <ActionBtn icon={StickyNote} label="Notes" onClick={() => onNotes(job)} />
                  <ActionBtn icon={Trash2} label="Delete" onClick={() => onDelete(job)} danger />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: 'warning' | 'critical' }) {
  const valueColor =
    tone === 'critical' ? 'text-error-text' : tone === 'warning' ? 'text-warning-text' : 'text-foreground';
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof UserCheck;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
        danger
          ? 'border-error/30 text-error-text hover:bg-error/10'
          : 'border-border text-foreground hover:bg-muted'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
