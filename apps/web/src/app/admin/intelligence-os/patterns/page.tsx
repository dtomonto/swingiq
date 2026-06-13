// Intelligence OS — Patterns. Recurring questions, faults, failures and
// opportunities, deduplicated by fingerprint. Each pattern can become a task,
// report, fix packet or canonical answer.

import { Recycle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { PatternsTable } from '@/components/admin/intelligence-os/Tables';
import { patternsRepo } from '@/lib/intelligence-os/store';

export const dynamic = 'force-dynamic';

export default async function PatternsPage() {
  const rows = await patternsRepo.list();
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Pattern Memory"
        icon={Recycle}
        description="What keeps breaking, what keeps getting asked, what keeps blocking conversion — deduplicated and ranked by occurrence. Click a pattern to generate a fix packet or open a task."
      />
      <IntelNav />
      <PatternsTable rows={rows} />
    </div>
  );
}
