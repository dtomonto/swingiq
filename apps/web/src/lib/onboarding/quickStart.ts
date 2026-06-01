// ============================================================
// SwingIQ — Start Here: Quick-Start Engine
// ------------------------------------------------------------
// Powers the guided first-user onboarding flow (/start).
//
// HONESTY RULES (match the rest of SwingIQ):
//   - The quick result is built from the user's SELF-REPORTED
//     answers, not from measured swing data or video pixels.
//   - We therefore label its confidence "low" and always say
//     exactly what the result is based on and what would raise
//     confidence.
//   - Drills are beginner-safe and generic; we never claim a
//     biomechanical measurement was made.
//
// This module is framework-agnostic (no React) so it can be unit
// tested and reused. It owns its own dataset on purpose — it is a
// richer, onboarding-specific superset of the Swing Mistake Quiz
// data (adds evidence, confidence, and "what improves" guidance).
// ============================================================

import type { AgentConfidence } from '@/lib/agents';
import type { LeadSource } from '@/lib/email/capture';

// ── Identity ──────────────────────────────────────────────────

export type OnboardingSportId =
  | 'golf'
  | 'tennis'
  | 'baseball'
  | 'softball_slow'
  | 'softball_fast';

export type UserType = 'athlete' | 'parent' | 'coach' | 'team';

export type InputMethod = 'quiz' | 'manual' | 'import' | 'video' | 'sample';

export type StartSkillLevel = 'new' | 'developing' | 'experienced';

// ── Data shapes ───────────────────────────────────────────────

export interface QuickOutcome {
  /** Stable key for the symptom the athlete picked. */
  value: string;
  /** Plain-language choice label. */
  label: string;
  /** The single top-priority issue (what to work on first). */
  issue: string;
  /** Why it matters / the one checkpoint to feel. */
  whyItMatters: string;
  /** Three beginner-safe drills tied to the issue. */
  drills: string[];
  /** A simple 7-day practice plan. */
  plan: string[];
}

export interface OnboardingSport {
  id: OnboardingSportId;
  label: string;
  emoji: string;
  leadSource: LeadSource;
  /** "What is your most common miss?" reworded per sport. */
  missQuestion: string;
  outcomes: QuickOutcome[];
}

// ── Per-sport quick-start dataset ─────────────────────────────

export const ONBOARDING_SPORTS: OnboardingSport[] = [
  {
    id: 'golf',
    label: 'Golf',
    emoji: '⛳',
    leadSource: 'golf_slice',
    missQuestion: 'What is your most common miss?',
    outcomes: [
      {
        value: 'slice',
        label: 'Slice (ball curves right)',
        issue: 'An out-to-in swing path with an open clubface',
        whyItMatters:
          'Squaring the path before the face stops you cutting across the ball — the #1 cause of a slice.',
        drills: ['Headcover gate drill', 'Transition drop rehearsal', 'Split-hand release feel'],
        plan: [
          'Days 1–2: path drills at slow speed',
          'Days 3–4: add the release feel',
          'Days 5–6: build back to full speed',
          'Day 7: retest your ball flight',
        ],
      },
      {
        value: 'hook',
        label: 'Hook (ball curves left)',
        issue: 'An overly in-to-out path with a closed face',
        whyItMatters: 'Quieting the hands neutralises a too-strong release so the face stops shutting down.',
        drills: ['Neutral-grip checkpoint', 'Hold-off finish drill', 'Tempo half-swings'],
        plan: [
          'Days 1–2: grip + face checkpoints',
          'Days 3–4: hold-off finishes',
          'Days 5–6: rebuild speed',
          'Day 7: retest your ball flight',
        ],
      },
      {
        value: 'fat_thin',
        label: 'Fat or thin contact',
        issue: 'Low-point and weight-shift control',
        whyItMatters: 'Getting your weight onto the lead side through impact moves the low point in front of the ball.',
        drills: ['Towel-behind-the-ball drill', 'Lead-side bump drill', 'Punch-shot reps'],
        plan: [
          'Days 1–3: low-point drills',
          'Days 4–6: half- to full-swing',
          'Day 7: retest your strike',
        ],
      },
      {
        value: 'inconsistent',
        label: 'Inconsistent — a bit of everything',
        issue: 'Tempo and swing sequencing',
        whyItMatters: 'A repeatable tempo has to come before chasing positions, or fixes will not hold up.',
        drills: ['3:1 tempo counts', 'Feet-together swings', 'Slow-motion rehearsal reps'],
        plan: ['Daily tempo work, 10–15 min', 'Day 7: retest your consistency'],
      },
    ],
  },
  {
    id: 'tennis',
    label: 'Tennis',
    emoji: '🎾',
    leadSource: 'tennis_forehand',
    missQuestion: 'Where does your forehand go wrong most often?',
    outcomes: [
      {
        value: 'long',
        label: 'Flies long',
        issue: 'Too flat — not enough topspin for margin',
        whyItMatters: 'A low-to-high brush adds net clearance and bring-down so the ball drops inside the line.',
        drills: ['Drop-feed topspin', 'Low-to-high shadow swings', 'Window target drill'],
        plan: ['Days 1–3: topspin feel', 'Days 4–6: rally it in', 'Day 7: retest depth control'],
      },
      {
        value: 'net',
        label: 'Into the net',
        issue: 'Closing the face / brushing down',
        whyItMatters: 'Finishing high and meeting the ball out front keeps the face from pointing down at contact.',
        drills: ['High-finish cue', 'Contact-point catch drill', 'Drop-feed groundstrokes'],
        plan: ['Days 1–3: contact point', 'Days 4–6: rally', 'Day 7: retest net clearance'],
      },
      {
        value: 'late',
        label: 'Always late',
        issue: 'A late unit turn',
        whyItMatters: 'Turning the shoulders before the bounce buys time so contact happens out in front.',
        drills: ['Early-turn shadow swings', 'Split-step timing', 'Catch-at-contact drill'],
        plan: ['Daily turn-timing reps', 'Day 7: retest your timing'],
      },
      {
        value: 'weak',
        label: 'No power',
        issue: 'An all-arm swing with no legs or core',
        whyItMatters: 'Driving from the ground up sequences the legs, then core, then arm for free power.',
        drills: ['Load-and-explode reps', 'Hip-lead rotation', 'Light medicine-ball throws'],
        plan: ['Days 1–3: sequence', 'Days 4–6: add power', 'Day 7: retest pace'],
      },
    ],
  },
  {
    id: 'baseball',
    label: 'Baseball',
    emoji: '⚾',
    leadSource: 'youth_baseball',
    missQuestion: 'What happens most often at contact?',
    outcomes: [
      {
        value: 'grounders',
        label: 'Ground balls',
        issue: 'Rolling over with a steep bat path',
        whyItMatters: 'Staying through the ball and delaying the top-hand roll keeps the barrel on plane longer.',
        drills: ['High-tee line drill', 'Stay-through cue', 'Two-ball spacing drill'],
        plan: ['Days 1–3: bat path', 'Days 4–6: live toss', 'Day 7: retest contact'],
      },
      {
        value: 'popups',
        label: 'Pop-ups',
        issue: 'Swinging under the ball',
        whyItMatters: 'Levelling the path and keeping the back shoulder up matches the barrel to the pitch.',
        drills: ['Belt-high tee', 'Level-path cue', 'Soft toss'],
        plan: ['Days 1–3: level path', 'Days 4–6: toss', 'Day 7: retest contact'],
      },
      {
        value: 'late',
        label: 'Late / jammed',
        issue: 'Late timing from a long load',
        whyItMatters: 'Shortening and starting the load earlier lets the barrel arrive on time.',
        drills: ['Short-load reps', 'Timing soft toss', 'Rhythm-count drill'],
        plan: ['Daily timing reps', 'Day 7: retest timing'],
      },
      {
        value: 'weak',
        label: 'Weak contact',
        issue: 'A sequence that leaks energy',
        whyItMatters: 'Letting the hips lead, then the hands, stores and releases power in the right order.',
        drills: ['Hip-lead rotation', 'Connection-ball drill', 'Tee for sequence'],
        plan: ['Days 1–3: sequence', 'Days 4–6: toss', 'Day 7: retest contact'],
      },
    ],
  },
  {
    id: 'softball_slow',
    label: 'Slow-Pitch Softball',
    emoji: '🥎',
    leadSource: 'slow_pitch_softball',
    missQuestion: 'What is your most common result?',
    outcomes: [
      {
        value: 'popups',
        label: 'Pop-ups',
        issue: 'Chopping down at a dropping ball',
        whyItMatters: 'Matching a slightly upward path to the arc squares the barrel to the descending pitch.',
        drills: ['Contact-height tee', 'Slight-up path cue', 'Timed soft toss'],
        plan: ['Days 1–3: bat path', 'Days 4–6: timing', 'Day 7: retest launch'],
      },
      {
        value: 'grounders',
        label: 'Ground balls',
        issue: 'Rolling over the top hand',
        whyItMatters: 'Staying through and driving the line keeps the barrel behind the ball longer.',
        drills: ['High-tee line drill', 'Stay-through cue', 'Two-ball drill'],
        plan: ['Days 1–3: bat path', 'Days 4–6: timing', 'Day 7: retest contact'],
      },
      {
        value: 'nopower',
        label: 'No carry / power',
        issue: 'Late hips and drifting forward',
        whyItMatters: 'Rotating onto a firm front side converts your move into bat speed instead of a slide.',
        drills: ['Hip-lead rotation', 'Step-and-load timing', 'Balance-hold finish'],
        plan: ['Days 1–3: sequence', 'Days 4–6: power', 'Day 7: retest carry'],
      },
      {
        value: 'mishit',
        label: 'Mis-hits / timing',
        issue: 'Timing against the arc',
        whyItMatters: 'Loading on a count matched to the drop puts the barrel on time with the pitch.',
        drills: ['Counted soft toss', 'Rhythm-load drill', 'Tee reset reps'],
        plan: ['Daily timing reps', 'Day 7: retest timing'],
      },
    ],
  },
  {
    id: 'softball_fast',
    label: 'Fast-Pitch Softball',
    emoji: '🥎',
    leadSource: 'youth_softball',
    missQuestion: 'What breaks down most often?',
    outcomes: [
      {
        value: 'late',
        label: 'Late on speed',
        issue: 'A long swing and late start',
        whyItMatters: 'Shortening to the ball and starting on time is how you catch up to real velocity.',
        drills: ['Short-to-it reps', 'Quick-hands toss', 'Reaction-tee drill'],
        plan: ['Daily quickness reps', 'Day 7: retest timing'],
      },
      {
        value: 'grounders',
        label: 'Ground balls',
        issue: 'Top-hand roll with a steep path',
        whyItMatters: 'Staying through the middle keeps the barrel level into the zone for line drives.',
        drills: ['Line-drive tee', 'Stay-through cue', 'Two-ball drill'],
        plan: ['Days 1–3: bat path', 'Days 4–6: live', 'Day 7: retest contact'],
      },
      {
        value: 'popups',
        label: 'Pop-ups',
        issue: 'Dropping under the ball',
        whyItMatters: 'A level path with the back shoulder up stops the barrel from working under the pitch.',
        drills: ['Belt-high tee', 'Level-path cue', 'Soft toss'],
        plan: ['Days 1–3: level path', 'Days 4–6: toss', 'Day 7: retest contact'],
      },
      {
        value: 'weak',
        label: 'Weak contact',
        issue: 'A sequence and connection leak',
        whyItMatters: 'Letting the hips lead while staying connected keeps the barrel in the zone with force.',
        drills: ['Connection-ball drill', 'Hip-lead drill', 'Sequence tee'],
        plan: ['Days 1–3: sequence', 'Days 4–6: live', 'Day 7: retest contact'],
      },
    ],
  },
];

// ── User types & input methods (UI metadata) ──────────────────

export const USER_TYPES: Array<{
  value: UserType;
  label: string;
  sublabel: string;
}> = [
  { value: 'athlete', label: 'Athlete', sublabel: "I'm working on my own swing" },
  { value: 'parent', label: 'Parent or guardian', sublabel: "I'm helping a young athlete" },
  { value: 'coach', label: 'Coach or instructor', sublabel: "I'm working with athletes I coach" },
  { value: 'team', label: 'Team / program', sublabel: "I'm exploring SwingIQ for a group" },
];

export const SKILL_LEVELS: Array<{ value: StartSkillLevel; label: string }> = [
  { value: 'new', label: 'New to it' },
  { value: 'developing', label: 'Still developing' },
  { value: 'experienced', label: 'Experienced' },
];

export interface InputMethodOption {
  value: InputMethod;
  label: string;
  description: string;
  /** Where this path continues. 'inline' means we generate the result here. */
  href: string | 'inline';
  /** Minutes-to-result hint shown to the user. */
  timeHint: string;
}

export const INPUT_METHODS: InputMethodOption[] = [
  {
    value: 'quiz',
    label: 'Answer a couple of quick questions',
    description: 'Fastest way to a first result. No data or upload needed.',
    href: 'inline',
    timeHint: 'about 2 minutes',
  },
  {
    value: 'video',
    label: 'Upload a swing video',
    description: 'Organise your review and capture context for AI-assisted coaching prompts.',
    href: '/video',
    timeHint: 'about 3 minutes',
  },
  {
    value: 'import',
    label: 'Import data (CSV or launch monitor)',
    description: 'Bring in launch-monitor or session data for a deeper, measured analysis.',
    href: '/sessions/import',
    timeHint: 'about 3 minutes',
  },
  {
    value: 'manual',
    label: 'Enter data manually',
    description: 'Type in what you know and run a diagnosis.',
    href: '/diagnose',
    timeHint: 'about 3 minutes',
  },
  {
    value: 'sample',
    label: 'See a sample report first',
    description: 'Preview exactly what SwingIQ produces before you put anything in.',
    href: '/report/sample',
    timeHint: 'about 1 minute',
  },
];

// ── Result model ──────────────────────────────────────────────

export interface QuickResult {
  sportId: OnboardingSportId;
  sportLabel: string;
  emoji: string;
  userType: UserType;
  skill: StartSkillLevel;
  /** The single top-priority issue. */
  issue: string;
  whyItMatters: string;
  drills: string[];
  plan: string[];
  confidence: AgentConfidence;
  /** What this result is based on (plain-language). */
  evidence: string[];
  /** Whether raw video pixels were analysed (always false for the quiz path). */
  videoAnalyzed: boolean;
  /** What would raise confidence next. */
  whatImproves: string[];
  /** ISO date 7 days from now. */
  retestDate: string;
  /** Optional, tone-tailored note for parents. */
  parentNote?: string;
}

const SKILL_LABEL: Record<StartSkillLevel, string> = {
  new: 'new to it',
  developing: 'still developing',
  experienced: 'experienced',
};

/** ISO date string N days from `from` (default now). */
export function addDaysISO(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function getSport(sportId: OnboardingSportId): OnboardingSport | undefined {
  return ONBOARDING_SPORTS.find((s) => s.id === sportId);
}

/**
 * Build the honest quick result from self-reported answers.
 * Confidence is intentionally "low" — this is an estimate from
 * answers, not measured swing data.
 */
export function buildQuickResult(args: {
  sportId: OnboardingSportId;
  symptom: string;
  userType: UserType;
  skill: StartSkillLevel;
}): QuickResult | null {
  const sport = getSport(args.sportId);
  if (!sport) return null;
  const outcome = sport.outcomes.find((o) => o.value === args.symptom);
  if (!outcome) return null;

  const confidence: AgentConfidence = {
    level: 'low',
    score: 35,
    reason: 'based on the answers you gave, not measured swing data',
  };

  const evidence = [
    `Your sport: ${sport.label}`,
    `Your most common miss: ${outcome.label}`,
    `Your experience: ${SKILL_LABEL[args.skill]}`,
  ];

  const whatImproves = [
    'Upload a swing video to add visual context',
    'Import launch-monitor or session data for a measured analysis',
    'Log a few sessions, then retest in 7 days to see a trend',
    'Have a qualified coach confirm what you are feeling',
  ];

  const parentNote =
    args.userType === 'parent'
      ? 'Keep it positive: pick one of these drills, make it a game, and praise effort over results. ' +
        'Avoid stacking corrections — one focus at a time. If anything causes pain, stop and check with a qualified coach or professional.'
      : undefined;

  return {
    sportId: sport.id,
    sportLabel: sport.label,
    emoji: sport.emoji,
    userType: args.userType,
    skill: args.skill,
    issue: outcome.issue,
    whyItMatters: outcome.whyItMatters,
    drills: outcome.drills,
    plan: outcome.plan,
    confidence,
    evidence,
    videoAnalyzed: false,
    whatImproves,
    retestDate: addDaysISO(7),
    parentNote,
  };
}
