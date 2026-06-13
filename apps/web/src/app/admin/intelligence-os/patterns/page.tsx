import type { Metadata } from 'next';
import { Repeat } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { patternRepo } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';
import { PatternsBrowser } from './PatternsBrowser';

export const metadata: Metadata = { title: 'Intelligence OS · Patterns | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function PatternsPage() {
  const items = (await patternRepo.list()).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Patterns"
        icon={Repeat}
        description="Repeated issues, questions, AI failures and opportunities — deduped into pattern memories with occurrence counts. Generate a Claude Code fix packet from any recurring issue."
      />
      <IntelligenceTabs />
      <SectionCard title="Pattern memories">
        <PatternsBrowser initial={items} />
      </SectionCard>
    </div>
  );
}
