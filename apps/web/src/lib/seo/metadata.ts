// ============================================================
// SwingVantage — Reusable Metadata Helper
// Build a complete Next.js Metadata object for any public page
// with sensible, config-driven defaults.
//
//   import { buildMetadata } from '@/lib/seo/metadata';
//   export const metadata = buildMetadata({
//     title: 'Fix Your Slice',
//     description: '...',
//     path: '/golf/fix-slice',
//   });
// ============================================================

import type { Metadata } from 'next';
import { siteConfig, absoluteUrl } from '@/config/site';
import type { LanguageCode } from '@/lib/i18n';
import { currentLocalesFor } from '@/lib/marketing-i18n/expose';
import { localizedHref } from '@/lib/marketing-i18n/href';

export interface BuildMetadataOptions {
  /** Page title (without the site-name suffix — added automatically). */
  title?: string;
  /** Meta description. Falls back to the site default. */
  description?: string;
  /** Site-relative path, e.g. '/golf/fix-slice'. Used for canonical + OG URL. */
  path?: string;
  /**
   * Which language this page is being rendered in. English ('en', default)
   * keeps the root URL canonical; a localized page (e.g. 'es') gets the
   * prefixed URL as its canonical. Either way, hreflang alternates linking the
   * language versions are emitted automatically for translated pages.
   */
  locale?: LanguageCode;
  /** Absolute or site-relative OG image. Falls back to the site default. */
  ogImage?: string;
  /** Open Graph type. */
  ogType?: 'website' | 'article';
  /** Set true to keep this page out of search indexes (private/thin/draft). */
  noindex?: boolean;
  /**
   * @deprecated Ignored on purpose. We do NOT emit a `<meta name="keywords">`
   * tag: Google ignores it and Bing can read a stuffed list as a negative
   * (spammy) signal, so it is pure downside. The field is kept only so the many
   * existing call sites that still pass `keywords` keep type-checking — nothing
   * is rendered. See docs/SEO_CONTENT_PLAN.md "Conservative SEO policy".
   */
  keywords?: string[];
}

/**
 * Build the hreflang alternates map for a path: English at the root plus every
 * locale the page is currently fully translated into, with an x-default. Returns
 * undefined when the page has no translations (so we never emit hreflang to a
 * URL that doesn't exist).
 */
function buildLanguageAlternates(path: string): Record<string, string> | undefined {
  const locales = currentLocalesFor(path);
  if (locales.length === 0) return undefined;
  const languages: Record<string, string> = { en: absoluteUrl(path) };
  for (const loc of locales) languages[loc] = absoluteUrl(localizedHref(path, loc));
  languages['x-default'] = absoluteUrl(path);
  return languages;
}

/** Compose the visible <title>, appending the brand unless it's the home title. */
function composeTitle(title?: string): string {
  if (!title) return `${siteConfig.siteName} — ${siteConfig.tagline}`;
  if (title.includes(siteConfig.siteName)) return title;
  return `${title} | ${siteConfig.siteName}`;
}

export function buildMetadata(options: BuildMetadataOptions = {}): Metadata {
  const {
    title,
    description = siteConfig.defaultMetaDescription,
    path = '/',
    locale = 'en',
    ogImage = siteConfig.defaultOgImage,
    ogType = 'website',
    noindex = false,
  } = options;

  const fullTitle = composeTitle(title);
  // The canonical for a localized page is its prefixed URL; English stays at root.
  const canonical = locale === 'en' ? path : localizedHref(path, locale);
  const languages = buildLanguageAlternates(path);
  const imageUrl = ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage);

  return {
    title: fullTitle,
    description,
    // No `keywords` meta tag — see BuildMetadataOptions.keywords (deprecated).
    metadataBase: new URL(siteConfig.liveSiteUrl),
    alternates: { canonical, ...(languages ? { languages } : {}) },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      type: ogType,
      url: absoluteUrl(canonical),
      siteName: siteConfig.siteName,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: siteConfig.twitterCard,
      title: fullTitle,
      description,
      images: [imageUrl],
      ...(siteConfig.social.twitter ? { site: siteConfig.social.twitter } : {}),
    },
  };
}
