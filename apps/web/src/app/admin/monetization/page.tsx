// ============================================================
// /admin/monetization — monetization & ads center
// ------------------------------------------------------------
// Reuses the real ad system (lib/ads) and capability detection. Honest:
// with no network connected there is no revenue to report, and the
// strategy is free-audience-first per the GTM plan.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign, ShieldCheck } from 'lucide-react';
import { AD_PLACEMENTS, HOUSE_ADS } from '@/lib/ads';
import { isAdsConfigured } from '@/lib/capabilities';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';

export const metadata: Metadata = { title: 'Monetization | Admin', robots: 'noindex, nofollow' };

const SAFETY_RULES = [
  'Minors never see paid ads (house promos only).',
  'Paying members get an ad-free experience.',
  'Sensitive surfaces (youth/health) never carry paid ads.',
  'No ads during upload or blocking AI results.',
  'Paid ads render non-personalized / contextual.',
];

export default function AdminMonetizationPage() {
  const activePlacements = AD_PLACEMENTS.filter((p) => p.enabled).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Monetization"
        icon={DollarSign}
        description="Revenue surfaces and the rules that protect the user experience. SwingVantage is free-audience-first: ads are the first revenue, memberships come later."
        actions={<StatusBadge tone={isAdsConfigured ? 'success' : 'warning'}>{isAdsConfigured ? 'Network connected' : 'House ads only'}</StatusBadge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Placements" value={`${activePlacements}/${AD_PLACEMENTS.length}`} hint="active/total" />
        <MetricStat label="House ads" value={HOUSE_ADS.length} />
        <MetricStat label="Est. revenue" value={isAdsConfigured ? '—' : '$0'} tone="muted" hint={isAdsConfigured ? 'see network' : 'no network'} />
        <MetricStat label="Strategy phase" value="Ads" tone="muted" hint="free → ads → tiers" />
      </div>

      {!isAdsConfigured && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-link">
          No ad network connected, so revenue is $0 by design — slots run house promotions that grow the
          product. Per the GTM plan, only switch on paid ads once the free audience is large enough to be worth
          an advertiser&apos;s spend. RPM / CTR / fill data appears here once a network reports it.
        </div>
      )}

      <SectionCard title="Placements" description={`${activePlacements} of ${AD_PLACEMENTS.length} active.`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="pb-2 pr-3">Slot</th><th className="pb-2 pr-3">Surface</th><th className="pb-2 pr-3">Format</th><th className="pb-2">Status</th></tr>
            </thead>
            <tbody className="text-foreground">
              {AD_PLACEMENTS.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2 pr-3 font-medium text-foreground">{p.label}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.surface}</td>
                  <td className="py-2 pr-3">{p.format}</td>
                  <td className="py-2">
                    <span className={p.enabled ? 'text-success-text' : 'text-muted-foreground'}>
                      {p.enabled ? 'on' : 'off'}{p.sensitive ? ' · sensitive' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="UX safety rules (always on)">
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {SAFETY_RULES.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-text" />
              {r}
            </li>
          ))}
        </ul>
      </SectionCard>

      <p className="text-xs text-muted-foreground">
        For network keys, house-ad inventory and placement details, see{' '}
        <Link href="/admin/ads" className="text-link hover:underline">AdsOS</Link>.
      </p>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The monetization control center. Today
          that&apos;s ads (keyless-first), with affiliate and membership surfaces as future phases.
        </p>
        <p>
          <strong className="text-foreground">What good looks like.</strong> A great free experience first;
          revenue that never degrades core tool pages. Higher ad density belongs on blog pages, not the
          analyzer.
        </p>
      </HelpPanel>
    </div>
  );
}
