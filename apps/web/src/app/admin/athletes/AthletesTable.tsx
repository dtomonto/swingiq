'use client';

// Client table for the Athletes directory. One row per (user, sport)
// profile; rows open the unified user journey (which shows every profile).

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { sportShort } from '@/lib/admin/sports';
import { formatRelativeTime } from '@/lib/admin/format';
import type { AthleteRow } from '@/lib/admin/data/athletes';

const columns: Column<AthleteRow>[] = [
  {
    key: 'athlete',
    header: 'Athlete',
    sortValue: (r) => r.email ?? r.name ?? '',
    render: (r) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-200">{r.name || r.email || '—'}</div>
        {r.name && r.email && <div className="truncate text-xs text-gray-500">{r.email}</div>}
      </div>
    ),
  },
  {
    key: 'sport',
    header: 'Sport',
    sortValue: (r) => r.sport,
    render: (r) => <StatusBadge tone="accent">{sportShort(r.sport)}</StatusBadge>,
  },
  {
    key: 'skill',
    header: 'Skill / Rating',
    sortValue: (r) => r.skill ?? '',
    render: (r) => <span className="capitalize text-gray-300">{r.skill ?? '—'}</span>,
  },
  {
    key: 'goal',
    header: 'Primary goal',
    render: (r) => <span className="block max-w-[18rem] truncate text-gray-400">{r.goal ?? '—'}</span>,
  },
  {
    key: 'updatedAt',
    header: 'Updated',
    sortValue: (r) => r.updatedAt,
    render: (r) => <span className="text-gray-500">{r.updatedAt ? formatRelativeTime(r.updatedAt) : '—'}</span>,
  },
];

export function AthletesTable({ rows }: { rows: AthleteRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => `${r.userId}:${r.sport}`}
      searchText={(r) => `${r.email ?? ''} ${r.name ?? ''} ${r.sport} ${r.skill ?? ''} ${r.goal ?? ''}`}
      searchPlaceholder="Search athletes by name, sport, skill…"
      rowHref={(r) => `/admin/users/${r.userId}`}
      initialSortKey="updatedAt"
    />
  );
}
