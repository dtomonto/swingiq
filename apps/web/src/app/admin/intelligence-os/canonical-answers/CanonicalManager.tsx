'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CanonicalAnswer, ValidationStatus } from '@/lib/intelligence-os/types';

const STATUS_TONE: Record<ValidationStatus, BadgeTone> = {
  candidate: 'watch', 'needs-review': 'warning', approved: 'healthy',
  rejected: 'critical', superseded: 'neutral', archived: 'neutral',
};

export function CanonicalManager({ initial }: { initial: CanonicalAnswer[] }) {
  const [items, setItems] = useState<CanonicalAnswer[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ canonicalQuestion: '', canonicalAnswer: '', triggerPhrases: '' });

  async function act(id: string, body: Record<string, unknown>) {
    setBusy(id);
    const res = await fetch('/api/admin/intelligence-os/canonical', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, ...body }),
    });
    const json = await res.json();
    if (json.ok && json.item) setItems((xs) => xs.map((x) => (x.id === id ? json.item : x)));
    setBusy(null);
  }

  async function create() {
    if (!form.canonicalQuestion || !form.canonicalAnswer) return;
    setCreating(true);
    const res = await fetch('/api/admin/intelligence-os/canonical', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        canonicalQuestion: form.canonicalQuestion, canonicalAnswer: form.canonicalAnswer,
        answerFormat: 'short-answer',
        triggerPhrases: form.triggerPhrases.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    const json = await res.json();
    if (json.ok && json.item) { setItems((xs) => [json.item, ...xs]); setForm({ canonicalQuestion: '', canonicalAnswer: '', triggerPhrases: '' }); }
    setCreating(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-medium text-foreground">New canonical answer</p>
        <div className="space-y-2">
          <input value={form.canonicalQuestion} onChange={(e) => setForm({ ...form, canonicalQuestion: e.target.value })} placeholder="Canonical question" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
          <textarea value={form.canonicalAnswer} onChange={(e) => setForm({ ...form, canonicalAnswer: e.target.value })} placeholder="Canonical answer" rows={3} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
          <input value={form.triggerPhrases} onChange={(e) => setForm({ ...form, triggerPhrases: e.target.value })} placeholder="Trigger phrases (comma-separated)" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground" />
          <Button size="sm" loading={creating} onClick={create}>Create (needs review)</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No canonical answers" description="Approve a knowledge item and promote it, or author one above. Approved canonical answers auto-serve and avoid third-party AI calls for matching requests." />
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{c.canonicalQuestion}</span>
                <StatusBadge tone={STATUS_TONE[c.validationStatus]}>{c.validationStatus}</StatusBadge>
                {c.allowedAutoServe && <StatusBadge tone="healthy">auto-serve</StatusBadge>}
                <span className="text-xs text-muted-foreground">conf {c.confidenceScore.toFixed(2)} · avoided {c.aiCallsAvoided} calls</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.canonicalAnswer}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.validationStatus !== 'approved' && <Button size="sm" loading={busy === c.id} onClick={() => act(c.id, { action: 'review', status: 'approved' })}>Approve & enable</Button>}
                {c.validationStatus !== 'rejected' && <Button size="sm" variant="secondary" loading={busy === c.id} onClick={() => act(c.id, { action: 'review', status: 'rejected' })}>Reject</Button>}
                {c.allowedAutoServe && <Button size="sm" variant="ghost" loading={busy === c.id} onClick={() => act(c.id, { action: 'invalidate', reason: 'admin invalidated' })}>Invalidate</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
