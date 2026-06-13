// Intelligence OS — Action Tasks. The clickable priority queue: every
// Critical / High Priority / Needs Attention item opens a real executive
// detail page with evidence, root cause, fix and a downloadable fix packet.

import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { TasksTable } from '@/components/admin/intelligence-os/Tables';
import { tasksRepo } from '@/lib/intelligence-os/store';
import type { ActionTask } from '@/lib/intelligence-os/types';

export const dynamic = 'force-dynamic';

const ATTENTION = new Set(['New', 'Triaged', 'Needs Review', 'Waiting']);

function applyFilter(tasks: ActionTask[], severity?: string, status?: string): { rows: ActionTask[]; label: string | null } {
  if (severity === 'critical') return { rows: tasks.filter((t) => t.severity === 'critical'), label: 'Critical' };
  if (severity === 'high') return { rows: tasks.filter((t) => t.severity === 'high' || t.priority === 'p1'), label: 'High priority' };
  if (status === 'attention') return { rows: tasks.filter((t) => ATTENTION.has(t.status)), label: 'Needs attention' };
  return { rows: tasks, label: null };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const all = (await tasksRepo.list()).filter((t) => !t.archived);
  const { rows, label } = applyFilter(all, sp.severity, sp.status);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Action Tasks"
        icon={ClipboardList}
        description="Every important issue and opportunity as a clickable, traceable task. No dead badges — open one for an executive summary, evidence, root cause, recommended fix and a Claude Code fix packet."
        badge={label ? <StatusBadge tone="watch">Filtered: {label}</StatusBadge> : undefined}
      />
      <IntelNav />
      <TasksTable rows={rows} />
    </div>
  );
}
