// ============================================================
// SearchIntelligenceOS — unit tests
// ------------------------------------------------------------
// Covers projects, page-intel enrichment, the technical audit + severity,
// keyword build + opportunity scoring, content opportunities, sitemap
// coverage/priority, decay detection, the brief generator, the explainable
// scorers, the score battery, and the full scan orchestration. Pure engine,
// no I/O — deterministic (fixed `now` where time matters).
// ============================================================

import { buildInventory } from '../../link-intelligence/inventory';
import { buildLinkGraph } from '../../link-intelligence/link-graph';
import { activeProject, listProjects } from '../projects';
import { buildPageIntel, findPageIntel } from '../page-intel';
import { auditSite } from '../audit';
import { buildKeywords } from '../keywords';
import { buildOpportunities } from '../opportunities';
import { analyzeSitemap, buildSitemapPathSet, isUtilityUrl } from '../sitemap-intel';
import { detectDecay } from '../decay';
import { generateBrief } from '../briefs';
import {
  scorePageQuality, scoreActionPriority, scoreIssuePriority, scoreKeywordOpportunity, clamp,
} from '../scoring';
import { computeScores } from '../scores';
import { runSearchIntel } from '../engine';
import { analyzeFindings } from '../../link-intelligence/internal-links';
import { computeClusterHealth } from '../../link-intelligence/clusters';

const FIXED_NOW = Date.parse('2026-06-09T00:00:00Z');

// Shared fixtures (built once).
const graph = buildLinkGraph(buildInventory());
const pages = buildPageIntel(graph);
const findings = analyzeFindings(graph);
const issues = auditSite(pages, findings);
const keywords = buildKeywords(pages);
const clusters = computeClusterHealth(graph);

const in0to100 = (n: number) => n >= 0 && n <= 100;

describe('projects', () => {
  it('SwingVantage is the active project', () => {
    expect(activeProject().id).toBe('swingvantage');
    expect(activeProject().status).toBe('active');
  });
  it('lists multi-project placeholders for future properties', () => {
    const ids = listProjects().map((p) => p.id);
    expect(ids).toContain('profitpour');
    expect(listProjects().filter((p) => p.status === 'planned').length).toBeGreaterThan(0);
  });
});

describe('page intelligence', () => {
  it('enriches every graph node', () => {
    expect(pages.length).toBe(graph.nodes.length);
    expect(pages.length).toBeGreaterThan(20);
  });
  it('reads real owned metadata for a known SEO guide', () => {
    const p = findPageIntel(pages, '/golf/fix-slice');
    expect(p).toBeDefined();
    expect(p!.wordCount).toBeGreaterThan(100);
    expect(p!.wordCountSource).toBe('real');
    expect(p!.hasDirectAnswer).toBe(true);
    expect(p!.faqCount).toBeGreaterThan(0);
    expect(p!.schemaTypes.length).toBeGreaterThan(0);
    expect(p!.inSitemap).toBe(true);
  });
  it('does not invent a word count for static routes', () => {
    const home = findPageIntel(pages, '/');
    expect(home).toBeDefined();
    expect(home!.wordCount).toBeNull();
  });
  it('keeps all scores within 0..100', () => {
    for (const p of pages) {
      expect(in0to100(p.qualityScore)).toBe(true);
      expect(in0to100(p.priorityScore)).toBe(true);
      expect(in0to100(p.businessValueScore)).toBe(true);
    }
  });
});

describe('technical audit', () => {
  it('produces issues with valid severities, sorted by priority', () => {
    expect(issues.length).toBeGreaterThan(0);
    const sevs = new Set(['critical', 'high', 'medium', 'low', 'informational']);
    for (const i of issues) {
      expect(sevs.has(i.severity)).toBe(true);
      expect(in0to100(i.priorityScore)).toBe(true);
    }
    for (let i = 1; i < issues.length; i++) {
      expect(issues[i - 1].priorityScore).toBeGreaterThanOrEqual(issues[i].priorityScore);
    }
  });
  it('never flags a missing description on an owned page that has one', () => {
    const ownedWithDesc = pages.filter((p) => p.source === 'seo-catalog' && p.metaDescription);
    const missingDescIssues = issues.filter((i) => i.issueType === 'meta-desc-missing');
    const flaggedUrls = new Set(missingDescIssues.flatMap((i) => i.affectedUrls));
    for (const p of ownedWithDesc) expect(flaggedUrls.has(p.url)).toBe(false);
  });
  it('only flags missing-from-sitemap for indexable pages not in the sitemap', () => {
    for (const i of issues.filter((x) => x.issueType === 'missing-from-sitemap')) {
      const p = findPageIntel(pages, i.url!);
      expect(p!.indexable && !p!.inSitemap).toBe(true);
    }
  });
});

describe('keyword engine', () => {
  it('includes owned + seed keywords, all scored 0..100', () => {
    expect(keywords.length).toBeGreaterThan(10);
    const sources = new Set(keywords.map((k) => k.source));
    expect(sources.has('owned-page')).toBe(true);
    for (const k of keywords) {
      expect(in0to100(k.opportunityScore)).toBe(true);
      expect(in0to100(k.difficultyEstimate)).toBe(true);
    }
  });
  it('labels seed keywords with no owned page as placeholder content gaps', () => {
    const gap = keywords.find((k) => k.source === 'seed' && !k.hasOwnedPage);
    if (gap) {
      expect(gap.dataSource).toBe('placeholder');
      expect(gap.contentGapScore).toBeGreaterThan(50);
    }
  });
  it('keyword opportunity rises when there is no owned page (gap)', () => {
    const base = { intent: 'informational' as const, funnelStage: 'consideration' as const, sport: 'golf' as const, businessValueScore: 60, difficultyEstimate: 50 };
    const gap = scoreKeywordOpportunity({ ...base, hasOwnedPage: false }).score;
    const owned = scoreKeywordOpportunity({ ...base, hasOwnedPage: true }).score;
    expect(gap).toBeGreaterThan(owned);
  });
});

describe('content opportunities', () => {
  const opps = buildOpportunities(keywords, clusters, pages);
  it('generates unique-slug opportunities sorted by priority', () => {
    expect(opps.length).toBeGreaterThan(0);
    const slugs = opps.map((o) => o.proposedSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (let i = 1; i < opps.length; i++) {
      expect(opps[i - 1].priorityScore).toBeGreaterThanOrEqual(opps[i].priorityScore);
    }
  });
  it('frames each opportunity with a CTA + schema recommendation', () => {
    for (const o of opps.slice(0, 5)) {
      expect(o.cta.length).toBeGreaterThan(0);
      expect(o.schemaRecommendation.length).toBeGreaterThan(0);
    }
  });
});

describe('sitemap intelligence', () => {
  const analysis = analyzeSitemap(pages);
  it('builds a non-trivial sitemap path set', () => {
    expect(buildSitemapPathSet().size).toBeGreaterThan(20);
  });
  it('returns one entry per page with a 1..100 indexing priority', () => {
    expect(analysis.entries.length).toBe(pages.length);
    for (const e of analysis.entries) {
      expect(e.indexingPriority).toBeGreaterThanOrEqual(1);
      expect(e.indexingPriority).toBeLessThanOrEqual(100);
    }
  });
  it('detects utility URLs that should never be indexed', () => {
    expect(isUtilityUrl('/dashboard')).toBe(true);
    expect(isUtilityUrl('/search?q=x')).toBe(true);
    expect(isUtilityUrl('/golf/fix-slice')).toBe(false);
  });
});

describe('decay detection', () => {
  it('returns labeled, bounded, deterministic signals', () => {
    const a = detectDecay(pages, FIXED_NOW);
    const b = detectDecay(pages, FIXED_NOW);
    expect(a.length).toBe(b.length);
    for (const d of a) {
      expect(in0to100(d.riskScore)).toBe(true);
      expect(d.dataSource).toBe('estimated');
      expect(d.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe('brief generator', () => {
  it('produces a complete, non-fabricating brief', () => {
    const brief = generateBrief({ topic: 'fix golf slice', sport: 'golf', intent: 'informational' });
    expect(brief.titleOptions.length).toBeGreaterThan(0);
    expect(brief.faqs.length).toBeGreaterThan(0);
    expect(brief.proposedSlug).toBe('golf/fix-golf-slice');
    expect(brief.noFabricationWarning.length).toBeGreaterThan(0);
    expect(brief.schemaRecommendations.length).toBeGreaterThan(0);
  });
});

describe('scoring', () => {
  it('action priority is higher for high impact/low effort and is banded', () => {
    const strong = scoreActionPriority({ impact: 'high', confidence: 'high', urgency: 'high', businessValue: 'high', effort: 'low' });
    const weak = scoreActionPriority({ impact: 'low', confidence: 'low', urgency: 'low', businessValue: 'low', effort: 'high' });
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.band).toBe('critical');
    expect(weak.band).toBe('low');
  });
  it('issue priority ranks critical above low', () => {
    const crit = scoreIssuePriority({ severity: 'critical', affectedCount: 5, expectedImpact: 'high', fixComplexity: 'low', confidence: 90 });
    const low = scoreIssuePriority({ severity: 'low', affectedCount: 1, expectedImpact: 'low', fixComplexity: 'high', confidence: 60 });
    expect(crit).toBeGreaterThan(low);
  });
  it('page quality handles a null word count without crashing', () => {
    const s = scorePageQuality({ wordCount: null, hasDirectAnswer: false, faqCount: 0, schemaCount: 0, hasMetaDescription: false, pageType: 'other' });
    expect(in0to100(s.score)).toBe(true);
    expect(s.factors.length).toBeGreaterThan(0);
  });
  it('clamp keeps values in range', () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-5)).toBe(0);
  });
});

describe('score battery + full scan', () => {
  it('computes nine bounded, explainable scores', () => {
    const scores = computeScores({
      pages, issues, keywords, decay: detectDecay(pages, FIXED_NOW),
      internalLinkHealth: 80, aeoReadiness: 70, backlinkOpportunityScore: 60, backlinkProviderConnected: false,
    });
    for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
      expect(in0to100(scores[key].score)).toBe(true);
      expect(scores[key].factors.length).toBeGreaterThan(0);
    }
  });
  it('runSearchIntel orchestrates a complete, honest result', () => {
    const r = runSearchIntel({ now: FIXED_NOW });
    expect(r.project.id).toBe('swingvantage');
    expect(r.pages.length).toBeGreaterThan(20);
    expect(in0to100(r.run.searchHealth)).toBe(true);
    expect(r.run.pagesAnalyzed).toBe(r.pages.length);
    expect(Array.isArray(r.actions)).toBe(true);
    expect(r.run.dataSource).toBe('real');
  });
});
