'use client';

// Client table for the Users list. Receives plain serializable rows
// from the server page and defines columns here (render fns can't cross
// the server/client boundary). Imports only TYPES from the server adapter.

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { sportShort } from '@/lib/admin/sports';
import { formatDate, formatRelativeTime } from '@/lib/admin/format';
import type { AdminUserRow } from '@/lib/admin/data/users';

const columns: Column<AdminUserRow>[] = [
  {
    key: 'email',
    header: 'User',
    sortValue: (r) => r.email ?? '',
    render: (r) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{r.email ?? '—'}</div>
        {r.name && <div className="truncate text-xs text-muted-foreground">{r.name}</div>}
      </div>
    ),
  },
  {
    key: 'sports',
    header: 'Sports',
    render: (r) =>
      r.sports.length === 0 ? (
        <span className="text-muted-foreground/70">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {r.sports.map((s) => (
            <StatusBadge key={s} tone="accent">{sportShort(s)}</StatusBadge>
          ))}
        </div>
      ),
  },
  {
    key: 'skillLevel',
    header: 'Skill',
    sortValue: (r) => r.skillLevel ?? '',
    render: (r) => <span className="capitalize text-muted-foreground">{r.skillLevel ?? '—'}</span>,
  },
  {
    key: 'confirmed',
    header: 'Status',
    render: (r) => (
      <StatusBadge tone={r.confirmed ? 'success' : 'warning'}>
        {r.confirmed ? 'Confirmed' : 'Unconfirmed'}
      </StatusBadge>
    ),
  },
  {
    key: 'lastSignInAt',
    header: 'Last seen',
    sortValue: (r) => r.lastSignInAt ?? '',
    render: (r) => (
      <span className="text-muted-foreground">{r.lastSignInAt ? formatRelativeTime(r.lastSignInAt) : 'never'}</span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Joined',
    sortValue: (r) => r.createdAt ?? '',
    render: (r) => <span className="text-muted-foreground">{r.createdAt ? formatDate(r.createdAt) : '—'}</span>,
  },
];

export function UsersTable({ rows }: { rows: AdminUserRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      searchText={(r) => `${r.email ?? ''} ${r.name ?? ''} ${r.sports.join(' ')}`}
      searchPlaceholder="Search by email, name, sport…"
      rowHref={(r) => `/admin/users/${r.id}`}
      initialSortKey="createdAt"
    />
  );
}
