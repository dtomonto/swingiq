// Guards the static sample-report content set (content/sampleReports.ts), the
// "see what you'll get" worked examples rendered by SampleReportTemplate. Every
// entry must be complete and honest, and every public per-sport report URL must
// be registered in the curated sitemap registry (site-sections.ts) so the
// sitemap-coverage gate (scripts/check-sitemap-coverage.mjs) never flags it.

import { SAMPLE_REPORTS, getSampleReport, type SampleReport } from '../sampleReports';
import { CURATED_URLS } from '@/lib/seo/site-sections';

describe('sample reports (content set)', () => {
  it('has unique slugs', () => {
    const slugs = SAMPLE_REPORTS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('covers all eight sports/modes including the three racquet sports', () => {
    const slugs = new Set(SAMPLE_REPORTS.map((r) => r.slug));
    for (const expected of [
      'golf', 'tennis', 'pickleball', 'padel',
      'baseball', 'slow-pitch', 'fast-pitch', 'softball',
    ] as const) {
      expect(slugs.has(expected)).toBe(true);
    }
  });

  it('gives every report the required, non-empty narrative fields', () => {
    for (const r of SAMPLE_REPORTS) {
      const nonEmpty = (s: string | undefined) => expect((s ?? '').trim().length).toBeGreaterThan(0);
      nonEmpty(r.sportLabel);
      nonEmpty(r.sportEmoji);
      nonEmpty(r.metaTitle);
      nonEmpty(r.metaDescription);
      nonEmpty(r.title);
      nonEmpty(r.intro);
      nonEmpty(r.issueDetected);
      nonEmpty(r.highestPriorityFix);
      nonEmpty(r.confidenceLevel);
      nonEmpty(r.trustDisclaimer);
      nonEmpty(r.coachSummary);
      expect(r.evidenceUsed.length).toBeGreaterThanOrEqual(1);
      expect(r.drills.length).toBeGreaterThanOrEqual(3);
      expect(r.practicePlan7Day.length).toBeGreaterThanOrEqual(1);
      expect(r.progressMetrics.length).toBeGreaterThanOrEqual(1);
      expect(r.whatWeCannotKnow.length).toBeGreaterThanOrEqual(1);
      for (const d of r.drills) {
        nonEmpty(d.name);
        nonEmpty(d.how);
      }
      // Shareable card is always populated.
      nonEmpty(r.card.topIssue);
      expect(r.card.drills.length).toBeGreaterThanOrEqual(1);
      nonEmpty(r.card.planSummary);
    }
  });

  it('getSampleReport resolves every slug and returns undefined otherwise', () => {
    for (const r of SAMPLE_REPORTS) {
      expect(getSampleReport(r.slug)).toBe(r);
    }
    expect(getSampleReport('not-a-sport')).toBeUndefined();
  });

  it('registers every per-sport report URL in the curated sitemap registry', () => {
    const curated = new Set(CURATED_URLS.map((u) => u.path));
    // The /sample-report index plus one entry per report slug must be curated,
    // or check-sitemap-coverage.mjs flags the live page as missing.
    expect(curated.has('/sample-report')).toBe(true);
    for (const r of SAMPLE_REPORTS) {
      expect(curated.has(`/sample-report/${r.slug}`)).toBe(true);
    }
  });

  it('points each non-chooser report at a real engine sport via startSport', () => {
    for (const r of SAMPLE_REPORTS as SampleReport[]) {
      if (r.modeChooser) {
        // The softball chooser intentionally has no single startSport.
        expect(r.startSport).toBeUndefined();
      } else {
        expect((r.startSport ?? '').trim().length).toBeGreaterThan(0);
      }
    }
  });
});
