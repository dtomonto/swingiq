// ============================================================
// /admin/growth/search — SearchIntelligenceOS · Visibility Command Center
// ------------------------------------------------------------
// The executive cockpit. Runs the full Search Intelligence scan LIVE on every
// load (computed from your real pages — never empty, never faked): the score
// battery, the prioritized action feed, top content opportunities, technical
// blockers, sitemap/indexing risks, pages to work on, decay risks, plus the
// reused AEO + competitor panels and honest provider status.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Radar, AlertTriangle, Lightbulb, FileSearch, Map, TrendingDown, Bot,
  Telescope, Plug, CheckCircle2, ArrowRight, ListChecks, KeyRound, Compass,
} from 'lucide-react';
import { runSearchIntel } from '@/lib/growth/search-intelligence';
import { providerStatuses } from '@/lib/growth/link-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, Badge, DataSourceBadge } from '../_components/ui';
import { ScoreTile, accent, SeverityBadge, BandBadge, Pill } from './_ui';
import { RunScanButton } from './RunScanButton';

export const metadata: Metadata = { title: 'Search Intelligence | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const BASE = '/admin/growth/search';

export default function SearchIntelligenceCommandCenter() {
  const r = runSearchIntel();
  const providers = providerStatuses();

  const topActions = r.actions.slice(0, 10);
  const topOpps = r.opportunities.slice(0, 6);
  const blockers = r.issues.filter((i) => i.severity === 'critical' || i.severity === 'high').slice(0, 8);
  const sitemapRisks = r.sitemap.entries.filter((e) => e.flag !== 'ok').slice(0, 8);
  const workOn = [...r.pages]
    .filter((p) => p.pageType !== 'legal')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 8);
  const decay = r.decay.slice(0, 6);
  const weakAeo = r.link.aiSearch.slice(0, 5);
  const competitorGaps = r.link.competitorGaps.slice(0, 4);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Radar}
        title="Search Intelligence"
        description="Visibility Command Center — what to fix, create, and link today, ranked by business impact."
      >
        <RunScanButton />
      </ModuleHeader>

      {/* Honesty banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200/90">
        <p className="font-semibold text-amber-300">What&apos;s real vs. what needs a connection</p>
        <p className="mt-1 text-xs leading-relaxed">
          The technical audit, page intelligence, internal-link health, sitemap analysis and AEO readiness are{' '}
          <strong>computed live from your real pages</strong>. Keyword volume/difficulty are{' '}
          <strong>relative estimates</strong> and backlink authority is a <strong>curated white-hat proxy</strong> until you
          connect Search Console / Ahrefs / Semrush — every value is labeled, never faked. SearchIntelligenceOS{' '}
          <strong>never publishes content or changes canonicals/sitemap without your approval</strong>.
        </p>
      </div>

      {/* Score battery */}
      <SectionCard title={`Visibility scores — overall ${r.scores.searchHealth.score}/100`} icon={Compass}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <ScoreTile label="Search health" breakdown={r.scores.searchHealth} />
          <ScoreTile label="Technical" breakdown={r.scores.technical} />
          <ScoreTile label="Indexability" breakdown={r.scores.indexability} />
          <ScoreTile label="Content authority" breakdown={r.scores.contentAuthority} />
          <ScoreTile label="Internal linking" breakdown={r.scores.internalLinking} />
          <ScoreTile label="Keyword opportunity" breakdown={r.scores.keywordOpportunity} />
          <ScoreTile label="AEO readiness" breakdown={r.scores.aeoReadiness} />
          <ScoreTile label="Backlink authority" breakdown={r.scores.backlinkAuthority} />
          <ScoreTile label="Growth momentum" breakdown={r.scores.growthMomentum} />
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-3.5 flex flex-col justify-center">
            <p className="text-[11px] text-gray-500">Scan summary</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-snug">
              {r.run.pagesAnalyzed} pages · {r.run.issuesFound} issues · {r.run.opportunitiesFound} opportunities
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Top actions */}
      <SectionCard
        title="Today's prioritized actions"
        icon={ListChecks}
        action={<Link href="#" className="text-xs text-gray-600">Impact × Confidence × Urgency × Value ÷ Effort</Link>}
      >
        {topActions.length === 0 ? (
          <p className="text-sm text-gray-500">No actions — your search posture is healthy. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {topActions.map((a) => (
              <li key={a.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.whyItMatters}</p>
                  </div>
                  <BandBadge band={a.band} score={a.priorityScore} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill>{humanize(a.category)}</Pill>
                  {a.canClaudeImplement ? <Pill tone="green"><Bot className="w-2.5 h-2.5" /> Claude can implement</Pill> : null}
                  {a.requiresApproval ? <Pill tone="amber">needs approval</Pill> : null}
                  {a.relatedUrl ? (
                    <Link href={`${BASE}/page-intel?url=${encodeURIComponent(a.relatedUrl)}`} className="text-[11px] text-green-400 hover:text-green-300 font-mono truncate">
                      {a.relatedUrl}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Highest-impact opportunities */}
        <SectionCard title="Highest-impact content opportunities" icon={Lightbulb} action={<Link href={`${BASE}/opportunities`} className="text-xs text-green-400 hover:text-green-300">Open →</Link>}>
          {topOpps.length === 0 ? <p className="text-sm text-gray-500">No gaps detected.</p> : (
            <ul className="space-y-2">
              {topOpps.map((o) => (
                <li key={o.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-200 min-w-0 truncate">{o.title}</p>
                    <Badge className={`bg-gray-800 border-gray-700 ${accent(o.priorityScore)}`}>{o.priorityScore}</Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 font-mono truncate">/{o.proposedSlug}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Technical blockers */}
        <SectionCard title="Technical blockers" icon={AlertTriangle} action={<Link href={`${BASE}/audit`} className="text-xs text-green-400 hover:text-green-300">Site Audit →</Link>}>
          {blockers.length === 0 ? <p className="text-sm text-gray-500">No critical/high issues. 🎉</p> : (
            <ul className="space-y-2">
              {blockers.map((i) => (
                <li key={i.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-200 min-w-0">{i.title}</p>
                    <SeverityBadge severity={i.severity} />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{i.url ?? `${i.affectedUrls.length} pages`}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Sitemap / indexing risks */}
        <SectionCard title="Sitemap & indexing risks" icon={Map} action={<Link href={`${BASE}/sitemap`} className="text-xs text-green-400 hover:text-green-300">Open →</Link>}>
          {sitemapRisks.length === 0 ? <p className="text-sm text-gray-500">Sitemap is clean. 🎉</p> : (
            <ul className="space-y-2">
              {sitemapRisks.map((e) => (
                <li key={e.url} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
                  <span className="text-xs font-mono text-gray-300 truncate">{e.url}</span>
                  <Badge className="text-amber-400 bg-amber-400/10 border-amber-400/30">{humanize(e.flag)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Pages to work on */}
        <SectionCard title="Pages to work on next" icon={FileSearch} action={<Link href={`${BASE}/explorer`} className="text-xs text-green-400 hover:text-green-300">Site Explorer →</Link>}>
          <ul className="space-y-1.5">
            {workOn.map((p) => (
              <li key={p.url}>
                <Link href={`${BASE}/page-intel?url=${encodeURIComponent(p.url)}`} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2 hover:border-gray-700">
                  <span className="text-xs font-mono text-gray-300 truncate">{p.url}</span>
                  <span className="text-[11px] text-gray-500 shrink-0">P{p.priorityScore} · Q{p.qualityScore}</span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Decay risks */}
        <SectionCard title="Content decay risk" icon={TrendingDown}>
          {decay.length === 0 ? <p className="text-sm text-gray-500">No structural decay risk detected.</p> : (
            <ul className="space-y-2">
              {decay.map((d) => (
                <li key={d.url} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-200 min-w-0 truncate">{d.title}</p>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Badge className="text-amber-400 bg-amber-400/10 border-amber-400/30">{d.riskScore}</Badge>
                      <DataSourceBadge source={d.dataSource} />
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{d.reasons.map((x) => x.replace(/-/g, ' ')).join(' · ')}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* AEO readiness (reused) */}
        <SectionCard title="AI-search (AEO/GEO) readiness" icon={Bot} action={<Link href="/admin/growth/link-intelligence" className="text-xs text-green-400 hover:text-green-300">Link Intelligence →</Link>}>
          <ul className="space-y-2">
            {weakAeo.map((a) => (
              <li key={a.url} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-200 min-w-0 truncate">{a.title}</p>
                  <Badge className={`bg-gray-800 border-gray-700 ${accent(a.score)}`}>{a.score}</Badge>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">{a.recommendations[0]}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Competitor gaps (reused) */}
      <SectionCard title="Competitor link gaps" icon={Telescope} action={<Link href="/admin/growth/market-intel" className="text-xs text-green-400 hover:text-green-300">Market Intel →</Link>}>
        <div className="grid sm:grid-cols-2 gap-2">
          {competitorGaps.map((g) => (
            <div key={g.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
              <p className="text-sm text-gray-200">{g.competitor}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.recommendedAction}</p>
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
                {p.connected ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Plug className="w-3.5 h-3.5 text-gray-600" />}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{p.connected ? 'Connected' : `Set ${p.envVars[0]}`}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Sub-navigation footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <ArrowRight className="w-3.5 h-3.5" />
        <Link href={`${BASE}/explorer`} className="hover:text-green-300 flex items-center gap-1"><FileSearch className="w-3 h-3" /> Site Explorer</Link>
        <Link href={`${BASE}/audit`} className="hover:text-green-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Site Audit</Link>
        <Link href={`${BASE}/keywords`} className="hover:text-green-300 flex items-center gap-1"><KeyRound className="w-3 h-3" /> Keywords</Link>
        <Link href={`${BASE}/opportunities`} className="hover:text-green-300 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Opportunities</Link>
        <Link href={`${BASE}/sitemap`} className="hover:text-green-300 flex items-center gap-1"><Map className="w-3 h-3" /> Sitemap</Link>
        <Link href={`${BASE}/briefs`} className="hover:text-green-300 flex items-center gap-1"><FileSearch className="w-3 h-3" /> Brief Generator</Link>
      </div>
    </div>
  );
}
