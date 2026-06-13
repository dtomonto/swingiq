'use client';

// Status workflow + quick actions + notes for an Action Task. Every mutation
// goes through the admin-guarded /api/admin/intelligence-os/tasks endpoint,
// then refreshes the server component.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { TASK_STATUSES, type ActionTask, type TaskStatus } from '@/lib/intelligence-os/types';

async function patch(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/intelligence-os/tasks', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
}

export function TaskWorkflow({ task }: { task: ActionTask }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [err, setErr] = useState<string | null>(null);

  function run(body: Record<string, unknown>, optimistic?: TaskStatus) {
    setErr(null);
    if (optimistic) setStatus(optimistic);
    start(async () => {
      try { await patch({ id: task.id, ...body }); router.refresh(); }
      catch (e) { setErr((e as Error).message); }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="status" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</label>
        <select
          id="status" value={status} disabled={pending}
          onChange={(e) => run({ status: e.target.value }, e.target.value as TaskStatus)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run({ status: 'in-progress' }, 'in-progress')}>In progress</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run({ status: 'fixed' }, 'fixed')}>Fixed</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run({ status: 'monitoring' }, 'monitoring')}>Monitoring</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run({ action: 'escalate' }, 'in-progress')}>Escalate</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run({ status: 'ignored' }, 'ignored')}>Ignore</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run({ status: 'archived' }, 'archived')}>Archive</Button>
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Add note</label>
        <textarea
          id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="What did you find / decide?"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        />
        <div className="mt-2">
          <Button size="sm" variant="secondary" disabled={pending || !note.trim()} onClick={() => { run({ note: note.trim() }); setNote(''); }}>Save note</Button>
        </div>
      </div>

      {err && <p className="text-sm text-error-text">{err}</p>}
      {pending && <p className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}
