'use client';

// Client table for the SEO/AEO/GEO command center. Rows are built from
// the static SEO_PAGES data by the server page and passed in plain.

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { sportShort } from '@/lib/admin/sports';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

export interface SeoRow {
  slug: string;
  keyword: string;
  sport: string;
  intent: string;
  funnelStage: string;
  priority: number;
  schemaType: string;
  published: boolean;
  faqCount: number;
  answerReady: boolean;
}

const columns: Column<SeoRow>[] = [
  {
    key: 'keyword',
    header: 'Keyword / Page',
    sortValue: (r) => r.keyword,
    render: (r) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{r.keyword}</div>
        <div className="truncate font-mono text-2xs text-muted-foreground">/{r.slug}</div>
      </div>
    ),
  },
  {
    key: 'sport',
    header: 'Sport',
    sortValue: (r) => r.sport,
    render: (r) => <StatusBadge tone="accent">{sportShort(r.sport)}</StatusBadge>,
  },
  { key: 'intent', header: 'Intent', sortValue: (r) => r.intent, render: (r) => <span className="capitalize text-muted-foreground">{r.intent}</span> },
  {
    key: 'priority',
    header: 'Priority',
    sortValue: (r) => r.priority,
    render: (r) => <StatusBadge tone={r.priority <= 2 ? 'warning' : 'neutral'}>P{r.priority}</StatusBadge>,
  },
  { key: 'schemaType', header: 'Schema', sortValue: (r) => r.schemaType, render: (r) => <span className="text-muted-foreground">{r.schemaType}</span> },
  {
    key: 'answerReady',
    header: 'AEO',
    sortValue: (r) => (r.answerReady ? 1 : 0),
    render: (r) =>
      r.answerReady ? (
        <span className="inline-flex items-center gap-1 text-success-text" title="Has a direct answer + FAQs">
          <CheckCircle2 className="h-3.5 w-3.5" /> {r.faqCount} FAQ
        </span>
      ) : (
        <span className="text-muted-foreground/70">—</span>
      ),
  },
  {
    key: 'published',
    header: 'Status',
    sortValue: (r) => (r.published ? 1 : 0),
    render: (r) => (
      <StatusBadge tone={r.published ? 'success' : 'warning'}>{r.published ? 'Published' : 'Draft'}</StatusBadge>
    ),
  },
  {
    key: 'view',
    header: '',
    render: (r) => (
      <a
        href={`/${r.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-xs text-link hover:underline"
      >
        View <ExternalLink className="h-3 w-3" />
      </a>
    ),
  },
];

export function SeoTable({ rows }: { rows: SeoRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.slug}
      searchText={(r) => `${r.keyword} ${r.slug} ${r.sport} ${r.intent} ${r.schemaType}`}
      searchPlaceholder="Search by keyword, slug, sport…"
      pageSize={25}
      initialSortKey="priority"
    />
  );
}
