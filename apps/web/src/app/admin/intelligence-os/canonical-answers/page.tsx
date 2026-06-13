// Intelligence OS — Canonical Answers. Approved first-party answers that serve
// repeated questions WITHOUT a third-party model call (when confidence + safety
// gates pass). Token savings accrue per served answer.

import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { CanonicalTable } from '@/components/admin/intelligence-os/Tables';
import { canonicalRepo } from '@/lib/intelligence-os/store';

export const dynamic = 'force-dynamic';

export default async function CanonicalAnswersPage() {
  const rows = await canonicalRepo.list();
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Canonical Answers"
        icon={Sparkles}
        description="Approved answers the router serves before calling a model. Sensitive content (youth, medical, legal, privacy, personalized) is never auto-served — it always requires review."
      />
      <IntelNav />
      <CanonicalTable rows={rows} />
    </div>
  );
}
