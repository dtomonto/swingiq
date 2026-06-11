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
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3">
              <AlertTriangle className="w-4 h-4 text-link shrink-0 mt-0.5" />
              <div className="text-sm text-link/90">
                <p className="font-semibold text-link">No analytics provider connected</p>
                <p className="mt-1 text-xs leading-relaxed text-link/80">
                  The KPIs below are <strong>placeholders</strong>. They show the dictionary of metrics
                  you intend to track, but their values are not yet real. Connect a provider by setting
                  one of the following environment variables in your Vercel project (or <code className="text-link">.env.local</code> for development):
                </p>
                <ul className="mt-2 space-y-1 text-xs text-link/80 font-mono">
                  <li><code>NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code> — Plausible Analytics (privacy-first, recommended)</li>
                  <li><code>NEXT_PUBLIC_GA_ID</code> — Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX)</li>
                  <li><code>NEXT_PUBLIC_POSTHOG_KEY</code> — PostHog project API key</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-3">
            <CheckCircle2 className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-success-text">Analytics connected</p>
              <p className="mt-0.5 text-xs text-success-text/80">
                Connected providers:{' '}
                {providers.map((p) => (
                  <span key={p} className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded bg-success/10 border border-success/30 text-success-text font-medium text-[11px]">
                    {p.toUpperCase()}
                  </span>
                ))}
              </p>
              <p className="mt-1 text-xs text-success-text/60">
                Events fire only after analytics consent is granted — see <code className="text-success-text/70">lib/growth/analytics.ts</code>.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* KPI dictionary */}
      <SectionCard title="KPI dictionary" icon={BarChart3}>
        <p className="text-xs text-muted-foreground mb-3">
          Every metric SwingIQ intends to track — with the exact formula used to compute it.
          The &quot;Source&quot; badge tells you whether the current value is real data or a placeholder.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Metric</th>
                <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Unit</th>
                <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Source</th>
                <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Funnel stage</th>
                <th className="text-left py-2.5 text-muted-foreground font-medium">Definition (how it&apos;s computed)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{m.name}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">{m.unit}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <DataSourceBadge source={m.dataSource} />
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    {m.funnelStage ? (
                      <Badge className="text-muted-foreground bg-muted/60 border-border/60">
                        {humanize(m.funnelStage)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/70">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-muted-foreground leading-relaxed max-w-sm">{m.definition}</td>
                </tr>
              ))}
              {metrics.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                    No metrics defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {providers.length === 0 && (
          <p className="text-[11px] text-muted-foreground/70 mt-3 pt-3 border-t border-border">
            Values shown as &quot;—&quot; will populate automatically once an analytics provider is connected and events
            are flowing. The definitions above document how each metric will be calculated.
          </p>
        )}
      </SectionCard>

      {/* UTM Builder — client component */}
      <UtmBuilder savedLinks={savedLinks} />

      {/* Future integrations */}
      <SectionCard title="Future integrations">
        <p className="text-xs text-muted-foreground mb-3">
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
              className="text-xs px-2.5 py-1 rounded-lg bg-muted border border-border text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-3">
          Each integration will wire into <code>lib/growth/analytics.ts</code> and respect the
          consent layer — data only flows after the visitor grants analytics consent.
        </p>
      </SectionCard>
    </div>
  );
}
