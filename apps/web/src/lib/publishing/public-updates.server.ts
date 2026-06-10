// ============================================================
// PublishingOS — override-aware public reads (SERVER-ONLY)
// ------------------------------------------------------------
// The seam that lets a durable PublishingOS publish decision actually change a
// public surface in production (where the filesystem is read-only). It merges
// the durable override map on top of each item's base visibility.
//
// ADDITIVE & SAFE: with no overrides (keyless default, or nothing toggled) each
// function returns exactly what the underlying getPublished*() returns today —
// a fully reversible wrapper. Cache freshness is handled by revalidatePath() in
// the publish API route (on-demand ISR).
//
// Surfaces wired here: /updates (product), /dev-updates, /blog. They mirror each
// other exactly; adding another surface = one base read + isPublic predicate.
// ============================================================

import { getAllUpdates, isPublicUpdate, type Update } from '@/data/updates';
import { getAllDevUpdates, isPublicDevUpdate, type DevUpdate } from '@/data/devUpdates';
import { devUpdateSlug } from '@/lib/updates/dev-detail';
import { BLOG_POSTS, isPublishedBlogPost, type BlogPost } from '@/data/blog-posts';
import { SEO_PAGES, effectiveSeoStatus, type SeoPage } from '@/content/seoPages';
import { getPublishOverrides } from './store';
import { applyOverrides, applyOverridesByKey } from './overrides';

/** Public updates with durable overrides applied, newest-first (pinned first). */
export async function getEffectivePublicUpdates(): Promise<Update[]> {
  const overrides = await getPublishOverrides('update');
  const effective = applyOverrides(getAllUpdates(), overrides, isPublicUpdate);
  return effective.sort((a, b) => {
    if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });
}

/** Featured update from the override-aware set (mirrors getFeaturedUpdate). */
export async function getEffectiveFeaturedUpdate(): Promise<Update | undefined> {
  const pub = await getEffectivePublicUpdates();
  return pub.find((u) => u.isFeatured) ?? pub[0];
}

/** Major milestones from the override-aware set (mirrors getMilestones). */
export async function getEffectiveMilestones(): Promise<Update[]> {
  const pub = await getEffectivePublicUpdates();
  return pub
    .filter((u) => u.isMajorMilestone)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
}

// ── Dev updates (/dev-updates) ────────────────────────────────────────────

/** Public dev updates with durable overrides applied, newest-first. Mirrors
 *  getDevUpdates() but honours a durable PublishingOS publish decision. */
export async function getEffectivePublicDevUpdates(): Promise<DevUpdate[]> {
  const overrides = await getPublishOverrides('dev-update');
  return applyOverrides(getAllDevUpdates(), overrides, isPublicDevUpdate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** A single effectively-published dev update by id (drafts not overridden →
 *  published return undefined → 404). */
export async function getEffectiveDevUpdate(id: string): Promise<DevUpdate | undefined> {
  return (await getEffectivePublicDevUpdates()).find((u) => u.id === id);
}

/** A single effectively-published dev update by its public SLUG (the detail
 *  route key). Honours the durable override in both directions: a demoted item
 *  returns undefined → 404; a promoted draft resolves (renders on-demand). */
export async function getEffectiveDevUpdateBySlug(slug: string): Promise<DevUpdate | undefined> {
  return (await getEffectivePublicDevUpdates()).find((u) => devUpdateSlug(u) === slug);
}

/** Override-aware dev milestones (mirrors getDevMilestones). */
export async function getEffectiveDevMilestones(): Promise<DevUpdate[]> {
  return (await getEffectivePublicDevUpdates())
    .filter((u) => u.isMilestone)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ── Blog (/blog) ──────────────────────────────────────────────────────────

/** Public blog posts with durable overrides applied. Mirrors
 *  getPublishedBlogPosts() — the durable DB override (keyed by slug) layers on
 *  TOP of the existing file/base status that isPublishedBlogPost already merges. */
export async function getEffectivePublicBlogPosts(): Promise<BlogPost[]> {
  const overrides = await getPublishOverrides('blog-post');
  return applyOverridesByKey(BLOG_POSTS, overrides, isPublishedBlogPost, (p) => p.slug)
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

/** A single effectively-published blog post by slug (drafts → undefined → 404). */
export async function getEffectiveBlogPost(slug: string): Promise<BlogPost | undefined> {
  return (await getEffectivePublicBlogPosts()).find((p) => p.slug === slug);
}

// ── SEO pages (crawl surface / sitemap) ───────────────────────────────────
// SEO content pages are STATICALLY rendered + source-controlled, so the durable
// override is honoured on the CRAWL surface (the sitemap) rather than forcing 40
// static pages dynamic. Unpublishing an SEO page drops it from the sitemap (the
// search-facing effect); hard removal of the route stays deploy-backed.

/** Published SEO pages with durable overrides applied (keyed by slug). Mirrors
 *  PUBLISHED_SEO_PAGES; used by the sitemap so a durable hide de-indexes a page. */
export async function getEffectivePublishedSeoPages(): Promise<SeoPage[]> {
  const overrides = await getPublishOverrides('seo-page');
  return applyOverridesByKey(SEO_PAGES, overrides, (p) => effectiveSeoStatus(p) === 'published', (p) => p.slug);
}

/** Whether a single SEO page is effectively published (durable override on top
 *  of its file/base status). */
export async function isEffectiveSeoPagePublished(slug: string): Promise<boolean> {
  const page = SEO_PAGES.find((p) => p.slug === slug);
  if (!page) return false;
  const overrides = await getPublishOverrides('seo-page');
  const o = overrides[slug];
  return o === undefined ? effectiveSeoStatus(page) === 'published' : o;
}
