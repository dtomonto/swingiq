'use client';

// ============================================================
// Audit findings table — filter by priority/status and track progress.
// Reads findings from props (server-loaded from the synced snapshot +
// owner overlay), and persists status changes via the guarded API route.
// Writes only succeed locally (a git diff you push); read-only in prod.
// ============================================================

import { useMemo, useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import type { AuditFindingView, AuditTrackStatus } from '@/lib/admin/audits/types';

const PRIORITY_TONE: Record<string, BadgeTone> = {
  P0: 'danger', P1: 'warning', P2: 'info', P3: 'neutral',
};
const TRACK_TONE: Record<AuditTrackStatus, BadgeTone> = {
  open: 'warning', 'in-progress': 'info', done: 'success',
};
const TRACK_LABEL: Record<AuditTrackStatus, string> = {
  open: 'Open', 'in-progress': 'In progress', done: 'Done',
};
const TRACK_ORDER: AuditTrackStatus[] = ['open', 'in-progress', 'done'];

type StatusFilter = 'all' | AuditTrackStatus;
type PriorityFilter = 'all' | 'P0' | 'P1' | 'P2' | 'P3';

export function AuditFindingsTable({
  findings,
  writable,
}: {
  findings: AuditFindingView[];
  writable: boolean;
}) {
  const [rows, setRows] = useState<AuditFindingView[]>(findings);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      rows.filter(
        (f) =>
          (statusFilter === 'all' || f.trackStatus === statusFilter) &&
          (priorityFilter === 'all' || f.priority === priorityFilter),
      ),
    [rows, statusFilter, priorityFilter],
  );

  async function setStatus(finding: AuditFindingView, next: AuditTrackStatus) {
    if (!writable || busy || finding.trackStatus === next) return;
    setBusy(finding.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/audits/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ findingId: finding.id, status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || 'Could not save the change.');
        return;
      }
      setRows((s) =>
        s.map((r) => (r.id === finding.id ? { ...r, trackStatus: next, trackedByOwner: true } : r)),
      );
    } catch {
      setError('Network error — the change was not saved.');
    } finally {
      setBusy(null);
    }
  }

  const priorities: PriorityFilter[] = ['all', 'P0', 'P1', 'P2', 'P3'];
  const statuses: StatusFilter[] = ['all', 'open', 'in-progress', 'done'];

  return (
    <div className="space-y-3">
      {!writable && (
        <div className="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            View-only here. Marking a finding edits a versioned data file the production filesystem
            can&apos;t write. Track progress from your local dev environment, then commit &amp; push.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Priority:</span>
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-full px-2 py-0.5 ${priorityFilter === p ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Status:</span>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-2 py-0.5 ${statusFilter === s ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {s === 'all' ? 'All' : TRACK_LABEL[s]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-gray-500">
          {visible.length} of {rows.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No findings match these filters.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((f) => (
            <li key={f.id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{f.id}</span>
                <StatusBadge tone={PRIORITY_TONE[f.priority] ?? 'neutral'}>{f.priority}</StatusBadge>
                <span className="text-xs text-gray-400">{f.category}</span>
                <span className="ml-auto">
                  <StatusBadge tone={TRACK_TONE[f.trackStatus]}>{TRACK_LABEL[f.trackStatus]}</StatusBadge>
                </span>
              </div>
              <p className="mt-1.5 text-sm text-gray-200">{f.finding}</p>
              {f.recommendation && (
                <p className="mt-1 text-xs text-gray-400">
                  <span className="text-gray-500">Recommended:</span> {f.recommendation}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {f.effort && <span className="text-[11px] text-gray-500">Effort {f.effort}</span>}
                {f.confidence && <span className="text-[11px] text-gray-500">· {f.confidence} confidence</span>}
                {f.sources.length > 0 && (
                  <span className="text-[11px] text-gray-500">· from {f.sources.join(', ')}</span>
                )}
                {writable && (
                  <span className="ml-auto inline-flex overflow-hidden rounded-lg border border-gray-700">
                    {TRACK_ORDER.map((s) => (
                      <button
                        key={s}
                        disabled={busy === f.id}
                        onClick={() => setStatus(f, s)}
                        className={`px-2 py-1 text-[11px] transition-colors disabled:opacity-50 ${
                          f.trackStatus === s
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                      >
                        {TRACK_LABEL[s]}
                      </button>
                    ))}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
