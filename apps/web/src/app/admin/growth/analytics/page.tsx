// ============================================================
// /admin/growth/analytics — KPI Dictionary, UTM Builder, and channel measurement
// ============================================================

import type { Metadata } from 'next';
import { BarChart3, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { metricsRepo, utmRepo } from '@/lib/growth/repository';
import { configuredAnalyticsProviders } from '@/lib/growth/analytics';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, DataSourceBadge, Badge } from '../_components/ui';
import { UtmBuilder } from './UtmBuilder';

export const metadata: Metadata = {
  title: 'Analytics | GrowthOS',
  robots: 'noindex, nofollow',
};

export default async function AnalyticsPage() {
  const [metrics, savedLinks] = await Promise.all([metricsRepo.list(), utmRepo.list()]);
  const providers = configuredAnalyticsProviders();

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={BarChart3}
        title="Analytics"
        description="KPI dictionary, UTM builder, and channel measurement."
      />

      {/* Data connection card */}
      <SectionCard title="Data connection" icon={Layers}>
        {providers.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200/90">
                <p className="font-semibold text-amber-300">No analytics provider connected</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-300/80">
                  The KPIs below are <strong>placeholders</strong>. They show the dictionary of metrics
                  you intend to track, but their values are not yet real. Connect a provider by setting
                  one of the following environment variables in your Vercel project (or <code className="text-amber-100">.env.local</code> for development):
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-100/80 font-mono">
                  <li><code>NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code> — Plausible Analytics (privacy-first, recommended)</li>
                  <li><code>NEXT_PUBLIC_GA_ID</code> — Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX)</li>
                  <li><code>NEXT_PUBLIC_POSTHOG_KEY</code> — PostHog project API key</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-300">Analytics connected</p>
              <p className="mt-0.5 text-xs text-green-300/80">
                Connected providers:{' '}
                {providers.map((p) => (
                  <span key={p} className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded bg-green-400/10 border border-green-400/30 text-green-300 font-medium text-[11px]">
                    {p.toUpperCase()}
                  </span>
                ))}
              </p>
              <p className="mt-1 text-xs text-green-300/60">
                Events fire only after analytics consent is granted — see <code className="text-green-200/70">lib/growth/analytics.ts</code>.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* KPI dictionary */}
      <SectionCard title="KPI dictionary" icon={BarChart3}>
        <p className="text-xs text-gray-500 mb-3">
          Every metric SwingIQ intends to track — with the exact formula used to compute it.
          The &quot;Source&quot; badge tells you whether the current value is real data or a placeholder.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2.5 pr-3 text-gray-400 font-medium whitespace-nowrap">Metric</th>
                <th className="text-left py-2.5 pr-3 text-gray-400 font-medium whitespace-nowrap">Unit</th>
                <th className="text-left py-2.5 pr-3 text-gray-400 font-medium whitespace-nowrap">Source</th>
                <th className="text-left py-2.5 pr-3 text-gray-400 font-medium whitespace-nowrap">Funnel stage</th>
                <th className="text-left py-2.5 text-gray-400 font-medium">Definition (how it&apos;s computed)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 pr-3 font-medium text-gray-200 whitespace-nowrap">{m.name}</td>
                  <td className="py-2.5 pr-3 text-gray-400 whitespace-nowrap">{m.unit}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <DataSourceBadge source={m.dataSource} />
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    {m.funnelStage ? (
                      <Badge className="text-gray-400 bg-gray-700/60 border-gray-600/60">
                        {humanize(m.funnelStage)}
                      </Badge>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-gray-400 leading-relaxed max-w-sm">{m.definition}</td>
                </tr>
              ))}
              {metrics.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                    No metrics defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {providers.length === 0 && (
          <p className="text-[11px] text-gray-600 mt-3 pt-3 border-t border-gray-800">
            Values shown as &quot;—&quot; will populate automatically once an analytics provider is connected and events
            are flowing. The definitions above document how each metric will be calculated.
          </p>
        )}
      </SectionCard>

      {/* UTM Builder — client component */}
      <UtmBuilder savedLinks={savedLinks} />

      {/* Future integrations */}
      <SectionCard title="Future integrations">
        <p className="text-xs text-gray-400 mb-3">
          Planned provider integrations that will replace placeholder KPIs with real data:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'GA4', 'Google Search Console', 'Google Ads',
            'Meta Ads', 'PostHog', 'Plausible',
            'Segment', 'Mixpanel', 'Amplitude', 'Stripe',
          ].map((name) => (
            <span
              key={name}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-400"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-gray-600 mt-3">
          Each integration will wire into <code>lib/growth/analytics.ts</code> and respect the
          consent layer — data only flows after the visitor grants analytics consent.
        </p>
      </SectionCard>
    </div>
  );
}
