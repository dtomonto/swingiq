// ============================================================
// SwingVantage — Pre-Round Warm-Up Generator
// Builds a personalised 15–20 minute warm-up routine based on
// the golfer's current primary diagnosis and skill level.
// ============================================================

import type { SkillLevel } from '../types';

export interface WarmUpExercise {
  order: number;
  title: string;
  description: string;
  duration_seconds: number;
  reps: number | null;
  equipment: string;
  category: 'mobility' | 'putting' | 'chipping' | 'irons' | 'driver' | 'mental';
  coaching_cue: string;
  youtube_search_query: string;
}

export interface PreRoundRoutine {
  title: string;
  total_minutes: number;
  diagnosis_focus: string;
  exercises: WarmUpExercise[];
  key_thought: string;
  on_course_reminder: string;
  generated_at: string;
}

// ── Exercise library ─────────────────────────────────────────

const MOBILITY_EXERCISES: WarmUpExercise[] = [
  {
    order: 1,
    title: 'Hip Circles',
    description: 'Stand with feet shoulder-width apart. Rotate hips in large circles 10x each direction.',
    duration_seconds: 60,
    reps: 20,
    equipment: 'None',
    category: 'mobility',
    coaching_cue: 'Keep shoulders still. Feel the hip joint opening up.',
    youtube_search_query: 'golf hip circles warm up mobility',
  },
  {
    order: 2,
    title: 'Torso Rotations with Club',
    description: 'Place a club across your shoulders. Rotate torso fully left and right 15 times each.',
    duration_seconds: 90,
    reps: 30,
    equipment: 'Golf club',
    category: 'mobility',
    coaching_cue: 'Feel the tension in your core. Keep the club level.',
    youtube_search_query: 'golf torso rotation warm up drill club',
  },
  {
    order: 3,
    title: 'Wrist Flexion & Extension',
    description: 'Extend both arms. Flex wrists up and down 20 times. Then rotate 15 times each direction.',
    duration_seconds: 45,
    reps: 20,
    equipment: 'None',
    category: 'mobility',
    coaching_cue: 'Golf demands full wrist mobility. Never skip this.',
    youtube_search_query: 'golf wrist warm up flexibility rotation',
  },
];

const PUTTING_EXERCISES: WarmUpExercise[] = [
  {
    order: 1,
    title: '3-Foot Circle Drill',
    description: 'Place 6 balls in a circle 3 feet from hole. Make all 6. Build confidence.',
    duration_seconds: 180,
    reps: null,
    equipment: 'Putter, 6 balls',
    category: 'putting',
    coaching_cue: 'Start at 3 feet and work confidence up. Never leave the practice green having missed a short putt.',
    youtube_search_query: 'golf putting warm up 3 foot circle drill',
  },
  {
    order: 2,
    title: 'Lag Putting — Distance Control',
    description: 'Putt 3 balls to the far end of the green. Focus on getting within 2 feet, not making them.',
    duration_seconds: 120,
    reps: null,
    equipment: 'Putter, 3 balls',
    category: 'putting',
    coaching_cue: 'Feel the pace of the greens for today.',
    youtube_search_query: 'golf lag putting drill distance control warm up',
  },
];

const CHIPPING_EXERCISES: WarmUpExercise[] = [
  {
    order: 1,
    title: 'Chip & Check',
    description: '5 chip shots from off the green. Note how the ball releases on today\'s turf.',
    duration_seconds: 120,
    reps: 5,
    equipment: '56° or 60° wedge, 5 balls',
    category: 'chipping',
    coaching_cue: 'Read the chipping green texture — firm vs. soft changes everything.',
    youtube_search_query: 'golf chipping warm up short game drill',
  },
];

const SLICE_FIX_EXERCISES: WarmUpExercise[] = [
  {
    order: 1,
    title: 'Gate Drill — 5 Shots',
    description: 'Tee 2 tees 1 inch outside ball. Hit 5 shots without clipping outer tee. Prime face control.',
    duration_seconds: 180,
    reps: 5,
    equipment: 'Iron, tees',
    category: 'irons',
    coaching_cue: 'Square face at impact. Don\'t block — rotate through.',
    youtube_search_query: 'golf gate drill face control square impact',
  },
  {
    order: 2,
    title: 'Pause at P3 — 3 Driver',
    description: 'Pause at P3 (hands at waist height) and check club face angle. Continue if face is square. 3 reps.',
    duration_seconds: 120,
    reps: 3,
    equipment: 'Driver',
    category: 'driver',
    coaching_cue: 'Face matching your spine angle = square. Toe up = closed. Face down = open.',
    youtube_search_query: 'golf P3 checkpoint face angle driver pause drill',
  },
];

const HOOK_FIX_EXERCISES: WarmUpExercise[] = [
  {
    order: 1,
    title: 'Weak Grip Check',
    description: 'Set your grip with a slightly weaker left hand. Hit 5 irons. Notice ball flight change.',
    duration_seconds: 120,
    reps: 5,
    equipment: 'Iron',
    category: 'irons',
    coaching_cue: 'See 1–2 knuckles on left hand at address. Prevents grip from closing face.',
    youtube_search_query: 'golf weak grip drill hook fix ball flight',
  },
];

const SMASH_FIX_EXERCISES: WarmUpExercise[] = [
  {
    order: 1,
    title: 'Impact Tape — 3 Irons',
    description: 'Apply impact tape. Hit 3 iron shots. Find the centre pattern to prime efficient contact.',
    duration_seconds: 90,
    reps: 3,
    equipment: 'Impact tape, iron',
    category: 'irons',
    coaching_cue: 'Sweet spot consistently = smash factor of 1.44+',
    youtube_search_query: 'golf impact tape drill centre face strike',
  },
];

const DRIVER_EXERCISES: WarmUpExercise[] = [
  {
    order: 1,
    title: 'Tee — 3 Easy, 3 Medium',
    description: '3 driver swings at 70% effort. Then 3 at 85%. Don\'t go full speed yet.',
    duration_seconds: 180,
    reps: 6,
    equipment: 'Driver',
    category: 'driver',
    coaching_cue: 'Build speed progressively. First swing of the day should never be max effort.',
    youtube_search_query: 'golf driver warm up routine build swing speed',
  },
];

const MENTAL_EXERCISE: WarmUpExercise = {
  order: 99,
  title: 'Intention Setting',
  description: 'Close your eyes for 30 seconds. Visualise 3 perfect shots from today\'s round — one tee shot, one iron, one putt.',
  duration_seconds: 30,
  reps: null,
  equipment: 'None',
  category: 'mental',
  coaching_cue: 'Your brain doesn\'t distinguish between real and vividly imagined reps.',
  youtube_search_query: 'golf mental game pre round visualisation routine',
};

// ── Generator ─────────────────────────────────────────────────

export function generatePreRoundRoutine(
  diagnosisId: string,
  diagnosisName: string,
  _skillLevel: SkillLevel = 'intermediate',
): PreRoundRoutine {
  const exercises: WarmUpExercise[] = [];
  let order = 1;

  const assignOrders = (exs: WarmUpExercise[]) =>
    exs.map((e) => ({ ...e, order: order++ }));

  // Always start with mobility
  exercises.push(...assignOrders(MOBILITY_EXERCISES));
  // Putting
  exercises.push(...assignOrders(PUTTING_EXERCISES));
  // Chipping
  exercises.push(...assignOrders(CHIPPING_EXERCISES));

  // Diagnosis-specific
  if (diagnosisId === 'slice_weak_fade') {
    exercises.push(...assignOrders(SLICE_FIX_EXERCISES));
  } else if (diagnosisId === 'hook_overdraw') {
    exercises.push(...assignOrders(HOOK_FIX_EXERCISES));
  } else if (diagnosisId === 'low_smash_factor') {
    exercises.push(...assignOrders(SMASH_FIX_EXERCISES));
  }

  // Always end with some driver and mental
  exercises.push(...assignOrders(DRIVER_EXERCISES));
  exercises.push({ ...MENTAL_EXERCISE, order: order++ });

  const totalSeconds = exercises.reduce((s, e) => s + e.duration_seconds, 0);

  const keyThoughts: Record<string, string> = {
    slice_weak_fade: 'Square face. Square face. Square face. Repeat it on every tee shot.',
    hook_overdraw: 'Start the ball right of target and let it draw back. Path right, face more right.',
    low_smash_factor: 'Find the centre. Speed without contact quality is wasted.',
    high_spin_driver: 'Hit up through the ball. Tee high. Catch it on the upswing.',
    default: 'Be a fair witness to yourself. Notice, don\'t judge.',
  };

  const reminders: Record<string, string> = {
    slice_weak_fade: 'On every tee shot: check grip, check alignment, feel the face square at P3.',
    hook_overdraw: 'If you feel a hook coming, trust the slightly weaker grip you practiced.',
    low_smash_factor: 'Don\'t rush the transition. Width in the backswing = centred contact.',
    default: 'One shot at a time. Focus on process, not score.',
  };

  return {
    title: `Pre-Round Warm-Up — ${diagnosisName}`,
    total_minutes: Math.round(totalSeconds / 60),
    diagnosis_focus: diagnosisName,
    exercises,
    key_thought: keyThoughts[diagnosisId] ?? keyThoughts.default!,
    on_course_reminder: reminders[diagnosisId] ?? reminders.default!,
    generated_at: new Date().toISOString(),
  };
}
