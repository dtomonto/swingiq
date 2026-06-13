import type { Metadata } from 'next';
import { Database } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { knowledgeRepo } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';
import { KnowledgeManager } from './KnowledgeManager';

export const metadata: Metadata = { title: 'Intelligence OS · Knowledge | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  const items = (await knowledgeRepo.list()).sort((a, b) => b.usageCount - a.usageCount || b.confidenceScore - a.confidenceScore);
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Knowledge Library"
        icon={Database}
        description="Reusable first-party intelligence captured from AI activity. Review candidates, approve them into reusable knowledge, archive what's stale, and promote the best into canonical answers."
      />
      <IntelligenceTabs />
      <SectionCard title="Knowledge items">
        <KnowledgeManager initial={items} />
      </SectionCard>
    </div>
  );
}
