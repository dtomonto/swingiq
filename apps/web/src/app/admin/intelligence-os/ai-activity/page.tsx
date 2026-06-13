// Intelligence OS — AI Activity. Every captured AI interaction: searchable,
// sortable by cost / reuse potential, honest about provider + tokens.

import { Activity } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { ActivityTable } from '@/components/admin/intelligence-os/Tables';
import { aiEventsRepo } from '@/lib/intelligence-os/store';

export const dynamic = 'force-dynamic';

export default async function AiActivityPage() {
  const rows = await aiEventsRepo.list();
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="AI Activity"
        icon={Activity}
        description="Every meaningful AI interaction — captured, sanitized (no raw prompts/PII), and scored for cost and reuse potential. Promote high-reuse events into knowledge."
      />
      <IntelNav />
      <ActivityTable rows={rows} />
    </div>
  );
}
