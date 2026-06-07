// ============================================================
// Link Intelligence Agent — unit tests
// ------------------------------------------------------------
// Covers inventory, graph, internal-link analysis/recs + scoring, anchors,
// guardrails (incl. the safety guarantees: never spam backlinks, never bad
// internal links, graceful missing APIs), backlinks/competitors/content gaps,
// outreach state machine, AEO/GEO, reports, and the full agent run.
// ============================================================

import { buildInventory, normalizeUrl } from '../inventory';
import { buildLinkGraph } from '../link-graph';
import { analyzeFindings, recommendInternalLinks } from '../internal-links';
import { classifyAnchor, buildAnchorProfile } from '../anchor';
import { scoreInternalLink, scoreBacklinkOpportunity, scoreCitation } from '../scoring';
import { evaluateAutoApply, validateWhiteHat, BLACKLISTED_TACTICS } from '../guardrails';
import { discoverBacklinkOpportunities } from '../backlinks';
import { discoverCompetitorGaps } from '../competitors';
import { discoverContentGaps } from '../content-gaps';
import { draftOutreach, makeApprovalTask, advanceOutreach } from '../outreach';
import { analyzeAiSearch } from '../ai-search';
import { buildReport } from '../reports';
import { anyProviderConfigured, providerStatuses } from '../adapters';
import { runLinkAgent } from '../agent';
import type { PageNode } from '../types';

const EMPTY_ENV = {} as NodeJS.ProcessEnv;

function mkNode(p: Partial<PageNode> & { url: string }): PageNode {
  return {
    title: p.title ?? p.url,
    pageType: p.pageType ?? 'seo-programmatic',
    sport: p.sport ?? 'golf',
    cluster: p.cluster ?? 'golf-swing-analysis',
    keyword: p.keyword,
    intent: p.intent,
    funnelStage: p.funnelStage,
    priority: p.priority ?? 2,
    outboundLinks: p.outboundLinks ?? [],
    source: p.source ?? 'seo-catalog',
    sensitive: p.sensitive ?? false,
    inboundCount: p.inboundCount ?? 0,
    outboundCount: p.outboundCount ?? 0,
    depth: p.depth ?? Number.POSITIVE_INFINITY,
    url: p.url,
  };
}

describe('inventory', () => {
  const nodes = buildInventory();
  it('builds a non-trivial inventory of real pages', () => {
    expect(nodes.length).toBeGreaterThan(20);
  });
  it('includes the homepage and the golf hub', () => {
    const urls = new Set(nodes.map((n) => n.url));
    expect(urls.has('/')).toBe(true);
    expect(urls.has('/golf-swing-analysis')).toBe(true);
  });
  it('has unique URLs and a leading-slash convention', () => {
    const urls = nodes.map((n) => n.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((u) => u.startsWith('/'))).toBe(true);
  });
  it('normalizeUrl strips origin, query, hash, trailing slash', () => {
    expect(normalizeUrl('https://swingvantage.com/golf/fix-slice/')).toBe('/golf/fix-slice');
    expect(normalizeUrl('golf/fix-slice?x=1#a')).toBe('/golf/fix-slice');
    expect(normalizeUrl('/')).toBe('/');
  });
});

describe('link graph', () => {
  const graph = buildLinkGraph(buildInventory());
  it('puts the homepage at depth 0', () => {
    expect(graph.byUrl.get('/')!.depth).toBe(0);
  });
  it('reaches sport hubs from the homepage (depth 1)', () => {
    expect(graph.byUrl.get('/golf-swing-analysis')!.depth).toBe(1);
  });
  it('computes inbound/outbound counts', () => {
    const total = graph.nodes.reduce((a, n) => a + n.outboundCount, 0);
    expect(total).toBeGreaterThan(0);
  });
  it('only flags broken edges whose target is not a known page', () => {
    for (const e of graph.edges.filter((x) => x.broken)) {
      expect(graph.byUrl.has(e.to)).toBe(false);
    }
  });
});

describe('internal-link analysis', () => {
  const graph = buildLinkGraph(buildInventory());
  const findings = analyzeFindings(graph);
  const recs = recommendInternalLinks(graph);

  it('produces well-formed findings', () => {
    for (const f of findings.slice(0, 50)) {
      expect(f.pageUrl).toBeTruthy();
      expect(['critical', 'high', 'medium', 'low']).toContain(f.severity);
      expect(f.status).toBe('open');
    }
  });

  it('never recommends a self-link, and scores are 0..100', () => {
    for (const r of recs) {
      expect(r.sourceUrl).not.toBe(r.destinationUrl);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.status).toBe('pending');
    }
  });

  it('only recommends RELEVANT links (same cluster or same sport) — no spammy cross-topic links', () => {
    for (const r of recs) {
      const s = graph.byUrl.get(r.sourceUrl)!;
      const d = graph.byUrl.get(r.destinationUrl)!;
      expect(s && d).toBeTruthy();
      expect(s.cluster === d.cluster || s.sport === d.sport).toBe(true);
    }
  });

  it('never recommends an internal link that already exists', () => {
    const existing = new Set(graph.edges.map((e) => `${e.from}|${e.to}`));
    for (const r of recs) {
      expect(existing.has(`${r.sourceUrl}|${r.destinationUrl}`)).toBe(false);
    }
  });
});

describe('anchor intelligence', () => {
  const dest = mkNode({ url: '/golf/fix-slice', keyword: 'how to fix a slice', title: 'How to Fix a Golf Slice' });
  it('classifies anchor kinds', () => {
    expect(classifyAnchor('click here', dest)).toBe('generic');
    expect(classifyAnchor('SwingVantage', dest)).toBe('branded');
    expect(classifyAnchor('how to fix a slice', dest)).toBe('exact-match');
    expect(classifyAnchor('how to fix golf slice', dest)).toBe('partial-match');
    expect(classifyAnchor('get started', dest)).toBe('cta');
  });
  it('flags over-optimized anchor profiles', () => {
    const edges = [
      { from: '/a', to: dest.url, anchor: 'how to fix a slice' },
      { from: '/b', to: dest.url, anchor: 'how to fix a slice' },
      { from: '/c', to: dest.url, anchor: 'how to fix a slice' },
      { from: '/d', to: dest.url, anchor: 'how to fix a slice' },
    ];
    const profile = buildAnchorProfile(dest, edges);
    expect(profile.overOptimized).toBe(true);
    expect(profile.total).toBe(4);
  });
});

describe('scoring (explainable, bounded)', () => {
  const src = mkNode({ url: '/golf-swing-analysis', pageType: 'sport-hub', inboundCount: 8, depth: 1, priority: 1 });
  const dest = mkNode({ url: '/golf/fix-slice', inboundCount: 0, depth: 4, priority: 1, keyword: 'fix slice' });
  it('internal-link score is 0..100 with factors', () => {
    const r = scoreInternalLink(src, dest, 'descriptive');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.factors.length).toBeGreaterThan(0);
  });
  it('backlink score penalizes spam risk', () => {
    const base = { relevance: 0.9, authorityProxy: 0.6, trafficProxy: 0.5, editorialQuality: 0.8, linkLikelihood: 0.6, competitorGap: 0.5, spamRisk: 0 };
    const clean = scoreBacklinkOpportunity(base);
    const spammy = scoreBacklinkOpportunity({ ...base, spamRisk: 0.9 });
    expect(spammy.score).toBeLessThan(clean.score);
  });
  it('citation score rewards clear answers + structure', () => {
    const weak = scoreCitation({ answerClarity: 0, factualDepth: 0, schemaQuality: 0, internalAuthority: 0, structure: 0, sportSpecificity: 0.5 });
    const strong = scoreCitation({ answerClarity: 1, factualDepth: 1, schemaQuality: 1, internalAuthority: 1, structure: 1, sportSpecificity: 1 });
    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe('guardrails (safety guarantees)', () => {
  const src = mkNode({ url: '/golf-swing-analysis', pageType: 'sport-hub', cluster: 'golf-swing-analysis', sport: 'golf' });
  const dest = mkNode({ url: '/golf/fix-slice', cluster: 'golf-swing-analysis', sport: 'golf' });

  it('auto-applies only highly-relevant, natural, high-confidence links', () => {
    const ok = evaluateAutoApply({ source: src, dest, anchorKind: 'descriptive', score: 80 });
    expect(ok.safe).toBe(true);
  });
  it('never auto-applies from a sensitive (money/home) source', () => {
    const sensitive = mkNode({ url: '/pricing', sensitive: true, cluster: 'cross-sport', sport: 'multi' });
    expect(evaluateAutoApply({ source: sensitive, dest, anchorKind: 'descriptive', score: 95 }).safe).toBe(false);
  });
  it('never auto-applies exact-match anchors or low scores', () => {
    expect(evaluateAutoApply({ source: src, dest, anchorKind: 'exact-match', score: 95 }).safe).toBe(false);
    expect(evaluateAutoApply({ source: src, dest, anchorKind: 'descriptive', score: 40 }).safe).toBe(false);
  });
  it('rejects non-white-hat backlink tactics', () => {
    expect(validateWhiteHat({ opportunityType: 'PBN link', targetOutlet: 'private blog network' }).ok).toBe(false);
    expect(validateWhiteHat({ opportunityType: 'Resource page', targetOutlet: 'Golf academy', spamRisk: 0.9 }).ok).toBe(false);
    expect(validateWhiteHat({ opportunityType: 'Resource page', targetOutlet: 'Golf academy', spamRisk: 0.1 }).ok).toBe(true);
  });
});

describe('backlinks / competitors / content gaps', () => {
  it('discovers only white-hat backlink opportunities (deterministic ids)', () => {
    const a = discoverBacklinkOpportunities(EMPTY_ENV);
    const b = discoverBacklinkOpportunities(EMPTY_ENV);
    expect(a.length).toBeGreaterThan(0);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id)); // idempotent
    for (const opp of a) {
      const hay = `${opp.opportunityType} ${opp.targetOutlet} ${opp.pitchAngle}`.toLowerCase();
      for (const banned of BLACKLISTED_TACTICS) expect(hay).not.toContain(banned);
      expect(opp.dataSource).toBe('placeholder'); // no provider connected
      expect(opp.status).toBe('idea');
    }
  });
  it('emits competitor backlink GAPS as competitor insights', () => {
    const gaps = discoverCompetitorGaps(EMPTY_ENV);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every((g) => g.insightType === 'backlink-gap')).toBe(true);
  });
  it('emits linkable-asset content recommendations', () => {
    const gaps = discoverContentGaps();
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every((g) => g.basis === 'strategic')).toBe(true);
  });
});

describe('outreach (human-approved, never auto-sends)', () => {
  const opp = discoverBacklinkOpportunities(EMPTY_ENV)[0];
  it('drafts a structured, honest outreach', () => {
    const d = draftOutreach(opp);
    expect(d.subjectOptions.length).toBeGreaterThan(0);
    expect(d.body).toContain('SwingVantage');
    expect(d.followUps.length).toBe(3);
    expect(d.reviewerNote.toLowerCase()).toContain('never sends');
  });
  it('creates an approval-required task', () => {
    const task = makeApprovalTask(opp);
    expect(task.approvalRequired).toBe(true);
    expect(task.status).toBe('todo');
  });
  it('transitions outreach state', () => {
    expect(advanceOutreach('idea', 'qualify')).toBe('researching');
    expect(advanceOutreach('pitched', 'win')).toBe('won');
    expect(advanceOutreach('pitched', 'lose')).toBe('declined');
  });
});

describe('AEO/GEO citation readiness', () => {
  const graph = buildLinkGraph(buildInventory());
  const ops = analyzeAiSearch(graph);
  it('scores published pages with recommendations', () => {
    expect(ops.length).toBeGreaterThan(0);
    for (const o of ops.slice(0, 20)) {
      expect(o.score).toBeGreaterThanOrEqual(0);
      expect(o.score).toBeLessThanOrEqual(100);
      expect(o.recommendations.length).toBeGreaterThan(0);
    }
  });
});

describe('adapters (graceful when no API configured)', () => {
  it('reports no providers connected with an empty env', () => {
    expect(anyProviderConfigured(EMPTY_ENV)).toBe(false);
    expect(providerStatuses(EMPTY_ENV).every((p) => p.connected === false)).toBe(true);
  });
});

describe('full agent run', () => {
  const result = runLinkAgent({ cadence: 'weekly', env: EMPTY_ENV });
  it('returns a complete, bounded result', () => {
    expect(result.run.pagesAnalyzed).toBeGreaterThan(20);
    expect(result.run.internalLinkHealth).toBeGreaterThanOrEqual(0);
    expect(result.run.internalLinkHealth).toBeLessThanOrEqual(100);
    expect(result.run.aeoReadiness).toBeLessThanOrEqual(100);
    expect(result.backlinkOpportunities.length).toBeGreaterThan(0);
    expect(result.competitorGaps.length).toBeGreaterThan(0);
    expect(Array.isArray(result.notifications)).toBe(true);
  });
  it('builds a report from the run', () => {
    const report = buildReport('weekly', {
      run: result.run, findings: result.findings, recommendations: result.recommendations,
      opportunities: result.backlinkOpportunities, competitorGaps: result.competitorGaps,
      aiSearch: result.aiSearch, clusters: result.clusters,
    });
    expect(report.sections.length).toBeGreaterThan(0);
    expect(report.headline).toContain('health');
  });
});
