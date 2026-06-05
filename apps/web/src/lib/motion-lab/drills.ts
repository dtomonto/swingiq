// ============================================================
// SwingVantage — Motion Lab: Drill Prescription Engine
// ------------------------------------------------------------
// Maps the weakest detected metrics to a prescription of four drills
// (immediate fix, feel, technical, constraint) plus a weekly plan.
// Drills are practical and equipment-light; YouTube links are SEARCH
// links only (never hardcoded video IDs), matching the app convention.
// ============================================================

import type {
  MotionMetric,
  CaptureContext,
  PrescribedDrill,
  DrillPlan,
} from './types';
import { getSport, getMotion } from './taxonomy';

type DrillKind = PrescribedDrill['kind'];
type CatalogDrill = Omit<PrescribedDrill, 'sport' | 'motionType' | 'videoSearchUrl'> & {
  searchQuery: string;
};

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// ── Drill catalog (keyed by the drillId referenced in biomechanics) ──
const CATALOG: Record<string, CatalogDrill> = {
  rotation_load: {
    id: 'rotation_load', name: 'Cross-Arm Turn', kind: 'feel',
    problemItSolves: 'Limited or arm-only rotation',
    setup: 'Stand in your posture, arms crossed over your chest.',
    steps: ['Turn back until your lead shoulder is under your chin', 'Feel your back muscles stretch', 'Return and turn through to a full finish', 'Keep your spine angle the same throughout'],
    repsOrDuration: '3 × 10 slow turns', difficulty: 'beginner',
    commonMistake: 'Swaying instead of rotating around a stable centre.',
    successCue: 'Back to the target going back, chest to the target through.',
    progression: 'Add the implement at half speed.', regression: 'Do it seated to remove the lower body.',
    equipment: 'None', estimatedMinutes: 5, searchQuery: 'cross arm shoulder turn drill',
  },
  hip_lead: {
    id: 'hip_lead', name: 'Lead-Hip Bump', kind: 'technical',
    problemItSolves: 'Hips firing too early, too late, or not leading',
    setup: 'Set up next to a wall with your lead hip a few inches away.',
    steps: ['Make a small backswing', 'Start down by bumping your lead hip toward the wall', 'Feel the hip clear before the hands come down', 'Touch the wall, then rotate through'],
    repsOrDuration: '3 × 8 reps', difficulty: 'intermediate',
    commonMistake: 'Sliding the whole body instead of bumping then rotating.',
    successCue: 'Bump, then spin.',
    progression: 'Blend into a half swing.', regression: 'Pause at the bump to feel the position.',
    equipment: 'Wall', estimatedMinutes: 6, searchQuery: 'hip lead downswing wall drill',
  },
  separation_step: {
    id: 'separation_step', name: 'Step-Change Separation', kind: 'technical',
    problemItSolves: 'Too little stretch between hips and shoulders',
    setup: 'Get to the top of your motion and hold.',
    steps: ['At the top, keep your chest pointed back', 'Start the lower body forward while the chest stays', 'Feel the stretch across your torso', 'Then let it unwind through the strike'],
    repsOrDuration: '3 × 6 slow reps', difficulty: 'advanced',
    commonMistake: 'Unwinding everything at once (no stretch).',
    successCue: 'Lower body goes while the chest waits.',
    progression: 'Shorten the pause until it’s continuous.', regression: 'Exaggerate the pause at the top.',
    equipment: 'None', estimatedMinutes: 7, searchQuery: 'hip shoulder separation x factor drill',
  },
  sequence_pump: {
    id: 'sequence_pump', name: 'Pump-Drill Sequence', kind: 'constraint',
    problemItSolves: 'Out-of-order kinetic sequence',
    setup: 'Take your motion to the top.',
    steps: ['Pump down halfway leading with the lower body, then back to the top — twice', 'On the third, fire all the way through', 'Feel the order: hips, chest, arms, implement'],
    repsOrDuration: '3 sets of (2 pumps + 1 full)', difficulty: 'intermediate',
    commonMistake: 'Pumping with the arms instead of the lower body.',
    successCue: 'Ground up, every time.',
    progression: 'One pump, then full.', regression: 'Pump and hold each checkpoint.',
    equipment: 'None', estimatedMinutes: 6, searchQuery: 'pump drill kinematic sequence swing',
  },
  steady_head: {
    id: 'steady_head', name: 'Eyes-on-Spot', kind: 'feel',
    problemItSolves: 'Excess head movement',
    setup: 'Mark a spot where the ball would be (or a coin).',
    steps: ['Keep your eyes on the spot from start to strike', 'Make slow motions keeping the head centred', 'Have a partner gently hold a club shaft to your head as a reference'],
    repsOrDuration: '10 slow reps, then 10 at speed', difficulty: 'beginner',
    commonMistake: 'Lifting the head early to watch the result.',
    successCue: 'See the spot through the strike.',
    progression: 'Add full speed.', regression: 'Do half motions first.',
    equipment: 'A spot or coin', estimatedMinutes: 4, searchQuery: 'keep head still swing drill',
  },
  anti_sway: {
    id: 'anti_sway', name: 'Rod-Behind-Hip', kind: 'constraint',
    problemItSolves: 'Lateral sway / slide',
    setup: 'Place an object (alignment stick / chair) just outside your trail hip.',
    steps: ['Turn back without bumping into the object', 'Feel rotation, not slide', 'Rotate through to a balanced finish'],
    repsOrDuration: '3 × 10 reps', difficulty: 'beginner',
    commonMistake: 'Sliding into the object on the backswing.',
    successCue: 'Turn in a barrel, don’t slide out of it.',
    progression: 'Add the strike.', regression: 'Slow turns only.',
    equipment: 'Alignment stick or chair', estimatedMinutes: 5, searchQuery: 'anti sway turn in a barrel drill',
  },
  posture_hold: {
    id: 'posture_hold', name: 'Spine-Angle Hold', kind: 'technical',
    problemItSolves: 'Early extension / standing up (posture loss)',
    setup: 'Set up with your backside lightly against a wall or chair.',
    steps: ['Make your motion keeping your backside in contact', 'Feel your chest stay over the ball', 'Don’t let your hips push toward the ball line'],
    repsOrDuration: '3 × 8 reps', difficulty: 'intermediate',
    commonMistake: 'Hips thrusting forward, losing wall contact.',
    successCue: 'Stay in your posture through the strike.',
    progression: 'Add speed gradually.', regression: 'Half motions.',
    equipment: 'Wall or chair', estimatedMinutes: 6, searchQuery: 'early extension fix wall drill',
  },
  metronome_tempo: {
    id: 'metronome_tempo', name: 'Metronome Tempo', kind: 'feel',
    problemItSolves: 'Rushed or uneven tempo',
    setup: 'Open a metronome app at a comfortable beat.',
    steps: ['Start back on beat one', 'Reach the top on a later beat', 'Strike on the next beat', 'Keep the same count every rep'],
    repsOrDuration: '5 minutes of rhythmic reps', difficulty: 'beginner',
    commonMistake: 'Speeding up under pressure.',
    successCue: 'Same song, every swing.',
    progression: 'Increase tempo slightly.', regression: 'Slow the beat down.',
    equipment: 'Metronome app', estimatedMinutes: 5, searchQuery: 'swing tempo metronome 3 to 1 drill',
  },
  hold_finish: {
    id: 'hold_finish', name: 'Hold-Your-Finish', kind: 'feel',
    problemItSolves: 'Poor balance through the finish',
    setup: 'Anywhere with room to complete the motion.',
    steps: ['Make your full motion', 'Freeze the finish and hold for a two-count', 'Most weight on the lead foot, fully rotated', 'If you stumble, slow down and rebuild'],
    repsOrDuration: '10 reps holding each finish', difficulty: 'beginner',
    commonMistake: 'Falling backward or off the line.',
    successCue: 'Pose for the photo at the finish.',
    progression: 'Hold on a slightly unstable surface.', regression: 'Half speed.',
    equipment: 'None', estimatedMinutes: 4, searchQuery: 'hold your finish balance drill',
  },
  speed_swish: {
    id: 'speed_swish', name: 'Swish Speed', kind: 'constraint',
    problemItSolves: 'Low speed delivery',
    setup: 'Take a light object (or flip the club) so it makes a swish.',
    steps: ['Swing for the loudest swish out in front, not behind', 'Feel speed peak through the strike zone', 'Stay balanced — speed with control'],
    repsOrDuration: '3 × 8 swings each side', difficulty: 'intermediate',
    commonMistake: 'Peaking speed too early (casting).',
    successCue: 'Loudest swish at the bottom.',
    progression: 'Add the real implement.', regression: 'Half-speed rehearsals.',
    equipment: 'Light object', estimatedMinutes: 5, searchQuery: 'speed training swish drill release',
  },
};

const GENERIC: Record<DrillKind, CatalogDrill> = {
  immediate: {
    id: 'generic_immediate', name: 'Slow-Motion Rehearsal', kind: 'immediate',
    problemItSolves: 'Building awareness of the one thing to fix',
    setup: 'No ball — just you and the motion.',
    steps: ['Make the motion at 25% speed', 'Exaggerate the correction your report highlighted', 'Do 5 slow, 5 medium, 5 full', 'Film one and compare to this session'],
    repsOrDuration: '15 reps', difficulty: 'beginner',
    commonMistake: 'Going full speed before the feel is grooved.',
    successCue: 'You can feel the change before you see it.',
    progression: 'Add speed.', regression: 'Mirror work only.',
    equipment: 'None', estimatedMinutes: 5, searchQuery: 'slow motion swing rehearsal drill',
  },
  feel: { ...CATALOG.steady_head },
  technical: { ...CATALOG.posture_hold },
  constraint: { ...CATALOG.anti_sway },
};

function toPrescribed(d: CatalogDrill, kind: DrillKind, capture: CaptureContext): PrescribedDrill {
  return {
    id: d.id,
    name: d.name,
    kind,
    sport: capture.sport,
    motionType: capture.motionType,
    problemItSolves: d.problemItSolves,
    setup: d.setup,
    steps: d.steps,
    repsOrDuration: d.repsOrDuration,
    difficulty: d.difficulty,
    commonMistake: d.commonMistake,
    successCue: d.successCue,
    progression: d.progression,
    regression: d.regression,
    equipment: d.equipment,
    estimatedMinutes: d.estimatedMinutes,
    videoSearchUrl: ytSearch(`${getSport(capture.sport).name} ${d.searchQuery}`),
  };
}

/** Build the four-drill prescription from the weakest metrics. */
export function prescribeDrills(metrics: MotionMetric[], capture: CaptureContext): DrillPlan {
  const weak = metrics
    .filter((m) => m.normalizedScore != null && m.drillId)
    .sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100));

  const used = new Set<string>();
  const pickForKind = (kind: DrillKind): PrescribedDrill => {
    for (const m of weak) {
      const d = m.drillId ? CATALOG[m.drillId] : undefined;
      if (d && d.kind === kind && !used.has(d.id)) {
        used.add(d.id);
        return toPrescribed(d, kind, capture);
      }
    }
    // Fall back to the weakest unused catalog drill of any kind, else a generic.
    for (const m of weak) {
      const d = m.drillId ? CATALOG[m.drillId] : undefined;
      if (d && !used.has(d.id)) {
        used.add(d.id);
        return toPrescribed(d, kind, capture);
      }
    }
    return toPrescribed(GENERIC[kind], kind, capture);
  };

  const immediate = pickForKind('immediate');
  const feel = pickForKind('feel');
  const technical = pickForKind('technical');
  const constraint = pickForKind('constraint');

  const motionLabel = getMotion(capture.sport, capture.motionType).label;
  const weeklyPlan = [
    { day: 'Mon', focus: `${immediate.name} (awareness)`, minutes: immediate.estimatedMinutes + 5 },
    { day: 'Tue', focus: `${feel.name} (groove the feel)`, minutes: feel.estimatedMinutes + 5 },
    { day: 'Wed', focus: 'Rest or light mobility', minutes: 10 },
    { day: 'Thu', focus: `${technical.name} (build the move)`, minutes: technical.estimatedMinutes + 5 },
    { day: 'Fri', focus: `${constraint.name} (lock it in)`, minutes: constraint.estimatedMinutes + 5 },
    { day: 'Sat', focus: `Film a new ${motionLabel} and re-analyse`, minutes: 15 },
    { day: 'Sun', focus: 'Rest', minutes: 0 },
  ];

  return { immediate, feel, technical, constraint, weeklyPlan };
}

export function getCatalogDrill(id: string | null): CatalogDrill | null {
  if (!id) return null;
  return CATALOG[id] ?? null;
}
