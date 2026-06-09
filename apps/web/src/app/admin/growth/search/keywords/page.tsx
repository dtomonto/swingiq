// ============================================================
// /admin/growth/search/keywords — Keyword Explorer (§2.4)
// ------------------------------------------------------------
// The keyword universe from owned pages + blog tags + strategic seeds, scored
// by relative opportunity. Volume/difficulty are RELATIVE estimates (labeled),
// never presented as measured demand. Content gaps (no owned page) float to
// the top and link straight into the brief generator.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Sparkles } from 'lucide-react';
import { runSearchIntel } from '@/lib/growth/search-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, KpiCard, Badge, DataSourceBadge } from '../../_components/ui';
import { accent } from '../_ui';
import { KeywordTools } from './KeywordTools';
import type { CsvValue } from '@/lib/growth/search-intelligence';

export const metadata: Metadata = { title: 'Keyword Explorer | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function KeywordExplorerPage() {
  const r = runSearchIntel();
  const keywords = r.keywords;
  const gaps = keywords.filter((k) => !k.hasOwnedPage).length;
  const owned = keywords.length - gaps;

  const exportRows: Record<string, CsvValue>[] = keywords.map((k) => ({
    keyword: k.keyword,
    intent: k.intent,
    funnel: k.funnelStage,
    cluster: k.topicCluster,
    sport: k.sport,
    volume: k.volumeEstimate,
    difficulty: k.difficultyEstimate,
    opportunity: k.opportunityScore,
    business_value: k.businessValueScore,
    source: k.source,
    url: k.targetUrl,
    data_source: k.dataSource,
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader icon={KeyRound} title="Keyword Explorer" description="Owned + strategic keywords, scored by relative opportunity.">
        <Link href="/admin/growth/search" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200"><ArrowLeft className="w-4 h-4" /> Command Center</Link>
      </ModuleHeader>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90 leading-relaxed">
        <strong className="text-amber-300">Volume & difficulty are relative estimates</strong> derived from keyword shape — not measured search demand.
        Connect Search Console or import a CSV to replace them with verified numbers.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Keywords" value={keywords.length} icon={KeyRound} source="real" />
        <KpiCard label="With a target page" value={owned} accent="text-green-400" source="real" />
        <KpiCard label="Content gaps" value={gaps} accent={gaps ? 'text-amber-400' : 'text-green-400'} source="estimated" sublabel="no owned page" />
        <KpiCard label="Avg opportunity" value={keywords.length ? Math.round(keywords.reduce((a, k) => a + k.opportunityScore, 0) / keywords.length) : 0} source="estimated" />
      </div>

      <SectionCard title="Import / export" icon={KeyRound}>
        <KeywordTools exportRows={exportRows} />
      </SectionCard>

      <SectionCard title="Keywords by opportunity" icon={KeyRound}>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-800/50 text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Keyword</th>
                <th className="px-3 py-2 font-medium">Intent</th>
                <th className="px-3 py-2 font-medium">Cluster</th>
                <th className="px-3 py-2 font-medium text-right">Vol*</th>
                <th className="px-3 py-2 font-medium text-right">Diff*</th>
                <th className="px-3 py-2 font-medium text-right">Opportunity</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Target / action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {keywords.map((k) => (
                <tr key={k.id} className="hover:bg-gray-800/30">
                  <td className="px-3 py-2 text-gray-200">{k.keyword}</td>
                  <td className="px-3 py-2 text-gray-400">{humanize(k.intent)}</td>
                  <td className="px-3 py-2 text-gray-500">{humanize(k.topicCluster)}</td>
                  <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{k.volumeEstimate}</td>
                  <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{k.difficultyEstimate}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-semibold ${accent(k.opportunityScore)}`}>{k.opportunityScore}</td>
                  <td className="px-3 py-2"><Badge className="bg-gray-800 border-gray-700 text-gray-400">{humanize(k.source)}</Badge></td>
                  <td className="px-3 py-2">
                    {k.targetUrl ? (
                      <Link href={`/admin/growth/search/page-intel?url=${encodeURIComponent(k.targetUrl)}`} className="text-green-400 hover:text-green-300 font-mono truncate">{k.targetUrl}</Link>
                    ) : (
                      <Link href={`/admin/growth/search/briefs?topic=${encodeURIComponent(k.keyword)}`} className="text-green-400 hover:text-green-300 inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> Brief</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-gray-600">* Relative estimates, not measured demand.</p>
          <DataSourceBadge source="estimated" />
        </div>
      </SectionCard>
    </div>
  );
}
