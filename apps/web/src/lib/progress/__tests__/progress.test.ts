// ============================================================
// SwingVantage — Progress Intelligence: Unit Tests
// ------------------------------------------------------------
// Guarantees Player Arc / Flaw Fingerprint / Training Receipt are
// honest: they summarize only what the data supports, surface real
// drill-feedback verdicts, and never claim a flaw is "fixed".
// ============================================================

import { buildPlayerArc, buildFlawFingerprint, buildTrainingReceipt } from '..';
import type { ProgressMemory, SessionSummary } from '@/lib/agents';
import type { RetestResult } from '@/lib/retest';
import type { DrillFeedbackRecord } from '@/lib/drillmatch';

function session(partial: Partial<SessionSummary> & { id: string; date: string }): SessionSummary {
  return {
    sport: 'golf',
    source: 'video',
    name: 'Session',
    primaryFocus: null,
    focusConfidence: null,
    score: null,
    shotCount: 0,
    hasDiagnosis: false,
    ...partial,
  };
}

const baseProgress: ProgressMemory = {
  trendSummary: 'Holding steady.',
  direction: 'stable',
  improvedAreas: [],
  stalledAreas: [],
  worsenedAreas: [],
  recurringPatterns: [],
  suggestedAdjustment: 'Pick one focus.',
  nextBestAction: 'Re-test your top focus.',
};

describe('Player Arc', () => {
  it('is empty + honest with no sessions', () => {
    const arc = buildPlayerArc({
      sport: 'golf',
      sportLabel: 'Golf',
      sessions: [],
      streakDays: 0,
      planStatus: 'none',
      daysSinceLastActivity: null,
      progress: baseProgress,
      retestResults: [],
      retestTargets: [],
    });
    expect(arc.hasData).toBe(false);
    expect(arc.mission.toLowerCase()).toContain('first');
    expect(arc.milestones).toHaveLength(0);
  });

  it('summarizes mission, baseline, recurring + moved-past flaws and milestones', () => {
    const sessions: SessionSummary[] = [
      session({ id: 's3', date: '2026-05-30', primaryFocus: 'over the top', hasDiagnosis: true }),
      session({ id: 's2', date: '2026-05-20', primaryFocus: 'over the top', hasDiagnosis: true }),
      session({ id: 's1', date: '2026-05-10', primaryFocus: 'early extension', hasDiagnosis: true }),
    ];
    const arc = buildPlayerArc({
      sport: 'golf',
      sportLabel: 'Golf',
      sessions,
      streakDays: 4,
      planStatus: 'in_progress',
      daysSinceLastActivity: 1,
      progress: { ...baseProgress, direction: 'improving', recurringPatterns: ['over the top'] },
      retestResults: [{} as RetestResult],
      retestTargets: [],
    });
    expect(arc.hasData).toBe(true);
    expect(arc.mission).toContain('over the top');
    expect(arc.baseline).toContain('first focus: early extension');
    expect(arc.recurringFlaws).toContain('over the top');
    // "early extension" is older, not current top, not recurring → moved past.
    expect(arc.movedPastFlaws).toContain('early extension');
    expect(arc.sessionsLogged).toBe(3);
    expect(arc.retestsCompleted).toBe(1);
    expect(arc.milestones).toEqual(
      expect.arrayContaining(['First swing analyzed', '3 sessions logged', '4-day practice streak', 'First retest completed', 'Score trending up']),
    );
  });
});

describe('Flaw Fingerprint', () => {
  it('identifies the most common flaw, its pattern, and helpful drills', () => {
    const sportSessions: SessionSummary[] = [
      session({ id: 'a', date: '2026-05-30', primaryFocus: 'over the top' }),
      session({ id: 'b', date: '2026-05-20', primaryFocus: 'over the top' }),
      session({ id: 'c', date: '2026-05-10', primaryFocus: 'early extension' }),
    ];
    const feedback: DrillFeedbackRecord[] = [
      { drillId: 'drill_ott_headcover', faultId: 'over_the_top', sport: 'golf', value: 'helped', recordedAt: '2026-05-31' },
      { drillId: 'drill_ott_gate', faultId: 'over_the_top', sport: 'golf', value: 'no_change', recordedAt: '2026-05-31' },
    ];
    const fp = buildFlawFingerprint({
      sport: 'golf',
      allSessions: sportSessions,
      sportSessions,
      drillFeedback: feedback,
    });
    expect(fp.hasData).toBe(true);
    expect(fp.mostCommonFlaw).toBe('over the top');
    expect(fp.occurrences).toBe(2);
    expect(fp.relatedFlaws).toContain('early extension');
    expect(fp.sportsAffected).toContain('golf');
    expect(fp.patternExplanation.length).toBeGreaterThan(10);
    expect(fp.drillsThatHelped.map((d) => d.drillId)).toContain('drill_ott_headcover');
    expect(fp.drillsThatHelped[0].name).not.toMatch(/^A drill you tried$/); // resolved to a real name
    expect(fp.drillsThatDidNot.map((d) => d.drillId)).toContain('drill_ott_gate');
    expect(fp.nextIntervention.toLowerCase()).toContain('keep');
  });

  it('is empty + honest with no diagnosed sessions', () => {
    const fp = buildFlawFingerprint({ sport: 'tennis', allSessions: [], sportSessions: [], drillFeedback: [] });
    expect(fp.hasData).toBe(false);
    expect(fp.mostCommonFlaw).toBeNull();
  });
});

describe('Training Receipt', () => {
  it('is unavailable + honest before any retest', () => {
    const r = buildTrainingReceipt({ sport: 'golf', latestResult: null, drillFeedbackForFault: [], drillsTried: [] });
    expect(r.available).toBe(false);
    expect(r.nextRecommendation.length).toBeGreaterThan(0);
    expect(r.confidenceNote.toLowerCase()).toContain('direction');
  });

  it('summarizes an improved practice→retest cycle with drill effectiveness', () => {
    const result: RetestResult = {
      id: 'r1',
      sport: 'golf',
      sportLabel: 'Golf',
      priorFocus: 'over the top',
      priorDate: '2026-05-20',
      currentDate: '2026-05-30',
      comparison: {
        outcome: 'improved',
        headline: 'Looks like progress',
        detail: 'Your prior top focus is no longer the headline issue.',
        sameConditionsMet: true,
        cautions: [],
        confidenceNote: 'This is a directional read from video, not a measured number.',
      },
    };
    const r = buildTrainingReceipt({
      sport: 'golf',
      latestResult: result,
      drillFeedbackForFault: [
        { drillId: 'drill_ott_headcover', faultId: 'over_the_top', sport: 'golf', value: 'helped', recordedAt: '2026-05-29' },
      ],
      drillsTried: [{ drillId: 'drill_ott_headcover', name: 'Headcover Outside Ball Drill' }],
    });
    expect(r.available).toBe(true);
    expect(r.outcome).toBe('improved');
    expect(r.diagnosed).toBe('over the top');
    expect(r.whatChanged).toContain('Looks like progress');
    expect(r.drillEffectiveness.toLowerCase()).toContain('working');
    expect(r.nextRecommendation.toLowerCase()).toContain('lock in');
    expect(r.confidenceNote.length).toBeGreaterThan(0);
  });
});
