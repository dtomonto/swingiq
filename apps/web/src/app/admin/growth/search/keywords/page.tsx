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
import { runSearchIntel, loadGscSnapshot, gscStatus } from '@/lib/growth/search-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, KpiCard, Badge, DataSourceBadge } from '../../_components/ui';
import { accent } from '../_ui';
import { KeywordTools } from './KeywordTools';
import { ConnectGsc } from './ConnectGsc';
import type { CsvValue } from '@/lib/growth/search-intelligence';

export const metadata: Metadata = { title: 'Keyword Explorer | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function KeywordExplorerPage() {
  const snap = await loadGscSnapshot();
  const r = runSearchIntel({ gscKeywords: snap?.keywords, gscRankings: snap?.rankings, gscSummary: snap?.summary ?? null });
  const status = gscStatus();
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
    rank: k.currentRank ?? null,
    impressions: k.impressions ?? null,
    clicks: k.clicks ?? null,
    data_source: k.dataSource,
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader icon={KeyRound} title="Keyword Explorer" description="Owned + strategic keywords, scored by relative opportunity.">
        <Link href="/admin/growth/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Command Center</Link>
      </ModuleHeader>

      <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-link/90 leading-relaxed">
        <strong className="text-link">Volume & difficulty are relative estimates</strong> derived from keyword shape — not measured search demand.
        Rank, impressions & clicks become <strong>real</strong> once Search Console is synced; volume stays an estimate (GSC reports impressions, not demand).
      </div>

      <ConnectGsc status={status} summary={r.gscSummary} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Keywords" value={keywords.length} icon={KeyRound} source="real" />
        <KpiCard label="With a target page" value={owned} accent="text-success-text" source="real" />
        <KpiCard label="Content gaps" value={gaps} accent={gaps ? 'text-link' : 'text-success-text'} source="estimated" sublabel="no owned page" />
        <KpiCard label="Avg opportunity" value={keywords.length ? Math.round(keywords.reduce((a, k) => a + k.opportunityScore, 0) / keywords.length) : 0} source="estimated" />
      </div>

      <SectionCard title="Import / export" icon={KeyRound}>
        <KeywordTools exportRows={exportRows} />
      </SectionCard>

      <SectionCard title="Keywords by opportunity" icon={KeyRound}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Keyword</th>
                <th className="px-3 py-2 font-medium">Intent</th>
                <th className="px-3 py-2 font-medium">Cluster</th>
                <th className="px-3 py-2 font-medium text-right">Rank</th>
                <th className="px-3 py-2 font-medium text-right">Vol*</th>
                <th className="px-3 py-2 font-medium text-right">Diff*</th>
                <th className="px-3 py-2 font-medium text-right">Opportunity</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Target / action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keywords.map((k) => (
                <tr key={k.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-foreground">{k.keyword}</td>
                  <td className="px-3 py-2 text-muted-foreground">{humanize(k.intent)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{humanize(k.topicCluster)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{k.currentRank != null ? <span className="text-success-text font-semibold" title={`${k.impressions ?? 0} impressions · ${k.clicks ?? 0} clicks (Search Console)`}>{k.currentRank}</span> : <span className="text-muted-foreground/60">—</span>}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">{k.volumeEstimate}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">{k.difficultyEstimate}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-semibold ${accent(k.opportunityScore)}`}>{k.opportunityScore}</td>
                  <td className="px-3 py-2"><Badge className="bg-muted border-border text-muted-foreground">{humanize(k.source)}</Badge></td>
                  <td className="px-3 py-2">
                    {k.targetUrl ? (
                      <Link href={`/admin/growth/search/page-intel?url=${encodeURIComponent(k.targetUrl)}`} className="text-success-text hover:text-success-text font-mono truncate">{k.targetUrl}</Link>
                    ) : (
                      <Link href={`/admin/growth/search/briefs?topic=${encodeURIComponent(k.keyword)}`} className="text-success-text hover:text-success-text inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> Brief</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-2xs text-muted-foreground/70">* Relative estimates, not measured demand.</p>
          <DataSourceBadge source="estimated" />
        </div>
      </SectionCard>
    </div>
  );
}
