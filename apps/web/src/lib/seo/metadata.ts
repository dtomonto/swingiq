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

export interface BuildMetadataOptions {
  /** Page title (without the site-name suffix — added automatically). */
  title?: string;
  /** Meta description. Falls back to the site default. */
  description?: string;
  /** Site-relative path, e.g. '/golf/fix-slice'. Used for canonical + OG URL. */
  path?: string;
  /** Absolute or site-relative OG image. Falls back to the site default. */
  ogImage?: string;
  /** Open Graph type. */
  ogType?: 'website' | 'article';
  /** Set true to keep this page out of search indexes (private/thin/draft). */
  noindex?: boolean;
  /** Optional keywords. */
  keywords?: string[];
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
    ogImage = siteConfig.defaultOgImage,
    ogType = 'website',
    noindex = false,
    keywords,
  } = options;

  const fullTitle = composeTitle(title);
  const canonical = path;
  const imageUrl = ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage);

  return {
    title: fullTitle,
    description,
    ...(keywords?.length ? { keywords } : {}),
    metadataBase: new URL(siteConfig.liveSiteUrl),
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      type: ogType,
      url: absoluteUrl(path),
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
