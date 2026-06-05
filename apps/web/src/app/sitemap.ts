import type { MetadataRoute } from 'next';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';

const BASE_URL = 'https://swingiq.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Programmatic SEO landing pages (only those marked 'published').
  const seoPages: MetadataRoute.Sitemap = PUBLISHED_SEO_PAGES.map((p) => ({
    url: `${BASE_URL}/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: p.priority === 1 ? 0.8 : 0.7,
  }));

  // Free growth tools (index + individual tools).
  const toolPages: MetadataRoute.Sitemap = [
    '/tools',
    '/tools/golf-slice-fixer',
    '/tools/swing-mistake-quiz',
    '/tools/at-home-swing-drill-generator',
    '/tools/practice-plan-generator',
    '/tools/private-lesson-savings-calculator',
    '/tools/slow-pitch-line-drive-guide',
    '/tools/equipment-diagnostic',
  ].map((path) => ({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 }));

  // Partner / audience pages.
  const partnerPages: MetadataRoute.Sitemap = ['/coaches', '/creators', '/teams', '/partners'].map(
    (path) => ({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 }),
  );

  // Challenge pages (index + individual challenges).
  const challengePages: MetadataRoute.Sitemap = [
    '/challenges',
    '/challenges/7-day-golf-slice',
    '/challenges/7-day-slow-pitch-line-drive',
    '/challenges/30-day-swingiq',
  ].map((path) => ({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 }));

  return [
    ...seoPages,
    ...toolPages,
    ...partnerPages,
    ...challengePages,
    // ── Homepage ────────────────────────────────────────────────
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // ── Sport swing analysis pages ──────────────────────────────
    {
      url: `${BASE_URL}/golf-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tennis-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/baseball-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/softball-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // ── Feature & informational pages ───────────────────────────
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Onboarding entry point (public, indexable conversion page).
      url: `${BASE_URL}/start`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Transparency page: what SwingVantage measures vs. estimates.
      url: `${BASE_URL}/methodology`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      // Explainer: Athlete General Intelligence (cross-sport reasoning).
      url: `${BASE_URL}/athlete-general-intelligence`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      // Public worked example of a swing report.
      url: `${BASE_URL}/sample-report`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/glossary`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/updates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/parents`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ── About & trust ───────────────────────────────────────────
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/trust`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/vulnerability-disclosure`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },

    // ── Blog ────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/how-to-fix-a-golf-slice`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/what-is-smash-factor`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/how-to-read-launch-monitor-data`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/tennis-forehand-technique-basics`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/baseball-exit-velocity-guide`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/softball-bat-path-and-launch-angle`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/how-ai-swing-analysis-works`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/practice-schedule-for-golfers`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },

    // ── Benchmarks ──────────────────────────────────────────────
    {
      url: `${BASE_URL}/benchmarks`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/golf`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/tennis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/baseball`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/softball`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Note: /drills is an authenticated app route (blocked in robots.txt),
    // and per-sport drill URLs (/drills/golf, etc.) are not standalone
    // routes — so they are intentionally NOT listed in the sitemap.
  ];
}
