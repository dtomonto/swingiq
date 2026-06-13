'use client';

// Status workflow + quick actions + notes for an Action Task. Every mutation
// goes through the admin-guarded /api/admin/intelligence-os/records endpoint,
// then refreshes the server component so the detail page reflects new state.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { ActionTask, TaskStatus } from '@/lib/intelligence-os/types';

const STATUSES: TaskStatus[] = [
  'New', 'Triaged', 'In Progress', 'Waiting', 'Needs Review',
  'Fixed', 'Verified', 'Monitoring', 'Archived', 'Ignored',
];

async function patchTask(id: string, patch: Partial<ActionTask>) {
  const res = await fetch('/api/admin/intelligence-os/records', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'action_task', id, patch }),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
}

export function TaskActions({ task }: { task: ActionTask }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  function run(patch: Partial<ActionTask>, optimisticStatus?: TaskStatus) {
    setError(null);
    if (optimisticStatus) setStatus(optimisticStatus);
    startTransition(async () => {
      try {
        await patchTask(task.id, patch);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function appendHistory(event: string, detail?: string) {
    return [...task.history, { at: new Date().toISOString(), event, detail }];
  }

  function changeStatus(next: TaskStatus) {
    run({ status: next, history: appendHistory('status_change', `${task.status} → ${next}`) }, next);
  }

  function addNote() {
    if (!note.trim()) return;
    const notes = [...task.notes, { at: new Date().toISOString(), author: 'admin', body: note.trim() }];
    run({ notes });
    setNote('');
  }

  return (
    <div className="space-y-4">
      {/* Status workflow */}
      <div>
        <label htmlFor="task-status" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </label>
        <select
          id="task-status"
          value={status}
          disabled={pending}
          onChange={(e) => changeStatus(e.target.value as TaskStatus)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => changeStatus('In Progress')}>Mark In Progress</Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => changeStatus('Fixed')}>Mark Fixed</Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => changeStatus('Monitoring')}>Mark Monitoring</Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run({ severity: 'critical', priority: 'p0', history: appendHistory('escalated', 'Escalated to critical') })}>Escalate to Critical</Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run({ status: 'Ignored', history: appendHistory('ignored') }, 'Ignored')}>Ignore</Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run({ archived: true, status: 'Archived', history: appendHistory('archived') }, 'Archived')}>Archive</Button>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="task-note" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Add note
        </label>
        <textarea
          id="task-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What did you find / decide?"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        />
        <div className="mt-2">
          <Button variant="secondary" size="sm" disabled={pending || !note.trim()} onClick={addNote}>Save note</Button>
        </div>
      </div>

      {error && <p className="text-sm text-error-text">{error}</p>}
      {pending && <p className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}
