// SignalRadar OS — Sport Intelligence + Strategy Brief tests (deterministic).

import { DEFAULT_CONFIG, DEFAULT_COMPETITORS } from '../config';
import { processRawInputs, buildDashboard } from '../engine';
import { buildSportView, VIEWABLE_SPORTS } from '../sport';
import { buildStrategyBrief } from '../strategy';
import { buildCompetitorInsights } from '../competitors';
import type { RawSignalInput } from '../types';

const NOW = '2026-06-11T12:00:00.000Z';
const raw = (p: Partial<RawSignalInput> & { text: string }): RawSignalInput => ({ sourceType: 'manual', collectionMethod: 'manual', ...p });

const { signals } = processRawInputs(
  [
    raw({ text: 'How do I analyze my golf swing with AI? Looking for an app', sourceUrl: 'https://a.com/1' }),
    raw({ text: 'SwingVantage golf swing analysis is great, love it', sourceUrl: 'https://a.com/2' }),
    raw({ text: 'SwingVantage crashed on my golf upload, refund please terrible', sourceUrl: 'https://a.com/3' }),
    raw({ text: 'How can I analyze my tennis serve? compared to Sportsbox AI', sourceUrl: 'https://a.com/4' }),
  ],
  DEFAULT_CONFIG,
  DEFAULT_COMPETITORS,
  { now: NOW, makeId: (i) => `s${i}` },
);

describe('buildSportView', () => {
  it('rolls up only the requested sport', () => {
    const golf = buildSportView(signals, 'golf', DEFAULT_CONFIG, DEFAULT_COMPETITORS);
    expect(golf.total).toBe(3);
    expect(golf.sport).toBe('golf');
    expect(golf.bySentiment.reduce((s, b) => s + b.count, 0)).toBe(3);
  });

  it('surfaces questions, pain points and recommended actions', () => {
    const golf = buildSportView(signals, 'golf', DEFAULT_CONFIG, DEFAULT_COMPETITORS);
    expect(golf.painPoints.length).toBeGreaterThanOrEqual(1); // the crash/refund
    expect(golf.recommendedActions.length).toBeGreaterThan(0);
  });

  it('returns an empty, honest view for a sport with no signals', () => {
    const padel = buildSportView(signals, 'padel', DEFAULT_CONFIG, DEFAULT_COMPETITORS);
    expect(padel.total).toBe(0);
    expect(padel.recommendedActions[0]).toMatch(/No signals/i);
  });

  it('exposes the 7 canonical sports', () => {
    expect(VIEWABLE_SPORTS).toHaveLength(7);
    expect(VIEWABLE_SPORTS).toContain('softball_fast');
  });
});

describe('buildStrategyBrief', () => {
  const dashboard = buildDashboard(signals, DEFAULT_CONFIG);
  const insights = buildCompetitorInsights(signals, DEFAULT_COMPETITORS);
  const brief = buildStrategyBrief(signals, dashboard, insights);

  it('summarizes counts honestly with a headline', () => {
    expect(brief.signalCount).toBe(4);
    expect(brief.headline).toMatch(/4 active signals/);
    expect(brief.highlights.length).toBeGreaterThan(0);
  });

  it('picks the busiest sport to watch (golf)', () => {
    expect(brief.sportToWatch?.sport).toBe('golf');
  });

  it('routes signals into content / product / reputation buckets', () => {
    expect(brief.contentToCreate.length).toBeGreaterThanOrEqual(1);
    expect(brief.reputationToWatch.length).toBeGreaterThanOrEqual(1);
    expect(brief.topActions.length).toBeGreaterThan(0);
    expect(brief.topOpportunity).not.toBeNull();
  });

  it('is empty + honest when there are no signals', () => {
    const empty = buildStrategyBrief([], buildDashboard([], DEFAULT_CONFIG), []);
    expect(empty.signalCount).toBe(0);
    expect(empty.headline).toMatch(/No signals/i);
    expect(empty.topOpportunity).toBeNull();
  });
});
