// ============================================================
// SearchIntelligenceOS — Page Intelligence enrichment (§2.3)
// ------------------------------------------------------------
// Turns each node of the shared Link Intelligence graph into a rich PageIntel
// record by reading the SAME owned registries the site renders from:
//   • programmatic SEO guides  (@/content/seoPages)   — full metadata + body
//   • blog posts               (@/data/blog-posts)    — metadata + markdown
//   • public video library     (@/lib/library)        — title/description
//   • static routes            — title only (body not in a registry → labeled)
//
// Internal-link counts + crawl depth come from the graph. Indexability +
// sitemap membership come from the sitemap registry. Nothing is invented:
// fields we don't own are labeled, never guessed.
// ============================================================

import { PUBLISHED_SEO_PAGES, type SeoPage } from '@/content/seoPages';
import { BLOG_POSTS, effectiveBlogStatus, type BlogPost } from '@/data/blog-posts';
import { getLearnItems } from '@/lib/library';
import { learnPath } from '@/lib/library/seo';
import { normalizeUrl } from '../link-intelligence/inventory';
import type { LinkGraph, PageNode } from '../link-intelligence/types';
import { buildSitemapPathSet } from './sitemap-intel';
import { activeProject } from './projects';
import {
  scorePageQuality, scorePageBusinessValue, scorePagePriority,
} from './scoring';
import type { PageIntel, PagePublishStatus, DataSource } from './types';

/** Count words in a blob of plain text / markdown. */
function countWords(text: string): number {
  const cleaned = text.replace(/[#*_>`\-|]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.split(' ').length : 0;
}

/** Real word count for an owned SEO guide (sums every authored body field). */
function seoWordCount(p: SeoPage): number {
  const parts = [
    p.directAnswer,
    ...p.problemExplanation,
    ...p.diagnosisSteps,
    ...p.whatSwingVantageLooksFor,
    p.exampleDiagnosis ?? '',
    ...p.drills.flatMap((d) => [d.name, d.how]),
    ...p.mistakesToAvoid,
    p.whenToWorkWithCoach,
    ...p.faqs.flatMap((f) => [f.question, f.answer]),
    p.safetyNotes,
  ];
  return countWords(parts.join(' '));
}

/**
 * Enrich every page in the graph with owned metadata + indexability + scores.
 * The `graph` carries inbound/outbound counts + BFS depth already.
 */
export function buildPageIntel(graph: LinkGraph): PageIntel[] {
  const project = activeProject();
  const sitemapSet = buildSitemapPathSet();

  const seoByUrl = new Map<string, SeoPage>(
    PUBLISHED_SEO_PAGES.map((p) => [normalizeUrl(`/${p.slug}`), p]),
  );
  const blogByUrl = new Map<string, BlogPost>(
    BLOG_POSTS.map((b) => [normalizeUrl(`/blog/${b.slug}`), b]),
  );
  const learnByUrl = new Map<string, ReturnType<typeof getLearnItems>[number]>(
    getLearnItems().map((i) => [normalizeUrl(learnPath(i)), i]),
  );

  return graph.nodes.map((node) => enrich(node, { project, sitemapSet, seoByUrl, blogByUrl, learnByUrl }));
}

interface EnrichCtx {
  project: ReturnType<typeof activeProject>;
  sitemapSet: Set<string>;
  seoByUrl: Map<string, SeoPage>;
  blogByUrl: Map<string, BlogPost>;
  learnByUrl: Map<string, ReturnType<typeof getLearnItems>[number]>;
}

function enrich(node: PageNode, ctx: EnrichCtx): PageIntel {
  const url = normalizeUrl(node.url);
  const seo = ctx.seoByUrl.get(url);
  const blog = ctx.blogByUrl.get(url);
  const learn = ctx.learnByUrl.get(url);

  let metaTitle = node.title;
  let metaDescription: string | null = null;
  let wordCount: number | null = null;
  let wordCountSource: DataSource = 'estimated';
  let schemaTypes: string[] = [];
  let hasDirectAnswer = false;
  let faqCount = 0;
  let publishStatus: PagePublishStatus = 'unknown';
  let lastModified: string | null = null;
  let rowSource: DataSource = 'estimated';

  if (seo) {
    metaTitle = seo.title;
    metaDescription = seo.metaDescription;
    wordCount = seoWordCount(seo);
    wordCountSource = 'real';
    schemaTypes = [seo.schemaType];
    hasDirectAnswer = Boolean(seo.directAnswer?.trim());
    faqCount = seo.faqs.length;
    publishStatus = 'published';
    rowSource = 'real';
  } else if (blog) {
    metaTitle = blog.metaTitle || blog.title;
    metaDescription = blog.metaDescription;
    wordCount = countWords(blog.content);
    wordCountSource = 'real';
    schemaTypes = ['Article'];
    hasDirectAnswer = false;
    faqCount = 0;
    publishStatus = effectiveBlogStatus(blog) === 'published' ? 'published' : 'draft';
    lastModified = blog.publishDate ?? null;
    rowSource = 'real';
  } else if (learn) {
    metaTitle = learn.title;
    metaDescription = learn.description ?? null;
    schemaTypes = learn.hasRecording ? ['VideoObject'] : [];
    publishStatus = 'published';
    rowSource = 'real';
  } else {
    // Static route: we own the title but the body isn't in a registry.
    publishStatus = 'unknown';
    rowSource = 'estimated';
  }

  // Indexability: the inventory only contains public, intended-to-index pages.
  const indexable = true;
  const robots = 'index, follow';
  const inSitemap = ctx.sitemapSet.has(url);
  const isOrphan = !Number.isFinite(node.depth);

  const quality = scorePageQuality({
    wordCount,
    hasDirectAnswer,
    faqCount,
    schemaCount: schemaTypes.length,
    hasMetaDescription: Boolean(metaDescription && metaDescription.trim()),
    pageType: node.pageType,
  });
  const businessValue = scorePageBusinessValue({
    pageType: node.pageType,
    intent: node.intent,
    funnelStage: node.funnelStage,
    sport: node.sport,
    priority: node.priority,
  });
  const priority = scorePagePriority({
    qualityScore: quality.score,
    businessValueScore: businessValue.score,
    internalLinksIn: node.inboundCount,
    depth: node.depth,
    isOrphan,
  });

  return {
    url,
    title: node.title,
    pageType: node.pageType,
    sport: node.sport,
    cluster: node.cluster,
    source: node.source,
    metaTitle,
    metaTitleLength: metaTitle.length,
    metaDescription,
    metaDescriptionLength: metaDescription ? metaDescription.length : null,
    keyword: node.keyword,
    intent: node.intent,
    funnelStage: node.funnelStage,
    wordCount,
    wordCountSource,
    schemaTypes,
    hasDirectAnswer,
    faqCount,
    indexable,
    robots,
    inSitemap,
    canonicalUrl: `${ctx.project.canonicalBaseUrl}${url === '/' ? '' : url}`,
    publishStatus,
    lastModified,
    internalLinksIn: node.inboundCount,
    internalLinksOut: node.outboundCount,
    depth: node.depth,
    isOrphan,
    qualityScore: quality.score,
    priorityScore: priority.score,
    businessValueScore: businessValue.score,
    dataSource: rowSource,
  };
}

/** Find one enriched page by URL (used by the Page Intelligence view). */
export function findPageIntel(pages: PageIntel[], url: string): PageIntel | undefined {
  const target = normalizeUrl(url);
  return pages.find((p) => p.url === target);
}
