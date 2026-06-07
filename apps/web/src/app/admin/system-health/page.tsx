// ============================================================
// /admin/system-health — operational status in plain English
// ------------------------------------------------------------
// Honest, capability-derived health: which services are connected and
// what each state means for users. Job/queue telemetry is explicitly
// labelled as not-yet-wired rather than faked.
// ============================================================

import type { Metadata } from 'next';
import { Activity, ServerCog } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecheckButton } from '@/components/admin/RecheckButton';
import { getSystemStatus, type IntegrationCategory } from '@/lib/admin/data/system';

export const metadata: Metadata = { title: 'System Health | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function SystemHealthPage() {
  const system = getSystemStatus();
  const byCategory = system.integrations.reduce<Record<string, typeof system.integrations>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});
  const allConnected = system.connectedCount === system.totalCount;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="System Health"
        icon={Activity}
        description="A plain-English view of what's running. Each row explains what the state means for users — not just whether a switch is on."
        actions={<RecheckButton />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat
          label="Services up" value={`${system.connectedCount}/${system.totalCount}`}
          tone={allConnected ? 'success' : 'warning'}
        />
        <MetricStat label="Environment" value={system.nodeEnv} tone="muted" />
        <MetricStat label="AI vision" value={system.capabilities.aiVision ? 'On' : 'Off'} tone={system.capabilities.aiVision ? 'success' : 'warning'} />
        <MetricStat label="Accounts" value={system.capabilities.auth ? 'On' : 'Local'} tone={system.capabilities.auth ? 'success' : 'muted'} />
      </div>

      {(Object.keys(byCategory) as IntegrationCategory[]).map((cat) => (
        <SectionCard key={cat} title={cat}>
          <ul className="divide-y divide-gray-800">
            {byCategory[cat].map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200">{i.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{i.detail}</p>
                </div>
                <StatusBadge tone={i.connected ? 'success' : 'neutral'}>
                  {i.connected ? 'Connected' : 'Off'}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}

      <SectionCard title="Background jobs & queues" description="What runs behind the scenes.">
        <div className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-400">
          <ServerCog className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <p>
            Heavy work (video analysis, OCR, AI generation) runs on demand rather than through a persistent
            worker queue, so there is no job backlog to display. Scheduled content/SEO/audit tasks run on the
            owner&apos;s machine and commit locally. Live queue telemetry can be wired here later if a hosted
            worker is added.
          </p>
        </div>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A health snapshot of the integrations
          SwingVantage depends on. &ldquo;Connected&rdquo; means a real key is configured and that capability
          is live; &ldquo;Off&rdquo; means the app falls back to its keyless behaviour.
        </p>
        <p>
          <strong className="text-gray-300">What good looks like.</strong> For full operation you want
          Supabase (accounts), the service role (admin data), and an AI vision provider connected. Ads and
          billing are intentionally off pre-revenue.
        </p>
        <p>
          <strong className="text-gray-300">What to do.</strong> To change a state, set the matching keys on
          the <a href="/admin/integrations">Integrations</a> page, then press <em>Re-check</em>.
        </p>
      </HelpPanel>
    </div>
  );
}
