// ============================================================
// SwingVantage — Developer Update detail engine (pure, server-safe)
// ------------------------------------------------------------
// Powers the dedicated /dev-updates/[slug] technical report pages from the
// existing DevUpdate model in @/data/devUpdates. Same contract as the product
// engine: a published developer update is BOTH a card and a dedicated page
// from one source of truth.
//
// DevUpdate has no slug field, so slugs are derived deterministically from the
// stable id (or, as a fallback, the title) and verified unique by a test.
// ============================================================

import type { Metadata } from 'next';
import { SITE_URL } from '@/config/site';
import { getDevUpdates, type DevUpdate } from '@/data/devUpdates';

/** Deterministic, URL-safe slug for a developer update. */
export function devUpdateSlug(update: DevUpdate): string {
  const withSlug = update as DevUpdate & { slug?: string };
  if (withSlug.slug) return withSlug.slug;
  // ids are already kebab-case and unique (e.g. "dev-seven-sports"); drop the
  // conventional "dev-" prefix for a cleaner URL. Fall back to a slugified title.
  const fromId = update.id.replace(/^dev-/, '').trim();
  if (fromId) return fromId;
  return slugify(update.title);
}

export function devUpdatePath(update: DevUpdate): string {
  return `/dev-updates/${devUpdateSlug(update)}`;
}

export function devUpdateUrl(update: DevUpdate): string {
  return `${SITE_URL}${devUpdatePath(update)}`;
}

/** A published (non-draft) developer update by slug, or undefined. */
export function getPublicDevUpdateBySlug(slug: string): DevUpdate | undefined {
  return getDevUpdates().find((u) => devUpdateSlug(u) === slug);
}

/** Slugs of every page-eligible developer update — for generateStaticParams + sitemap. */
export function publicDevUpdateSlugs(): string[] {
  return getDevUpdates().map(devUpdateSlug);
}

/** Related developer updates scored by shared category, newest first. */
export function getRelatedDevUpdates(update: DevUpdate, limit = 4): DevUpdate[] {
  const others = getDevUpdates().filter((u) => u.id !== update.id);
  const scored = others.map((u) => {
    let score = 0;
    if (u.category === update.category) score += 2;
    if (u.impact === update.impact) score += 1;
    return { u, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || new Date(b.u.date).getTime() - new Date(a.u.date).getTime())
    .slice(0, limit)
    .map((s) => s.u);
}

export interface DevUpdateFaq {
  q: string;
  a: string;
}

/**
 * AEO/GEO FAQ derived from the developer update's own fields.
 *
 * Deliberately omits any "what technologies / what stack" question: this page is
 * public, and we do not publish our vendors, libraries, or implementation. See
 * the proprietary-protection policy in @/data/devUpdates.
 */
export function buildDevUpdateFaqs(update: DevUpdate): DevUpdateFaq[] {
  const faqs: DevUpdateFaq[] = [
    { q: `What changed in "${update.title}"?`, a: update.headline },
    { q: 'What does this do and why does it matter?', a: update.details },
  ];
  return faqs;
}

/** Short technical summary for AI answer engines. */
export function devUpdateAiAnswer(update: DevUpdate): string {
  return `${update.title}: ${update.headline}`;
}

export function buildDevUpdateMetadata(update: DevUpdate): Metadata {
  const title = `${update.title} | SwingVantage Developer Updates`;
  const description = update.headline;
  const canonical = devUpdatePath(update);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: update.title,
      description,
      type: 'article',
      url: devUpdateUrl(update),
      publishedTime: update.date,
    },
  };
}

/**
 * JSON-LD graph for a developer update detail page:
 *   BreadcrumbList + TechArticle + (FAQPage when FAQ items exist).
 * TechArticle is the correct type for a technical engineering write-up.
 */
export function buildDevUpdateJsonLd(
  update: DevUpdate,
  faqs: DevUpdateFaq[],
): Record<string, unknown> {
  const url = devUpdateUrl(update);
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Developer Updates', item: `${SITE_URL}/dev-updates` },
        { '@type': 'ListItem', position: 3, name: update.title, item: url },
      ],
    },
    {
      '@type': 'TechArticle',
      headline: update.title,
      description: update.headline,
      datePublished: update.date,
      url,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      // No `keywords` from stack: we don't publish our technologies (see the
      // proprietary-protection policy in @/data/devUpdates).
      about: {
        '@type': 'SoftwareApplication',
        name: 'SwingVantage',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
      },
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// ── Proprietary-disclosure guard (public-copy backstop) ─────────────────────
//
// /dev-updates is public and search-indexed. Hand-written seed entries bypass
// the commit-trailer leak guard in scripts/generate-updates.mjs, so this mirrors
// it for the rendered page: a CI test (see data/__tests__/devUpdates.test.ts)
// scans every PUBLISHED developer update through findProprietaryDisclosure() and
// fails the build if an entry names a vendor/library/infra, an internal system
// codename, an env/config flag, or a source-file path. Describe the benefit,
// never the implementation — see the policy note at the top of @/data/devUpdates.

/** Distinctive vendors/libraries/infra + internal codenames kept off public copy.
 *  Mirrors PROPRIETARY_TERMS in scripts/generate-updates.mjs; keep them in sync. */
export const PROPRIETARY_TERMS: readonly string[] = [
  'AIO-4', 'BranchGuardianOS', 'GrowthOS', 'CentralIntelligenceOS', 'securityOS',
  'PublishingOS', 'MotionLab',
  'Next.js', 'MediaPipe', 'MoveNet', 'Upstash', 'PostHog', 'Supabase',
  'PostgreSQL', 'Postgres', 'Resend', 'OpenAI', 'Gemini', 'Anthropic', 'Claude',
  'Three.js', 'WebGPU', 'WebNN', 'Turborepo', 'IndexedDB', 'localStorage',
  'Redis', 'Tokens Studio',
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PROPRIETARY_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'source file path', re: /\b(?:apps|packages|server|scripts|node_modules)\/[\w./-]+|(?:[\w-]+\/)+[\w-]+\.(?:tsx?|jsx?|mjs|cjs|sql|env|py|css|json)\b/ },
  { name: 'env or config flag name', re: /\b[A-Z][A-Z0-9]{2,}(?:_[A-Z0-9]+)+\b/ },
  { name: 'vendor, library, infra, or internal codename', re: new RegExp(`\\b(?:${PROPRIETARY_TERMS.map(escapeRegExp).join('|')})\\b`, 'i') },
];

/** First proprietary/implementation tell found in the given strings, or null. */
export function findProprietaryDisclosure(...parts: Array<string | undefined>): { name: string; sample: string } | null {
  const text = parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join('\n');
  for (const { name, re } of PROPRIETARY_PATTERNS) {
    const m = text.match(re);
    if (m) return { name, sample: m[0].slice(0, 48) };
  }
  return null;
}

/** Scan all rendered, athlete-visible fields of a developer update. */
export function findDevUpdateDisclosure(update: DevUpdate): { name: string; sample: string } | null {
  return findProprietaryDisclosure(
    update.title,
    update.headline,
    update.details,
    update.version,
    ...(update.highlights ?? []),
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
