// ============================================================
// /admin/growth/link-intelligence — Link Intelligence Agent hub
// ------------------------------------------------------------
// The "links brain" of GrowthOS. Renders a LIVE agent run (computed from your
// real pages on every load — never empty, never faked) with internal-link
// health, the site audit, internal-link recommendations, discovered backlink
// opportunities (→ Digital PR), competitor link gaps (→ Market Intel), sport
// cluster authority, AEO/GEO readiness, notifications, the latest report, and
// honest provider-connection status.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Network, Link2, Search, Newspaper, Telescope, Trophy, Bot, Bell, FileText,
  AlertTriangle, ArrowRight, Plug, CheckCircle2, Lightbulb,
} from 'lucide-react';
import { runLinkAgent, buildReport, providerStatuses } from '@/lib/growth/link-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, KpiCard, SectionCard, Badge } from '../_components/ui';
import { RunAgentButton } from './RunAgentButton';

export const metadata: Metadata = { title: 'Link Intelligence | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

function accent(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 45) return 'text-amber-400';
  return 'text-red-400';
}

const BASE = '/admin/growth';

export default function LinkIntelligenceHub() {
  const r = runLinkAgent({ cadence: 'manual' });
  const report = buildReport('weekly', {
    run: r.run, findings: r.findings, recommendations: r.recommendations,
    opportunities: r.backlinkOpportunities, competitorGaps: r.competitorGaps,
    aiSearch: r.aiSearch, clusters: r.clusters,
  });
  const providers = providerStatuses();

  const pendingRecs = r.recommendations.filter((x) => x.status === 'pending');
  const autoSafe = r.recommendations.filter((x) => x.autoSafe);
  const topRecs = r.recommendations.slice(0, 6);
  const topOpps = r.backlinkOpportunities.slice(0, 5);
  const topGaps = r.competitorGaps.slice(0, 4);
  const clusters = r.clusters.filter((c) => c.pageCount > 0).sort((a, b) => b.authorityScore - a.authorityScore);
  const weakAeo = r.aiSearch.slice(0, 5);

  const findingCounts = r.findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.findingType] = (acc[f.findingType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <ModuleHeader icon={Network} title="Link Intelligence" description="The links brain — internal linking, backlinks, competitor gaps, topical authority and AI-search readiness.">
        <RunAgentButton />
      </ModuleHeader>

      {/* Honesty banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200/90">
        <p className="font-semibold text-amber-300">What&apos;s real vs. what needs a connection</p>
        <p className="mt-1 text-xs leading-relaxed">
          Internal-link analysis, the site audit, recommendations and AEO/GEO readiness are{' '}
          <strong>computed live from your real pages</strong>. Backlink opportunities and competitor gaps run on{' '}
          <strong>curated white-hat examples</strong> until you connect a data provider (Ahrefs / Semrush / Search Console) —
          they&apos;re labeled, never faked. The agent <strong>never sends outreach automatically</strong>.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Internal-link health" value={`${r.run.internalLinkHealth}/100`} icon={Link2} accent={accent(r.run.internalLinkHealth)} source="real" sublabel={`${r.run.pagesAnalyzed} pages · ${r.run.internalLinksMapped} links`} />
        <KpiCard label="Orphan pages" value={r.run.orphansFound} icon={AlertTriangle} accent={r.run.orphansFound ? 'text-red-400' : 'text-green-400'} source="real" sublabel="no path from homepage" />
        <KpiCard label="Broken internal links" value={r.run.brokenFound} icon={AlertTriangle} accent={r.run.brokenFound ? 'text-red-400' : 'text-green-400'} source="real" />
        <KpiCard label="Internal-link recs" value={pendingRecs.length} icon={Lightbulb} accent="text-amber-400" source="real" sublabel={`${autoSafe.length} safe to auto-apply`} />
        <KpiCard label="Backlink opportunity" value={`${r.run.backlinkOpportunityScore}/100`} icon={Newspaper} accent={accent(r.run.backlinkOpportunityScore)} source={r.providerConnected ? 'estimated' : 'placeholder'} sublabel={`${r.run.backlinkOppsDiscovered} opportunities`} />
        <KpiCard label="AEO/GEO readiness" value={`${r.run.aeoReadiness}/100`} icon={Bot} accent={accent(r.run.aeoReadiness)} source="real" sublabel="avg citation readiness" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top internal-link recommendations */}
        <SectionCard title="Top internal-link recommendations" icon={Lightbulb} action={<Link href={`${BASE}/internal-links`} className="text-xs text-green-400 hover:text-green-300">Open Internal Links →</Link>}>
          {topRecs.length === 0 ? (
            <p className="text-sm text-gray-500">No recommendations right now — your internal linking is in good shape.</p>
          ) : (
            <ul className="space-y-2">
              {topRecs.map((rec) => (
                <li key={rec.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-200 min-w-0 truncate">{rec.name}</p>
                    <Badge className={accent(rec.score).replace('text-', 'text-') + ' bg-gray-800 border-gray-700'}>{rec.score}</Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">{rec.anchorKind}</span>
                    {rec.autoSafe
                      ? <Badge className="text-green-400 bg-green-400/10 border-green-400/30">safe to auto-apply</Badge>
                      : <Badge className="text-amber-400 bg-amber-400/10 border-amber-400/30">needs review</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Site audit summary */}
        <SectionCard title="Site link audit" icon={Search} action={<Link href={`${BASE}/internal-links`} className="text-xs text-green-400 hover:text-green-300">View findings →</Link>}>
          {Object.keys(findingCounts).length === 0 ? (
            <p className="text-sm text-gray-500">No issues found. 🎉</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(findingCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
                  <span className="text-xs text-gray-300">{humanize(type)}</span>
                  <span className="text-sm font-semibold text-gray-100">{count}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Backlink opportunities → Digital PR */}
        <SectionCard title="Backlink opportunities" icon={Newspaper} action={<Link href={`${BASE}/pr`} className="text-xs text-green-400 hover:text-green-300">Open Digital PR →</Link>}>
          <ul className="space-y-2">
            {topOpps.map((o) => (
              <li key={o.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <p className="text-sm text-gray-200">{o.opportunityType}</p>
                <p className="text-xs text-gray-500 mt-0.5">{o.targetOutlet}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-gray-600">Curated white-hat examples until a provider is connected. Qualify + draft outreach in Digital PR.</p>
        </SectionCard>

        {/* Competitor gaps → Market Intel */}
        <SectionCard title="Competitor link gaps" icon={Telescope} action={<Link href={`${BASE}/market-intel`} className="text-xs text-green-400 hover:text-green-300">Open Market Intel →</Link>}>
          <ul className="space-y-2">
            {topGaps.map((g) => (
              <li key={g.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <p className="text-sm text-gray-200">{g.competitor}</p>
                <p className="text-xs text-gray-500 mt-0.5">{g.recommendedAction}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Sport cluster authority */}
        <SectionCard title="Sport cluster authority" icon={Trophy}>
          <ul className="space-y-2">
            {clusters.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-gray-300 truncate">{c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                  <div className={`h-full rounded-full ${c.authorityScore >= 70 ? 'bg-green-500/70' : c.authorityScore >= 45 ? 'bg-amber-500/70' : 'bg-red-500/70'}`} style={{ width: `${c.authorityScore}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right tabular-nums text-gray-400 text-xs">{c.authorityScore} · {c.pageCount}p</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* AEO/GEO readiness */}
        <SectionCard title="AI-search (AEO/GEO) readiness" icon={Bot}>
          <ul className="space-y-2">
            {weakAeo.map((a) => (
              <li key={a.url} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-200 min-w-0 truncate">{a.title}</p>
                  <Badge className={`bg-gray-800 border-gray-700 ${accent(a.score)}`}>{a.score}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{a.recommendations[0]}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Notifications */}
      <SectionCard title="Notifications" icon={Bell}>
        {r.notifications.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing needs your attention.</p>
        ) : (
          <ul className="space-y-2">
            {r.notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.severity === 'high' || n.severity === 'critical' ? 'bg-red-500' : n.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-200">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.detail}</p>
                </div>
                {n.href ? <Link href={n.href} className="text-xs text-green-400 hover:text-green-300 shrink-0">Open →</Link> : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Latest report */}
      <SectionCard title={report.title} icon={FileText}>
        <p className="text-sm text-gray-300">{report.headline}</p>
        <div className="mt-3 grid sm:grid-cols-2 gap-4">
          {report.sections.map((s) => (
            <div key={s.heading}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{s.heading}</p>
              <ul className="space-y-0.5">
                {s.lines.slice(0, 6).map((line, i) => (
                  <li key={i} className="text-xs text-gray-400 leading-relaxed">{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Provider status */}
      <SectionCard title="Data providers" icon={Plug} action={<Link href="/admin/integrations" className="text-xs text-green-400 hover:text-green-300">Integrations →</Link>}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {providers.map((p) => (
            <div key={p.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">{p.label}</span>
                {p.connected
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  : <Plug className="w-3.5 h-3.5 text-gray-600" />}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{p.connected ? 'Connected' : `Set ${p.envVars[0]}`}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ArrowRight className="w-3.5 h-3.5" />
        <span>Recommendations + audit findings live in <Link href={`${BASE}/internal-links`} className="text-green-400 hover:underline">Internal Links</Link>. Backlink opportunities flow to <Link href={`${BASE}/pr`} className="text-green-400 hover:underline">Digital PR</Link>; competitor gaps to <Link href={`${BASE}/market-intel`} className="text-green-400 hover:underline">Market Intelligence</Link>.</span>
      </div>
    </div>
  );
}
