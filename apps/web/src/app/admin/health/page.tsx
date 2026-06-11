// ============================================================
// /admin/health — Product Health (consolidated overview)
// ------------------------------------------------------------
// The single entry point for "is anything wrong?" — rolls up system
// status, reliability incidents, QA coverage and data quality. Honest,
// capability-derived; links to each surface for the detail. Additive:
// the individual surfaces keep their own routes (no redirects yet).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, HeartPulse, ClipboardCheck, Search, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { getSystemStatus } from '@/lib/admin/data/system';

export const metadata: Metadata = { title: 'Product Health | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SURFACES = [
  {
    href: '/admin/system-health', icon: Activity, name: 'System Health',
    blurb: 'Every integration, what state it is in and what that means for users — plus the AI cost guard and job posture.',
  },
  {
    href: '/admin/reliability', icon: HeartPulse, name: 'Reliability',
    blurb: 'What broke — uploads, logins, pages, tools — grouped into issues with severity, onset and what to fix first.',
  },
  {
    href: '/admin/qa', icon: ClipboardCheck, name: 'QA & Testing',
    blurb: 'A generated manual-QA checklist that tracks the app as it grows — per section, agent and sport. Work P0 first.',
  },
  {
    href: '/admin/data-quality', icon: Search, name: 'Data Quality',
    blurb: 'Keyless hygiene over the content registry — duplicate slugs/titles, thin content, mis-tagged sports, missing CTAs.',
  },
];

export default function ProductHealthPage() {
  const system = getSystemStatus();
  const allConnected = system.connectedCount === system.totalCount;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Product Health"
        icon={Activity}
        description="What's running and what's broken, in one place — system status, reliability incidents, QA and data quality. Each surface explains what a state means for users, not just whether a switch is on."
        actions={
          <StatusBadge tone={allConnected ? 'healthy' : 'warning'}>
            {system.connectedCount}/{system.totalCount} services connected
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Services up"
          value={`${system.connectedCount}/${system.totalCount}`}
          status={allConnected ? 'good' : 'warning'}
          hint="connected integrations"
        />
        <MetricCard label="Environment" value={system.nodeEnv} tone="muted" hint="runtime" />
        <MetricCard
          label="AI vision"
          value={system.capabilities.aiVision ? 'On' : 'Off'}
          status={system.capabilities.aiVision ? 'good' : 'warning'}
          hint="swing analysis"
        />
        <MetricCard
          label="Accounts"
          value={system.capabilities.auth ? 'On' : 'Local'}
          tone={system.capabilities.auth ? 'success' : 'muted'}
          hint="auth + cloud sync"
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Health surfaces</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SURFACES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-theme hover:border-primary/40"
              >
                <span className="mt-0.5 shrink-0 rounded-lg border border-primary/25 bg-primary/[0.08] p-2 text-link">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    {s.name}
                    <ArrowRight className="h-3.5 w-3.5 text-link transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{s.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The single entry point for product health.
          It rolls up the four operational surfaces SwingVantage watches — system status, reliability incidents,
          QA coverage and data quality — so &ldquo;is anything wrong?&rdquo; has one answer instead of four tabs
          to check.
        </p>
        <p>
          <strong className="text-foreground">What good looks like.</strong> All services connected, no open
          reliability incidents, QA P0s clear, and no duplicate or thin content flagged. Anything off shows here
          first, then links to the surface that fixes it.
        </p>
      </HelpPanel>
    </div>
  );
}
