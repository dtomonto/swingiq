import type { Metadata } from 'next';
import { FileCheck2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { canonicalRepo } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';
import { CanonicalManager } from './CanonicalManager';

export const metadata: Metadata = { title: 'Intelligence OS · Canonical Answers | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function CanonicalAnswersPage() {
  const items = (await canonicalRepo.list()).sort((a, b) => b.aiCallsAvoided - a.aiCallsAvoided);
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Canonical Answers"
        icon={FileCheck2}
        description="Approved first-party answers that serve repeated questions WITHOUT calling a third-party model. Set trigger phrases and auto-serve rules; every served answer is counted as an avoided AI call."
      />
      <IntelligenceTabs />
      <SectionCard title="Canonical answers">
        <CanonicalManager initial={items} />
      </SectionCard>
    </div>
  );
}
