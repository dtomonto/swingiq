// ============================================================
// /admin/content — Content hub
// ------------------------------------------------------------
// Overview of every content surface, with real counts and links into
// the focused tools. Blog and SEO content live in code data files
// today; this hub is the operator's map of all of it.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText, Search, Trophy, Wand2, Share2, Clapperboard, ExternalLink, ArrowUpRight, Newspaper,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BLOG_POSTS } from '@/data/blog-posts';
import { SEO_PAGES } from '@/content/seoPages';
import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { sportShort } from '@/lib/admin/sports';
import { formatDate } from '@/lib/admin/format';

export const metadata: Metadata = { title: 'Content | Admin', robots: 'noindex, nofollow' };

interface Surface {
  label: string; href: string; icon: LucideIcon; desc: string; count?: number; external?: boolean;
}

export default function AdminContentPage() {
  const surfaces: Surface[] = [
    { label: 'Publishing', href: '/admin/updates', icon: Newspaper, desc: 'Publish changelog drafts (Updates & Dev Updates)' },
    { label: 'SEO / AEO / GEO', href: '/admin/seo', icon: Search, desc: 'Search & answer-engine pages', count: SEO_PAGES.length },
    { label: 'Generated Fixes', href: '/admin/content/generated-fixes', icon: Wand2, desc: 'AI fix-page review queue' },
    { label: 'Sports', href: '/admin/sports', icon: Trophy, desc: 'Per-sport analysis config', count: ALL_SPORTS_INCLUDING_GOLF.length },
    { label: 'Social Generator', href: '/admin/social', icon: Share2, desc: 'Posts from published content', external: true },
    { label: 'Video Studio', href: '/admin/video-studio', icon: Clapperboard, desc: 'AI video department', external: true },
  ];

  const recentBlog = [...BLOG_POSTS]
    .sort((a, b) => (b.publishDate ?? '').localeCompare(a.publishDate ?? ''))
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Content"
        icon={FileText}
        description="Your map of every content surface — blog, SEO pages, generated fixes, sport config, and the social/video tools. Counts are read live from the content catalog."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Blog posts" value={BLOG_POSTS.length} />
        <MetricStat label="SEO pages" value={SEO_PAGES.length} />
        <MetricStat label="Sports" value={ALL_SPORTS_INCLUDING_GOLF.length} />
        <MetricStat label="Published SEO" value={SEO_PAGES.filter((p) => p.publishStatus === 'published').length} tone="success" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {surfaces.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-border">
              <span className="rounded-lg bg-muted p-2 text-link"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  {s.label}
                  {s.external ? <ArrowUpRight className="h-3 w-3 text-muted-foreground/70" /> : null}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.desc}</span>
                {typeof s.count === 'number' && <span className="mt-1 block text-xs text-link/80">{s.count} items</span>}
              </span>
            </Link>
          );
        })}
      </div>

      <SectionCard title="Recent blog posts" description={`${BLOG_POSTS.length} total in the catalog.`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="pb-2 pr-3">Title</th><th className="pb-2 pr-3">Sport</th><th className="pb-2 pr-3">Category</th><th className="pb-2 pr-3">Date</th><th className="pb-2"></th></tr>
            </thead>
            <tbody className="text-foreground">
              {recentBlog.map((p) => (
                <tr key={p.slug} className="border-t border-border">
                  <td className="max-w-[18rem] truncate py-2 pr-3 text-foreground">{p.title}</td>
                  <td className="py-2 pr-3">{sportShort(p.sport === 'all' ? 'multi' : p.sport)}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.category}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.publishDate ? formatDate(p.publishDate) : '—'}</td>
                  <td className="py-2">
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-link hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The hub for everything SwingVantage
          publishes. Blog and SEO content currently live in versioned data files; this page is the single
          place to see counts and jump into each tool.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Review the generated-fix queue before
          pages go live, keep high-priority SEO pages published, and use the social/video tools to amplify new
          posts.
        </p>
      </HelpPanel>
    </div>
  );
}
