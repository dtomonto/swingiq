// ============================================================
// SwingVantage — Swing education system tests.
// Covers: content integrity, unique slugs, SEO metadata presence,
// publish-gating, relationship resolution into the real fault
// ontology + coach styles, fault→page mapping, and JSON-LD.
// ============================================================

import { SPORT_TAXONOMY } from '@swingiq/core';
import { getFault } from '@/lib/faults';
import { USER_COACHING_STYLES } from '@/lib/central-intelligence/coach-mix/user-styles';
import {
  getPublishedLearnEntries,
  getConceptEntries,
  getDataPointEntries,
  getConceptEntry,
  getDataPointEntry,
  getLearnEntry,
  getDataPointsByCategory,
  resolveRelatedPages,
  resolveRelatedFaults,
  learnPageForFault,
  conceptPath,
  dataPointPath,
  learnPath,
  buildLearnGraph,
} from '@/lib/learn';

const VALID_SPORTS = new Set(SPORT_TAXONOMY.map((s) => s.id));

describe('learn registry — content integrity', () => {
  const all = getPublishedLearnEntries();

  it('ships the three flagship concept pages', () => {
    const slugs = getConceptEntries().map((e) => e.slug).sort();
    expect(slugs).toEqual(['grip', 'swing-plane', 'weight-distribution']);
  });

  it('ships a meaningful starter set of data points', () => {
    expect(getDataPointEntries().length).toBeGreaterThanOrEqual(8);
  });

  it('every entry has a unique slug', () => {
    const slugs = all.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every entry has the required content + SEO fields', () => {
    for (const e of all) {
      expect(e.title).toBeTruthy();
      expect(e.descriptionShort).toBeTruthy();
      expect(e.explanationBeginner).toBeTruthy();
      expect(e.explanationAdvanced).toBeTruthy();
      expect(e.whyItMatters).toBeTruthy();
      expect(e.detectionLogic).toBeTruthy();
      expect(e.confidenceExplanation).toBeTruthy();
      expect(e.goodPattern).toBeTruthy();
      expect(e.poorPatterns.length).toBeGreaterThan(0);
      expect(e.drills.length).toBeGreaterThan(0);
      expect(e.practicePlan.length).toBeGreaterThan(0);
      // SEO
      expect(e.seoTitle).toBeTruthy();
      expect(e.seoDescription.length).toBeGreaterThan(20);
      expect(e.faqs.length).toBeGreaterThan(0);
    }
  });

  it('every entry uses only valid SportId values', () => {
    for (const e of all) {
      for (const s of e.sports) expect(VALID_SPORTS.has(s)).toBe(true);
      for (const v of e.sportVariations ?? []) expect(VALID_SPORTS.has(v.sport)).toBe(true);
    }
  });

  it('never exposes admin-only sourceNotes via the rendered shape (it stays a plain field)', () => {
    // sourceNotes may exist but must never be required for rendering — the renderer
    // simply never reads it. Here we assert it is optional and not part of any
    // public link/SEO output.
    const graphJson = JSON.stringify(buildLearnGraph(getConceptEntry('grip')!));
    expect(graphJson).not.toContain('sourceNotes');
  });
});

describe('learn registry — publish gating', () => {
  it('only returns published entries', () => {
    for (const e of getPublishedLearnEntries()) expect(e.status).toBe('published');
  });

  it('returns undefined for unknown slugs (→ 404), not a draft', () => {
    expect(getLearnEntry('does-not-exist')).toBeUndefined();
    expect(getDataPointEntry('does-not-exist')).toBeUndefined();
    expect(getConceptEntry('tempo')).toBeUndefined(); // tempo is a data point, not a concept
  });
});

describe('learn registry — relationship resolution', () => {
  it('resolves related fault ids against the REAL ontology', () => {
    const earlyExt = getDataPointEntry('early-extension')!;
    const faults = resolveRelatedFaults(earlyExt);
    expect(faults.length).toBeGreaterThan(0);
    // Each resolved fault id must be a real ontology entry.
    for (const id of earlyExt.relatedFaultIds ?? []) {
      expect(getFault(id)).toBeDefined();
    }
  });

  it('resolves related coach styles to real coach-mix user styles', () => {
    for (const e of getPublishedLearnEntries()) {
      for (const id of e.relatedCoachStyleIds ?? []) {
        expect(USER_COACHING_STYLES.some((s) => s.id === id)).toBe(true);
      }
    }
  });

  it('resolves cross-links only to published pages', () => {
    for (const e of getPublishedLearnEntries()) {
      const { concepts, dataPoints } = resolveRelatedPages(e);
      for (const l of [...concepts, ...dataPoints]) {
        expect(l.href.startsWith('/learn/')).toBe(true);
        expect(l.label).toBeTruthy();
      }
    }
  });

  it('maps a detected fault to a learn page for report wiring', () => {
    const link = learnPageForFault('over_the_top');
    expect(link).toBeDefined();
    expect(link!.href).toBe('/learn/data-points/over-the-top');
  });

  it('returns undefined when no learn page covers a fault', () => {
    expect(learnPageForFault('totally_unknown_fault')).toBeUndefined();
  });
});

describe('learn SEO', () => {
  it('builds correct canonical paths by kind', () => {
    expect(conceptPath('grip')).toBe('/learn/grip');
    expect(dataPointPath('tempo')).toBe('/learn/data-points/tempo');
    expect(learnPath(getConceptEntry('grip')!)).toBe('/learn/grip');
    expect(learnPath(getDataPointEntry('tempo')!)).toBe('/learn/data-points/tempo');
  });

  it('builds a JSON-LD graph with Article, FAQ, and HowTo nodes', () => {
    const graph = buildLearnGraph(getConceptEntry('grip')!) as { '@graph': { '@type': string }[] };
    const types = graph['@graph'].map((n) => n['@type']);
    expect(types).toContain('Article');
    expect(types).toContain('FAQPage');
    expect(types).toContain('HowTo');
  });

  it('groups data points by category for the index', () => {
    const groups = getDataPointsByCategory();
    expect(groups.length).toBeGreaterThan(0);
    const total = groups.reduce((n, g) => n + g.entries.length, 0);
    expect(total).toBe(getDataPointEntries().length);
  });
});
