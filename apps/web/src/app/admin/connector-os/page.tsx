// ============================================================
// /admin/connector-os — ConnectorOS status (single source of truth)
// ------------------------------------------------------------
// A unified, honest read of every ConnectorOS connector: which are
// configured vs keyless-default, grouped by layer, with the env var(s)
// that turn each on and a docs pointer. Reads lib/connector-os status
// (booleans only — never a secret value). Complements (does not replace)
// System Health & Integrations; links out to both.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Plug } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecheckButton } from '@/components/admin/RecheckButton';
import {
  getConnectorStatuses,
  summarizeConnectors,
  type ConnectorLayer,
} from '@/lib/connector-os/feature-flags/connector-status';

export const metadata: Metadata = { title: 'ConnectorOS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const LAYER_LABELS: Record<ConnectorLayer, string> = {
  analytics: 'Analytics & Growth',
  reliability: 'Reliability',
  seo: 'SEO / AEO / GEO',
  security: 'Trust & Security',
  video: 'Video Intelligence',
  monetization: 'Monetization',
};

const LAYER_ORDER: ConnectorLayer[] = [
  'analytics', 'reliability', 'seo', 'security', 'video', 'monetization',
];

const STAGE_TONE = { live: 'success', scaffold: 'info', future: 'neutral' } as const;

export default function ConnectorOsPage() {
  const statuses = getConnectorStatuses();
  const summary = summarizeConnectors();

  const byLayer = LAYER_ORDER.map((layer) => ({
    layer,
    items: statuses.filter((s) => s.layer === layer),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="ConnectorOS"
        icon={Plug}
        description="One honest status board for every connector — analytics, reliability, SEO, security, video and monetization. 'Configured' means a real key is set; otherwise the connector uses its safe keyless default."
        actions={<RecheckButton />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat
          label="Live & ready"
          value={`${summary.liveConfigured}/${summary.liveTotal}`}
          tone={summary.liveConfigured === summary.liveTotal ? 'success' : 'warning'}
        />
        <MetricStat label="Configured" value={`${summary.configured}/${summary.total}`} tone="muted" />
        <MetricStat
          label="Analytics"
          value={`${summary.byLayer.analytics?.configured ?? 0}/${summary.byLayer.analytics?.total ?? 0}`}
          tone="muted"
        />
        <MetricStat
          label="SEO"
          value={`${summary.byLayer.seo?.configured ?? 0}/${summary.byLayer.seo?.total ?? 0}`}
          tone="muted"
        />
      </div>

      {byLayer.map(({ layer, items }) => (
        <SectionCard key={layer} title={LAYER_LABELS[layer]}>
          <ul className="divide-y divide-gray-800">
            {items.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-200">{c.label}</p>
                    {c.truth && (
                      <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {c.truth}
                      </span>
                    )}
                    <StatusBadge tone={STAGE_TONE[c.stage]}>{c.stage}</StatusBadge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{c.blurb}</p>
                  <p className="mt-1 font-mono text-[10px] text-gray-600">{c.envVars.join('  ·  ')}</p>
                </div>
                <StatusBadge tone={c.configured ? 'success' : 'neutral'}>
                  {c.configured ? 'Configured' : 'Keyless'}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> The ConnectorOS status board —
          a single typed registry (<code className="rounded bg-gray-800 px-1 text-gray-300">lib/connector-os</code>)
          that every connector reads. It returns booleans only and never exposes a secret value.
        </p>
        <p>
          <strong className="text-gray-300">Stages.</strong> <em>live</em> = wired &amp; usable now ·{' '}
          <em>scaffold</em> = code + docs ready, needs keys/SDK · <em>future</em> = planned.
        </p>
        <p>
          <strong className="text-gray-300">What to do.</strong> Set the listed env var(s) to turn a
          connector on, then press <em>Re-check</em>. Manage keys on{' '}
          <Link href="/admin/integrations">Integrations</Link>, see plain-English service status on{' '}
          <Link href="/admin/system-health">System Health</Link>. Full docs live in{' '}
          <code className="rounded bg-gray-800 px-1 text-gray-300">docs/connector-os/</code>.
        </p>
      </HelpPanel>
    </div>
  );
}
