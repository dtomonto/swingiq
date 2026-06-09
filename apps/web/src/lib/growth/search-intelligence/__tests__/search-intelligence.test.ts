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
import {
  parseCsv, parseCsvRows, toCsv, importKeywords, importRankings, importBacklinks, importByKind,
} from '../csv';
import {
  gscStatus, fetchGscRows, gscRowsToKeywords, gscRowsToRankings, summarizeGsc, buildGscSnapshot,
  GSC_TOKEN_ENV, GSC_SITE_ENV,
} from '../gsc';
import type { GscRow } from '../types';

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

describe('CSV core', () => {
  it('parses quoted fields, embedded commas, escaped quotes, CRLF + BOM', () => {
    const csv = '﻿keyword,note\r\n"fix, slice","he said ""hi"""\r\ngolf grip,plain';
    const { headers, rows } = parseCsv(csv);
    expect(headers).toEqual(['keyword', 'note']);
    expect(rows[0]).toEqual({ keyword: 'fix, slice', note: 'he said "hi"' });
    expect(rows[1]).toEqual({ keyword: 'golf grip', note: 'plain' });
  });
  it('normalizes headers (case/space/hyphen → underscore)', () => {
    const { headers } = parseCsv('Target URL,Search Volume\n/x,100');
    expect(headers).toEqual(['target_url', 'search_volume']);
  });
  it('toCsv quotes risky values and round-trips through parseCsv', () => {
    const rows = [{ a: 'x,y', b: 'line\nbreak', c: 3 }];
    const back = parseCsv(toCsv(rows as never));
    expect(back.rows[0].a).toBe('x,y');
    expect(back.rows[0].b).toBe('line\nbreak');
    expect(back.rows[0].c).toBe('3');
  });
  it('ignores fully blank lines', () => {
    expect(parseCsvRows('a,b\n\n1,2\n').filter((r) => r.some((c) => c)).length).toBe(2);
  });
});

describe('CSV importers', () => {
  it('imports keywords, labeling verified vs estimated by supplied numbers', () => {
    const csv = 'keyword,volume,difficulty,intent,sport,url\nfix slice,1200,40,informational,golf,/golf/fix-slice\nbare keyword,,,,,';
    const { rows, errors, total } = importKeywords(csv);
    expect(total).toBe(2);
    expect(errors).toHaveLength(0);
    const verified = rows.find((r) => r.keyword === 'fix slice')!;
    expect(verified.source).toBe('imported');
    expect(verified.dataSource).toBe('imported'); // had real numbers
    expect(verified.hasOwnedPage).toBe(true);
    expect(in0to100(verified.opportunityScore)).toBe(true);
    const bare = rows.find((r) => r.keyword === 'bare keyword')!;
    expect(bare.dataSource).toBe('estimated'); // no numbers supplied
  });
  it('flags keyword rows missing the required column', () => {
    const { rows, errors } = importKeywords('keyword,volume\n,500');
    expect(rows).toHaveLength(0);
    expect(errors.length).toBe(1);
  });
  it('imports rankings and requires keyword+url+position', () => {
    const { rows, errors } = importRankings('keyword,url,position\nfix slice,/golf/fix-slice,3\nbad,,');
    expect(rows).toHaveLength(1);
    expect(rows[0].position).toBe(3);
    expect(rows[0].dataSource).toBe('imported');
    expect(errors.length).toBe(1);
  });
  it('imports backlinks, deriving domain + parsing nofollow', () => {
    const { rows } = importBacklinks('source_url,target_url,nofollow,authority\nhttps://www.golfdigest.com/x,https://swingvantage.com/,true,72');
    expect(rows).toHaveLength(1);
    expect(rows[0].sourceDomain).toBe('golfdigest.com');
    expect(rows[0].nofollow).toBe(true);
    expect(rows[0].authorityEstimate).toBe(72);
  });
  it('importByKind dispatches to the right importer', () => {
    expect(importByKind('keywords', 'keyword\nx').kind).toBe('keywords');
    expect(importByKind('rankings', 'keyword,url,position\nx,/y,1').kind).toBe('rankings');
    expect(importByKind('backlinks', 'source_url,target_url\na,b').kind).toBe('backlinks');
  });
});

describe('Google Search Console adapter', () => {
  const GSC_ROWS: GscRow[] = [
    { query: 'golf swing analysis', page: 'https://swingvantage.com/golf-swing-analysis', clicks: 40, impressions: 1000, ctr: 0.04, position: 6.2 },
    { query: 'golf swing analysis', page: 'https://swingvantage.com/blog/swing', clicks: 10, impressions: 500, ctr: 0.02, position: 14 },
    { query: 'fix golf slice', page: 'https://swingvantage.com/golf/fix-slice', clicks: 5, impressions: 300, ctr: 0.016, position: 22 },
  ];

  it('status is honest about connection + missing env vars', () => {
    const off = gscStatus({} as NodeJS.ProcessEnv);
    expect(off.connected).toBe(false);
    expect(off.missing).toContain(GSC_TOKEN_ENV);
    expect(off.missing).toContain(GSC_SITE_ENV);
    const on = gscStatus({ [GSC_TOKEN_ENV]: 'tok', [GSC_SITE_ENV]: 'sc-domain:swingvantage.com' } as unknown as NodeJS.ProcessEnv);
    expect(on.connected).toBe(true);
    expect(on.siteUrl).toBe('sc-domain:swingvantage.com');
  });

  it('fetch is keyless-safe (no token → connected:false, no rows, no throw)', async () => {
    const res = await fetchGscRows({}, {} as NodeJS.ProcessEnv);
    expect(res.connected).toBe(false);
    expect(res.rows).toHaveLength(0);
  });

  it('maps rows → keywords (real rank/impressions, grouped by query)', () => {
    const kws = gscRowsToKeywords(GSC_ROWS);
    expect(kws.length).toBe(2); // two distinct queries
    const gsa = kws.find((k) => k.normalizedKeyword === 'golf swing analysis')!;
    expect(gsa.source).toBe('gsc');
    expect(gsa.dataSource).toBe('real');
    expect(gsa.clicks).toBe(50); // summed across pages
    expect(gsa.impressions).toBe(1500);
    expect(gsa.currentRank).toBeGreaterThan(6); // impression-weighted avg of 6.2 & 14
    expect(gsa.currentRank).toBeLessThan(14);
    expect(gsa.targetUrl).toBe('/golf-swing-analysis'); // best (most clicks) page, normalized
    expect(in0to100(gsa.opportunityScore)).toBe(true);
  });

  it('striking-distance queries score higher opportunity than page-1 winners', () => {
    const top = gscRowsToKeywords([{ query: 'a golf drill', page: '/golf/a', clicks: 1, impressions: 100, ctr: 0.01, position: 2 }])[0];
    const striking = gscRowsToKeywords([{ query: 'a golf drill', page: '/golf/a', clicks: 1, impressions: 100, ctr: 0.01, position: 8 }])[0];
    expect(striking.opportunityScore).toBeGreaterThan(top.opportunityScore);
  });

  it('maps rows → rankings + summarizes', () => {
    const ranks = gscRowsToRankings(GSC_ROWS);
    expect(ranks).toHaveLength(3);
    expect(ranks[0].dataSource).toBe('real');
    const sum = summarizeGsc(GSC_ROWS);
    expect(sum.totalClicks).toBe(55);
    expect(sum.totalImpressions).toBe(1800);
    expect(sum.rowCount).toBe(3);
  });

  it('snapshot has keywords + rankings + summary', () => {
    const snap = buildGscSnapshot(GSC_ROWS, 'sc-domain:swingvantage.com');
    expect(snap.siteUrl).toBe('sc-domain:swingvantage.com');
    expect(snap.keywords.length).toBe(2);
    expect(snap.rankings.length).toBe(3);
  });

  it('buildKeywords merges GSC over estimates (real rank wins)', () => {
    const gsc = gscRowsToKeywords(GSC_ROWS);
    const merged = buildKeywords(pages, { gsc });
    const gsa = merged.find((k) => k.normalizedKeyword === 'golf swing analysis')!;
    expect(gsa.source).toBe('gsc');
    expect(gsa.currentRank).not.toBeNull();
    expect(gsa.dataSource).toBe('real');
  });
});
