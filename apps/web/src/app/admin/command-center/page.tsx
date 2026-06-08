// ============================================================
// /admin/command-center — Today's Command Center (DailyActionIntelligenceOS)
// ------------------------------------------------------------
// The founder's daily operating cockpit: a prioritized "to do today" list
// generated from live signals (drill coverage, audit findings, feature
// education gaps, setup state, analytics wiring) — each item explaining
// what to do, why it matters, what data is missing, the exact steps, the
// expected impact and how completion is detected.
//
// Generation is server-side + stateless (lib/command-center). Owner state
// (in-progress / complete / snooze / dismiss / notes) and settings persist
// in the browser, so the page works in production's read-only filesystem.
// "Run Intelligence Scan" just re-renders this force-dynamic page.
// ============================================================

import type { Metadata } from 'next';
import { Gauge } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { runScan } from '@/lib/command-center/generate.server';
import { CommandCenterClient } from './CommandCenterClient';

export const metadata: Metadata = { title: "Today's Command Center | Admin", robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
  const scan = await runScan();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Today's Command Center"
        icon={Gauge}
        description="Your daily operating cockpit. Prioritized recommendations computed from live platform signals — what to do today, why it matters, what data is missing, the exact steps, the expected impact, and how the app knows it's done. Nothing here is an invented metric: every item traces to a real source."
        actions={
          <StatusBadge tone={scan.recommendations.some((r) => r.priorityBand === 'critical') ? 'danger' : scan.recommendations.length > 0 ? 'warning' : 'success'}>
            {scan.recommendations.length > 0 ? `${scan.recommendations.length} recommendations` : 'All clear'}
          </StatusBadge>
        }
      />

      <CommandCenterClient
        recommendations={scan.recommendations}
        generatedAt={scan.generatedAt}
        totals={scan.totals}
        analyticsConfigured={scan.analyticsConfigured}
      />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A daily, prioritized to-do list for the
          operator. Each recommendation is generated from a real signal in your app — drill coverage gaps,
          open audit findings, undocumented features, pending setup, missing analytics — and scored
          transparently so you always know <em>why</em> it&apos;s near the top.
        </p>
        <p>
          <strong className="text-gray-300">How it&apos;s honest.</strong> The engine never fabricates
          analytics. When data is missing it says so and tells you how to start collecting it. Best-practice
          starters are labelled &ldquo;Initial recommendation&rdquo; so they&apos;re never mistaken for
          measured results.
        </p>
        <p>
          <strong className="text-gray-300">How your progress is saved.</strong> Marking items in-progress,
          complete, snoozed or dismissed (and your notes &amp; settings) is saved in your browser, so it works
          in production and survives re-scans. Press <em>Run Intelligence Scan</em> any time to recompute from
          the latest signals.
        </p>
      </HelpPanel>
    </div>
  );
}
