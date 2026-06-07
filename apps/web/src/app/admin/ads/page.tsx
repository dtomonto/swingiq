// ============================================================
// /admin/ads — AdsOS manager (owner)
// ------------------------------------------------------------
// Status + inventory for the ad system. Honest: shows whether a network
// is connected (keyless = house ads only), every placement, the safety
// rules, and the house-ad inventory. Admin-guarded by admin/layout.tsx.
// ============================================================

import type { Metadata } from 'next';
import { AD_PLACEMENTS, HOUSE_ADS } from '@/lib/ads';
import { isAdsConfigured } from '@/lib/capabilities';

export const metadata: Metadata = { title: 'AdsOS | Admin', robots: 'noindex, nofollow' };

const ADS_PROVIDER = process.env.NEXT_PUBLIC_ADS_PROVIDER || '';

export default function AdminAdsPage() {
  const activePlacements = AD_PLACEMENTS.filter((p) => p.enabled).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-100">AdsOS</h1>
        <p className="mt-1 text-sm text-gray-400">
          Phase-2 monetization, keyless-first. With no network connected, slots run house
          promotions that grow the product; paid ads switch on automatically once a network is set.
        </p>
      </header>

      {/* Network status */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="font-semibold text-gray-100">Ad network</h2>
        {isAdsConfigured ? (
          <p className="mt-2 text-sm text-emerald-400">
            Connected{ADS_PROVIDER ? ` · ${ADS_PROVIDER}` : ''}. Paid ads are eligible on non-sensitive
            slots for non-minor, non-member users.
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-400">
            Not connected — running house ads only. Set NEXT_PUBLIC_ADS_PROVIDER and
            NEXT_PUBLIC_ADS_CLIENT_ID to enable paid ads. (Per the GTM plan, only turn this on once the
            free audience is large enough to be worth an advertiser’s spend.)
          </p>
        )}
      </section>

      {/* Safety rules */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="font-semibold text-gray-100">Safety rules (always on)</h2>
        <ul className="mt-2 space-y-1 text-sm text-gray-400">
          <li>• <span className="text-gray-200">Minors</span> never see paid ads (house promos only).</li>
          <li>• <span className="text-gray-200">Paying members</span> get an ad-free experience.</li>
          <li>• <span className="text-gray-200">Sensitive surfaces</span> (youth/health) never carry paid ads.</li>
          <li>• Paid ads render non-personalized / contextual containers.</li>
        </ul>
      </section>

      {/* Placement inventory */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">Placements</h2>
          <span className="text-xs text-gray-400">{activePlacements}/{AD_PLACEMENTS.length} active</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="pb-2 pr-3">Slot</th>
                <th className="pb-2 pr-3">Surface</th>
                <th className="pb-2 pr-3">Format</th>
                <th className="pb-2 pr-3">House</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {AD_PLACEMENTS.map((p) => (
                <tr key={p.id} className="border-t border-gray-800">
                  <td className="py-2 pr-3 font-medium text-gray-200">{p.label}</td>
                  <td className="py-2 pr-3 text-gray-400">{p.surface}</td>
                  <td className="py-2 pr-3">{p.format}</td>
                  <td className="py-2 pr-3">{p.allowHouse ? 'yes' : 'no'}</td>
                  <td className="py-2">
                    <span className={p.enabled ? 'text-emerald-400' : 'text-gray-500'}>
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
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="font-semibold text-gray-100">House ad inventory</h2>
        <p className="mt-1 text-xs text-gray-500">Self-promotions that fill slots now (weighted rotation).</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {HOUSE_ADS.map((ad) => (
            <div key={ad.id} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-100">{ad.title}</p>
                <span className="text-[11px] text-gray-500">w{ad.weight}</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-400">{ad.body}</p>
              <p className="mt-1 text-xs text-emerald-400">{ad.cta.label} → {ad.cta.href}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
