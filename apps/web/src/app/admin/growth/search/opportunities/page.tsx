// ============================================================
// /admin/growth/search/opportunities — Content Opportunity engine (§2.6)
// ------------------------------------------------------------
// Scored content to create next, from keyword gaps + cluster missing topics.
// Each card is a production-ready frame: target keyword, intent, proposed slug,
// internal links to add, schema, CTA, and a one-click brief.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Lightbulb, ArrowLeft, Sparkles } from 'lucide-react';
import { runSearchIntel } from '@/lib/growth/search-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, KpiCard, Badge, DataSourceBadge } from '../../_components/ui';
import { accent, Pill } from '../_ui';
import { ExportCsvButton } from '../ExportCsvButton';
import type { CsvValue } from '@/lib/growth/search-intelligence';

export const metadata: Metadata = { title: 'Content Opportunities | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function OpportunitiesPage() {
  const r = runSearchIntel();
  const opps = r.opportunities;
  const golf = opps.filter((o) => o.sport === 'golf').length;
  const softball = opps.filter((o) => o.sport === 'softball').length;

  const exportRows: Record<string, CsvValue>[] = opps.map((o) => ({
    title: o.title,
    proposed_slug: o.proposedSlug,
    content_type: o.contentType,
    target_keyword: o.targetKeyword,
    intent: o.searchIntent,
    cluster: o.topicCluster,
    sport: o.sport,
    schema: o.schemaRecommendation,
    internal_links: o.internalLinksToAdd.join(' | '),
    priority: o.priorityScore,
    confidence: o.confidenceScore,
    status: o.status,
    data_source: o.dataSource,
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader icon={Lightbulb} title="Content Opportunities" description="What to create next — scored by business impact, with a ready-to-use frame.">
        <div className="flex items-center gap-2">
          <ExportCsvButton rows={exportRows} filename="swingvantage-content-opportunities.csv" />
          <Link href="/admin/growth/search" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200"><ArrowLeft className="w-4 h-4" /> Command Center</Link>
        </div>
      </ModuleHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Opportunities" value={opps.length} icon={Lightbulb} source="estimated" />
        <KpiCard label="Golf (beachhead)" value={golf} accent="text-green-400" source="estimated" />
        <KpiCard label="Softball" value={softball} accent="text-green-400" source="estimated" />
        <KpiCard label="Avg priority" value={opps.length ? Math.round(opps.reduce((a, o) => a + o.priorityScore, 0) / opps.length) : 0} source="estimated" />
      </div>

      {opps.length === 0 ? (
        <SectionCard title="No gaps" icon={Lightbulb}><p className="text-sm text-gray-500">No content gaps detected right now.</p></SectionCard>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {opps.map((o) => (
            <div key={o.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-100">{o.title}</h3>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">/{o.proposedSlug}</p>
                </div>
                <Badge className={`bg-gray-800 border-gray-700 ${accent(o.priorityScore)}`}>{o.priorityScore}</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-2">{o.whyItMatters}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Pill>{humanize(o.contentType)}</Pill>
                <Pill>{humanize(o.searchIntent)}</Pill>
                <Pill>{humanize(o.topicCluster)}</Pill>
                <Pill>schema: {o.schemaRecommendation}</Pill>
              </div>
              {o.internalLinksToAdd.length > 0 ? (
                <p className="text-[11px] text-gray-600 mt-2 truncate">Link from: {o.internalLinksToAdd.join(', ')}</p>
              ) : null}
              <div className="mt-3 flex items-center justify-between">
                <Link href={`/admin/growth/search/briefs?topic=${encodeURIComponent(o.targetKeyword)}&sport=${o.sport}&intent=${o.searchIntent}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300">
                  <Sparkles className="w-3.5 h-3.5" /> Generate brief
                </Link>
                <DataSourceBadge source={o.dataSource} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
