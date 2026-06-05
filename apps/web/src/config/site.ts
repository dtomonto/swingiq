// ============================================================
// SwingIQ — Centralized Site Configuration
// Single source of truth for site-wide constants: name, URL,
// contact emails, default metadata, and social handles.
//
// Import from anywhere with:  import { siteConfig } from '@/config/site';
//
// IMPORTANT (owner setup): the email addresses below must point
// to inboxes (or forwarding) that you actually monitor before
// relying on them publicly. See docs/growth-implementation.md.
// ============================================================

/**
 * The live, canonical origin for SwingIQ. Used for canonical URLs,
 * sitemap entries, Open Graph URLs, and absolute links.
 * Override per-environment with NEXT_PUBLIC_SITE_URL if needed.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://swingvantage.com';

export const siteConfig = {
  /** Product name as shown to users. */
  siteName: 'SwingIQ',

  /** Short tagline used in titles and OG metadata. */
  tagline: 'Free AI Swing Analysis for Golf, Tennis, Baseball & Softball',

  /** Live, canonical site origin (no trailing slash). */
  liveSiteUrl: SITE_URL,

  // ── Contact ────────────────────────────────────────────────
  /** General contact / questions. */
  contactEmail: 'support@swingiq.app',
  /** Support / help with the product. */
  supportEmail: 'support@swingiq.app',
  /** Privacy, data-access, and data-deletion requests. */
  privacyEmail: 'privacy@swingiq.app',
  /** Security / vulnerability disclosure. */
  securityEmail: 'security@swingiq.app',

  // ── Default metadata ───────────────────────────────────────
  defaultMetaDescription:
    'Upload a swing video or import launch monitor data. Get a free AI breakdown of your top swing fault, beginner-safe drills, and a practice plan — golf, tennis, baseball, and softball. No account required.',
  defaultOgImage: '/og-default.png',
  twitterCard: 'summary_large_image' as const,

  // ── Social handles (only include real, claimed handles) ────
  // Leave empty until accounts actually exist. Empty handles are
  // omitted from metadata so we never link to a non-existent page.
  social: {
    twitter: '', // e.g. '@swingiq'
    instagram: '',
    youtube: '',
    tiktok: '',
  },

  /** Supported sports, used across nav, schema, and SEO surfaces. */
  sports: ['golf', 'tennis', 'baseball', 'slow-pitch softball', 'fast-pitch softball'] as const,
} as const;

export type SiteConfig = typeof siteConfig;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = ''): string {
  if (!path) return siteConfig.liveSiteUrl;
  return `${siteConfig.liveSiteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
