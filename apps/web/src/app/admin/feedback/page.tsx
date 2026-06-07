// ============================================================
// /admin/feedback — feedback management & roadmap
// ============================================================

import type { Metadata } from 'next';
import { MessageSquare } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { FeedbackClient } from './FeedbackClient';

export const metadata: Metadata = { title: 'Feedback | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Feedback"
        icon={MessageSquare}
        description="Capture feedback on AI results, pages, tutorials and UX — then move it through to the roadmap. New → Triaged → Planned → Done turns recurring feedback into product improvements."
      />
      <SectionCard><FeedbackClient actor={actor} /></SectionCard>
      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> The feedback-to-roadmap pipeline. Tag each
          item by type, then advance its status as you act on it.
        </p>
        <p>
          <strong className="text-gray-300">What good looks like.</strong> Recurring themes (e.g. several
          &ldquo;AI result&rdquo; notes about the same fault) become &ldquo;Planned&rdquo; improvements rather
          than getting lost.
        </p>
      </HelpPanel>
    </div>
  );
}
