'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PatternMemory } from '@/lib/intelligence-os/types';

interface FixPacket { title: string; markdownPrompt: string; acceptanceCriteria: string[] }

export function PatternsBrowser({ initial }: { initial: PatternMemory[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [packet, setPacket] = useState<FixPacket | null>(null);

  async function genPacket(id: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/intelligence-os/patterns?fixPacket=${encodeURIComponent(id)}`);
    const json = await res.json();
    if (json.ok) setPacket(json.packet);
    setBusy(null);
  }

  if (initial.length === 0) {
    return <EmptyState title="No patterns detected yet" description="Recurring user questions, swing faults, upload issues, AI-quality problems and technical bugs are deduped into pattern memories as evidence accrues. Each can become a task, report, fix packet or canonical answer." />;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {initial.map((p) => (
          <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{p.patternTitle}</span>
              <StatusBadge tone={p.occurrenceCount >= 5 ? 'warning' : 'watch'}>×{p.occurrenceCount}</StatusBadge>
              <span className="text-xs text-muted-foreground">{p.patternType} · {p.affectedFeature}{p.affectedRoute ? ` · ${p.affectedRoute}` : ''}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{p.summary}</p>
            <div className="mt-2">
              <Button size="sm" variant="ghost" loading={busy === p.id} onClick={() => genPacket(p.id)}>Generate fix packet</Button>
            </div>
          </li>
        ))}
      </ul>

      {packet && (
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-foreground">{packet.title}</p>
            <Button size="sm" variant="ghost" onClick={() => setPacket(null)}>Close</Button>
          </div>
          <textarea readOnly value={packet.markdownPrompt} rows={10} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Acceptance: {packet.acceptanceCriteria.join(' · ')}</p>
        </div>
      )}
    </div>
  );
}
