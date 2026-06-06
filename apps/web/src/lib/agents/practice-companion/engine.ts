// ============================================================
// SwingVantage — Agent: Live Practice Companion — Engine
// ------------------------------------------------------------
// A deterministic, immutable reducer that coaches a practice
// session rep-by-rep and adapts as it goes. Pure, SSR-safe, never
// throws. State is fully serializable so a caller can persist it
// (see save/load) and resume later — mirroring agi/commitment's
// own-key pattern, with no store-schema changes.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { PracticePlan } from '../types';
import { getSportAgentProfile } from '../sport-profiles';
import type {
  CompanionDrill,
  CompanionGuidance,
  CompanionPlan,
  CompanionState,
  CompanionSummary,
  DrillOutcome,
  DrillVerdict,
} from './types';

const MASTERED_RATE = 0.8;
const MIN_REPS = 3;
const MAX_REPS = 15;
const DEFAULT_REPS = 6;
const DEFAULT_THRESHOLD = 0.6;

// ── Adapter: PracticePlan → CompanionPlan ─────────────────────

/** Pull the first integer out of a "reps or time" string, clamped sanely. */
function parseReps(repsOrTime: string): number {
  const m = repsOrTime.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : DEFAULT_REPS;
  if (!Number.isFinite(n)) return DEFAULT_REPS;
  return Math.max(MIN_REPS, Math.min(MAX_REPS, n));
}

/** Map a static PracticePlan into a runnable CompanionPlan. */
export function fromPracticePlan(plan: PracticePlan): CompanionPlan {
  const sp = getSportAgentProfile(plan.sport);
  const drills: CompanionDrill[] = (plan.mainDrills ?? []).map((d) => ({
    name: d.name,
    cue: d.why?.trim() || sp.defaultCue,
    repsTarget: parseReps(d.repsOrTime ?? ''),
    successThreshold: DEFAULT_THRESHOLD,
    level: 1,
  }));
  return { sport: plan.sport, focus: plan.practiceFocus, drills };
}

// ── Lifecycle ─────────────────────────────────────────────────

export function startSession(plan: CompanionPlan, now: Date = new Date()): CompanionState {
  return {
    sport: plan.sport,
    focus: plan.focus,
    drills: plan.drills.map((d) => ({ ...d })),
    index: 0,
    status: plan.drills.length ? 'active' : 'complete',
    reps: [],
    history: [],
    startedAt: now.toISOString(),
    endedAt: plan.drills.length ? null : now.toISOString(),
  };
}

/** Record one rep against the current drill. No-op unless active. */
export function recordRep(state: CompanionState, success: boolean): CompanionState {
  if (state.status !== 'active') return state;
  return { ...state, reps: [...state.reps, { success }] };
}

function verdictFor(rate: number, threshold: number): DrillVerdict {
  if (rate >= MASTERED_RATE) return 'mastered';
  if (rate >= threshold) return 'progressing';
  return 'struggled';
}

function outcomeFor(drill: CompanionDrill, reps: CompanionState['reps']): DrillOutcome {
  const attempts = reps.length;
  const successes = reps.filter((r) => r.success).length;
  const rate = attempts ? successes / attempts : 0;
  return {
    name: drill.name,
    attempts,
    successes,
    successRate: Math.round(rate * 100) / 100,
    verdict: verdictFor(rate, drill.successThreshold),
    level: drill.level,
  };
}

/**
 * Finalize the current drill, adapt the NEXT one, and advance. Mastery levels
 * up the next drill (harder bar + one more rep); a struggle leaves it as-is.
 */
export function advanceDrill(state: CompanionState, now: Date = new Date()): CompanionState {
  if (state.status !== 'active') return state;
  const drill = state.drills[state.index];
  if (!drill) return finishSession(state, now);

  const outcome = outcomeFor(drill, state.reps);
  const history = [...state.history, outcome];

  const nextIndex = state.index + 1;
  if (nextIndex >= state.drills.length) {
    return { ...state, history, index: nextIndex, reps: [], status: 'complete', endedAt: now.toISOString() };
  }

  // Adapt the upcoming drill based on how this one went.
  const drills = state.drills.map((d) => ({ ...d }));
  if (outcome.verdict === 'mastered') {
    const nxt = drills[nextIndex];
    nxt.level += 1;
    nxt.repsTarget = Math.min(MAX_REPS, nxt.repsTarget + 1);
    nxt.successThreshold = Math.min(0.85, nxt.successThreshold + 0.05);
  }

  return { ...state, drills, history, index: nextIndex, reps: [] };
}

/** Retry the current drill from scratch, easing the bar slightly (deload). */
export function repeatDrill(state: CompanionState): CompanionState {
  if (state.status !== 'active') return state;
  const drills = state.drills.map((d) => ({ ...d }));
  const drill = drills[state.index];
  if (drill) {
    drill.successThreshold = Math.max(0.4, drill.successThreshold - 0.05);
  }
  return { ...state, drills, reps: [] };
}

/** Force-complete the session (e.g. user taps "I'm done"). */
export function finishSession(state: CompanionState, now: Date = new Date()): CompanionState {
  if (state.status === 'complete') return state;
  // Bank any in-progress reps as an outcome so the summary is honest.
  const drill = state.drills[state.index];
  const history =
    drill && state.reps.length > 0 ? [...state.history, outcomeFor(drill, state.reps)] : state.history;
  return { ...state, history, reps: [], status: 'complete', endedAt: now.toISOString() };
}

// ── Summary + guidance ────────────────────────────────────────

function buildSummary(state: CompanionState, sport: SportId): CompanionSummary {
  const totalReps = state.history.reduce((s, o) => s + o.attempts, 0);
  const totalSuccesses = state.history.reduce((s, o) => s + o.successes, 0);
  const overall = totalReps ? totalSuccesses / totalReps : 0;
  const drillsMastered = state.history.filter((o) => o.verdict === 'mastered').length;
  const sp = getSportAgentProfile(sport);

  let durationMinutes: number | null = null;
  if (state.startedAt && state.endedAt) {
    const ms = new Date(state.endedAt).getTime() - new Date(state.startedAt).getTime();
    if (Number.isFinite(ms) && ms >= 0) durationMinutes = Math.round(ms / 60_000);
  }

  return {
    totalReps,
    totalSuccesses,
    overallSuccessRate: Math.round(overall * 100) / 100,
    drillsMastered,
    drillsRun: state.history.length,
    durationMinutes,
    retestPrompt: `Log a fresh ${sp.inputNoun} this week so SwingVantage can confirm "${state.focus}" is sticking.`,
  };
}

const PRAISE = ['Nice.', 'Good work.', 'That’s it.', 'Locked in.', 'Smooth.'];
const ENCOURAGE = ['Reset and go again.', 'Trust it.', 'One at a time.', 'Stay with the cue.'];

/** Render-ready guidance for the current state. One cue at a time, honest. */
export function coach(state: CompanionState): CompanionGuidance {
  const total = state.drills.length;

  if (state.status === 'idle') {
    return {
      phase: 'intro', drillName: null, drillIndex: 0, totalDrills: total,
      cue: state.focus ? `Today: ${state.focus}` : 'Ready when you are.',
      instruction: 'Tap start when you’re set up.', repsDone: 0, repsTarget: 0,
      verdict: null, recommendedAction: 'start', encouragement: 'Short and focused beats long and scattered.',
      summary: null,
    };
  }

  if (state.status === 'complete') {
    return {
      phase: 'summary', drillName: null, drillIndex: state.history.length, totalDrills: total,
      cue: 'Session complete.', instruction: '', repsDone: 0, repsTarget: 0,
      verdict: null, recommendedAction: 'finish', encouragement: 'Great work showing up.',
      summary: buildSummary(state, state.sport),
    };
  }

  const drill = state.drills[state.index];
  const done = state.reps.length;
  const successes = state.reps.filter((r) => r.success).length;
  const rate = done ? successes / done : 0;
  const isLast = state.index === total - 1;

  if (done < drill.repsTarget) {
    return {
      phase: 'in_drill', drillName: drill.name, drillIndex: state.index, totalDrills: total,
      cue: drill.cue,
      instruction: `Rep ${done + 1} of ${drill.repsTarget}`,
      repsDone: done, repsTarget: drill.repsTarget,
      verdict: null, recommendedAction: 'rep',
      encouragement: done > 0 && state.reps[done - 1].success
        ? PRAISE[done % PRAISE.length]
        : ENCOURAGE[done % ENCOURAGE.length],
      summary: null,
    };
  }

  // Target reached — judge the round and recommend the next control.
  const verdict = verdictFor(rate, drill.successThreshold);
  const recommendedAction = verdict === 'struggled' ? 'repeat' : isLast ? 'finish' : 'next';
  const encouragement =
    verdict === 'mastered'
      ? 'You owned that — let’s make the next one count.'
      : verdict === 'progressing'
        ? 'Solid round. Keep building.'
        : 'No problem — run it again and groove the feel.';

  return {
    phase: 'drill_complete', drillName: drill.name, drillIndex: state.index, totalDrills: total,
    cue: `${successes}/${done} on target`,
    instruction: verdict === 'struggled' ? 'Run it back to lock in the feel.' : 'Ready for the next one.',
    repsDone: done, repsTarget: drill.repsTarget,
    verdict, recommendedAction, encouragement, summary: null,
  };
}
