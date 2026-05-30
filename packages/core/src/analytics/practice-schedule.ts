// ============================================================
// SwingIQ — Practice Schedule Generator
// Creates a personalized weekly practice plan based on:
//   - Primary diagnosis
//   - Practice frequency from golfer profile
//   - Session length preference
//   - Available equipment (mat, simulator, outdoor range)
// ============================================================

export type PracticeDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type PracticeFrequency = '1x' | '2x' | '3x' | '4x' | '5x' | 'daily';
export type SessionLength = 'short' | 'medium' | 'long'; // 20 / 45 / 90 min

export interface PracticeBlock {
  title: string;
  description: string;
  duration_minutes: number;
  drill_ids: string[];
  youtube_search_query: string;
  focus_metric: string;
  intensity: 'warmup' | 'main' | 'challenge' | 'cool_down';
}

export interface PracticeDay_ {
  day: PracticeDay;
  session_label: string;
  total_minutes: number;
  blocks: PracticeBlock[];
  balls_needed: number;
  rest: false;
}

export interface RestDay {
  day: PracticeDay;
  rest: true;
  mental_tip: string;
}

export type WeekDay = PracticeDay_ | RestDay;

export interface WeeklySchedule {
  diagnosis_id: string;
  diagnosis_name: string;
  week_label: string;
  days: WeekDay[];
  total_sessions: number;
  total_balls: number;
  key_focus: string;
  success_criteria: string;
  generated_at: string;
}

// ── Frequency → days mapping ──────────────────────────────────

const FREQ_DAYS: Record<PracticeFrequency, PracticeDay[]> = {
  '1x':    ['Sat'],
  '2x':    ['Tue', 'Sat'],
  '3x':    ['Mon', 'Wed', 'Sat'],
  '4x':    ['Mon', 'Wed', 'Fri', 'Sat'],
  '5x':    ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
  'daily': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const SESSION_MINUTES: Record<SessionLength, number> = {
  short: 20, medium: 45, long: 90,
};

const BALLS_PER_MIN = 0.8; // ~48 balls/hour at a range

// ── Diagnosis-specific block templates ───────────────────────

interface BlockTemplate {
  title: string;
  description: string;
  youtube_search_query: string;
  focus_metric: string;
  intensity: PracticeBlock['intensity'];
  pct_of_session: number; // 0–1
}

const DIAGNOSIS_BLOCKS: Record<string, BlockTemplate[]> = {
  slice_weak_fade: [
    { title: 'Grip Pressure Warmup', description: 'Hit 10 easy wedge shots focusing on soft grip and square face at impact.', youtube_search_query: 'golf grip pressure drill square face', focus_metric: 'face_angle', intensity: 'warmup', pct_of_session: 0.2 },
    { title: 'Gate Drill — Face Control', description: 'Set two tees 1 inch outside the ball. Swing through without hitting the outer tee. Focus on a square face at impact.', youtube_search_query: 'golf gate drill face control slice fix', focus_metric: 'face_to_path', intensity: 'main', pct_of_session: 0.4 },
    { title: 'Hip Release Drill', description: 'Slow-motion swings pausing at P7 to check hip clearance. 10 reps.', youtube_search_query: 'golf hip rotation drill slice fix open face', focus_metric: 'club_path', intensity: 'main', pct_of_session: 0.3 },
    { title: 'Retest — 10 Driver Shots', description: 'Normal driver shots. Count how many start on your target line or to the left.', youtube_search_query: 'golf driver straight ball flight face path', focus_metric: 'launch_direction', intensity: 'challenge', pct_of_session: 0.1 },
  ],
  hook_overdraw: [
    { title: 'Path Awareness Warmup', description: 'Hit 10 slow pitching wedge shots with exaggerated out-to-in path feeling.', youtube_search_query: 'golf out to in swing path drill', focus_metric: 'club_path', intensity: 'warmup', pct_of_session: 0.2 },
    { title: 'Board Drill — Path Control', description: 'Place a headcover just outside the ball. Swing without hitting it to train out-to-in path.', youtube_search_query: 'golf club path board drill hook fix', focus_metric: 'club_path', intensity: 'main', pct_of_session: 0.45 },
    { title: 'Alignment Stick Drill', description: 'Use an alignment stick to verify club path direction. 15 reps.', youtube_search_query: 'golf alignment stick path drill draw hook fix', focus_metric: 'face_to_path', intensity: 'main', pct_of_session: 0.25 },
    { title: 'Retest — 10 7-Iron', description: 'Hit 10 normal 7-iron shots. Track how many draw vs. start left of target.', youtube_search_query: 'golf 7 iron straight path control', focus_metric: 'lateral_offline', intensity: 'challenge', pct_of_session: 0.1 },
  ],
  low_smash_factor: [
    { title: 'Centred Strike Warmup', description: 'Slow half swings on a mat with impact tape. Study where ball contacts face.', youtube_search_query: 'golf impact tape strike location center face drill', focus_metric: 'smash_factor', intensity: 'warmup', pct_of_session: 0.2 },
    { title: 'Ball Position Drill', description: '3 balls at different positions — forward, centre, back. Find the position giving the most centred strike.', youtube_search_query: 'golf ball position center face strike drill', focus_metric: 'smash_factor', intensity: 'main', pct_of_session: 0.4 },
    { title: 'Speed Ramp Drill', description: 'Start at 50% speed hitting the centre, increase to 90% while maintaining strike quality.', youtube_search_query: 'golf speed ramp drill smash factor efficiency', focus_metric: 'ball_speed', intensity: 'main', pct_of_session: 0.3 },
    { title: 'Retest', description: '10 7-iron shots with impact tape. Target: smash factor above 1.42.', youtube_search_query: 'golf smash factor improve center strike iron', focus_metric: 'smash_factor', intensity: 'challenge', pct_of_session: 0.1 },
  ],
  high_spin_driver: [
    { title: 'Attack Angle Warmup', description: 'Tee ball high. Make 10 easy driver swings feeling like you\'re hitting upward through the ball.', youtube_search_query: 'golf positive attack angle driver tee high', focus_metric: 'attack_angle', intensity: 'warmup', pct_of_session: 0.2 },
    { title: 'High Tee Drill', description: 'Tee the ball 1 inch higher than normal. Train catching ball on the upswing. 20 reps.', youtube_search_query: 'golf driver high tee drill low spin attack angle', focus_metric: 'attack_angle', intensity: 'main', pct_of_session: 0.4 },
    { title: 'Foot Back Drill', description: 'Pull trail foot back 6 inches to shallow the path. 10 reps.', youtube_search_query: 'golf foot back drill shallow path driver spin', focus_metric: 'spin_rate', intensity: 'main', pct_of_session: 0.3 },
    { title: 'Retest', description: '10 driver shots. Target: spin rate under 3000 RPM (or back to baseline).', youtube_search_query: 'golf driver low spin launch optimization', focus_metric: 'spin_rate', intensity: 'challenge', pct_of_session: 0.1 },
  ],
  default: [
    { title: 'General Warmup', description: 'Start with 10 wedge shots at 60% effort. Focus on solid contact.', youtube_search_query: 'golf warmup routine range drills', focus_metric: 'strike_quality', intensity: 'warmup', pct_of_session: 0.2 },
    { title: 'Block Practice — Primary Issue', description: 'Spend the main session on your primary diagnosed issue. Repeat the same motion until consistent.', youtube_search_query: 'golf block practice drill technique', focus_metric: 'consistency', intensity: 'main', pct_of_session: 0.5 },
    { title: 'Random Practice', description: 'Hit different clubs to different targets. Apply your corrections in a less structured environment.', youtube_search_query: 'golf random practice transfer on course', focus_metric: 'consistency', intensity: 'challenge', pct_of_session: 0.2 },
    { title: 'Cool-Down', description: '10 slow swings focusing on rhythm and feel. Journal one thing you improved.', youtube_search_query: 'golf practice cool down mental game', focus_metric: 'rhythm', intensity: 'cool_down', pct_of_session: 0.1 },
  ],
};

const MENTAL_TIPS: string[] = [
  'Visualise your ideal shot shape before every practice session.',
  'Review your last session\'s notes. What worked? What needs more reps?',
  'Watch one instructional video related to your primary issue.',
  'Practice your pre-shot routine mentally — full rehearsal counts.',
  'Read about the D-plane (D-plane ball flight laws) to deepen your understanding.',
  'Rest and recovery are part of skill acquisition. Take today fully off.',
  'Journal: what is your one goal for your next practice session?',
];

function getBlocks(diagnosisId: string): BlockTemplate[] {
  return DIAGNOSIS_BLOCKS[diagnosisId] ?? DIAGNOSIS_BLOCKS.default!;
}

// ── Generator ─────────────────────────────────────────────────

export function generateWeeklySchedule(
  diagnosisId: string,
  diagnosisName: string,
  frequency: PracticeFrequency = '3x',
  sessionLength: SessionLength = 'medium',
  successCriteria = 'Improve primary metric by 20%.',
): WeeklySchedule {
  const practiceDays = FREQ_DAYS[frequency];
  const allDays: PracticeDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const blockTemplates = getBlocks(diagnosisId);
  const totalMin = SESSION_MINUTES[sessionLength];

  const days: WeekDay[] = allDays.map((day, i) => {
    if (!practiceDays.includes(day)) {
      return {
        day,
        rest: true as const,
        mental_tip: MENTAL_TIPS[i % MENTAL_TIPS.length]!,
      };
    }

    const blocks: PracticeBlock[] = blockTemplates.map((tmpl) => ({
      title: tmpl.title,
      description: tmpl.description,
      duration_minutes: Math.max(5, Math.round(totalMin * tmpl.pct_of_session)),
      drill_ids: [],
      youtube_search_query: tmpl.youtube_search_query,
      focus_metric: tmpl.focus_metric,
      intensity: tmpl.intensity,
    }));

    const ballsNeeded = Math.round(totalMin * BALLS_PER_MIN);

    return {
      day,
      rest: false as const,
      session_label: `${diagnosisName} — ${sessionLength === 'short' ? 'Quick Fix' : sessionLength === 'medium' ? 'Core Session' : 'Deep Work'}`,
      total_minutes: totalMin,
      blocks,
      balls_needed: ballsNeeded,
    };
  });

  const practiceDayCount = days.filter((d) => !d.rest).length;

  return {
    diagnosis_id: diagnosisId,
    diagnosis_name: diagnosisName,
    week_label: 'This Week',
    days,
    total_sessions: practiceDayCount,
    total_balls: practiceDayCount * Math.round(totalMin * BALLS_PER_MIN),
    key_focus: blockTemplates[1]?.focus_metric ?? 'consistency',
    success_criteria: successCriteria,
    generated_at: new Date().toISOString(),
  };
}
