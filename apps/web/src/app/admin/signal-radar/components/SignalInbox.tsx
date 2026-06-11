'use client';

import { useMemo, useState } from 'react';
import { Search, Plus, Inbox as InboxIcon, ExternalLink } from 'lucide-react';
import type { Signal } from '@/lib/signal-radar/types';
import { filterByView, sortSignals, searchSignals, type InboxView, type SortKey } from '@/lib/signal-radar/engine';
import { Btn, EmptyState, INPUT_CLS, SignalBadges, SubTabs } from './ui';

const VIEWS: { id: InboxView; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high_priority', label: 'High priority' },
  { id: 'needs_response', label: 'Needs response' },
  { id: 'negative_risk', label: 'Negative / risk' },
  { id: 'seo_opportunities', label: 'SEO opportunities' },
  { id: 'product_feedback', label: 'Product feedback' },
  { id: 'competitor', label: 'Competitor' },
  { id: 'backlink', label: 'Backlink' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'sport_specific', label: 'Sport-specific' },
  { id: 'archived', label: 'Archived' },
  { id: 'ignored', label: 'Ignored' },
];

const PAGE_SIZE = 15;

export function SignalInbox({ signals, onOpenSignal, onAdd }: {
  signals: Signal[];
  onOpenSignal: (id: string) => void;
  onAdd: () => void;
}) {
  const [view, setView] = useState<InboxView>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [page, setPage] = useState(0);

  const counts = useMemo(() => {
    const map = {} as Record<InboxView, number>;
    for (const v of VIEWS) map[v.id] = filterByView(signals, v.id).length;
    return map;
  }, [signals]);

  const filtered = useMemo(() => {
    const byView = filterByView(signals, view);
    const searched = searchSignals(byView, query);
    return sortSignals(searched, sortKey, 'desc');
  }, [signals, view, query, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <SubTabs
        tabs={VIEWS.map((v) => ({ id: v.id, label: v.label, count: counts[v.id] }))}
        active={view}
        onChange={(v) => { setView(v); setPage(0); }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search title, text, source, author…"
            className={`${INPUT_CLS} pl-9`}
          />
        </div>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={`${INPUT_CLS} w-auto`}>
          <option value="priority">Sort: Priority</option>
          <option value="date">Sort: Date</option>
          <option value="sentiment">Sort: Sentiment</option>
          <option value="source">Sort: Source</option>
          <option value="sport">Sort: Sport</option>
          <option value="status">Sort: Status</option>
        </select>
        <Btn tone="primary" onClick={onAdd}><Plus className="h-4 w-4" /> Add</Btn>
      </div>

      {pageItems.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No signals in this view"
          hint={query ? 'Try a different search or view.' : 'Add or import signals to get started.'}
          action={!query ? <Btn tone="primary" onClick={onAdd}><Plus className="h-4 w-4" /> Add signal</Btn> : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {pageItems.map((s) => (
            <li key={s.id}>
              <div className="rounded-xl border border-border bg-card p-3 transition-colors hover:border-border">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => onOpenSignal(s.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {s.title && <p className="truncate text-sm font-medium text-foreground">{s.title}</p>}
                      <span className="shrink-0 text-xs text-muted-foreground">· {s.sourceName}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{s.cleanText}</p>
                    <div className="mt-2"><SignalBadges signal={s} showStatus /></div>
                  </button>
                  {s.sourceUrl && (
                    <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-link" title="Open source">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} signals · page {safePage + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <Btn size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Prev</Btn>
            <Btn size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
