// ============================================================
// /admin/growth/search/explorer — Site Explorer (§2.2)
// ------------------------------------------------------------
// The full URL inventory with crawl/index/sitemap/metadata/schema status,
// internal-link counts, and computed scores. Rows are sanitized to a
// serializable shape (orphan depth → null) before handing to the client table.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { FileSearch, ArrowLeft } from 'lucide-react';
import { runSearchIntel } from '@/lib/growth/search-intelligence';
import { ModuleHeader, SectionCard, KpiCard } from '../../_components/ui';
import { SiteExplorerTable, type ExplorerRow } from './SiteExplorerTable';

export const metadata: Metadata = { title: 'Site Explorer | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function SiteExplorerPage() {
  const r = runSearchIntel();
  const rows: ExplorerRow[] = r.pages.map((p) => ({
    url: p.url,
    title: p.title,
    pageType: p.pageType,
    sport: p.sport,
    source: p.source,
    indexable: p.indexable,
    inSitemap: p.inSitemap,
    schemaCount: p.schemaTypes.length,
    wordCount: p.wordCount,
    internalLinksIn: p.internalLinksIn,
    internalLinksOut: p.internalLinksOut,
    depth: Number.isFinite(p.depth) ? p.depth : null,
    isOrphan: p.isOrphan,
    qualityScore: p.qualityScore,
    priorityScore: p.priorityScore,
    publishStatus: p.publishStatus,
    dataSource: p.dataSource,
    keyword: p.keyword,
  }));

  const orphans = rows.filter((x) => x.isOrphan).length;
  const missingSitemap = rows.filter((x) => x.indexable && !x.inSitemap).length;
  const noSchema = rows.filter((x) => x.schemaCount === 0).length;

  return (
    <div className="space-y-6">
      <ModuleHeader icon={FileSearch} title="Site Explorer" description="Every discovered URL with indexability, metadata, schema, link counts, and scores.">
        <Link href="/admin/growth/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Command Center</Link>
      </ModuleHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Pages" value={rows.length} icon={FileSearch} source="real" />
        <KpiCard label="Orphans" value={orphans} accent={orphans ? 'text-error-text' : 'text-success-text'} source="real" />
        <KpiCard label="Missing from sitemap" value={missingSitemap} accent={missingSitemap ? 'text-link' : 'text-success-text'} source="real" />
        <KpiCard label="No structured data" value={noSchema} accent={noSchema ? 'text-link' : 'text-success-text'} source="real" />
      </div>

      <SectionCard title="URL inventory" icon={FileSearch}>
        <SiteExplorerTable rows={rows} />
      </SectionCard>
    </div>
  );
}
