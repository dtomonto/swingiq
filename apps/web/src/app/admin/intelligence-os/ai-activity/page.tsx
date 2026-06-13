import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { activityRepo } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';
import { ActivityExplorer } from './ActivityExplorer';

export const metadata: Metadata = { title: 'Intelligence OS · AI Activity | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AiActivityPage() {
  const events = (await activityRepo.list()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500);
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · AI Activity"
        icon={Activity}
        description="Every meaningful third-party AI interaction the system has captured — prompts and responses are summarized + hashed (never stored raw). Search, filter, and promote high-value events into reusable knowledge."
      />
      <IntelligenceTabs />
      <SectionCard title="Captured AI events">
        <ActivityExplorer initial={events} />
      </SectionCard>
    </div>
  );
}
