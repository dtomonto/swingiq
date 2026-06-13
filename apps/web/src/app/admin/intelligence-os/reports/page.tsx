import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { reportRepo } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';
import { ReportsBrowser } from './ReportsBrowser';

export const metadata: Metadata = { title: 'Intelligence OS · Reports | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const items = (await reportRepo.list())
    .filter((r) => !r.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Reports"
        icon={FileText}
        description="Durable, retention-tiered findings. Reports dedupe by fingerprint, generate Action Tasks (which link back), and move hot → warm → cold so report bodies are never stored unbounded."
      />
      <IntelligenceTabs />
      <SectionCard title="Report library">
        <ReportsBrowser initial={items} />
      </SectionCard>
    </div>
  );
}
