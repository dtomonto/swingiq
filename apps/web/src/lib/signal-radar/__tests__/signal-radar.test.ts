// SignalRadar OS — pure engine tests. Deterministic: every test passes an
// explicit `now` + id factory so there is no reliance on wall-clock/random.

import { DEFAULT_CONFIG, DEFAULT_COMPETITORS, resolveConfig } from '../config';
import { classifySignal } from '../classify';
import { computeScores, computePriority } from '../scoring';
import { dedupe } from '../dedup';
import { normalizeSignal, fingerprintOf } from '../normalize';
import { parseGoogleAlerts, parseRssFeed, parseCsv } from '../importers';
import {
  processRawInputs,
  buildDashboard,
  filterByView,
  sortSignals,
  searchSignals,
} from '../engine';
import { deriveNotifications } from '../notifications';
import { buildCompetitorInsights } from '../competitors';
import { buildConversionFields } from '../conversions';
import { resolveAdapterStatuses, summarizeAdapters, ADAPTERS } from '../adapters';
import { PERMISSIONS, roleHasPermission } from '@/lib/admin/rbac';
import type { RawSignalInput } from '../types';

const NOW = '2026-06-11T12:00:00.000Z';
const CTX = { competitors: DEFAULT_COMPETITORS };

function classify(text: string, title?: string) {
  return classifySignal({ title, text }, DEFAULT_CONFIG, CTX);
}

function raw(partial: Partial<RawSignalInput> & { text: string }): RawSignalInput {
  return { sourceType: 'manual', collectionMethod: 'manual', ...partial };
}

describe('classifier — brand + sport + competitor detection', () => {
  it('detects a direct brand mention and its sport', () => {
    const c = classify('I tried SwingVantage for my golf swing and loved it');
    expect(c.brandTermsMatched.length).toBeGreaterThan(0);
    expect(c.sport).toBe('golf');
    expect(c.sentiment).toBe('positive');
  });

  it('flags multi-sport when two sports appear', () => {
    const c = classify('great for tennis serve and pickleball dink alike');
    expect(c.sport).toBe('multi_sport');
  });

  it('detects competitor terms', () => {
    const c = classify('Is SwingVantage a good Sportsbox AI alternative?');
    expect(c.competitorTermsMatched.map((t) => t.toLowerCase())).toContain('sportsbox ai');
  });

  it('respects an operator sport hint', () => {
    const c = classifySignal({ text: 'no sport words here' }, DEFAULT_CONFIG, { ...CTX, sportHint: 'padel' });
    expect(c.sport).toBe('padel');
  });
});

describe('classifier — intent + sentiment', () => {
  it('classifies a negative branded complaint as reputation risk', () => {
    const c = classify('SwingVantage charged me twice and I want a refund, terrible');
    expect(c.sentiment).toBe('negative');
    expect(c.intent).toBe('reputation_risk');
    expect(c.urgency === 'critical' || c.urgency === 'high').toBe(true);
  });

  it('classifies a demand question as an SEO/content opportunity', () => {
    const c = classify('How do I analyze my golf swing with AI? Looking for an app');
    expect(['seo_content_opportunity', 'coaching_need', 'purchase_comparison']).toContain(c.intent);
  });

  it('classifies a branded feature ask as feature_request', () => {
    const c = classify('Love SwingVantage, wish it had side-by-side pro comparison, please add');
    expect(c.intent).toBe('feature_request');
  });

  it('routes spam to spam_noise', () => {
    const c = classify('make money fast click here free gift card crypto casino');
    expect(c.intent).toBe('spam_noise');
  });

  it('detects a parent audience', () => {
    const c = classify('I want to analyze my daughter fastpitch softball swing video');
    expect(c.audience).toBe('parent');
    expect(c.sport).toBe('softball_fast');
  });
});

describe('scoring — transparent + bounded', () => {
  it('scores a branded, linked, negative signal high with visible factors', () => {
    const sig = normalizeSignal(
      raw({ text: 'SwingVantage is broken, refund please', sourceUrl: 'https://blog.example.com/x' }),
      { id: 's1', now: NOW },
    );
    const c = classify('SwingVantage is broken, refund please');
    const { priority, factors } = computePriority(sig, c, DEFAULT_CONFIG.weights, NOW);
    expect(priority).toBeGreaterThan(50);
    expect(priority).toBeLessThanOrEqual(100);
    expect(factors.some((f) => f.label === 'Direct brand mention')).toBe(true);
  });

  it('forces spam priority low regardless of incidental matches', () => {
    const sig = normalizeSignal(raw({ text: 'crypto casino make money fast' }), { id: 's2', now: NOW });
    const c = classify('crypto casino make money fast');
    const scores = computeScores(sig, c, DEFAULT_CONFIG.weights, NOW);
    expect(scores.priority).toBeLessThanOrEqual(8);
  });

  it('keeps all scores within 0–100', () => {
    const sig = normalizeSignal(raw({ text: 'golf swing analysis app' }), { id: 's3', now: NOW });
    const c = classify('golf swing analysis app');
    const scores = computeScores(sig, c, DEFAULT_CONFIG.weights, NOW);
    for (const v of [scores.priority, scores.confidence, scores.relevance, scores.sourceReliability]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('dedup', () => {
  it('treats the same URL as a duplicate', () => {
    const a = normalizeSignal(raw({ text: 'one', sourceUrl: 'https://x.com/a' }), { id: 'a', now: NOW });
    const b = normalizeSignal(raw({ text: 'two different text', sourceUrl: 'https://x.com/a' }), { id: 'b', now: NOW });
    const { unique, duplicates } = dedupe([a, b]);
    expect(unique).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
  });

  it('uses text hash when no URL is present', () => {
    const fp1 = fingerprintOf({ cleanText: 'hello world', title: 'T' });
    const fp2 = fingerprintOf({ cleanText: 'hello world', title: 'T' });
    expect(fp1).toBe(fp2);
    expect(fp1.startsWith('t:')).toBe(true);
  });
});

describe('importers (keyless, paste-based)', () => {
  it('parses a Google Alerts digest into signals', () => {
    const digest = [
      'Best AI golf swing app\nhttps://example.com/golf\nA roundup of swing apps',
      '',
      'SwingVantage review\nhttps://example.com/sv\nGreat tool for tennis',
    ].join('\n');
    const rows = parseGoogleAlerts(digest);
    expect(rows).toHaveLength(2);
    expect(rows[0].sourceUrl).toContain('example.com');
    expect(rows[0].collectionMethod).toBe('import_google_alerts');
  });

  it('parses an RSS feed body', () => {
    const xml = `<rss><channel>
      <item><title>Swing analysis tips</title><link>https://blog.example.com/1</link><description>Golf swing help</description><pubDate>Wed, 10 Jun 2026 10:00:00 GMT</pubDate></item>
      <item><title>Tennis drills</title><link>https://blog.example.com/2</link><description>Forehand</description></item>
    </channel></rss>`;
    const rows = parseRssFeed(xml);
    expect(rows).toHaveLength(2);
    expect(rows[0].sourceUrl).toBe('https://blog.example.com/1');
    expect(rows[0].publishedAt).toBeDefined();
  });

  it('parses a CSV with flexible headers', () => {
    const csv = 'url,title,text,author\nhttps://x.com/1,"A, title","some, text",bob';
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('A, title');
    expect(rows[0].text).toBe('some, text');
    expect(rows[0].authorName).toBe('bob');
  });
});

describe('engine — process + dashboard + views', () => {
  const inputs: RawSignalInput[] = [
    raw({ text: 'SwingVantage golf swing analysis is great', sourceUrl: 'https://a.com/1' }),
    raw({ text: 'How do I analyze my tennis serve with AI?', sourceUrl: 'https://a.com/2' }),
    raw({ text: 'SwingVantage crashed, refund please terrible', sourceUrl: 'https://a.com/3' }),
    raw({ text: 'SwingVantage golf swing analysis is great', sourceUrl: 'https://a.com/1' }), // dup
  ];

  function build() {
    return processRawInputs(inputs, DEFAULT_CONFIG, DEFAULT_COMPETITORS, {
      now: NOW,
      makeId: (i) => `e${i}`,
    });
  }

  it('processes inputs, dropping duplicates', () => {
    const { signals, duplicateCount } = build();
    expect(signals).toHaveLength(3);
    expect(duplicateCount).toBe(1);
  });

  it('builds a dashboard with honest totals', () => {
    const { signals } = build();
    const dash = buildDashboard(signals, DEFAULT_CONFIG);
    expect(dash.totals.all).toBe(3);
    expect(dash.totals.negativeRisk).toBeGreaterThanOrEqual(1);
    expect(dash.bySport.length).toBeGreaterThan(0);
    expect(dash.needsAttention.length).toBeGreaterThan(0);
  });

  it('filters by view', () => {
    const { signals } = build();
    const risk = filterByView(signals, 'negative_risk');
    expect(risk.every((s) => s.classification.sentiment === 'negative' || s.classification.intent === 'reputation_risk')).toBe(true);
  });

  it('sorts + searches', () => {
    const { signals } = build();
    const sorted = sortSignals(signals, 'priority', 'desc');
    expect(sorted[0].scores.priority).toBeGreaterThanOrEqual(sorted[sorted.length - 1].scores.priority);
    expect(searchSignals(signals, 'refund')).toHaveLength(1);
  });
});

describe('notifications + competitor insights + conversions', () => {
  const { signals } = processRawInputs(
    [
      raw({ text: 'SwingVantage is broken and inaccurate, want a refund', sourceUrl: 'https://a.com/r' }),
      raw({ text: 'SwingVantage vs Sportsbox AI for baseball', sourceUrl: 'https://a.com/c' }),
    ],
    DEFAULT_CONFIG,
    DEFAULT_COMPETITORS,
    { now: NOW, makeId: (i) => `n${i}` },
  );

  it('derives reputation + comparison notifications', () => {
    const notes = deriveNotifications(signals, DEFAULT_CONFIG);
    expect(notes.some((n) => n.kind === 'negative_mention')).toBe(true);
  });

  it('builds competitor insights from matched signals', () => {
    const insights = buildCompetitorInsights(signals, DEFAULT_COMPETITORS);
    const sportsbox = insights.find((i) => i.competitorId === 'sportsbox');
    expect(sportsbox?.signalCount).toBeGreaterThanOrEqual(1);
  });

  it('builds conversion fields linked to the signal', () => {
    const fields = buildConversionFields('reputation_risk', signals[0]);
    expect(fields.summary).toBeTruthy();
    expect(fields.whatNotToSay).toBeTruthy();
  });
});

describe('adapters — honest states, never leak secrets', () => {
  it('keyless adapters are manual_only; automated are placeholder without creds', () => {
    const statuses = resolveAdapterStatuses({});
    const manual = statuses.find((s) => s.id === 'manual');
    const reddit = statuses.find((s) => s.id === 'reddit');
    expect(manual?.state).toBe('manual_only');
    expect(reddit?.state).toBe('placeholder');
  });

  it('marks an automated adapter configured_disabled when its key is set', () => {
    const statuses = resolveAdapterStatuses({ YOUTUBE_API_KEY: 'real-key-123' });
    const yt = statuses.find((s) => s.id === 'youtube');
    expect(yt?.state).toBe('configured_disabled');
    expect(yt?.hasCredentials).toBe(true);
  });

  it('never includes secret VALUES in the resolved status', () => {
    const statuses = resolveAdapterStatuses({ YOUTUBE_API_KEY: 'sk_supersecret_value' });
    expect(JSON.stringify(statuses)).not.toContain('sk_supersecret_value');
  });

  it('summarizes adapter health', () => {
    const summary = summarizeAdapters(resolveAdapterStatuses({}));
    expect(summary.total).toBe(ADAPTERS.length);
    expect(summary.live).toBeGreaterThanOrEqual(5); // manual + 3 imports + ai-audit
  });
});

describe('config overrides', () => {
  it('merges weights + sport terms without dropping defaults', () => {
    const cfg = resolveConfig({ weights: { ...DEFAULT_CONFIG.weights, hasLink: 2 } });
    expect(cfg.weights.hasLink).toBe(2);
    expect(cfg.weights.directBrandMention).toBe(DEFAULT_CONFIG.weights.directBrandMention);
    expect(cfg.sportTerms.golf).toBeDefined();
  });
});

describe('RBAC — signals.manage gating', () => {
  it('is a registered permission', () => {
    expect(PERMISSIONS).toContain('signals.manage');
  });
  it('is held by super_admin + admin, denied to analyst/read_only', () => {
    expect(roleHasPermission('super_admin', 'signals.manage')).toBe(true);
    expect(roleHasPermission('admin', 'signals.manage')).toBe(true);
    expect(roleHasPermission('analyst', 'signals.manage')).toBe(false);
    expect(roleHasPermission('read_only', 'signals.manage')).toBe(false);
  });
});
