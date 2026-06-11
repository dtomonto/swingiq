// ============================================================
// /admin/notifications — admin notification center
// ------------------------------------------------------------
// Aggregates the same REAL, derived signals as the Command Center
// alerts plus recent admin activity. No invented notifications.
// ============================================================

import type { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { AlertCard } from '@/components/admin/AlertCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { getSystemStatus } from '@/lib/admin/data/system';
import { getPlatformMetrics } from '@/lib/admin/data/metrics';
import { deriveAlerts, type AdminAlert } from '@/lib/admin/alerts';
import { collectServerActions, summarizeActions } from '@/lib/admin/action-center';
import { isHrefBuilt } from '@/lib/admin/nav';

export const metadata: Metadata = { title: 'Notifications | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const system = getSystemStatus();
  const metrics = await getPlatformMetrics();
  const actions = await collectServerActions();
  const actionSummary = summarizeActions(actions);
  const actionAlerts: AdminAlert[] =
    actions.length > 0
      ? [
          {
            id: 'action-center',
            severity: actionSummary.hasCritical ? 'critical' : 'warning',
            title: `${actionSummary.total} item${actionSummary.total === 1 ? '' : 's'} need your review`,
            detail: `One inbox for approvals, opportunities and audit findings across ${actionSummary.items} source${actionSummary.items === 1 ? '' : 's'}.`,
            href: '/admin/approvals',
            cta: 'Open Action Center',
          },
        ]
      : [];
  const alerts = [...actionAlerts, ...deriveAlerts(system, metrics)];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Notifications"
        icon={Bell}
        description="What needs your attention right now — derived from real platform signals — plus a feed of recent admin activity."
      />

      <SectionCard title="Alerts" description={`${alerts.length} active signal${alerts.length === 1 ? '' : 's'}.`}>
        {alerts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">All clear — no active alerts.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <AlertCard
                key={a.id}
                severity={a.severity === 'success' ? 'success' : a.severity}
                title={a.title}
                detail={a.detail}
                href={a.href && isHrefBuilt(a.href) ? a.href : undefined}
                cta={a.cta}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent admin activity">
        <RecentActivity limit={10} />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A single place to catch failures, review
          queues, opportunities and incidents. Severity runs info → success → warning → critical.
        </p>
        <p>
          <strong className="text-foreground">Why it&apos;s honest.</strong> Every alert is grounded in something
          observed (a missing integration, a real sport-usage trend). Outbound delivery (email/Slack) can be
          wired later; today this is the in-app center.
        </p>
      </HelpPanel>
    </div>
  );
}
