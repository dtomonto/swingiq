// ============================================================
// SwingVantage — Technology-education SEO/AEO/GEO standard tests.
// Mechanically enforces the strictest bar on EVERY education article so
// the set can grow without any page silently regressing:
//   • SEO  — unique title/description, length windows, route exists,
//            Article schema with published/modified dates.
//   • AEO  — direct answer summary, ≥2 real-query FAQs, FAQPage schema,
//            Speakable selectors over the H1 + answer block.
//   • GEO  — self-contained, defensible copy (no unverified scale claims).
// ============================================================

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  TECH_EDUCATION_ARTICLES,
  getTechEducationArticle,
  techEducationPath,
  techEducationPaths,
  buildTechEducationGraph,
  buildTechEducationMetadata,
} from '@/lib/learn/tech-education';

// Rendered <title> = "<title> | SwingVantage" (composeTitle in lib/seo/metadata).
const BRANDED = (title: string) => `${title} | SwingVantage`;
const APP_DIR = join(process.cwd(), 'src', 'app', '(marketing)');

describe('tech-education registry: structure & uniqueness', () => {
  it('ships at least the six planned education articles', () => {
    expect(TECH_EDUCATION_ARTICLES.length).toBeGreaterThanOrEqual(6);
  });

  it('has unique slugs, titles, descriptions, and answer summaries', () => {
    const dupe = (xs: string[]) => xs.length !== new Set(xs.map((x) => x.toLowerCase())).size;
    expect(dupe(TECH_EDUCATION_ARTICLES.map((a) => a.slug))).toBe(false);
    expect(dupe(TECH_EDUCATION_ARTICLES.map((a) => a.title))).toBe(false);
    expect(dupe(TECH_EDUCATION_ARTICLES.map((a) => a.description))).toBe(false);
    expect(dupe(TECH_EDUCATION_ARTICLES.map((a) => a.answerSummary))).toBe(false);
  });

  it('resolves each article by slug and exposes its canonical path', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      expect(getTechEducationArticle(a.slug)).toBe(a);
      expect(techEducationPath(a.slug)).toBe(`/learn/${a.slug}`);
    }
    expect(techEducationPaths()).toHaveLength(TECH_EDUCATION_ARTICLES.length);
  });

  it('has a real route file for every article (no broken sitemap rows)', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      expect(existsSync(join(APP_DIR, 'learn', a.slug, 'page.tsx'))).toBe(true);
    }
  });
});

describe('tech-education: SEO standards', () => {
  it('keeps the rendered <title> within the SEO window (15–70 chars)', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      const len = BRANDED(a.title).length;
      expect(len).toBeGreaterThanOrEqual(15);
      expect(len).toBeLessThanOrEqual(70);
    }
  });

  it('keeps meta descriptions within the SEO window (70–175 chars)', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      expect(a.description.length).toBeGreaterThanOrEqual(70);
      expect(a.description.length).toBeLessThanOrEqual(175);
    }
  });

  it('emits a canonical + article OG metadata for each article', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      const meta = buildTechEducationMetadata(a.slug);
      expect(meta.alternates?.canonical).toBe(techEducationPath(a.slug));
      expect(meta.openGraph).toBeTruthy();
    }
  });
});

describe('tech-education: AEO standards', () => {
  it('provides a self-contained direct answer for each article', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      expect(a.answerSummary.length).toBeGreaterThanOrEqual(80);
      expect(a.answerSummary.length).toBeLessThanOrEqual(340);
    }
  });

  it('ships at least two real-query FAQs per article', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      expect(a.faqs.length).toBeGreaterThanOrEqual(2);
      for (const f of a.faqs) {
        expect(f.question.trim().endsWith('?')).toBe(true);
        expect(f.answer.length).toBeGreaterThanOrEqual(40);
      }
    }
  });

  it('emits Article (with dates + Speakable) and FAQPage schema, but no duplicate breadcrumb', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      const graph = buildTechEducationGraph(a.slug) as { '@graph': Array<Record<string, unknown>> };
      const types = graph['@graph'].map((n) => n['@type']);
      expect(types).toContain('Article');
      expect(types).toContain('FAQPage');
      expect(types).not.toContain('BreadcrumbList'); // owned by the visible <Breadcrumbs>

      const article = graph['@graph'].find((n) => n['@type'] === 'Article')!;
      expect(article.datePublished).toBeTruthy();
      expect(article.dateModified).toBeTruthy();
      const speakable = article.speakable as { cssSelector?: string[] } | undefined;
      expect(speakable?.cssSelector).toContain('[data-aeo-summary]');
    }
  });
});

describe('tech-education: GEO / claim safety', () => {
  it('never asserts an unverified "millions of data points" scale', () => {
    for (const a of TECH_EDUCATION_ARTICLES) {
      const blob = `${a.description} ${a.answerSummary} ${a.faqs.map((f) => f.answer).join(' ')}`;
      expect(blob).not.toMatch(/millions? of (?:real )?(?:data points|users|athletes)/i);
    }
  });
});
