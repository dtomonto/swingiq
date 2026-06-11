// ============================================================
// /admin/growth/search/sitemap — Sitemap & Indexing Intelligence (§2.14)
// ------------------------------------------------------------
// Compares the page inventory to the XML sitemap: pages missing from it,
// utility URLs that shouldn't be in it, sitemap URLs not in the inventory,
// and a 1..100 ordered indexing/submission priority list.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Map, ArrowLeft } from 'lucide-react';
import { runSearchIntel } from '@/lib/growth/search-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, KpiCard, Badge } from '../../_components/ui';
import { ExportCsvButton } from '../ExportCsvButton';
import type { CsvValue } from '@/lib/growth/search-intelligence';

export const metadata: Metadata = { title: 'Sitemap Intelligence | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function SitemapIntelligencePage() {
  const r = runSearchIntel();
  const { entries, sitemapOnly, missingFromSitemap, utilityInSitemap } = r.sitemap;
  const risks = entries.filter((e) => e.flag !== 'ok');
  const submitFirst = entries.slice(0, 25); // already sorted by indexingPriority

  const exportRows: Record<string, CsvValue>[] = entries.map((e) => ({
    indexing_priority: e.indexingPriority,
    url: e.url,
    in_sitemap: e.inSitemap,
    indexable: e.indexable,
    flag: e.flag,
    note: e.note,
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader icon={Map} title="Sitemap & Indexing Intelligence" description="What belongs in the sitemap, what's missing, and what to submit first.">
        <div className="flex items-center gap-2">
          <ExportCsvButton rows={exportRows} filename="swingvantage-sitemap-intelligence.csv" />
          <Link href="/admin/growth/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Command Center</Link>
        </div>
      </ModuleHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Inventory pages" value={entries.length} icon={Map} source="real" />
        <KpiCard label="Missing from sitemap" value={missingFromSitemap} accent={missingFromSitemap ? 'text-link' : 'text-success-text'} source="real" />
        <KpiCard label="Utility URLs in sitemap" value={utilityInSitemap} accent={utilityInSitemap ? 'text-error-text' : 'text-success-text'} source="real" />
        <KpiCard label="Sitemap-only URLs" value={sitemapOnly.length} source="real" sublabel="not in inventory" />
      </div>

      {/* Risks */}
      <SectionCard title={`Sitemap risks (${risks.length})`} icon={Map}>
        {risks.length === 0 ? <p className="text-sm text-muted-foreground">No sitemap conflicts. 🎉</p> : (
          <ul className="space-y-2">
            {risks.map((e) => (
              <li key={e.url} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <div className="min-w-0">
                  <Link href={`/admin/growth/search/page-intel?url=${encodeURIComponent(e.url)}`} className="text-xs font-mono text-foreground hover:text-success-text truncate block">{e.url}</Link>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{e.note}</p>
                </div>
                <Badge className="text-link bg-primary/10 border-primary/30 shrink-0">{humanize(e.flag)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Indexing priority */}
      <SectionCard title="Indexing / submission priority (top 25)" icon={Map}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium text-right w-12">#</th>
                <th className="px-3 py-2 font-medium">URL</th>
                <th className="px-3 py-2 font-medium text-center">In sitemap</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submitFirst.map((e) => (
                <tr key={e.url} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">{e.indexingPriority}</td>
                  <td className="px-3 py-2 font-mono text-foreground truncate max-w-[360px]">{e.url}</td>
                  <td className="px-3 py-2 text-center">{e.inSitemap ? <span className="text-success-text">✓</span> : <span className="text-link">✗</span>}</td>
                  <td className="px-3 py-2 text-muted-foreground">{humanize(e.flag)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">Ordered by page priority, with a boost for indexable pages still missing from the sitemap. Submit those first in Search Console.</p>
      </SectionCard>
    </div>
  );
}
