// ============================================================
// /admin/content/generated-fixes — AI fix-page review queue
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { SEO_PAGES } from '@/content/seoPages';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { GeneratedFixesClient } from './GeneratedFixesClient';

export const metadata: Metadata = { title: 'Generated Fixes | Admin', robots: 'noindex, nofollow' };

export default function GeneratedFixesPage() {
  // Real existing keywords/slugs power the duplication score.
  const existingKeywords = [
    ...SEO_PAGES.map((p) => p.keyword),
    ...SEO_PAGES.map((p) => p.slug.replace(/[/-]/g, ' ')),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/content" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Content
      </Link>
      <PageHeader
        title="Generated Fix Pages"
        icon={Wand2}
        description="The review queue for repair/fix/tutorial pages proposed from user searches or AI-detected issues. Everything is scored against a relevance gate first, so irrelevant, duplicate, thin or unsafe pages never go live automatically."
      />

      <GeneratedFixesClient existingKeywords={existingKeywords} />

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A safety gate between &ldquo;an idea for a
          page&rdquo; and &ldquo;a published page.&rdquo; Each candidate is scored for relevance, quality,
          duplication, SEO opportunity and safety, and the gate recommends approve / review / reject.
        </p>
        <p>
          <strong className="text-foreground">Why nothing auto-publishes.</strong> Approving here marks a
          candidate ready for the content pipeline — it never silently creates a live page. Unsafe or
          off-topic queries (e.g. medical advice, non-sport searches) are blocked by the gate.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Work the &ldquo;needs review&rdquo;
          items: approve strong, distinct opportunities; merge near-duplicates of existing pages; reject the
          rest. Duplication is checked against the live SEO catalog.
        </p>
      </HelpPanel>
    </div>
  );
}
