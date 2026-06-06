// ============================================================
// SwingVantage — Agent: Live Practice Companion — Unit Tests
// ============================================================

import type { PracticePlan } from '../../types';
import type { CompanionPlan, CompanionState } from '../types';
import {
  fromPracticePlan, startSession, recordRep, advanceDrill, repeatDrill, finishSession, coach,
} from '../engine';

const plan: CompanionPlan = {
  sport: 'golf',
  focus: 'Center contact',
  drills: [
    { name: 'Tee gate', cue: 'Brush the tee', repsTarget: 4, successThreshold: 0.6, level: 1 },
    { name: 'Step drill', cue: 'Stay in posture', repsTarget: 4, successThreshold: 0.6, level: 1 },
  ],
};

const repN = (s: CompanionState, success: boolean, n: number): CompanionState => {
  let next = s;
  for (let i = 0; i < n; i += 1) next = recordRep(next, success);
  return next;
};

describe('practice companion — lifecycle', () => {
  it('starts active and coaches the first drill one rep at a time', () => {
    const s = startSession(plan, new Date('2026-06-06T10:00:00'));
    expect(s.status).toBe('active');
    const g = coach(s);
    expect(g.phase).toBe('in_drill');
    expect(g.drillName).toBe('Tee gate');
    expect(g.cue).toBe('Brush the tee');
    expect(g.repsTarget).toBe(4);
    expect(g.recommendedAction).toBe('rep');
    expect(g.instruction).toBe('Rep 1 of 4');
  });

  it('judges a perfect round as mastered and recommends moving on', () => {
    const s = repN(startSession(plan), true, 4);
    const g = coach(s);
    expect(g.phase).toBe('drill_complete');
    expect(g.verdict).toBe('mastered');
    expect(g.recommendedAction).toBe('next');
  });

  it('levels up the next drill after mastery', () => {
    const mastered = repN(startSession(plan), true, 4);
    const s = advanceDrill(mastered);
    expect(s.index).toBe(1);
    expect(s.drills[1].level).toBe(2);
    expect(s.drills[1].repsTarget).toBe(5); // bumped from 4
    expect(s.reps).toHaveLength(0);
    expect(s.history).toHaveLength(1);
    expect(s.history[0].verdict).toBe('mastered');
  });

  it('recommends a repeat after a struggle and deloads the bar', () => {
    const struggled = repN(startSession(plan), false, 3);
    const s4 = recordRep(struggled, true); // 1/4 = 0.25
    const g = coach(s4);
    expect(g.verdict).toBe('struggled');
    expect(g.recommendedAction).toBe('repeat');

    const retry = repeatDrill(s4);
    expect(retry.reps).toHaveLength(0);
    expect(retry.drills[0].successThreshold).toBeLessThan(0.6);
  });

  it('completes after the last drill and produces an honest summary', () => {
    let s = repN(startSession(plan, new Date('2026-06-06T10:00:00')), true, 4);
    s = advanceDrill(s);            // → drill 2 (now repsTarget 5)
    s = repN(s, true, s.drills[1].repsTarget);
    s = advanceDrill(s, new Date('2026-06-06T10:20:00')); // past last → complete
    expect(s.status).toBe('complete');
    const g = coach(s);
    expect(g.phase).toBe('summary');
    expect(g.summary?.drillsRun).toBe(2);
    expect(g.summary?.totalReps).toBe(9); // 4 + 5
    expect(g.summary?.drillsMastered).toBe(2);
    expect(g.summary?.durationMinutes).toBe(20);
    expect(g.summary?.retestPrompt).toContain('Center contact');
  });

  it('finishSession banks in-progress reps so the summary stays honest', () => {
    const s = finishSession(repN(startSession(plan), true, 2));
    expect(s.status).toBe('complete');
    expect(s.history).toHaveLength(1);
    expect(s.history[0].attempts).toBe(2);
  });
});

describe('practice companion — fromPracticePlan adapter', () => {
  it('maps drills and parses rep targets from free text', () => {
    const practice = {
      sport: 'golf',
      practiceFocus: 'Strike',
      mainDrills: [
        { name: 'A', why: 'feel the lag', repsOrTime: '10 reps', successMetric: 'x' },
        { name: 'B', why: '', repsOrTime: '90 seconds', successMetric: 'x' },
        { name: 'C', why: 'tempo', repsOrTime: 'until comfortable', successMetric: 'x' },
      ],
    } as unknown as PracticePlan;

    const cp = fromPracticePlan(practice);
    expect(cp.drills).toHaveLength(3);
    expect(cp.drills[0].repsTarget).toBe(10);
    expect(cp.drills[1].repsTarget).toBe(15); // clamped from 90
    expect(cp.drills[2].repsTarget).toBe(6);  // no number → default
    expect(cp.drills[1].cue.length).toBeGreaterThan(0); // empty why → sport default cue
  });
});
