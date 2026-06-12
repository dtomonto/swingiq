// ============================================================
// /admin/analysis-jobs — Video Analysis Job Monitor
// ------------------------------------------------------------
// Surfaces the analysis-job lifecycle so an operator can see what ran,
// what's failing, and what needs a human look. Jobs are recorded
// DEVICE-LOCAL (analysis runs on-device; the video never leaves the
// browser), so this monitor shows the jobs on THIS device — the same
// local-first model the feature-flag and audit-log surfaces use. A
// fleet-wide view would mirror this metadata to an optional Supabase
// analysis_jobs table (deferred).
// ============================================================

import type { Metadata } from 'next';
import { ClipboardList } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { AnalysisJobsClient } from './AnalysisJobsClient';

export const metadata: Metadata = { title: 'Analysis Jobs | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminAnalysisJobsPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Analysis Jobs"
        icon={ClipboardList}
        description="Every swing analysis as a traceable job — lifecycle status, confidence, the AI provider/model the route used, and retries. Retry, request a rerun, or send low-confidence runs to human review."
      />

      <SectionCard
        title="Honest note"
        description="Swing analysis runs ON-DEVICE (the video never leaves the browser), so these jobs are recorded on THIS device — they are operator metadata, not a fleet-wide queue. A cross-device view would mirror this metadata to an optional Supabase analysis_jobs table (deferred), exactly as the audit log notes for itself. Operator actions here are recorded in the audit log."
      >
        <AnalysisJobsClient actor={actor} />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A lifecycle view of each AI swing analysis:
          queued → preparing → extracting frames → measuring pose → AI analyzing → building report → completed.
          A run that finishes without an AI provider (keyless / paused / budget) is shown honestly as
          <em> No AI</em>, not a failure.
        </p>
        <p>
          <strong className="text-foreground">Human review.</strong> Low-confidence analyses are auto-flagged
          for review. Use <em>Send to review</em> / <em>Clear</em> to work the queue.
        </p>
        <p>
          <strong className="text-foreground">Rerun.</strong> <em>Request rerun</em> records the intent against a
          finished job (and bumps its retry count); the fresh run happens when the swing is re-analyzed.
        </p>
      </HelpPanel>
    </div>
  );
}
