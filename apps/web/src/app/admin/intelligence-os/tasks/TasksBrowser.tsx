'use client';

// Action Tasks list: client-side search + severity/status filters, each row a
// real link into the executive task detail. No dead badges.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ActionTask, TaskSeverity } from '@/lib/intelligence-os/types';

const SEV_TONE: Record<TaskSeverity, 'critical' | 'warning' | 'watch' | 'routine'> = {
  critical: 'critical', high: 'warning', medium: 'watch', low: 'routine', info: 'routine',
};
const ATTENTION = new Set(['new', 'triaged', 'needs-review', 'waiting']);

export function TasksBrowser({ initial }: { initial: ActionTask[] }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'attention' | 'opportunity'>('all');

  const rows = useMemo(() => {
    let r = initial;
    if (filter === 'critical') r = r.filter((t) => t.severity === 'critical');
    else if (filter === 'high') r = r.filter((t) => t.severity === 'high' || t.priority === 'p1');
    else if (filter === 'attention') r = r.filter((t) => ATTENTION.has(t.status));
    else if (filter === 'opportunity') r = r.filter((t) => t.category === 'opportunity');
    const term = q.trim().toLowerCase();
    if (term) r = r.filter((t) => `${t.title} ${t.category} ${t.affectedRoute ?? ''} ${t.affectedFeature} ${t.status}`.toLowerCase().includes(term));
    return r;
  }, [initial, filter, q]);

  if (initial.length === 0) {
    return <EmptyState title="No tasks yet" description="Action tasks are opened from recurring patterns, reports and AI-quality findings — or created manually. Every Critical / High Priority / Needs Attention item becomes a clickable task with an executive detail view and a downloadable Claude Code fix packet." />;
  }

  const FILTERS: Array<[typeof filter, string]> = [
    ['all', 'All'], ['critical', 'Critical'], ['high', 'High priority'], ['attention', 'Needs attention'], ['opportunity', 'Opportunities'],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === key ? 'border-primary/40 bg-primary/10 text-link' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks…"
          className="ml-auto w-full max-w-xs rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No tasks match this filter.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/intelligence-os/tasks/${t.id}`}
                className="block rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/40 hover:bg-card/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={SEV_TONE[t.severity]}>{t.severity}</StatusBadge>
                  <span className="font-medium text-foreground">{t.title}</span>
                  <span className="text-xs text-muted-foreground">{t.category} · {t.affectedRoute ?? t.affectedFeature}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{t.status} · ×{t.occurrenceCount}</span>
                </div>
                {t.evidenceSummary && <p className="mt-1 line-clamp-1 text-muted-foreground">{t.evidenceSummary}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
