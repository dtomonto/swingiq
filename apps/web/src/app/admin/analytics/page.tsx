// ============================================================
// /admin/analytics — analytics & funnels
// ------------------------------------------------------------
// The event catalog (what SwingVantage CAN measure) is real, read from
// @swingiq/core. Live counts require an analytics provider's API; we say
// so plainly rather than inventing charts.
// ============================================================

import type { Metadata } from 'next';
import { BarChart3, ArrowRight } from 'lucide-react';
import { ANALYTICS_EVENTS } from '@swingiq/core';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { HelpPanel } from '@/components/admin/HelpPanel';

export const metadata: Metadata = { title: 'Analytics | Admin', robots: 'noindex, nofollow' };

const FUNNELS: { name: string; steps: string[] }[] = [
  { name: 'Acquisition', steps: ['Visitor', 'Signup', 'First upload', 'Completed analysis'] },
  { name: 'Activation', steps: ['Analysis', 'Tutorial click', 'Drill started', 'Repeat visit'] },
  { name: 'Content → tool', steps: ['Blog/SEO visit', 'Tool usage', 'Upload'] },
  { name: 'Fix loop', steps: ['Fix page', 'Manual generated', 'Return session'] },
];

export default function AdminAnalyticsPage() {
  const events = Object.values(ANALYTICS_EVENTS);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Analytics"
        icon={BarChart3}
        description="Growth, retention and funnel reporting. The event catalog below is what SwingVantage is instrumented to track; live numbers populate once an analytics provider's read API is connected."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Tracked events" value={events.length} />
        <MetricStat label="Key funnels" value={FUNNELS.length} />
        <MetricStat label="Live data" value="Connect" tone="muted" hint="needs provider API" />
        <MetricStat label="Sports" value={7} />
      </div>

      <SectionCard title="Key funnels" description="The conversions worth watching.">
        <div className="space-y-3">
          {FUNNELS.map((f) => (
            <div key={f.name}>
              <p className="mb-1 text-sm font-medium text-amber-300">{f.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                {f.steps.map((s, i) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="rounded bg-gray-800 px-2 py-1">{s}</span>
                    {i < f.steps.length - 1 && <ArrowRight className="h-3 w-3 text-gray-600" />}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Event catalog" description={`${events.length} instrumented events.`}>
        <div className="flex flex-wrap gap-1.5">
          {events.map((e) => (
            <code key={e} className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] text-gray-300">{e}</code>
          ))}
        </div>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A reference for what&apos;s measured and the
          funnels that matter. SwingVantage fires these events client-side today.
        </p>
        <p>
          <strong className="text-gray-300">Why no live charts yet.</strong> Reading aggregated counts back
          requires the analytics provider&apos;s reporting API. Until that&apos;s connected, this page is the
          honest catalog — not a fabricated dashboard. Connecting it would light up the funnels above.
        </p>
      </HelpPanel>
    </div>
  );
}
