// ============================================================
// /admin/reliability — ReliabilityOS Health Command Center
// ------------------------------------------------------------
// The founder's operational cockpit: overall system status, a prioritized
// Failure Inbox, and Upload/Auth/Page/Tool reliability panels — answering
// "what broke, how bad, is it ongoing, what do I fix first". Failures are
// captured from the existing error reporter + analytics seams; grouping is
// pure (lib/reliability-os) and owner state (issue status/notes) persists in
// the browser. Honest: when no durable backend is configured it shows
// admin-session + signal-derived health only, and says so.
// ============================================================

import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireReliabilityAccess } from './access.server';
import { gatherReliabilitySignals } from '@/lib/reliability-os/signals.server';
import { listIngestedEvents } from '@/lib/reliability-os/ingest.server';
import { ReliabilityDashboard } from './ReliabilityDashboard';

export const metadata: Metadata = { title: 'ReliabilityOS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function ReliabilityPage() {
  const ctx = await requireReliabilityAccess();
  const signals = gatherReliabilitySignals();
  // Cross-user events (only present when a durable backend is configured).
  const ingested = signals.crossUserCaptureEnabled ? await listIngestedEvents(1000) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="ReliabilityOS"
        icon={Activity}
        description="Your operational health command center. See what broke, who/what was affected, how severe it is, whether it's still happening, and what to fix first — translated into plain language. Privacy-first: every captured failure is sanitized to metadata only; unknowns are labelled, never faked."
      />

      <ReliabilityDashboard actor={ctx.email ?? 'admin'} signals={signals} ingestedEvents={ingested} />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A founder-friendly reliability layer.
          It captures failures from the app&apos;s existing error reporting + analytics, groups repeated
          failures into issues, and shows you a prioritized inbox with suggested next steps and a
          one-click &ldquo;Copy Debug Context&rdquo; you can paste into Claude Code.
        </p>
        <p className="mt-2">
          <strong className="text-gray-300">Daily:</strong> glance at System Status and any open
          critical/high issues, failed uploads and failed logins. <strong className="text-gray-300">Weekly:</strong>{' '}
          resolve fixed issues, copy debug context for anything recurring. <strong className="text-gray-300">Monthly:</strong>{' '}
          review the top failure categories and tune alert thresholds. See{' '}
          <code>docs/reliability-os/founder-guide.md</code>.
        </p>
        <p className="mt-2 text-amber-300/80">
          Cross-user runtime capture requires a durable backend (Supabase). When it&apos;s off, this
          shows your admin session&apos;s captured failures + signal-derived health only — it never
          invents numbers for other users.
        </p>
      </HelpPanel>
    </div>
  );
}
