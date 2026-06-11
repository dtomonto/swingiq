'use client';

// Client table for Uploads & Media (media lens over video_analyses).
// Rows open the shared analysis detail page.

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { sportShort } from '@/lib/admin/sports';
import { formatRelativeTime } from '@/lib/admin/format';
import type { AnalysisRow } from '@/lib/admin/data/analyses';

const columns: Column<AnalysisRow>[] = [
  {
    key: 'fileName',
    header: 'File',
    sortValue: (r) => r.fileName,
    render: (r) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{r.fileName || 'untitled'}</div>
        {r.cameraAngle && <div className="text-xs text-muted-foreground">{r.cameraAngle.replace(/_/g, ' ')}</div>}
      </div>
    ),
  },
  {
    key: 'userEmail',
    header: 'User',
    sortValue: (r) => r.userEmail ?? '',
    render: (r) => <span className="block max-w-[14rem] truncate text-foreground">{r.userEmail ?? r.userId}</span>,
  },
  {
    key: 'sport',
    header: 'Sport',
    sortValue: (r) => r.sport,
    render: (r) => <StatusBadge tone="accent">{sportShort(r.sport)}</StatusBadge>,
  },
  {
    key: 'overallScore',
    header: 'Score',
    sortValue: (r) => r.overallScore,
    render: (r) => <span className="tabular-nums text-foreground">{r.overallScore || '—'}</span>,
  },
  {
    key: 'createdAt',
    header: 'Analyzed',
    sortValue: (r) => r.createdAt,
    render: (r) => <span className="text-muted-foreground">{r.createdAt ? formatRelativeTime(r.createdAt) : '—'}</span>,
  },
];

export function UploadsTable({ rows }: { rows: AnalysisRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      searchText={(r) => `${r.fileName} ${r.userEmail ?? ''} ${r.sport}`}
      searchPlaceholder="Search media by file, user, sport…"
      rowHref={(r) => `/admin/ai-analyses/${r.id}`}
      initialSortKey="createdAt"
    />
  );
}
