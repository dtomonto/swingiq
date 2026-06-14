// ============================================================
// /admin/ads — AdsOS manager (owner)
// ------------------------------------------------------------
// Status + inventory for the ad system. Honest: shows whether a network
// is connected (keyless = house ads only), every placement, the safety
// rules, and the house-ad inventory. Admin-guarded by admin/layout.tsx.
// ============================================================

import type { Metadata } from 'next';
import { Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AD_PLACEMENTS, HOUSE_ADS } from '@/lib/ads';
import { isAdsConfigured } from '@/lib/capabilities';

export const metadata: Metadata = { title: 'AdsOS | Admin', robots: 'noindex, nofollow' };

const ADS_PROVIDER = process.env.NEXT_PUBLIC_ADS_PROVIDER || '';

export default function AdminAdsPage() {
  const activePlacements = AD_PLACEMENTS.filter((p) => p.enabled).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="AdsOS"
        icon={Megaphone}
        description="Phase-2 monetization, keyless-first. With no network connected, slots run house promotions that grow the product; paid ads switch on automatically once a network is set."
      />

      {/* Network status */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Ad network</h2>
        {isAdsConfigured ? (
          <p className="mt-2 text-sm text-success-text">
            Connected{ADS_PROVIDER ? ` · ${ADS_PROVIDER}` : ''}. Paid ads are eligible on non-sensitive
            slots for non-minor, non-member users.
          </p>
        ) : (
          <p className="mt-2 text-sm text-link">
            Not connected — running house ads only. Set NEXT_PUBLIC_ADS_PROVIDER and
            NEXT_PUBLIC_ADS_CLIENT_ID to enable paid ads. (Per the GTM plan, only turn this on once the
            free audience is large enough to be worth an advertiser’s spend.)
          </p>
        )}
      </section>

      {/* Safety rules */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Safety rules (always on)</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• <span className="text-foreground">Minors</span> never see paid ads (house promos only).</li>
          <li>• <span className="text-foreground">Paying members</span> get an ad-free experience.</li>
          <li>• <span className="text-foreground">Sensitive surfaces</span> (youth/health) never carry paid ads.</li>
          <li>• Paid ads render non-personalized / contextual containers.</li>
        </ul>
      </section>

      {/* Placement inventory */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Placements</h2>
          <span className="text-xs text-muted-foreground">{activePlacements}/{AD_PLACEMENTS.length} active</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">Slot</th>
                <th className="pb-2 pr-3">Surface</th>
                <th className="pb-2 pr-3">Format</th>
                <th className="pb-2 pr-3">House</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {AD_PLACEMENTS.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2 pr-3 font-medium text-foreground">{p.label}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.surface}</td>
                  <td className="py-2 pr-3">{p.format}</td>
                  <td className="py-2 pr-3">{p.allowHouse ? 'yes' : 'no'}</td>
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
      </section>

      {/* House ad inventory */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">House ad inventory</h2>
        <p className="mt-1 text-xs text-muted-foreground">Self-promotions that fill slots now (weighted rotation).</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {HOUSE_ADS.map((ad) => (
            <div key={ad.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{ad.title}</p>
                <span className="text-2xs text-muted-foreground">w{ad.weight}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{ad.body}</p>
              <p className="mt-1 text-xs text-success-text">{ad.cta.label} → {ad.cta.href}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
