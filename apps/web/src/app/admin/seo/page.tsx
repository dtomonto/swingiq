// ============================================================
// /admin/seo — SEO / AEO / GEO Command Center
// ------------------------------------------------------------
// Reads the static SEO_PAGES catalog. Structural signals (schema,
// FAQs, direct answers, publish status) are REAL and computed here.
// Live ranking/impression data needs Search Console — we say so
// honestly rather than inventing numbers.
// ============================================================

import type { Metadata } from 'next';
import { Search, ExternalLink } from 'lucide-react';
import { SEO_PAGES } from '@/content/seoPages';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { SeoTable, type SeoRow } from './SeoTable';

export const metadata: Metadata = { title: 'SEO / AEO / GEO | Admin', robots: 'noindex, nofollow' };

export default function AdminSeoPage() {
  const rows: SeoRow[] = SEO_PAGES.map((p) => ({
    slug: p.slug,
    keyword: p.keyword,
    sport: p.sport,
    intent: p.intent,
    funnelStage: p.funnelStage,
    priority: p.priority,
    schemaType: p.schemaType,
    published: p.publishStatus === 'published',
    faqCount: p.faqs?.length ?? 0,
    answerReady: Boolean(p.directAnswer?.trim()) && (p.faqs?.length ?? 0) > 0,
  }));

  const published = rows.filter((r) => r.published).length;
  const answerReady = rows.filter((r) => r.answerReady).length;
  const highPriority = rows.filter((r) => r.priority <= 2).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="SEO / AEO / GEO"
        icon={Search}
        description="How SwingVantage shows up in Google and AI answer engines. Structure (schema, FAQs, direct answers) is scored here from the live content; rankings and clicks come from Search Console once connected."
        actions={
          <a
            href="/sitemap.xml" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            Sitemap <ExternalLink className="h-3 w-3" />
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="SEO pages" value={rows.length} />
        <MetricStat label="Published" value={published} tone="success" />
        <MetricStat label="Drafts" value={rows.length - published} tone={rows.length - published > 0 ? 'warning' : 'muted'} />
        <MetricStat label="AEO-ready" value={answerReady} hint="direct answer + FAQs" tone="success" />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-link">
        <Search className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {highPriority} high-priority (P1–P2) page{highPriority === 1 ? '' : 's'}. Live impressions, clicks and
          rankings require a Google Search Console connection — until then this page reflects on-page
          <strong> structure and readiness</strong>, which is what you control directly.
        </span>
      </div>

      <SectionCard>
        <SeoTable rows={rows} />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> Your content&apos;s search and
          answer-engine readiness. &ldquo;AEO-ready&rdquo; means a page leads with a direct answer and has FAQ
          structure — exactly what ChatGPT-style engines and Google&apos;s AI overviews quote.
        </p>
        <p>
          <strong className="text-foreground">What good looks like.</strong> High-priority keywords published,
          with schema and FAQs. Drafts and non-answer-ready pages are your work queue.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Open a page (View ↗) to read it as users
          do. To unlock rankings/clicks, connect Search Console; that integration would surface here.
        </p>
      </HelpPanel>
    </div>
  );
}
