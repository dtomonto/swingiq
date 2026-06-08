// Guards the curated public-URL registry that feeds BOTH the XML sitemap
// (app/sitemap.ts) and the HTML sitemap (app/(marketing)/sitemap). These tests
// encode the SEO policy: only clean, canonical, indexable public URLs, never an
// auth/admin/utility route, and never a path that another registry already
// emits (which would create a duplicate sitemap entry).

import {
  CURATED_URLS,
  SECTION_ORDER,
  SECTION_LABELS,
  curatedUrlsBySection,
} from '../site-sections';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';

// Prefixes that must NEVER appear in the index (auth, admin, API, and the
// authenticated product surface — all blocked in robots.txt).
const FORBIDDEN_PREFIXES = [
  '/admin', '/api', '/login', '/signup', '/dashboard', '/settings', '/sessions',
  '/diagnose', '/drills', '/practice', '/training', '/milestones', '/progress',
  '/reports', '/video', '/bag', '/profile', '/compare', '/avatar', '/pre-round',
  '/ai-coach', '/community', '/data', '/recruiting', '/notes', '/reminders',
  '/refer', '/motion-lab', '/agi', '/coach', '/retest', '/bodysync', '/arc',
];

describe('curated URL registry (sitemap source of truth)', () => {
  it('every path is a clean, absolute, query-free, fragment-free URL', () => {
    for (const u of CURATED_URLS) {
      expect(u.path.startsWith('/')).toBe(true);
      expect(u.path).not.toContain('?'); // no query params
      expect(u.path).not.toContain('#'); // no fragments
      expect(u.path).not.toContain('//'); // no host/protocol or empty segment
      if (u.path !== '/') expect(u.path.endsWith('/')).toBe(false); // no trailing slash
    }
  });

  it('excludes every auth/admin/API/app-only route prefix', () => {
    for (const u of CURATED_URLS) {
      for (const bad of FORBIDDEN_PREFIXES) {
        const blocked = u.path === bad || u.path.startsWith(bad + '/');
        if (blocked) throw new Error(`Curated URL "${u.path}" matches forbidden prefix "${bad}"`);
        expect(blocked).toBe(false);
      }
    }
  });

  it('has no duplicate paths', () => {
    const paths = CURATED_URLS.map((u) => u.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('contains the expected core public pages', () => {
    const paths = new Set(CURATED_URLS.map((u) => u.path));
    for (const core of [
      '/', '/how-it-works', '/golf-swing-analysis', '/tennis-swing-analysis',
      '/baseball-swing-analysis', '/softball-swing-analysis', '/tools',
      '/sample-report', '/methodology', '/benchmarks', '/sitemap',
    ]) {
      expect(paths.has(core)).toBe(true);
    }
  });

  it('never duplicates a dynamically-emitted URL (guides/blog/challenges/library)', () => {
    const curated = new Set(CURATED_URLS.map((u) => u.path));
    // Programmatic SEO guides are emitted from PUBLISHED_SEO_PAGES by the XML
    // sitemap — they must NOT also be curated, or the URL appears twice.
    for (const p of PUBLISHED_SEO_PAGES) {
      expect(curated.has(`/${p.slug}`)).toBe(false);
    }
    // Dynamic index roots are emitted by their own registries.
    for (const root of ['/blog', '/challenges', '/learn']) {
      expect(curated.has(root)).toBe(false);
    }
  });

  it('declares every used section in SECTION_ORDER and SECTION_LABELS', () => {
    for (const u of CURATED_URLS) {
      expect(SECTION_ORDER).toContain(u.section);
      expect(SECTION_LABELS[u.section]).toBeTruthy();
    }
  });

  it('groups every URL exactly once via curatedUrlsBySection', () => {
    const grouped = curatedUrlsBySection();
    const total = SECTION_ORDER.reduce((n, s) => n + grouped[s].length, 0);
    expect(total).toBe(CURATED_URLS.length);
  });

  it('uses valid priorities (0..1) and change frequencies', () => {
    const freqs = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
    for (const u of CURATED_URLS) {
      expect(u.priority).toBeGreaterThanOrEqual(0);
      expect(u.priority).toBeLessThanOrEqual(1);
      expect(freqs.has(u.changeFrequency)).toBe(true);
    }
  });

  it('gives every URL a non-empty descriptive label for the HTML sitemap', () => {
    for (const u of CURATED_URLS) {
      expect(u.label.trim().length).toBeGreaterThan(0);
    }
  });
});
