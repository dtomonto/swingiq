'use client';

// Client table for AI Analyses (quality lens over video_analyses).

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { sportShort } from '@/lib/admin/sports';
import { formatRelativeTime } from '@/lib/admin/format';
import type { AnalysisRow } from '@/lib/admin/data/analyses';

function scoreTone(score: number): string {
  if (score <= 0) return 'text-gray-500';
  if (score < 60) return 'text-red-400';
  if (score < 85) return 'text-amber-400';
  return 'text-emerald-400';
}

const columns: Column<AnalysisRow>[] = [
  {
    key: 'sport',
    header: 'Sport',
    sortValue: (r) => r.sport,
    render: (r) => <StatusBadge tone="accent">{sportShort(r.sport)}</StatusBadge>,
  },
  {
    key: 'userEmail',
    header: 'User',
    sortValue: (r) => r.userEmail ?? '',
    render: (r) => <span className="block max-w-[14rem] truncate text-gray-300">{r.userEmail ?? r.userId}</span>,
  },
  {
    key: 'overallScore',
    header: 'Score',
    sortValue: (r) => r.overallScore,
    render: (r) => <span className={`font-semibold tabular-nums ${scoreTone(r.overallScore)}`}>{r.overallScore || '—'}</span>,
  },
  {
    key: 'issuesCount',
    header: 'Issues',
    sortValue: (r) => r.issuesCount,
    render: (r) => <span className="tabular-nums text-gray-400">{r.issuesCount}</span>,
  },
  {
    key: 'primaryIssue',
    header: 'Primary issue',
    render: (r) => <span className="block max-w-[16rem] truncate text-gray-400">{r.primaryIssue ?? '—'}</span>,
  },
  {
    key: 'createdAt',
    header: 'When',
    sortValue: (r) => r.createdAt,
    render: (r) => <span className="text-gray-500">{r.createdAt ? formatRelativeTime(r.createdAt) : '—'}</span>,
  },
];

export function AnalysesTable({ rows }: { rows: AnalysisRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      searchText={(r) => `${r.userEmail ?? ''} ${r.sport} ${r.primaryIssue ?? ''} ${r.fileName}`}
      searchPlaceholder="Search by user, sport, issue…"
      rowHref={(r) => `/admin/ai-analyses/${r.id}`}
      initialSortKey="createdAt"
    />
  );
}
