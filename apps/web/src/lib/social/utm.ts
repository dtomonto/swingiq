// ============================================================
// SwingVantage — Blog-to-Social: UTM link builder
//
// Produces a UNIQUE, measurable link per platform + variation so the
// analytics layer can attribute traffic precisely. Pure string logic,
// no network — trivially testable.
// ============================================================

import type { Platform, VariationType } from './types';
import { getPlatformRule } from './platforms';

export const SITE_ORIGIN = 'https://swingvantage.com';

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}

/** Lowercase, alphanumerics + underscores only — safe, consistent UTM values. */
export function slugifyUtm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Append UTM params to a URL, preserving any existing query string and
 * never duplicating keys. Returns a normalized absolute URL.
 */
export function buildUtmUrl(baseUrl: string, params: UtmParams): string {
  let url: URL;
  try {
    url = new URL(baseUrl, SITE_ORIGIN);
  } catch {
    url = new URL(SITE_ORIGIN);
  }

  const entries: Array<[string, string | undefined]> = [
    ['utm_source', params.source],
    ['utm_medium', params.medium],
    ['utm_campaign', params.campaign],
    ['utm_content', params.content],
    ['utm_term', params.term],
  ];

  for (const [key, raw] of entries) {
    if (!raw) continue;
    url.searchParams.set(key, slugifyUtm(raw));
  }
  return url.toString();
}

/** Canonical public URL for a blog post slug. */
export function blogUrl(slug: string): string {
  return `${SITE_ORIGIN}/blog/${slug}`;
}

/**
 * Per-platform, per-variation tracked link. utm_content encodes
 * `${platform}_${variation}` so every button/post is distinct in analytics.
 */
export function socialUtmUrl(
  slug: string,
  platform: Platform,
  variation: VariationType,
  campaign = 'blog_distribution',
): string {
  return buildUtmUrl(blogUrl(slug), {
    source: getPlatformRule(platform).utmSource,
    medium: 'social',
    campaign,
    content: `${platform}_${variation}`,
  });
}
