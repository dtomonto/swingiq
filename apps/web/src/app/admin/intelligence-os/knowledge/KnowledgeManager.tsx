'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { KnowledgeItem, ValidationStatus } from '@/lib/intelligence-os/types';

const STATUS_TONE: Record<ValidationStatus, BadgeTone> = {
  candidate: 'watch', 'needs-review': 'warning', approved: 'healthy',
  rejected: 'critical', superseded: 'neutral', archived: 'neutral',
};

async function api(method: string, body: unknown): Promise<{ ok: boolean; item?: KnowledgeItem; error?: string }> {
  const res = await fetch('/api/admin/intelligence-os/knowledge', {
    method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

export function KnowledgeManager({ initial }: { initial: KnowledgeItem[] }) {
  const [items, setItems] = useState<KnowledgeItem[]>(initial);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => items.filter((k) =>
    (!q || `${k.title} ${k.canonicalQuestion} ${k.topic}`.toLowerCase().includes(q.toLowerCase()))
    && (!status || k.validationStatus === status)
  ), [items, q, status]);

  function replace(updated?: KnowledgeItem) {
    if (updated) setItems((xs) => xs.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function review(id: string, newStatus: ValidationStatus) {
    setBusy(id);
    const r = await api('PATCH', { id, action: 'review', status: newStatus });
    replace(r.item); setBusy(null);
  }
  async function canonicalize(id: string) {
    setBusy(id);
    await fetch('/api/admin/intelligence-os/knowledge', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, action: 'canonicalize' }),
    });
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search knowledge…"
          className="w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground">
          <option value="">All statuses</option>
          {(['candidate', 'needs-review', 'approved', 'rejected', 'superseded', 'archived'] as ValidationStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="button" onClick={() => { window.location.href = '/api/admin/intelligence-os/export?format=markdown'; }} className="ml-auto text-sm text-link hover:underline">Export .md</button>
        <button type="button" onClick={() => { window.location.href = '/api/admin/intelligence-os/export?format=json'; }} className="text-sm text-link hover:underline">Export .json</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No knowledge items" description="Knowledge candidates are created automatically when the router captures reusable AI output, or author one via the API. Approve candidates to make them reusable." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((k) => (
            <li key={k.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{k.title}</span>
                    <StatusBadge tone={STATUS_TONE[k.validationStatus]}>{k.validationStatus}</StatusBadge>
                    <span className="text-xs text-muted-foreground">{k.knowledgeType} · {k.sport} · conf {k.confidenceScore.toFixed(2)} · used {k.usageCount}×</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{k.shortAnswer || k.canonicalAnswer}</p>
                  {k.safetyFlags.length > 0 && (
                    <p className="mt-1 text-xs text-warning-text">Safety: {k.safetyFlags.join(', ')}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {k.validationStatus !== 'approved' && (
                  <Button size="sm" variant="primary" loading={busy === k.id} onClick={() => review(k.id, 'approved')}>Approve</Button>
                )}
                {k.validationStatus !== 'rejected' && (
                  <Button size="sm" variant="secondary" loading={busy === k.id} onClick={() => review(k.id, 'rejected')}>Reject</Button>
                )}
                {!k.archived && (
                  <Button size="sm" variant="ghost" loading={busy === k.id} onClick={() => review(k.id, 'archived')}>Archive</Button>
                )}
                {k.validationStatus === 'approved' && (
                  <Button size="sm" variant="ghost" loading={busy === k.id} onClick={() => canonicalize(k.id)}>→ Canonical</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
