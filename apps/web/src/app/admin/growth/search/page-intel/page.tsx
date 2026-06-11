// ============================================================
// /admin/growth/search/page-intel — Page Intelligence (§2.3)
// ------------------------------------------------------------
// A dedicated per-URL deep dive: current metadata, indexability, schema, link
// graph, content signals, the issues affecting this page, suggested
// improvements (metadata / schema / internal links / AEO), and copy-paste
// Claude Code implementation prompts. Reads ?url= from the query string.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText, ArrowLeft, ExternalLink, AlertTriangle, Link2, Bot, Sparkles, Lightbulb,
} from 'lucide-react';
import { runSearchIntel, findPageIntel } from '@/lib/growth/search-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, KpiCard, FieldRow, EmptyState, DataSourceBadge } from '../../_components/ui';
import { accent, SeverityBadge } from '../_ui';

export const metadata: Metadata = { title: 'Page Intelligence | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function PageIntelView({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  const r = runSearchIntel();
  const page = url ? findPageIntel(r.pages, url) : undefined;

  if (!page) {
    return (
      <div className="space-y-6">
        <ModuleHeader icon={FileText} title="Page Intelligence" description="Per-URL deep dive.">
          <Link href="/admin/growth/search/explorer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Site Explorer</Link>
        </ModuleHeader>
        <EmptyState
          icon={FileText}
          title={url ? 'Page not found in the inventory' : 'No page selected'}
          description={url ? `“${url}” isn’t in the current crawl inventory.` : 'Open a page from the Site Explorer or Command Center to see its intelligence.'}
          action={<Link href="/admin/growth/search/explorer" className="text-sm text-success-text hover:text-success-text">Open Site Explorer →</Link>}
        />
      </div>
    );
  }

  const pageIssues = r.issues.filter((i) => i.affectedUrls.includes(page.url)).sort((a, b) => b.priorityScore - a.priorityScore);
  const linksInto = r.link.recommendations.filter((x) => x.destinationUrl === page.url).slice(0, 6);
  const linksFrom = r.link.recommendations.filter((x) => x.sourceUrl === page.url).slice(0, 6);
  const aeo = r.link.aiSearch.find((a) => a.url === page.url);
  const claudeTasks = buildClaudeTasks(page.url, pageIssues);

  return (
    <div className="space-y-6">
      <ModuleHeader icon={FileText} title="Page Intelligence" description={page.title}>
        <div className="flex items-center gap-2">
          <a href={page.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ExternalLink className="w-4 h-4" /> Open</a>
          <Link href="/admin/growth/search/explorer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Explorer</Link>
        </div>
      </ModuleHeader>

      <p className="font-mono text-xs text-success-text">{page.url}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Priority" value={page.priorityScore} accent={accent(page.priorityScore)} source="real" sublabel="work-on-next" />
        <KpiCard label="Content quality" value={page.qualityScore} accent={accent(page.qualityScore)} source="real" />
        <KpiCard label="Business value" value={page.businessValueScore} accent={accent(page.businessValueScore)} source="real" />
        <KpiCard label="Internal links in" value={page.internalLinksIn} accent={page.isOrphan ? 'text-error-text' : 'text-foreground'} source="real" sublabel={page.isOrphan ? 'orphan' : `depth ${page.depth}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Current state */}
        <SectionCard title="Current metadata & indexing" icon={FileText}>
          <dl>
            <FieldRow label="Title"><span className="text-foreground">{page.metaTitle}</span> <span className="text-muted-foreground/70">({page.metaTitleLength} chars)</span></FieldRow>
            <FieldRow label="Description">{page.metaDescription ? <><span className="text-foreground">{page.metaDescription}</span> <span className="text-muted-foreground/70">({page.metaDescriptionLength} chars)</span></> : <span className="text-link">Not in registry</span>}</FieldRow>
            <FieldRow label="Canonical"><span className="font-mono text-[11px]">{page.canonicalUrl}</span></FieldRow>
            <FieldRow label="Indexable">{page.indexable ? 'Yes' : 'No'} · {page.robots}</FieldRow>
            <FieldRow label="In sitemap">{page.inSitemap ? <span className="text-success-text">Yes</span> : <span className="text-link">No</span>}</FieldRow>
            <FieldRow label="Schema">{page.schemaTypes.length ? page.schemaTypes.join(', ') : <span className="text-link">None</span>}</FieldRow>
            <FieldRow label="Word count">{page.wordCount ?? <span className="text-muted-foreground">— (not in registry)</span>}</FieldRow>
            <FieldRow label="Direct answer">{page.hasDirectAnswer ? <span className="text-success-text">Yes</span> : <span className="text-link">No</span>} · {page.faqCount} FAQs</FieldRow>
            <FieldRow label="Cluster">{humanize(page.cluster)}</FieldRow>
            <FieldRow label="Keyword">{page.keyword ?? '—'}</FieldRow>
            <FieldRow label="Intent / funnel">{page.intent ? humanize(page.intent) : '—'} · {page.funnelStage ? humanize(page.funnelStage) : '—'}</FieldRow>
            <FieldRow label="Publish status">{humanize(page.publishStatus)}</FieldRow>
          </dl>
        </SectionCard>

        {/* Issues on this page */}
        <SectionCard title={`Issues on this page (${pageIssues.length})`} icon={AlertTriangle}>
          {pageIssues.length === 0 ? <p className="text-sm text-muted-foreground">No issues detected. 🎉</p> : (
            <ul className="space-y-2">
              {pageIssues.map((i) => (
                <li key={i.id} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground">{i.title}</p>
                    <SeverityBadge severity={i.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{i.recommendedFix}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Internal link suggestions */}
        <SectionCard title="Internal-link suggestions" icon={Link2} action={<Link href="/admin/growth/internal-links" className="text-xs text-success-text hover:text-success-text">Internal Links →</Link>}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1">Pages that should link here</p>
          {linksInto.length === 0 ? <p className="text-xs text-muted-foreground mb-3">None pending.</p> : (
            <ul className="space-y-1 mb-3">
              {linksInto.map((l) => <li key={l.id} className="text-xs text-foreground font-mono truncate">← {l.sourceUrl}</li>)}
            </ul>
          )}
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1">Links this page should add</p>
          {linksFrom.length === 0 ? <p className="text-xs text-muted-foreground">None pending.</p> : (
            <ul className="space-y-1">
              {linksFrom.map((l) => <li key={l.id} className="text-xs text-foreground font-mono truncate">→ {l.destinationUrl}</li>)}
            </ul>
          )}
        </SectionCard>

        {/* AEO readiness */}
        <SectionCard title="AI-search (AEO/GEO) readiness" icon={Bot}>
          {aeo ? (
            <>
              <p className={`text-2xl font-bold ${accent(aeo.score)}`}>{aeo.score}<span className="text-sm text-muted-foreground/70">/100</span></p>
              <ul className="mt-2 space-y-1">
                {aeo.recommendations.map((rec, i) => <li key={i} className="text-xs text-muted-foreground">• {rec}</li>)}
              </ul>
            </>
          ) : <p className="text-sm text-muted-foreground">No AEO analysis for this page type.</p>}
        </SectionCard>
      </div>

      {/* Suggested improvements */}
      <SectionCard title="Suggested improvements" icon={Lightbulb}>
        <ul className="grid sm:grid-cols-2 gap-2 text-xs text-foreground">
          {page.metaTitleLength > 60 || page.metaTitleLength < 30 ? <li>• Tune the title toward 30–60 characters with the keyword near the front.</li> : null}
          {!page.metaDescription || (page.metaDescriptionLength ?? 0) < 70 ? <li>• Write/expand the meta description to 70–160 chars with a benefit + CTA.</li> : null}
          {!page.hasDirectAnswer && page.source === 'seo-catalog' ? <li>• Add a 2–3 sentence direct-answer block at the top (AEO-ready).</li> : null}
          {page.faqCount === 0 && page.source === 'seo-catalog' ? <li>• Add 3–5 FAQs + FAQPage schema.</li> : null}
          {page.schemaTypes.length === 0 ? <li>• Declare the most fitting schema.org type (Article / HowTo / FAQPage).</li> : null}
          {page.wordCount !== null && page.wordCount < 400 ? <li>• Expand thin content with a worked example + drill how-to.</li> : null}
          {page.isOrphan ? <li>• Add a contextual inbound internal link (this page is an orphan).</li> : null}
          {!page.inSitemap ? <li>• Add this page to the sitemap registry so Google can discover it.</li> : null}
          <li>• <Link href={`/admin/growth/search/briefs?topic=${encodeURIComponent(page.keyword ?? page.title)}`} className="text-success-text hover:text-success-text inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> Generate a content brief</Link></li>
        </ul>
      </SectionCard>

      {/* Claude Code tasks */}
      {claudeTasks.length > 0 ? (
        <SectionCard title="Recommended Claude Code tasks" icon={Bot}>
          <ul className="space-y-2">
            {claudeTasks.map((t, i) => (
              <li key={i} className="rounded-lg border border-border bg-background p-3 font-mono text-[11px] text-foreground leading-relaxed">{t}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground/70">Copy a prompt into Claude Code. All public-content / canonical / sitemap changes still require admin approval before publishing.</p>
        </SectionCard>
      ) : null}

      <div className="flex justify-end"><DataSourceBadge source={page.dataSource} /></div>
    </div>
  );
}

function buildClaudeTasks(url: string, issues: { issueType: string; recommendedFix: string }[]): string[] {
  return issues.slice(0, 6).map((i) =>
    `Fix "${i.issueType}" on ${url}: ${i.recommendedFix} Show a before/after diff and wait for approval before publishing.`,
  );
}
