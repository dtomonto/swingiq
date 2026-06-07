// ============================================================
// Link Intelligence Agent — page inventory (REAL data)
// ------------------------------------------------------------
// Builds the canonical list of SwingVantage pages the agent reasons about,
// from the SAME real sources the sitemap uses:
//   • published programmatic SEO pages  (@/content/seoPages)
//   • the public video library          (@/lib/library)
//   • blog posts                        (@/data/blog-posts)
//   • hand-listed static routes         (mirrors app/sitemap.ts)
//
// Output is a PageNode[] with declared internal links extracted from each
// page's own data (relatedLinks, CTA, relatedSlugs). Structural links
// (nav/silo) are added later in link-graph.ts. Nothing is invented.
// ============================================================

import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import { getLibraryItems } from '@/lib/library';
import { learnPath } from '@/lib/library/seo';
import { BLOG_POSTS } from '@/data/blog-posts';
import { clusterForPage } from './clusters';
import type {
  PageNode, LinkEdge, PageType, LinkSport, LinkIntent, LinkFunnel,
} from './types';

/** Normalize any href to a clean site-relative path with a leading slash. */
export function normalizeUrl(href: string): string {
  if (!href) return '/';
  let path = href.trim();
  // strip origin
  path = path.replace(/^https?:\/\/[^/]+/i, '');
  // drop query + hash (a fragment links to the same page for graph purposes)
  path = path.split('#')[0].split('?')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  // strip trailing slash except root
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

/** Conversion / money pages — guardrails forbid auto-editing these. */
const SENSITIVE = new Set(['/', '/pricing', '/start', '/checkout', '/login', '/signup', '/dashboard']);

function isSensitive(url: string): boolean {
  return SENSITIVE.has(url) || url.startsWith('/checkout');
}

// ── Static routes (mirrors the hand-listed entries in app/sitemap.ts) ──
interface StaticDef {
  path: string;
  title: string;
  pageType: PageType;
  sport: LinkSport;
  priority: number;
}

const STATIC_PAGES: StaticDef[] = [
  { path: '/', title: 'SwingVantage — AI Swing Analysis', pageType: 'home', sport: 'multi', priority: 1 },
  // Sport hubs
  { path: '/golf-swing-analysis', title: 'Golf Swing Analysis', pageType: 'sport-hub', sport: 'golf', priority: 1 },
  { path: '/tennis-swing-analysis', title: 'Tennis Swing Analysis', pageType: 'sport-hub', sport: 'tennis', priority: 1 },
  { path: '/baseball-swing-analysis', title: 'Baseball Swing Analysis', pageType: 'sport-hub', sport: 'baseball', priority: 1 },
  { path: '/softball-swing-analysis', title: 'Softball Swing Analysis', pageType: 'sport-hub', sport: 'softball', priority: 1 },
  { path: '/softball-swing-analysis/slow-pitch', title: 'Slow-Pitch Softball Analysis', pageType: 'sport-hub', sport: 'softball', priority: 2 },
  { path: '/softball-swing-analysis/fast-pitch', title: 'Fast-Pitch Softball Analysis', pageType: 'sport-hub', sport: 'softball', priority: 2 },
  // Feature & informational
  { path: '/how-it-works', title: 'How It Works', pageType: 'feature', sport: 'multi', priority: 2 },
  { path: '/start', title: 'Get Started', pageType: 'feature', sport: 'multi', priority: 2 },
  { path: '/methodology', title: 'Methodology', pageType: 'feature', sport: 'multi', priority: 3 },
  { path: '/athlete-general-intelligence', title: 'Athlete General Intelligence', pageType: 'feature', sport: 'multi', priority: 3 },
  { path: '/features', title: 'Features', pageType: 'feature', sport: 'multi', priority: 2 },
  { path: '/faq', title: 'FAQ', pageType: 'faq', sport: 'multi', priority: 2 },
  { path: '/resources', title: 'Resources', pageType: 'other', sport: 'multi', priority: 3 },
  { path: '/glossary', title: 'Glossary', pageType: 'glossary', sport: 'multi', priority: 3 },
  { path: '/updates', title: 'Updates', pageType: 'other', sport: 'multi', priority: 4 },
  { path: '/parents', title: 'For Parents', pageType: 'partner', sport: 'multi', priority: 3 },
  { path: '/pricing', title: 'Pricing', pageType: 'other', sport: 'multi', priority: 2 },
  // Sample reports
  { path: '/sample-report', title: 'Sample Report', pageType: 'sample-report', sport: 'multi', priority: 3 },
  { path: '/sample-report/golf', title: 'Sample Report — Golf', pageType: 'sample-report', sport: 'golf', priority: 3 },
  { path: '/sample-report/baseball', title: 'Sample Report — Baseball', pageType: 'sample-report', sport: 'baseball', priority: 3 },
  { path: '/sample-report/slow-pitch', title: 'Sample Report — Slow-Pitch', pageType: 'sample-report', sport: 'softball', priority: 3 },
  { path: '/sample-report/fast-pitch', title: 'Sample Report — Fast-Pitch', pageType: 'sample-report', sport: 'softball', priority: 3 },
  { path: '/sample-report/softball', title: 'Sample Report — Softball', pageType: 'sample-report', sport: 'softball', priority: 3 },
  // About & trust
  { path: '/about', title: 'About', pageType: 'other', sport: 'multi', priority: 3 },
  { path: '/trust', title: 'Trust & Safety', pageType: 'other', sport: 'multi', priority: 4 },
  { path: '/privacy', title: 'Privacy Policy', pageType: 'legal', sport: 'multi', priority: 5 },
  { path: '/terms', title: 'Terms of Service', pageType: 'legal', sport: 'multi', priority: 5 },
  { path: '/vulnerability-disclosure', title: 'Vulnerability Disclosure', pageType: 'legal', sport: 'multi', priority: 5 },
  // Blog index + learn index
  { path: '/blog', title: 'Blog', pageType: 'blog', sport: 'multi', priority: 2 },
  { path: '/learn', title: 'Video Library', pageType: 'video', sport: 'multi', priority: 3 },
  // Benchmarks
  { path: '/benchmarks', title: 'Benchmarks', pageType: 'benchmark', sport: 'multi', priority: 3 },
  { path: '/benchmarks/golf', title: 'Golf Benchmarks', pageType: 'benchmark', sport: 'golf', priority: 3 },
  { path: '/benchmarks/tennis', title: 'Tennis Benchmarks', pageType: 'benchmark', sport: 'tennis', priority: 3 },
  { path: '/benchmarks/pickleball', title: 'Pickleball Benchmarks', pageType: 'benchmark', sport: 'pickleball', priority: 3 },
  { path: '/benchmarks/padel', title: 'Padel Benchmarks', pageType: 'benchmark', sport: 'padel', priority: 3 },
  { path: '/benchmarks/baseball', title: 'Baseball Benchmarks', pageType: 'benchmark', sport: 'baseball', priority: 3 },
  { path: '/benchmarks/softball', title: 'Softball Benchmarks', pageType: 'benchmark', sport: 'softball', priority: 3 },
  // Free tools
  { path: '/tools', title: 'Free Tools', pageType: 'tool', sport: 'multi', priority: 2 },
  { path: '/tools/golf-slice-fixer', title: 'Golf Slice Fixer', pageType: 'tool', sport: 'golf', priority: 2 },
  { path: '/tools/swing-mistake-quiz', title: 'Swing Mistake Quiz', pageType: 'tool', sport: 'multi', priority: 3 },
  { path: '/tools/at-home-swing-drill-generator', title: 'At-Home Swing Drill Generator', pageType: 'tool', sport: 'multi', priority: 3 },
  { path: '/tools/practice-plan-generator', title: 'Practice Plan Generator', pageType: 'tool', sport: 'multi', priority: 3 },
  { path: '/tools/private-lesson-savings-calculator', title: 'Private Lesson Savings Calculator', pageType: 'tool', sport: 'multi', priority: 3 },
  { path: '/tools/slow-pitch-line-drive-guide', title: 'Slow-Pitch Line Drive Guide', pageType: 'tool', sport: 'softball', priority: 3 },
  { path: '/tools/equipment-diagnostic', title: 'Equipment Diagnostic', pageType: 'tool', sport: 'multi', priority: 3 },
  // Partner / audience
  { path: '/coaches', title: 'For Coaches', pageType: 'partner', sport: 'multi', priority: 2 },
  { path: '/creators', title: 'For Creators', pageType: 'partner', sport: 'multi', priority: 3 },
  { path: '/teams', title: 'For Teams', pageType: 'partner', sport: 'multi', priority: 3 },
  { path: '/partners', title: 'Partners', pageType: 'partner', sport: 'multi', priority: 3 },
  // Challenges
  { path: '/challenges', title: 'Challenges', pageType: 'challenge', sport: 'multi', priority: 3 },
  { path: '/challenges/7-day-golf-slice', title: '7-Day Golf Slice Challenge', pageType: 'challenge', sport: 'golf', priority: 3 },
  { path: '/challenges/7-day-slow-pitch-line-drive', title: '7-Day Slow-Pitch Line Drive Challenge', pageType: 'challenge', sport: 'softball', priority: 3 },
  { path: '/challenges/30-day-swingiq', title: '30-Day SwingVantage Challenge', pageType: 'challenge', sport: 'multi', priority: 3 },
];

function blogSport(s: string): LinkSport {
  return (['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball'].includes(s) ? s : 'multi') as LinkSport;
}

function baseNode(partial: Omit<PageNode, 'inboundCount' | 'outboundCount' | 'depth'>): PageNode {
  return { ...partial, inboundCount: 0, outboundCount: 0, depth: Number.POSITIVE_INFINITY };
}

/** Build the full, deduplicated page inventory (REAL pages only). */
export function buildInventory(): PageNode[] {
  const byUrl = new Map<string, PageNode>();
  const add = (node: PageNode) => {
    if (!byUrl.has(node.url)) byUrl.set(node.url, node);
  };

  // 1) Static routes
  for (const s of STATIC_PAGES) {
    add(baseNode({
      url: s.path,
      title: s.title,
      pageType: s.pageType,
      sport: s.sport,
      cluster: clusterForPage(s.sport, `${s.title} ${s.path}`),
      priority: s.priority,
      outboundLinks: [],
      source: 'static',
      sensitive: isSensitive(s.path),
    }));
  }

  // 2) Programmatic SEO pages (published only) — rich, with declared links
  for (const p of PUBLISHED_SEO_PAGES) {
    const url = normalizeUrl(p.slug);
    const outbound: LinkEdge[] = [
      ...(p.relatedLinks ?? []).map((l) => ({ from: url, to: normalizeUrl(l.href), anchor: l.label })),
    ];
    if (p.cta?.href) outbound.push({ from: url, to: normalizeUrl(p.cta.href), anchor: p.cta.label });
    add(baseNode({
      url,
      title: p.title,
      pageType: 'seo-programmatic',
      sport: p.sport as LinkSport,
      cluster: clusterForPage(p.sport as LinkSport, `${p.keyword} ${p.slug} ${p.title}`),
      keyword: p.keyword,
      intent: p.intent as LinkIntent,
      funnelStage: p.funnelStage as LinkFunnel,
      priority: p.priority,
      outboundLinks: outbound,
      source: 'seo-catalog',
      sensitive: false,
    }));
  }

  // 3) Blog posts — declared via relatedSlugs
  for (const b of BLOG_POSTS) {
    const url = `/blog/${b.slug}`;
    const outbound: LinkEdge[] = (b.relatedSlugs ?? []).map((slug) => ({
      from: url, to: `/blog/${slug}`, anchor: slug.replace(/-/g, ' '),
    }));
    add(baseNode({
      url,
      title: b.title,
      pageType: 'blog',
      sport: blogSport(b.sport),
      cluster: clusterForPage(blogSport(b.sport), `${b.title} ${b.tags.join(' ')} ${b.slug}`),
      keyword: b.tags[0],
      intent: 'informational',
      funnelStage: 'consideration',
      priority: 3,
      outboundLinks: outbound,
      source: 'blog',
      sensitive: false,
    }));
  }

  // 4) Public video library (feature walkthroughs + training)
  for (const item of getLibraryItems()) {
    const url = normalizeUrl(learnPath(item));
    const sport = (item.sport === 'all' ? 'multi' : item.sport) as LinkSport;
    add(baseNode({
      url,
      title: item.title,
      pageType: 'video',
      sport,
      cluster: clusterForPage(sport, `${item.title} ${item.description}`),
      keyword: item.title,
      intent: 'informational',
      funnelStage: 'awareness',
      priority: 4,
      outboundLinks: [],
      source: 'library',
      sensitive: false,
    }));
  }

  return Array.from(byUrl.values());
}
