// ============================================================
// Today's Command Center — engine, scoring & overlay tests
// ============================================================

import { scoreRecommendation, priorityBand, EFFORT_PENALTY } from '../scoring';
import {
  generateRecommendations,
  dedupeRecommendations,
  ruleSportCoverage,
  ruleAnalytics,
  ruleAuditFindings,
  ruleDataReadiness,
  DATA_THRESHOLDS,
  type SignalBundle,
  type PlatformDataSignal,
} from '../engine';
import {
  applyOverrides,
  summarize,
  pickDailyFocus,
  sectionsFor,
  REOPEN_DELTA,
} from '../overrides';
import type { OverrideMap, Recommendation } from '../types';

const NOW = '2026-06-08T12:00:00.000Z';

// Default: connected with counts well ABOVE every threshold, so the
// data-readiness rule is silent unless a test deliberately lowers a count.
const FULL_DATA: PlatformDataSignal = {
  connected: true,
  sessions: 1000,
  analyses: 1000,
  community: 1000,
  activeSports: 7,
};

function bundle(partial: Partial<SignalBundle> = {}): SignalBundle {
  return {
    now: NOW,
    sportCoverage: [],
    auditFindings: [],
    setupTasks: [],
    featureEducation: { gaps: 0, needsReview: 0, drift: 0 },
    platformData: FULL_DATA,
    analyticsConfigured: true,
    totals: { features: 0, sports: 7, drills: 0 },
    ...partial,
  };
}

describe('scoring', () => {
  it('clamps factors and produces a 1–100 score', () => {
    const b = scoreRecommendation({
      impact: 99, urgency: 99, confidence: 99, affectedUsers: 99, strategic: 99, risk: 99, effortPenalty: 0,
    });
    expect(b.score).toBe(100);
    expect(b.band).toBe('critical');
  });

  it('never goes below 1 even with a huge effort penalty', () => {
    const b = scoreRecommendation({
      impact: 1, urgency: 0, confidence: 0, affectedUsers: 0, strategic: 0, risk: 0, effortPenalty: 99,
    });
    expect(b.score).toBeGreaterThanOrEqual(1);
  });

  it('buckets bands at the documented thresholds', () => {
    expect(priorityBand(90)).toBe('critical');
    expect(priorityBand(89)).toBe('high');
    expect(priorityBand(70)).toBe('high');
    expect(priorityBand(69)).toBe('medium');
    expect(priorityBand(40)).toBe('medium');
    expect(priorityBand(39)).toBe('low');
  });

  it('subtracts the effort penalty', () => {
    const base = { impact: 10, urgency: 10, confidence: 10, affectedUsers: 10, strategic: 10, risk: 10 };
    const small = scoreRecommendation({ ...base, effortPenalty: EFFORT_PENALTY.S });
    const xl = scoreRecommendation({ ...base, effortPenalty: EFFORT_PENALTY.XL });
    expect(small.score).toBeGreaterThan(xl.score);
  });
});

describe('ruleSportCoverage', () => {
  it('flags a sport whose drill count is far below the leader', () => {
    const recs = ruleSportCoverage(
      bundle({
        sportCoverage: [
          { sportId: 'golf', sportName: 'Golf', drillCount: 40 },
          { sportId: 'padel', sportName: 'Padel', drillCount: 2 },
        ],
      }),
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].relatedSport).toBe('Padel');
    expect(recs[0].recommendationType).toBe('content_gap');
    expect(recs[0].completionCriteria).toMatch(/Padel/);
  });

  it('does not flag a well-covered sport', () => {
    const recs = ruleSportCoverage(
      bundle({
        sportCoverage: [
          { sportId: 'golf', sportName: 'Golf', drillCount: 40 },
          { sportId: 'tennis', sportName: 'Tennis', drillCount: 38 },
        ],
      }),
    );
    expect(recs).toHaveLength(0);
  });
});

describe('ruleAnalytics', () => {
  it('emits a high-value gap when analytics is not configured', () => {
    const recs = ruleAnalytics(bundle({ analyticsConfigured: false }));
    expect(recs).toHaveLength(1);
    expect(recs[0].recommendationType).toBe('analytics_gap');
    expect(recs[0].priorityScore).toBeGreaterThanOrEqual(70);
  });

  it('is silent when analytics is configured', () => {
    expect(ruleAnalytics(bundle({ analyticsConfigured: true }))).toHaveLength(0);
  });
});

describe('ruleAuditFindings', () => {
  it('only surfaces open P0/P1 and ranks P0 higher', () => {
    const recs = ruleAuditFindings(
      bundle({
        auditFindings: [
          { id: 'F-1', category: 'Security', finding: 'leak', recommendation: 'fix', priority: 'P0', status: 'open' },
          { id: 'F-2', category: 'SEO', finding: 'meta', recommendation: 'fix', priority: 'P1', status: 'open' },
          { id: 'F-3', category: 'Misc', finding: 'nit', recommendation: 'fix', priority: 'P3', status: 'open' },
        ],
      }),
    );
    expect(recs.map((r) => r.id)).toEqual(['audit:F-1', 'audit:F-2']);
    expect(recs[0].priorityScore).toBeGreaterThan(recs[1].priorityScore);
    expect(recs[0].recommendationType).toBe('security');
  });
});

describe('ruleDataReadiness', () => {
  it('is silent when every feature is above its data threshold', () => {
    expect(ruleDataReadiness(bundle())).toHaveLength(0);
  });

  it('emits a single critical connect-data item when live data is off', () => {
    const recs = ruleDataReadiness(
      bundle({ platformData: { connected: false, reason: 'SR off.', sessions: null, analyses: null, community: null, activeSports: 0 } }),
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].id).toBe('data-readiness:connect-live-data');
    expect(recs[0].priorityBand).toBe('critical');
    expect(recs[0].evidence).toContain('SR off.');
  });

  it('flags a below-threshold feature with the exact gap, progress and steps', () => {
    const recs = ruleDataReadiness(
      bundle({ platformData: { ...FULL_DATA, analyses: 3 } }),
    );
    const trends = recs.find((r) => r.id === 'data-readiness:swing-trends');
    expect(trends).toBeDefined();
    expect(trends!.recommendationType).toBe('feature_readiness'); // 3 > 0 → partial
    expect(trends!.title).toContain(`${DATA_THRESHOLDS.analysesForTrends}`);
    expect(trends!.evidence.some((e) => e.includes('3 / 10'))).toBe(true);
    expect(trends!.missingData).toContain('7');
    expect(trends!.stepByStepActions.length).toBeGreaterThan(0);
    expect(trends!.completionCriteria).toContain('10');
  });

  it('treats a zero-count feature as a data_gap (higher urgency)', () => {
    const recs = ruleDataReadiness(bundle({ platformData: { ...FULL_DATA, analyses: 0 } }));
    const trends = recs.find((r) => r.id === 'data-readiness:swing-trends')!;
    expect(trends.recommendationType).toBe('data_gap');
    expect(trends.title.toLowerCase()).toContain('no data');
  });

  it('cross-sport needs two active sports', () => {
    const recs = ruleDataReadiness(bundle({ platformData: { ...FULL_DATA, activeSports: 1 } }));
    expect(recs.some((r) => r.id === 'data-readiness:cross-sport')).toBe(true);
  });

  it('every emitted item is fully laid out (reason, steps, completion criteria)', () => {
    const recs = ruleDataReadiness(
      bundle({ platformData: { connected: true, sessions: 1, analyses: 1, community: 1, activeSports: 1 } }),
    );
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.stepByStepActions.length).toBeGreaterThan(0);
      expect(r.completionCriteria.length).toBeGreaterThan(0);
      expect(r.howToComplete.length).toBeGreaterThan(0);
    }
  });
});

describe('generateRecommendations', () => {
  it('dedupes, scores and sorts by priority desc', () => {
    const recs = generateRecommendations(
      bundle({
        analyticsConfigured: false,
        sportCoverage: [
          { sportId: 'golf', sportName: 'Golf', drillCount: 40 },
          { sportId: 'padel', sportName: 'Padel', drillCount: 1 },
        ],
      }),
    );
    expect(recs.length).toBeGreaterThan(1);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].priorityScore).toBeGreaterThanOrEqual(recs[i].priorityScore);
    }
    // ids are unique
    expect(new Set(recs.map((r) => r.id)).size).toBe(recs.length);
  });

  it('omits baseline seeds when includeBaseline is false', () => {
    const withSeeds = generateRecommendations(bundle(), { includeBaseline: true });
    const without = generateRecommendations(bundle(), { includeBaseline: false });
    expect(withSeeds.some((r) => r.isSeed)).toBe(true);
    expect(without.some((r) => r.isSeed)).toBe(false);
  });
});

describe('dedupeRecommendations', () => {
  it('merges evidence and keeps the higher score', () => {
    const a = { id: 'x', priorityScore: 50, evidence: ['a'] } as unknown as Recommendation;
    const b = { id: 'x', priorityScore: 80, evidence: ['b'] } as unknown as Recommendation;
    const out = dedupeRecommendations([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].priorityScore).toBe(80);
    expect(out[0].evidence.sort()).toEqual(['a', 'b']);
  });
});

describe('applyOverrides + roll-ups', () => {
  const recs = generateRecommendations(bundle({ analyticsConfigured: false }));

  it('defaults to active with no overrides', () => {
    const views = applyOverrides(recs, {}, NOW);
    expect(views.every((v) => v.status === 'active')).toBe(true);
  });

  it('reverts an expired snooze to active', () => {
    const id = recs[0].id;
    const overrides: OverrideMap = {
      [id]: { status: 'snoozed', snoozedUntil: '2000-01-01T00:00:00.000Z', updatedAt: NOW },
    };
    const view = applyOverrides(recs, overrides, NOW).find((v) => v.id === id)!;
    expect(view.status).toBe('active');
  });

  it('keeps an unexpired snooze snoozed', () => {
    const id = recs[0].id;
    const overrides: OverrideMap = {
      [id]: { status: 'snoozed', snoozedUntil: '2999-01-01T00:00:00.000Z', updatedAt: NOW },
    };
    const view = applyOverrides(recs, overrides, NOW).find((v) => v.id === id)!;
    expect(view.status).toBe('snoozed');
  });

  it('marks a completed item reopened when its score rises past the delta', () => {
    const target = recs[0];
    const overrides: OverrideMap = {
      [target.id]: {
        status: 'completed',
        completedAt: NOW,
        scoreAtAction: target.priorityScore - REOPEN_DELTA - 1,
        updatedAt: NOW,
      },
    };
    const view = applyOverrides(recs, overrides, NOW).find((v) => v.id === target.id)!;
    expect(view.status).toBe('completed');
    expect(view.reopened).toBe(true);
  });

  it('summarize counts actionable items and excludes completed/dismissed', () => {
    const id = recs[0].id;
    const overrides: OverrideMap = { [id]: { status: 'completed', completedAt: NOW, updatedAt: NOW } };
    const views = applyOverrides(recs, overrides, NOW);
    const s = summarize(views);
    expect(s.completed).toBe(1);
    expect(s.needsAttention).toBe(views.length - 1);
  });

  it('pickDailyFocus returns the highest-scoring actionable item', () => {
    const views = applyOverrides(recs, {}, NOW);
    const focus = pickDailyFocus(views)!;
    const maxScore = Math.max(...views.map((v) => v.priorityScore));
    expect(focus.priorityScore).toBe(maxScore);
  });

  it('routes completed items only to the completed section', () => {
    const completed = applyOverrides(recs, { [recs[0].id]: { status: 'completed', updatedAt: NOW } }, NOW)
      .find((v) => v.id === recs[0].id)!;
    expect(sectionsFor(completed)).toEqual(['completed']);
  });
});
