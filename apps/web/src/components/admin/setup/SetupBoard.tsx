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
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-amber-400" />
            <h2 className="font-semibold text-gray-100">Your setup progress</h2>
          </div>
          <span className="text-sm tabular-nums text-gray-400">
            {summary.essentialsDone}/{summary.essentialsTotal} essentials done
          </span>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${allEssentialsDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {summary.requiredOutstanding > 0 ? (
            <span className="font-medium text-amber-400">
              {summary.requiredOutstanding} required step{summary.requiredOutstanding === 1 ? '' : 's'} left before launch
            </span>
          ) : allEssentialsDone ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
              <PartyPopper className="h-4 w-4" /> All essentials are set up — nice work.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> No required steps outstanding.
            </span>
          )}
          <span className="text-gray-500">
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
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              {f.label} <span className="tabular-nums opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-sm text-gray-500">
          {filter === 'done'
            ? 'Nothing marked done yet — work through the steps above and they\'ll move here.'
            : 'Nothing here. Switch filters to see more.'}
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-200">{group.label}</h2>
              <p className="text-xs text-gray-500">{group.blurb}</p>
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
