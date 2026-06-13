// ============================================================
// SwingVantage — Educational-link registry + technology-claims tests.
// Pure logic (node env): verifies the heuristic/AI education topics
// resolve to the right pages, that tooltips/labels exist, and that the
// centralized data-scale claim stays in safe, defensible language until
// explicitly verified.
// ============================================================

import {
  EDUCATIONAL_TOPICS,
  getEducationalTopic,
  HEURISTIC_LINK_TERMS,
  AI_LINK_TERMS,
  type EducationalTerm,
} from '@/lib/learn/educational-links';
import {
  technologyClaims,
  dataScaleClaim,
  DATA_SCALE_VERIFIED,
} from '@/content/technologyClaims';

describe('educational-links registry', () => {
  it('maps the heuristic topic to its canonical page', () => {
    const topic = getEducationalTopic('heuristic-data');
    expect(topic?.href).toBe('/learn/what-is-heuristic-data');
    expect(topic?.defaultLabel).toBeTruthy();
    expect(topic?.tooltip.length).toBeGreaterThan(20);
  });

  it('maps the AI topic to its canonical page', () => {
    const topic = getEducationalTopic('ai-sports');
    expect(topic?.href).toBe('/learn/ai-in-sports-performance');
    expect(topic?.defaultLabel).toBeTruthy();
    expect(topic?.tooltip.length).toBeGreaterThan(20);
  });

  it('returns undefined for an unknown term (so links never break)', () => {
    // Cast through unknown to simulate a stale/bad caller.
    expect(getEducationalTopic('not-a-term' as unknown as EducationalTerm)).toBeUndefined();
  });

  it('every topic href is an absolute site-relative path', () => {
    for (const topic of Object.values(EDUCATIONAL_TOPICS)) {
      expect(topic.href.startsWith('/learn/')).toBe(true);
    }
  });

  it('ships curated term lists for authors (heuristic + AI)', () => {
    expect(HEURISTIC_LINK_TERMS).toContain('heuristic data');
    expect(HEURISTIC_LINK_TERMS).toContain('deterministic mode');
    expect(AI_LINK_TERMS).toContain('AI');
    expect(AI_LINK_TERMS).toContain('video analysis');
  });
});

describe('technologyClaims data-scale safety', () => {
  it('defaults to safe, capability-framed language (no unverified "millions")', () => {
    // Guard: until DATA_SCALE_VERIFIED is intentionally flipped with evidence,
    // public copy must never assert "millions" of data points.
    if (!DATA_SCALE_VERIFIED) {
      expect(dataScaleClaim).not.toMatch(/million/i);
      expect(technologyClaims.millionsDataPointsClaim).not.toMatch(/million/i);
      expect(dataScaleClaim).toBe('large-scale sport-specific performance signals');
    }
  });

  it('describes Athlete General Intelligence with the shipped brand name', () => {
    // Reuse the existing product brand, not a competing term.
    expect(technologyClaims.athleteGeneralIntelligence.name).toBe('Athlete General Intelligence');
    expect(technologyClaims.athleteGeneralIntelligence.full).toContain(dataScaleClaim);
  });

  it('carries an honest trust disclaimer that is not a guarantee', () => {
    expect(technologyClaims.trustDisclaimer).toMatch(/not.*final diagnosis/i);
    expect(technologyClaims.trustDisclaimer).not.toMatch(/guaranteed (?!-?result)/i);
  });

  it('provides plain-English heuristic copy for the education page', () => {
    expect(technologyClaims.heuristicIntelligence.plainEnglish).toMatch(/structured performance logic/i);
  });
});
