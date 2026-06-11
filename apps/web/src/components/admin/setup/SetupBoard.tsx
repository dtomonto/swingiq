'use client';

// ============================================================
// SwingVantage Admin — Setup hub: the board
// ------------------------------------------------------------
// Client container: takes the secret-free SetupSignal + the full task list
// from the server, layers in the owner's "I did this" marks (localStorage),
// and renders a progress meter, friendly filters, and category groups.
//
// Hydration: until mounted we treat acknowledgements as empty (matching the
// server render) so there's never a hydration mismatch; after mount the
// persisted marks load and the board re-resolves.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ListChecks, PartyPopper } from 'lucide-react';
import type { SetupTask, SetupSignal } from '@/lib/admin/setup/types';
import { resolveAll, summarize, groupByCategory } from '@/lib/admin/setup/registry';
import { SetupTaskCard } from './SetupTaskCard';
import { useSetupStore } from './setup-store';

type Filter = 'all' | 'todo' | 'done';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'todo', label: 'Just what needs action' },
  { id: 'done', label: 'Completed' },
];

export function SetupBoard({ tasks, signal }: { tasks: SetupTask[]; signal: SetupSignal }) {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  useEffect(() => setMounted(true), []);

  const acknowledged = useSetupStore((s) => s.acknowledged);
  const toggle = useSetupStore((s) => s.toggle);

  // Pre-mount: empty set (matches SSR). Post-mount: the persisted marks.
  const ackSet = useMemo(
    () => new Set(mounted ? Object.keys(acknowledged) : []),
    [mounted, acknowledged],
  );

  const resolved = useMemo(() => resolveAll(tasks, signal, ackSet), [tasks, signal, ackSet]);
  const summary = useMemo(() => summarize(resolved), [resolved]);

  const visible = useMemo(() => {
    if (filter === 'todo') return resolved.filter((t) => t.status === 'action-needed' || t.status === 'optional-todo');
    if (filter === 'done') return resolved.filter((t) => t.status === 'done');
    return resolved;
  }, [resolved, filter]);

  const groups = useMemo(() => groupByCategory(visible), [visible]);

  const pct = summary.essentialsTotal
    ? Math.round((summary.essentialsDone / summary.essentialsTotal) * 100)
    : 100;
  const allEssentialsDone = summary.essentialsDone === summary.essentialsTotal;

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-link" />
            <h2 className="font-semibold text-foreground">Your setup progress</h2>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">
            {summary.essentialsDone}/{summary.essentialsTotal} essentials done
          </span>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${allEssentialsDone ? 'bg-success' : 'bg-warning'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {summary.requiredOutstanding > 0 ? (
            <span className="font-medium text-link">
              {summary.requiredOutstanding} required step{summary.requiredOutstanding === 1 ? '' : 's'} left before launch
            </span>
          ) : allEssentialsDone ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success-text">
              <PartyPopper className="h-4 w-4" /> All essentials are set up — nice work.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-success-text">
              <CheckCircle2 className="h-4 w-4" /> No required steps outstanding.
            </span>
          )}
          <span className="text-muted-foreground">
            {summary.optionalDone}/{summary.optionalTotal} optional extras enabled
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.id === 'todo'
              ? resolved.filter((t) => t.status === 'action-needed' || t.status === 'optional-todo').length
              : f.id === 'done'
                ? resolved.filter((t) => t.status === 'done').length
                : resolved.length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-primary/40 bg-primary/10 text-link'
                  : 'border-border bg-card text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              {f.label} <span className="tabular-nums opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {filter === 'done'
            ? 'Nothing marked done yet — work through the steps above and they\'ll move here.'
            : 'Nothing here. Switch filters to see more.'}
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              <p className="text-xs text-muted-foreground">{group.blurb}</p>
            </div>
            <div className="grid gap-3">
              {group.tasks.map((task) => (
                <SetupTaskCard
                  key={task.id}
                  task={task}
                  acknowledged={ackSet.has(task.id)}
                  onToggle={() => toggle(task.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
