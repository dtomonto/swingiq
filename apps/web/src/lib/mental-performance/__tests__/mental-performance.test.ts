// ============================================================
// SwingVantage — Mental Performance: unit tests
// Runs in the default (node) jest env with a tiny localStorage polyfill for
// the store tests, so it needs no jsdom dependency.
// ============================================================

import {
  MENTAL_ROUTINES, getRoutine, getRoutinesForSport, getUniversalRoutines,
  routineForContext, getAllSituationParams,
} from '../routines';
import { MISTAKE_CATEGORIES } from '../constants';
import { buildCoachResponse } from '../coach';
import { screenForCrisis, isMedicalAdviceRequest } from '../crisis';
import { buildPlan, planCatalog, PLAN_TYPES } from '../plans';
import { generateJournalInsights } from '../journal';
import {
  generateMentalInsights, generateMentalRecommendations, sampleMentalSignals,
  aggregateMentalSignals, MENTAL_K,
} from '../intelligence';
import { generateMentalOpportunities, routineCoverageGaps } from '../growth';
import { generateMeditationScript, generateRoutineVideoBrief } from '../scripts';
import type { MentalSport, MentalLog, MentalIntelligenceSignals } from '../types';

const SPORTS: MentalSport[] = [
  'golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast',
];

// ── Routines ─────────────────────────────────────────────────
describe('routine library', () => {
  it('has unique ids and required fields on every routine', () => {
    const ids = new Set<string>();
    for (const r of MENTAL_ROUTINES) {
      expect(ids.has(r.id)).toBe(false);
      ids.add(r.id);
      expect(r.id).toBe(r.slug);
      expect(r.sports.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThanOrEqual(3);
      expect(r.breathPattern).toBeTruthy();
      expect(r.selfTalkCue).toBeTruthy();
      expect(r.durationSeconds).toBeGreaterThan(0);
    }
  });

  it('every sport plus universal has at least one routine', () => {
    for (const s of SPORTS) expect(getRoutinesForSport(s).length).toBeGreaterThan(0);
    expect(getUniversalRoutines().length).toBeGreaterThan(0);
  });

  it('every mistake-category routineSlug resolves to a real routine', () => {
    for (const m of MISTAKE_CATEGORIES) {
      expect(getRoutine(m.routineSlug)).toBeDefined();
    }
  });

  it('generateStaticParams covers the spec deep URLs', () => {
    const params = getAllSituationParams();
    const has = (sport: string, situation: string) =>
      params.some((p) => p.sport === sport && p.situation === situation);
    expect(has('golf', 'bad-shot-reset')).toBe(true);
    expect(has('golf', 'three-putt-recovery')).toBe(true);
    expect(has('baseball', 'error-recovery')).toBe(true);
    expect(has('softball_slow', 'error-recovery')).toBe(true);
    expect(has('softball_fast', 'fielding-confidence')).toBe(true);
    expect(has('tennis', 'between-point-reset')).toBe(true);
    expect(has('pickleball', 'forced-error-recovery')).toBe(true);
    expect(has('padel', 'match-focus')).toBe(true);
    expect(has('universal', 'pre-game-routine')).toBe(true);
    expect(has('universal', 'confidence-rebuilding')).toBe(true);
  });

  it('routineForContext maps mistakes and falls back safely', () => {
    expect(routineForContext('golf', 'three_putt').id).toBe('three-putt-recovery');
    expect(routineForContext('tennis', 'forced_error').id).toBe('forced-error-recovery');
    expect(routineForContext('pickleball', 'partner_frustration').id).toBe('doubles-frustration-reset');
    // Unknown context → family default.
    expect(routineForContext('golf', 'totally-unknown').id).toBe('bad-shot-reset');
    expect(routineForContext('baseball', 'totally-unknown').id).toBe('error-recovery');
    expect(routineForContext('tennis', 'totally-unknown').id).toBe('unforced-error-reset');
    // No context at all still returns a routine.
    expect(routineForContext('golf').id).toBeTruthy();
    // Fault keyword match (e.g. a detected slice).
    expect(routineForContext('golf', 'slice').sports).toContain('golf');
  });
});

// ── Coach ────────────────────────────────────────────────────
describe('deterministic coach', () => {
  it('golf chunk + angry → bad-shot reset with a wedge drill', () => {
    const r = buildCoachResponse({ sport: 'golf', mistake: 'chunked_wedge', emotion: 'angry' });
    expect(r.kind).toBe('coaching');
    expect(r.routine?.id).toBe('bad-shot-reset');
    expect(r.selfTalk).toContain('Next best swing');
    expect(r.drill?.name.toLowerCase()).toContain('wedge');
    expect(r.breathPattern).toBeTruthy();
    expect(r.reflectionPrompt).toBeTruthy();
  });

  it('softball fielding error → error-recovery with "want the next one"', () => {
    const r = buildCoachResponse({ sport: 'softball_fast', mistake: 'fielding_error', emotion: 'embarrassed' });
    expect(r.routine?.id).toBe('error-recovery');
    expect(r.selfTalk.toLowerCase()).toContain('want the next one');
    expect(r.nextActionCue.toLowerCase()).toContain('feet');
  });

  it('tennis forced vs unforced error are distinguished', () => {
    const forced = buildCoachResponse({ sport: 'tennis', mistake: 'forced_error' });
    expect(forced.errorClass).toBe('forced');
    expect(forced.tone).toBe('tactical');
    expect(forced.whatHappened.toLowerCase()).toContain('forced');

    const unforced = buildCoachResponse({ sport: 'tennis', mistake: 'unforced_error' });
    expect(unforced.errorClass).toBe('unforced');
    expect(unforced.routine?.id).toBe('unforced-error-reset');
  });

  it('crisis language short-circuits to safe referral, NO coaching', () => {
    const r = buildCoachResponse({ sport: 'golf', freeText: 'honestly I want to kill myself' });
    expect(r.kind).toBe('crisis');
    expect(r.routine).toBeNull();
    expect(r.safety?.flagged).toBe(true);
    expect(r.safety?.resources.length).toBeGreaterThan(0);
    expect(r.selfTalk).toBe('');
  });

  it('medical-advice request redirects, NO coaching', () => {
    const r = buildCoachResponse({ sport: 'tennis', freeText: 'do I have depression?' });
    expect(r.kind).toBe('medical_redirect');
    expect(r.routine).toBeNull();
    expect(r.safety?.flagged).toBe(true);
  });

  it('normal sport idiom is NOT treated as a crisis', () => {
    const r = buildCoachResponse({ sport: 'golf', mistake: 'three_putt', freeText: 'this round is killing me' });
    expect(r.kind).toBe('coaching');
    expect(r.routine?.id).toBe('three-putt-recovery');
  });

  it('always carries a non-medical disclaimer', () => {
    const r = buildCoachResponse({ sport: 'golf', mistake: 'shank' });
    expect(r.disclaimer.toLowerCase()).toContain('not medical');
  });
});

// ── Crisis / medical screen ──────────────────────────────────
describe('safety screen', () => {
  it('flags genuine self-harm / harm-to-others language', () => {
    for (const t of [
      'I want to kill myself',
      'thinking about ending my life',
      'I feel suicidal',
      'I might hurt myself',
      'I want to hurt someone',
      "there's no reason to live",
    ]) {
      expect(screenForCrisis(t).flagged).toBe(true);
      expect(screenForCrisis(t).severity).toBe('urgent');
    }
  });

  it('does NOT flag common sport idioms or normal frustration', () => {
    for (const t of [
      'I want to kill this putt',
      'this heat is killing me',
      'I was dying out there',
      "I'm so frustrated I could scream",
      'that shot was dead',
    ]) {
      expect(screenForCrisis(t).flagged).toBe(false);
    }
  });

  it('detects clinical-advice requests but not therapist encouragement', () => {
    expect(isMedicalAdviceRequest('what medication should I take')).toBe(true);
    expect(isMedicalAdviceRequest('do I have an anxiety disorder')).toBe(true);
    expect(isMedicalAdviceRequest('can you diagnose me')).toBe(true);
    expect(isMedicalAdviceRequest('I am just frustrated today')).toBe(false);
    expect(isMedicalAdviceRequest('should I see a therapist')).toBe(false);
  });

  it('empty text is never flagged', () => {
    expect(screenForCrisis('').flagged).toBe(false);
    expect(screenForCrisis(null).flagged).toBe(false);
    expect(isMedicalAdviceRequest(undefined)).toBe(false);
  });
});

// ── Plans ────────────────────────────────────────────────────
describe('training plans', () => {
  it('builds multi-day plans with complete days', () => {
    const p = buildPlan('reset_7', 'golf');
    expect(p.days).toHaveLength(7);
    for (const d of p.days) {
      expect(d.skillFocus).toBeTruthy();
      expect(d.exercise).toBeTruthy();
      expect(d.sportApplication).toBeTruthy();
      expect(d.reflectionPrompt).toBeTruthy();
      expect(d.progressMarker).toBeTruthy();
      expect(d.routineId).toBeTruthy();
    }
    expect(buildPlan('confidence_30').days).toHaveLength(30);
  });

  it('focused single-session plans use their module list', () => {
    const pre = buildPlan('pre_round', 'golf');
    expect(pre.days.length).toBe(4);
    expect(pre.planType).toBe('pre_round');
  });

  it('sport tailors the application text', () => {
    const golf = buildPlan('reset_7', 'golf');
    const tennis = buildPlan('reset_7', 'tennis');
    expect(golf.days[0].sportApplication).not.toBe(tennis.days[0].sportApplication);
  });

  it('exposes a catalog and the plan-type list', () => {
    expect(planCatalog().length).toBeGreaterThan(5);
    expect(PLAN_TYPES).toContain('reset_7');
    expect(PLAN_TYPES).toContain('confidence_30');
  });
});

// ── Journal insights ─────────────────────────────────────────
describe('journal insights', () => {
  const mk = (over: Partial<MentalLog>): MentalLog => ({
    id: Math.random().toString(36).slice(2), date: '2026-06-01T12:00:00Z',
    sport: 'golf', sessionType: 'competition', mistake: 'three_putt', emotion: 'frustrated',
    intensity: 4, recoverySpeed: 3, whatIDidNext: '', whatWorked: '', whatDidnt: '',
    nextTimeCue: '', confidence: 3, focus: 3, composure: 3, routineUsed: null,
    effectiveness: null, reflection: '', ...over,
  });

  it('empty logs return a friendly zero state', () => {
    const ins = generateJournalInsights([]);
    expect(ins.total).toBe(0);
    expect(ins.pressureReadiness).toBeNull();
    expect(ins.headline).toBeTruthy();
  });

  it('counts triggers and computes readiness with enough data', () => {
    const logs = [
      mk({ emotion: 'frustrated', date: '2026-06-01T10:00:00Z' }),
      mk({ emotion: 'frustrated', date: '2026-06-02T10:00:00Z' }),
      mk({ emotion: 'nervous', date: '2026-06-03T10:00:00Z' }),
    ];
    const ins = generateJournalInsights(logs);
    expect(ins.total).toBe(3);
    expect(ins.topTriggers[0].emotion).toBe('frustrated');
    expect(ins.topTriggers[0].count).toBe(2);
    expect(ins.pressureReadiness).not.toBeNull();
    expect(ins.composureTrend[0].date <= ins.composureTrend[1].date).toBe(true);
  });
});

// ── CentralIntelligenceOS layer ──────────────────────────────
describe('mental intelligence (CIOS)', () => {
  it('produces insights + recommendations from sample signals', () => {
    const s = sampleMentalSignals();
    const insights = generateMentalInsights(s);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some((i) => i.kind === 'gap')).toBe(true);

    const recs = generateMentalRecommendations(s);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.area === 'mental_performance')).toBe(true);
  });

  it('enforces k-anonymity (suppresses small cohorts)', () => {
    const tiny: MentalIntelligenceSignals = {
      activeUsers: 3,
      triggersBySport: [{ sport: 'golf', emotion: 'frustrated', count: MENTAL_K - 1 }],
      mistakeCounts: [{ sport: 'golf', mistake: 'three_putt', count: MENTAL_K - 1 }],
      routineStats: [],
      shortVsLong: { shortCompletionRate: 50, longCompletionRate: 50 },
      contentGaps: [{ sport: 'golf', situation: 'x', demand: MENTAL_K - 1 }],
    };
    expect(generateMentalInsights(tiny)).toHaveLength(0);
  });
});

// ── GrowthOS layer ───────────────────────────────────────────
describe('mental growth opportunities', () => {
  it('generates prioritized opportunities including internal links', () => {
    const opps = generateMentalOpportunities(sampleMentalSignals());
    expect(opps.length).toBeGreaterThan(0);
    expect(opps.some((o) => o.opportunityType === 'aeo_answer')).toBe(true);
    expect(opps.some((o) => o.opportunityType === 'internal_link')).toBe(true);
    // sorted descending by priority
    for (let i = 1; i < opps.length; i++) {
      expect(opps[i - 1].priorityScore).toBeGreaterThanOrEqual(opps[i].priorityScore);
    }
  });

  it('reports no routine-coverage gaps (all 7 sports covered)', () => {
    expect(routineCoverageGaps()).toHaveLength(0);
  });
});

// ── Store (consent-gated, local-first) ───────────────────────
describe('store', () => {
  const mem: Record<string, string> = {};
  const localStorageMock = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = String(v); },
    removeItem: (k: string) => { delete mem[k]; },
    clear: () => { for (const k of Object.keys(mem)) delete mem[k]; },
  };

  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
  let store: typeof import('../store');

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    g.window = {
      localStorage: localStorageMock,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    g.localStorage = localStorageMock;
    g.Event = class { type: string; constructor(t: string) { this.type = t; } };
    g.StorageEvent = class { type: string; constructor(t: string) { this.type = t; } };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    store = require('../store');
  });

  beforeEach(() => {
    localStorageMock.clear();
    store.clearAllMentalData();
  });

  const baseLog = {
    sport: 'golf' as MentalSport, sessionType: 'competition' as const, mistake: 'three_putt',
    emotion: 'frustrated' as const, intensity: 4, recoverySpeed: 3, whatIDidNext: '',
    whatWorked: '', whatDidnt: '', nextTimeCue: '', confidence: 3, focus: 3, composure: 3,
    routineUsed: null, effectiveness: null, reflection: '',
  };

  it('consent enables the section and stamps a date', () => {
    store.consent();
    const s = store.read();
    expect(s.settings.enabled).toBe(true);
    expect(s.settings.consentedAt).toBeTruthy();
  });

  it('does NOT store logs without explicit storeLogs consent', () => {
    store.consent();
    const ok = store.saveLog(baseLog);
    expect(ok).toBe(false);
    expect(store.read().logs).toHaveLength(0);
  });

  it('stores logs once storeLogs consent is given; deletes + clears', () => {
    store.consent();
    store.setStoreLogs(true);
    expect(store.saveLog(baseLog)).toBe(true);
    let logs = store.read().logs;
    expect(logs).toHaveLength(1);
    store.deleteLog(logs[0].id);
    expect(store.read().logs).toHaveLength(0);
    store.setStoreLogs(true);
    store.saveLog(baseLog);
    store.clearAllLogs();
    expect(store.read().logs).toHaveLength(0);
  });

  it('assigns a plan and completes it on the last day', () => {
    const plan = buildPlan('pre_round', 'golf'); // 4 focused days
    const a = store.assignPlan(plan);
    expect(store.read().planAssignments[0].status).toBe('active');
    for (const d of plan.days) store.advancePlanDay(a.id, d.day, plan.days.length);
    const done = store.read().planAssignments.find((x) => x.id === a.id);
    expect(done?.status).toBe('completed');
    expect(done?.completionDate).toBeTruthy();
  });

  it('setProfile persists and stamps updatedAt; full erase resets', () => {
    store.setProfile({ confidence: 4, preferredTone: 'calm' });
    expect(store.read().profile.confidence).toBe(4);
    expect(store.read().profile.updatedAt).toBeTruthy();
    store.clearAllMentalData();
    expect(store.read().profile.confidence).toBeNull();
  });
});

// ── Real aggregator (backend logic behind the seam) ──────────
describe('aggregateMentalSignals', () => {
  const log = (over: Partial<MentalLog>): MentalLog => ({
    id: Math.random().toString(36).slice(2), date: '2026-06-01T12:00:00Z',
    sport: 'golf', sessionType: 'competition', mistake: 'three_putt', emotion: 'frustrated',
    intensity: 4, recoverySpeed: 3, whatIDidNext: '', whatWorked: '', whatDidnt: '',
    nextTimeCue: '', confidence: 3, focus: 3, composure: 3, routineUsed: 'three-putt-recovery',
    effectiveness: 4, reflection: '', ...over,
  });

  it('computes real trigger/mistake/routine counts from logs', () => {
    const s = aggregateMentalSignals([
      log({}), log({}), log({ emotion: 'angry', mistake: 'shank', routineUsed: 'shank-reset' }),
    ]);
    const frustrated = s.triggersBySport.find((t) => t.emotion === 'frustrated' && t.sport === 'golf');
    expect(frustrated?.count).toBe(2);
    const threePutt = s.mistakeCounts.find((m) => m.mistake === 'three_putt');
    expect(threePutt?.count).toBe(2);
    const routine = s.routineStats.find((r) => r.routineId === 'three-putt-recovery');
    expect(routine?.starts).toBe(2);
    expect(routine?.avgEffectiveness).toBe(4);
  });

  it('does not fabricate completion telemetry, and empty logs give zeros', () => {
    const s = aggregateMentalSignals([]);
    expect(s.activeUsers).toBe(0);
    expect(s.triggersBySport).toHaveLength(0);
    expect(s.shortVsLong).toEqual({ shortCompletionRate: 0, longCompletionRate: 0 });
  });

  it('feeds the insight engine (with enough volume + userCount)', () => {
    const logs = Array.from({ length: MENTAL_K }, () => log({}));
    const insights = generateMentalInsights(aggregateMentalSignals(logs, 20));
    expect(insights.some((i) => i.kind === 'pattern')).toBe(true);
  });
});

// ── Guided-routine scripts (Phase 4 groundwork) ──────────────
describe('meditation scripts', () => {
  it('builds a timed narration with breath cue, steps, and a close', () => {
    const routine = getRoutine('bad-shot-reset')!;
    const script = generateMeditationScript(routine);
    expect(script.routineId).toBe('bad-shot-reset');
    expect(script.lines.length).toBe(routine.steps.length + 1); // +1 breath cue
    expect(script.lines[0].text.toLowerCase()).toContain('breathe');
    expect(script.voiceover).toContain(routine.selfTalkCue);
    expect(script.wordCount).toBeGreaterThan(20);
    // timestamps are non-decreasing
    for (let i = 1; i < script.lines.length; i++) {
      expect(script.lines[i].at).toBeGreaterThanOrEqual(script.lines[i - 1].at);
    }
  });

  it('builds a draft video brief for the Video Studio pipeline', () => {
    const routine = getRoutine('error-recovery')!;
    const brief = generateRoutineVideoBrief(routine);
    expect(brief.status).toBe('draft');
    expect(brief.voiceoverScript.length).toBeGreaterThan(0);
    expect(brief.onScreenText).toHaveLength(routine.steps.length);
    expect(brief.sports).toEqual(routine.sports);
  });
});

// ── Parent / coach guidance mode ─────────────────────────────
describe('coach parent/coach mode', () => {
  it('reframes guidance for a supporting adult, keeping the routine', () => {
    const r = buildCoachResponse({ sport: 'baseball', mistake: 'fielding_error', mode: 'parent_coach' });
    expect(r.kind).toBe('coaching');
    expect(r.routine?.id).toBe('error-recovery');
    expect(r.whatHappened.toLowerCase()).toContain('your athlete');
    expect(r.selfTalk.toLowerCase()).toContain('next');
  });

  it('still short-circuits on crisis text even in parent/coach mode', () => {
    const r = buildCoachResponse({ sport: 'golf', mode: 'parent_coach', freeText: 'I want to kill myself' });
    expect(r.kind).toBe('crisis');
    expect(r.routine).toBeNull();
  });
});
