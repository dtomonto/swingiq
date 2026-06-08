// ============================================================
// SwingVantage — Mental Performance: training plans (pure)
//
// Deterministic, keyless plan templates. Each day = 1 mental-skill focus +
// 1 short exercise + 1 sport-specific application + 1 reflection + a progress
// marker (+ an optional routine to run). Days are generated from reusable
// skill modules so 7/14/30-day plans stay varied and coherent without hand-
// writing every day, while pre/game/match-day plans use focused modules.
// ============================================================

import type {
  TrainingPlan, PlanDay, PlanType, MentalSport, RoutineLevel,
} from './types';
import { sportFamilyFor } from './constants';
import { routineForContext } from './routines';

// A reusable mental-skill module. `context` resolves a routine for the sport.
interface SkillModule {
  skillFocus: string;
  exercise: string;
  context: string; // mistake/keyword for routineForContext
  app: (sport: MentalSport) => string;
  reflection: string;
}

function appByFamily(sport: MentalSport, golf: string, bat: string, racket: string, universal: string): string {
  const fam = sportFamilyFor(sport);
  if (fam === 'golf') return golf;
  if (fam === 'bat') return bat;
  if (fam === 'racket') return racket;
  return universal;
}

const SKILL_MODULES: SkillModule[] = [
  {
    skillFocus: 'Reset breathing',
    exercise: 'Three rounds of 4-second inhale, 6-second exhale.',
    context: 'pressure',
    app: (s) => appByFamily(s,
      'Use it before your pre-shot routine on three holes today.',
      'Use it between pitches in your next at-bat or inning.',
      'Use it behind the baseline before three service points.',
      'Use it before three reps in your next session.'),
    reflection: 'Where in my routine does the breath fit most naturally?',
  },
  {
    skillFocus: 'Acceptance',
    exercise: 'Name one recent mistake out loud, then say "it’s done".',
    context: 'general_mistake',
    app: (s) => appByFamily(s,
      'Practice accepting one bad shot per nine without commentary.',
      'Accept one bad at-bat or error and move to the next play.',
      'Accept one missed point without changing your effort.',
      'Accept one mistake cleanly in today’s session.'),
    reflection: 'Did naming it help me let it go faster?',
  },
  {
    skillFocus: 'Next-play refocus',
    exercise: 'Run your sport reset on a deliberately imagined miss.',
    context: 'mistake',
    app: (s) => appByFamily(s,
      'After any miss, step into your next-shot routine immediately.',
      'After any error, tap the glove and want the next ball.',
      'After any miss, run your between-point ritual the same way.',
      'After any mistake, do your reset before the next rep.'),
    reflection: 'How quickly did I get back to neutral?',
  },
  {
    skillFocus: 'Self-talk',
    exercise: 'Write one short, true cue you can say under pressure.',
    context: 'lost_confidence',
    app: (s) => appByFamily(s,
      'Say your cue before each tee shot today.',
      'Say your cue before each at-bat or on defense.',
      'Say your cue before each serve and return.',
      'Say your cue before each meaningful rep.'),
    reflection: 'Was my self-talk a coach or a critic today?',
  },
  {
    skillFocus: 'Pre-performance routine',
    exercise: 'Run your pre-game settle (5 breaths + focus word).',
    context: 'pre_game_nerves',
    app: (s) => appByFamily(s,
      'Do the settle before your round and on the first tee.',
      'Do the settle before first pitch and your first at-bat.',
      'Do the settle in the warm-up and before the first game.',
      'Do the settle before you start today’s session.'),
    reflection: 'Did I start the way I planned, or react to nerves?',
  },
  {
    skillFocus: 'Visualization',
    exercise: 'Spend 60 seconds vividly seeing one play go perfectly.',
    context: 'pre_game_nerves',
    app: (s) => appByFamily(s,
      'Visualize your favorite tee shot before you hit it.',
      'Visualize a clean play before each inning.',
      'Visualize your best serve pattern before serving.',
      'Visualize the rep before you do it.'),
    reflection: 'Was my mental picture clear and from my own eyes?',
  },
  {
    skillFocus: 'Present focus',
    exercise: 'Notice 3 breaths matched to your movement.',
    context: 'focus',
    app: (s) => appByFamily(s,
      'Use the walk between shots to stay present, not replay.',
      'Stay in this pitch, not the last at-bat.',
      'Use the back-fence walk to reset to now.',
      'Stay with the current rep, not the last one.'),
    reflection: 'When did my mind drift, and what pulled it back?',
  },
  {
    skillFocus: 'Confidence evidence',
    exercise: 'List three specific things you genuinely do well.',
    context: 'lost_confidence',
    app: (s) => appByFamily(s,
      'Recall a great shot you’ve hit before each tough tee.',
      'Recall a great play before tough defensive situations.',
      'Recall a clutch point before a big point.',
      'Recall a strong rep before a hard one.'),
    reflection: 'Am I judging myself on effort or outcome?',
  },
  {
    skillFocus: 'Pressure practice',
    exercise: 'Add a small consequence to one practice block.',
    context: 'pressure',
    app: (s) => appByFamily(s,
      'Play a 9-hole "every miss = reset" pressure game.',
      'Take two-strike BP with a make-it rule.',
      'Play a pressure tiebreak with your routine.',
      'Add a small stake to one rep block.'),
    reflection: 'Did my routine hold up when it counted?',
  },
  {
    skillFocus: 'Body language',
    exercise: 'Hold tall, strong posture for 30 seconds after a mistake.',
    context: 'defeated',
    app: (s) => appByFamily(s,
      'Walk tall to the next tee no matter the score.',
      'Sprint on/off the field with strong posture.',
      'Walk to the back fence tall after every point.',
      'Reset to strong posture after each mistake.'),
    reflection: 'Did my posture lift my energy or sink it?',
  },
];

function buildDays(sport: MentalSport, durationDays: number): PlanDay[] {
  const days: PlanDay[] = [];
  for (let d = 1; d <= durationDays; d++) {
    const m = SKILL_MODULES[(d - 1) % SKILL_MODULES.length];
    const routine = routineForContext(sport, m.context);
    const week = Math.ceil(d / 7);
    const marker =
      week === 1 ? 'Build the habit — focus on doing it, not doing it perfectly.'
        : week === 2 ? 'Make it automatic — run it without thinking.'
          : week === 3 ? 'Add pressure — keep it under stakes.'
            : 'Own it — this is now part of how you compete.';
    days.push({
      day: d,
      title: `Day ${d}: ${m.skillFocus}`,
      skillFocus: m.skillFocus,
      exercise: m.exercise,
      sportApplication: m.app(sport),
      reflectionPrompt: m.reflection,
      progressMarker: marker,
      routineId: routine.id,
    });
  }
  return days;
}

// Focused single-session plans (pre-round / game-day / match-day).
function focusedModules(keys: string[]): SkillModule[] {
  return keys.map((k) => SKILL_MODULES.find((m) => m.skillFocus === k)!).filter(Boolean);
}

function buildFocusedDays(sport: MentalSport, modules: SkillModule[]): PlanDay[] {
  return modules.map((m, i) => {
    const routine = routineForContext(sport, m.context);
    return {
      day: i + 1,
      title: `Step ${i + 1}: ${m.skillFocus}`,
      skillFocus: m.skillFocus,
      exercise: m.exercise,
      sportApplication: m.app(sport),
      reflectionPrompt: m.reflection,
      progressMarker: 'Run it the same way every time you compete.',
      routineId: routine.id,
    };
  });
}

interface PlanSpec {
  planType: PlanType;
  slug: string;
  title: string;
  durationDays: number;
  level: RoutineLevel;
  goal: string;
  summary: string;
  /** Focused module keys for single-session plans; undefined = multi-day. */
  focusedKeys?: string[];
}

const PLAN_SPECS: PlanSpec[] = [
  { planType: 'reset_7', slug: '7-day-reset', title: '7-Day Reset', durationDays: 7, level: 'all',
    goal: 'Build a fast, repeatable mistake reset.',
    summary: 'One week to make "mistake → reset → next play" automatic.' },
  { planType: 'composure_14', slug: '14-day-composure', title: '14-Day Composure', durationDays: 14, level: 'all',
    goal: 'Stay calm and committed under pressure.',
    summary: 'Two weeks layering breathing, acceptance, and pressure practice.' },
  { planType: 'confidence_30', slug: '30-day-confidence', title: '30-Day Confidence', durationDays: 30, level: 'all',
    goal: 'Rebuild durable, evidence-based confidence.',
    summary: 'A month of self-talk, evidence, visualization, and pressure reps.' },
  { planType: 'mistake_recovery', slug: 'mistake-recovery', title: 'Mistake-Recovery Plan', durationDays: 7, level: 'all',
    goal: 'Stop one mistake from becoming three.',
    summary: 'A focused week on recovering faster after errors.' },
  { planType: 'pressure', slug: 'pressure-training', title: 'Pressure Training', durationDays: 14, level: 'intermediate',
    goal: 'Perform your routine when the moment is big.',
    summary: 'Two weeks of progressive pressure practice.' },
  { planType: 'tournament', slug: 'tournament-mindset', title: 'Tournament Mindset', durationDays: 7, level: 'intermediate',
    goal: 'Arrive ready and stay composed across a competition.',
    summary: 'A week to prepare your mind for a tournament.' },
  // Focused single-session plans
  { planType: 'pre_round', slug: 'pre-round', title: 'Pre-Round Routine', durationDays: 0, level: 'all',
    goal: 'Start your round calm, clear, and committed.',
    summary: 'A short pre-round mental warm-up.',
    focusedKeys: ['Pre-performance routine', 'Visualization', 'Reset breathing', 'Self-talk'] },
  { planType: 'game_day', slug: 'game-day', title: 'Game-Day Routine', durationDays: 0, level: 'all',
    goal: 'Be ready for first pitch with a calm, alert mind.',
    summary: 'A short game-day mental warm-up.',
    focusedKeys: ['Pre-performance routine', 'Visualization', 'Reset breathing', 'Confidence evidence'] },
  { planType: 'match_day', slug: 'match-day', title: 'Match-Day Routine', durationDays: 0, level: 'all',
    goal: 'Find a calm, aggressive baseline for your match.',
    summary: 'A short match-day mental warm-up.',
    focusedKeys: ['Pre-performance routine', 'Present focus', 'Reset breathing', 'Self-talk'] },
  { planType: 'parent_coach', slug: 'parent-coach-support', title: 'Parent / Coach Support', durationDays: 7, level: 'all',
    goal: 'Support an athlete’s composure without adding pressure.',
    summary: 'A week of small, supportive habits for parents and coaches.' },
];

export function buildPlan(planType: PlanType, sport: MentalSport = 'universal'): TrainingPlan {
  const spec = PLAN_SPECS.find((p) => p.planType === planType) ?? PLAN_SPECS[0];
  const days = spec.focusedKeys
    ? buildFocusedDays(sport, focusedModules(spec.focusedKeys))
    : buildDays(sport, spec.durationDays);
  return {
    id: `${spec.slug}__${sport}`,
    title: spec.title,
    slug: spec.slug,
    sport,
    durationDays: spec.focusedKeys ? days.length : spec.durationDays,
    level: spec.level,
    goal: spec.goal,
    planType: spec.planType,
    summary: spec.summary,
    days,
  };
}

/** Catalog of available plan templates (for the picker), sport-agnostic. */
export function planCatalog(): Array<Omit<TrainingPlan, 'days'>> {
  return PLAN_SPECS.map((spec) => ({
    id: spec.slug,
    title: spec.title,
    slug: spec.slug,
    sport: 'universal',
    durationDays: spec.durationDays,
    level: spec.level,
    goal: spec.goal,
    planType: spec.planType,
    summary: spec.summary,
  }));
}

export const PLAN_TYPES: PlanType[] = PLAN_SPECS.map((p) => p.planType);
