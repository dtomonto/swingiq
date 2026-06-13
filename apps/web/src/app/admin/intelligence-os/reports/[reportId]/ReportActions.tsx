'use client';

// Report controls: generate Action Tasks from findings, set the retention tier
// (hot/warm/cold — demoting drops the full body), and advance the lifecycle.
// All mutations go through the admin-guarded /reports endpoint.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { REPORT_LIFECYCLES, type ActionReport, type ReportLifecycle, type RetentionTier } from '@/lib/intelligence-os/types';

async function patch(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/intelligence-os/reports', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
  return res.json();
}

const TIERS: RetentionTier[] = ['hot', 'warm', 'cold'];

export function ReportActions({ report }: { report: ActionReport }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(body: Record<string, unknown>, note?: string) {
    setMsg(null);
    start(async () => {
      try {
        const json = await patch({ id: report.id, ...body });
        if (note) setMsg(note);
        if (json.createdTaskIds) setMsg(`Generated ${json.createdTaskIds.length} task(s).`);
        router.refresh();
      } catch (e) { setMsg((e as Error).message); }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tasks</p>
        <Button size="sm" variant="primary" disabled={pending || report.findings.length === 0} onClick={() => run({ action: 'generate-tasks' })}>
          Generate tasks from findings
        </Button>
      </div>

      <div>
        <label htmlFor="tier" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Retention tier</label>
        <select
          id="tier" value={report.retentionTier} disabled={pending}
          onChange={(e) => run({ retentionTier: e.target.value }, `Moved to ${e.target.value}.`)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">Warm/cold drop the full body; summary, findings & generated tasks are always kept.</p>
      </div>

      <div>
        <label htmlFor="lifecycle" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifecycle</label>
        <select
          id="lifecycle" value={report.lifecycleStatus} disabled={pending}
          onChange={(e) => run({ lifecycleStatus: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          {REPORT_LIFECYCLES.map((s: ReportLifecycle) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
