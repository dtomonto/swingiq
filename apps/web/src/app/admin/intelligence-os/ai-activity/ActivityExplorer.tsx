'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AIActivityEvent } from '@/lib/intelligence-os/types';

const cents = (n: number) => `$${(n / 100).toFixed(3)}`;

export function ActivityExplorer({ initial }: { initial: AIActivityEvent[] }) {
  const [events, setEvents] = useState<AIActivityEvent[]>(initial);
  const [q, setQ] = useState('');
  const [provider, setProvider] = useState('');
  const [sort, setSort] = useState<'recent' | 'cost' | 'confidence'>('recent');
  const [busy, setBusy] = useState<string | null>(null);

  const providers = useMemo(() => Array.from(new Set(initial.map((e) => e.provider))), [initial]);

  const filtered = useMemo(() => {
    let list = events.filter((e) =>
      (!q || `${e.userIntent} ${e.feature}`.toLowerCase().includes(q.toLowerCase()))
      && (!provider || e.provider === provider));
    list = [...list].sort((a, b) =>
      sort === 'cost' ? b.estimatedCostCents - a.estimatedCostCents
        : sort === 'confidence' ? b.confidenceScore - a.confidenceScore
          : b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [events, q, provider, sort]);

  async function promote(id: string) {
    setBusy(id);
    const res = await fetch('/api/admin/intelligence-os/activity', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'promote', eventId: id }),
    });
    const json = await res.json();
    if (json.ok && json.knowledge) {
      setEvents((xs) => xs.map((e) => (e.id === id ? { ...e, promotedKnowledgeId: json.knowledge.id } : e)));
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity…" className="w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground">
          <option value="">All providers</option>
          {providers.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground">
          <option value="recent">Most recent</option>
          <option value="cost">Highest cost</option>
          <option value="confidence">Highest confidence</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No AI activity captured" description="Events appear here once an AI feature routes through resolveWithFirstPartyIntelligence() or posts to the activity API. Personalized/privacy content is summarized and hashed — never stored raw." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => (
            <li key={e.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{e.feature}</span>
                <span className="text-xs text-muted-foreground">{e.sourceSystem} · {e.provider}/{e.model ?? 'n/a'} · {e.sport}</span>
                <StatusBadge tone={e.status === 'ok' ? 'healthy' : e.status === 'error' ? 'critical' : 'warning'}>{e.status}</StatusBadge>
                {e.safetyFlags.map((f) => <StatusBadge key={f} tone="watch">{f}</StatusBadge>)}
              </div>
              <p className="mt-1 line-clamp-2 text-muted-foreground">{e.userIntent}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{e.inputTokens + e.outputTokens} tok · {cents(e.estimatedCostCents)}</span>
                <span>conf {e.confidenceScore.toFixed(2)}</span>
                <span>{new Date(e.createdAt).toLocaleString()}</span>
                <span className="ml-auto">
                  {e.promotedKnowledgeId
                    ? <StatusBadge tone="routine">promoted</StatusBadge>
                    : <Button size="sm" variant="ghost" loading={busy === e.id} onClick={() => promote(e.id)}>Promote to knowledge</Button>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
