// ============================================================
// /admin/data-quality — Data Quality
// ------------------------------------------------------------
// A read-only, keyless data-hygiene board. Runs deterministic checks
// over the real SEO content registry (duplicate slugs/titles/meta/
// keywords, length problems, thin content, slug↔sport mismatches,
// missing CTAs) and shows findings — and passing checks — honestly,
// each linking to the tool that fixes it.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck, AlertTriangle, AlertCircle, Info, CheckCircle2, Database,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { SEO_PAGES } from '@/content/seoPages';
import { runDataQualityReport, type DqSeverity, type SeoPageLike } from '@/lib/admin/data-quality/checks';

export const metadata: Metadata = { title: 'Data Quality | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SEVERITY_TONE: Record<DqSeverity, BadgeTone> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
};

export default function AdminDataQualityPage() {
  // Map the rich SeoPage into the minimal shape the checks need (decoupled).
  const pages: SeoPageLike[] = SEO_PAGES.map((p) => ({
    slug: p.slug,
    sport: p.sport,
    keyword: p.keyword,
    title: p.title,
    metaDescription: p.metaDescription,
    directAnswer: p.directAnswer,
    problemExplanation: p.problemExplanation,
    drills: p.drills,
    faqs: p.faqs,
    cta: p.cta,
    publishStatus: p.publishStatus,
  }));

  const report = runDataQualityReport(pages);
  const withIssues = report.categories.filter((c) => c.issues.length > 0);
  const clean = report.categories.filter((c) => c.issues.length === 0);
  const healthy = report.totals.issues === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data Quality"
        icon={ShieldCheck}
        description="Automated hygiene checks over your content registry — duplicate slugs, titles, meta descriptions and keywords; length problems; thin content; mis-tagged sports; missing CTAs. Every finding is computed from real data and links to the tool that fixes it. Read-only."
        actions={
          <StatusBadge tone={healthy ? 'success' : report.totals.critical > 0 ? 'danger' : 'warning'}>
            {healthy ? 'All checks pass' : `${report.totals.issues} issue${report.totals.issues === 1 ? '' : 's'}`}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricStat label="Pages scanned" icon={Database} value={String(report.scanned)} hint="SEO content registry" />
        <MetricStat label="Critical" icon={AlertCircle} tone={report.totals.critical > 0 ? 'default' : 'muted'} value={String(report.totals.critical)} hint="routing/breakage" />
        <MetricStat label="Warnings" icon={AlertTriangle} tone={report.totals.warning > 0 ? 'default' : 'muted'} value={String(report.totals.warning)} hint="SEO/quality" />
        <MetricStat label="Info" icon={Info} tone={report.totals.info > 0 ? 'default' : 'muted'} value={String(report.totals.info)} hint="polish" />
        <MetricStat label="Checks passing" icon={CheckCircle2} value={`${report.totals.cleanChecks}/${report.categories.length}`} hint="green checks" />
      </div>

      {withIssues.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Needs attention</h2>
          {withIssues.map((c) => (
            <SectionCard
              key={c.id}
              title={
                <span className="flex items-center gap-2">
                  {c.label}
                  <StatusBadge tone={SEVERITY_TONE[c.severity]}>{c.severity}</StatusBadge>
                  <span className="text-xs font-normal text-gray-500">{c.issues.length}</span>
                </span>
              }
              description={c.description}
              actions={
                <Link href={c.href} className="text-xs text-amber-400 hover:underline">
                  Fix →
                </Link>
              }
            >
              <ul className="divide-y divide-gray-800/70 text-sm">
                {c.issues.slice(0, 25).map((issue) => (
                  <li key={issue.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-3">
                    <code className="shrink-0 text-xs text-amber-300/90">{issue.entity}</code>
                    <span className="text-gray-400">{issue.detail}</span>
                  </li>
                ))}
                {c.issues.length > 25 && (
                  <li className="py-2 text-xs text-gray-500">+ {c.issues.length - 25} more…</li>
                )}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                <span className="text-gray-400">How to fix:</span> {c.fix}
              </p>
            </SectionCard>
          ))}
        </section>
      ) : (
        <SectionCard>
          <p className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Every data-quality check passed across {report.scanned} pages. Nice and clean.
          </p>
        </SectionCard>
      )}

      {clean.length > 0 && (
        <SectionCard title="Passing checks" description="Checks currently with zero findings.">
          <div className="flex flex-wrap gap-2">
            {clean.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs text-emerald-300/90">
                <CheckCircle2 className="h-3 w-3" />
                {c.label}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A keyless, deterministic auditor that
          keeps your content clean as it scales. It scans the SEO content registry on each load and reports
          exactly what it finds — no guessing, and passing checks are shown too so you can trust the green.
        </p>
        <p>
          <strong className="text-gray-300">Related CI gates.</strong> Two scripts run the same spirit of
          check in CI and on commit: <code>scripts/check-sitemap-coverage.mjs</code> flags public pages
          missing from the sitemap, and the duplicate-content gate flags near-duplicate titles/descriptions.
          This board surfaces the registry-level issues in-app between those runs.
        </p>
        <p>
          <strong className="text-gray-300">What to do next.</strong> Work the <em>critical</em> findings
          first (they can break routing), then warnings (SEO/quality), then info (polish). Each card links to{' '}
          <Link href="/admin/seo">SEO</Link>, <Link href="/admin/content">Content</Link> or{' '}
          <Link href="/admin/sports">Sports</Link> where the fix lives.
        </p>
      </HelpPanel>
    </div>
  );
}
