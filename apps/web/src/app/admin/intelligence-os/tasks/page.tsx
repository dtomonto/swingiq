import type { Metadata } from 'next';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { taskRepo } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';
import { TasksBrowser } from './TasksBrowser';

export const metadata: Metadata = { title: 'Intelligence OS · Tasks | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default async function TasksPage() {
  const items = (await taskRepo.list())
    .filter((t) => !t.archived)
    .sort((a, b) => (rank[a.severity] - rank[b.severity]) || b.lastDetectedAt.localeCompare(a.lastDetectedAt));
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Action Tasks"
        icon={ClipboardList}
        description="Every important issue and opportunity as a clickable, traceable task. Open one for an executive summary, evidence, root cause, recommended fix and a downloadable Claude Code fix packet."
      />
      <IntelligenceTabs />
      <SectionCard title="Tasks">
        <TasksBrowser initial={items} />
      </SectionCard>
    </div>
  );
}
