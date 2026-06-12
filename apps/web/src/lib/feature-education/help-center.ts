// ============================================================
// SwingVantage — Help Center reader (the `/help/<slug>` destination)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Every "Learn more →" link in the app points at `/help/<feature-slug>`
//   (see the Feature Education in-app help cards). This module turns the
//   committed, source-controlled published education seed into the data those
//   pages render — a help topic per feature, built ONLY from PUBLISHED,
//   public-safe assets (tutorial / how-to / FAQ / SEO answer / in-app help).
//
//   It is PURE and DETERMINISTIC (no I/O, no server-only imports): it reads the
//   same `SEEDED_ASSETS` the in-app reader unions in, so the destination pages
//   exist out of the box, keyless, and can be statically generated. Admin-only
//   asset bodies (visibility 'admin'/'internal'/'support') are excluded so a
//   public help page never leaks internal guidance.
// ============================================================

import { SEEDED_ASSETS } from './server/seed-help';
import { humanize } from './detection';
import type { AssetFaq, AssetSection, AssetStep, EducationAsset } from './types';

/** Asset visibilities that are safe to render on a PUBLIC help page. */
const PUBLIC_SAFE_VISIBILITY = new Set(['public', 'user']);

/** Section headings we render specially (steps) or replace (related) — skip in narrative. */
const SKIP_SECTION = /^(step by step|steps|related|related & next)$/i;

/** A fully-developed public help topic, assembled from a feature's assets. */
export interface HelpTopic {
  /** URL slug — matches the `/help/<slug>` the in-app cards link to. */
  slug: string;
  /** Human title, e.g. "Dashboard", "AI Coach". */
  title: string;
  /** One-line plain-language lead. */
  lead: string;
  /** The in-app route this feature lives at (for the "Open in app" CTA). */
  primaryRoute?: string;
  /** True when the feature is an internal/admin surface. */
  isAdmin: boolean;
  /** Numbered walkthrough steps (from the tutorial / how-to). */
  steps: AssetStep[];
  /** Narrative sections (what it does, who it's for, best practices, …). */
  sections: AssetSection[];
  /** Common questions for this feature. */
  faqs: AssetFaq[];
  /** Short, direct answer (answer-engine style). */
  answer?: string;
  /** SEO title + description (falls back to a sensible default in the page). */
  seoTitle?: string;
  seoDescription?: string;
}

/** The help slug a published asset belongs to (its feature, minus `feat_`). */
function helpSlugForAsset(a: EducationAsset): string {
  return a.featureId.replace(/^feat_/, '');
}

/** First grounded in-app route for a set of a feature's assets, if any. */
function primaryRoute(assets: EducationAsset[]): string | undefined {
  for (const a of assets) {
    const fromHelp = a.inAppHelp?.route;
    if (fromHelp) return fromHelp;
    const grounded = a.groundedIn.find((g) => g.kind === 'route')?.ref;
    if (grounded && grounded.startsWith('/')) return grounded;
  }
  return undefined;
}

/** Best human title for the feature behind a slug. */
function topicTitle(slug: string, assets: EducationAsset[]): string {
  const seoTitle = assets.find((a) => a.type === 'seo-article')?.seo?.title;
  if (seoTitle) {
    const stem = seoTitle.split(/\s+[—|]\s+/)[0]?.trim();
    if (stem) return stem;
  }
  const tut = assets.find((a) => a.type === 'tutorial');
  const m = tut?.title.match(/^How to use (.+)$/i);
  if (m) return m[1].trim();
  return humanize(slug);
}

/**
 * Pick the richest narrative asset for the body — a real user tutorial first,
 * then a how-to, so admin features (which ship a how-to but no public tutorial)
 * still get a developed page.
 */
function primaryArticle(assets: EducationAsset[]): EducationAsset | undefined {
  return (
    assets.find((a) => a.type === 'tutorial') ??
    assets.find((a) => a.type === 'how-to') ??
    assets.find((a) => a.type === 'manual')
  );
}

/** Build the one help topic for a slug, or null if it has no public content. */
function buildTopic(slug: string, all: EducationAsset[]): HelpTopic | null {
  // Only PUBLISHED, public-safe assets contribute to a public help page.
  const assets = all.filter(
    (a) => a.status === 'published' && PUBLIC_SAFE_VISIBILITY.has(a.visibility),
  );
  if (assets.length === 0) return null;

  const article = primaryArticle(assets);
  const faqAsset = assets.find((a) => a.type === 'faq');
  const seoAsset = assets.find((a) => a.type === 'seo-article');
  const inApp = assets.find((a) => a.type === 'in-app-help')?.inAppHelp;

  const route = primaryRoute(assets);
  const lead =
    article?.summary ??
    inApp?.body ??
    seoAsset?.summary ??
    `Learn what ${topicTitle(slug, assets)} does and how to use it.`;

  const sections = (article?.sections ?? []).filter((s) => !SKIP_SECTION.test(s.heading));
  const faqs = faqAsset?.faqs ?? article?.faqs ?? [];

  return {
    slug,
    title: topicTitle(slug, assets),
    lead,
    primaryRoute: route,
    isAdmin: (route?.startsWith('/admin') ?? false) || slug.startsWith('admin-'),
    steps: article?.steps ?? [],
    sections,
    faqs,
    answer: seoAsset?.seo?.aeoAnswer ?? inApp?.body,
    seoTitle: seoAsset?.seo?.title,
    seoDescription: seoAsset?.seo?.description,
  };
}

/** Index of every help topic, keyed by slug (built once at module load). */
const TOPICS_BY_SLUG: Map<string, HelpTopic> = (() => {
  const grouped = new Map<string, EducationAsset[]>();
  for (const a of SEEDED_ASSETS) {
    const slug = helpSlugForAsset(a);
    const list = grouped.get(slug) ?? [];
    list.push(a);
    grouped.set(slug, list);
  }
  const out = new Map<string, HelpTopic>();
  for (const [slug, assets] of grouped) {
    const topic = buildTopic(slug, assets);
    if (topic) out.set(slug, topic);
  }
  return out;
})();

/** All public help topics, sorted by title. */
export function getHelpTopics(): HelpTopic[] {
  return [...TOPICS_BY_SLUG.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/** One help topic by slug, or null when none is published for it. */
export function getHelpTopic(slug: string): HelpTopic | null {
  return TOPICS_BY_SLUG.get(slug) ?? null;
}

/** Site-relative path for a help topic. */
export function helpPath(slug: string): string {
  return `/help/${slug}`;
}

/**
 * Topics split into the public/end-user help and the admin/operator help, for
 * the index page. Both are real, published content; we just group them so the
 * index reads cleanly.
 */
export function getHelpGroups(): { user: HelpTopic[]; admin: HelpTopic[] } {
  const topics = getHelpTopics();
  return {
    user: topics.filter((t) => !t.isAdmin),
    admin: topics.filter((t) => t.isAdmin),
  };
}
