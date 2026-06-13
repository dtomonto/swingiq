// Intelligence OS — Knowledge Library. Reusable first-party intelligence:
// review candidates, approve canonical knowledge, see how often each item
// avoided a third-party AI call.

import { Database } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { KnowledgeTable } from '@/components/admin/intelligence-os/Tables';
import { knowledgeRepo } from '@/lib/intelligence-os/store';

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  const rows = await knowledgeRepo.list();
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Knowledge Library"
        icon={Database}
        description="The reusable first-party knowledge base. Candidates are promoted from repeated high-confidence AI outputs and human-approved before they can serve answers."
      />
      <IntelNav />
      <KnowledgeTable rows={rows} />
    </div>
  );
}
