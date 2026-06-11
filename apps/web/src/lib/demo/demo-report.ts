// ============================================================
// SwingVantage — Demo report model (all 7 sports)
//
// One unified view-model so the public /demo can show a comprehensive,
// switchable report for every sport. HONESTY by construction:
//   • Golf  → computed by the REAL diagnostic + scoring engine from
//             sample shots (lib/demo/swing-demo). Nothing hand-typed.
//   • Others→ assembled from REAL registry content (phase definitions
//             + coaching cues, the sport's real drill library, and the
//             published benchmark windows). The primary fix shown is a
//             representative case; the whole surface is labelled "sample".
//
// Everything here is deterministic (no randomness) so the demo renders
// identically on server and client.
// ============================================================

import {
  runDiagnosticEngine,
  computeSwingScores,
  buildSessionInsight,
  getRoutineForDiagnosis,
  shotsToDispersionPoints,
  computeDispersion,
  getSportConfig,
  TENNIS_DRILLS,
  PICKLEBALL_DRILLS,
  PADEL_DRILLS,
  BASEBALL_DRILLS,
  SLOW_PITCH_DRILLS,
  FAST_PITCH_DRILLS,
} from '@swingiq/core';
import type {
  Shot,
  SportId,
  SportDrillRecommendation,
} from '@swingiq/core';
import { DEMO_PROFILE, demoDiagnoseSession } from './swing-demo';

// ── View-model ────────────────────────────────────────────────

export type DemoSportId = SportId;

export interface DemoSubScore {
  label: string;
  value: number;
}

export type PhaseStatus = 'good' | 'watch' | 'fix';

export interface DemoPhase {
  label: string;
  cue: string;
  status: PhaseStatus;
}

export type IssueSeverity = 'critical' | 'notable' | 'minor';

export interface DemoIssue {
  label: string;
  severity: IssueSeverity;
  cause: string;
}

export interface DemoDrill {
  name: string;
  purpose: string;
  steps?: string[];
  reps?: string;
  feel?: string;
  youtube?: string;
}

export interface DemoBenchmark {
  label: string;
  target: string;
  range: string;
  note: string;
}

export interface DemoMetric {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'danger' | 'neutral';
}

export interface DemoPlanDay {
  day: string;
  focus: string;
}

export interface DemoProfileSnapshot {
  name: string;
  level: string;
  goal: string;
  miss: string;
  fields: { label: string; value: string }[];
}

export interface DemoReport {
  sport: {
    id: DemoSportId;
    slug: string;
    name: string;
    emoji: string;
    accent: string;
    tagline: string;
  };
  sessionId: string;
  score: number;
  /** Golf only — the 5 real sub-scores. */
  subScores?: DemoSubScore[];
  primaryFix: { title: string; cause: string; whyItMatters: string };
  issues: DemoIssue[];
  phases: DemoPhase[];
  /** Golf: real computed dispersion stats. */
  metrics?: DemoMetric[];
  /** Non-golf: real benchmark windows for the athlete's level. */
  benchmarks?: DemoBenchmark[];
  drills: DemoDrill[];
  plan: DemoPlanDay[];
  profile: DemoProfileSnapshot;
  whatToDoNext: string;
  /** Golf only — sample shot rows for the shot table. */
  shots?: Shot[];
}

// ── Sport <-> URL slug ────────────────────────────────────────

const SLUG_BY_ID: Record<DemoSportId, string> = {
  golf: 'golf',
  tennis: 'tennis',
  pickleball: 'pickleball',
  padel: 'padel',
  baseball: 'baseball',
  softball_slow: 'slow-pitch',
  softball_fast: 'fast-pitch',
};
const ID_BY_SLUG: Record<string, DemoSportId> = Object.fromEntries(
  Object.entries(SLUG_BY_ID).map(([id, slug]) => [slug, id as DemoSportId]),
) as Record<string, DemoSportId>;

export const DEMO_SPORT_SLUGS = Object.values(SLUG_BY_ID);
export const DEMO_SPORT_IDS = Object.keys(SLUG_BY_ID) as DemoSportId[];

export function slugForSport(id: DemoSportId): string {
  return SLUG_BY_ID[id];
}
export function sportForSlug(slug: string): DemoSportId | null {
  return ID_BY_SLUG[slug] ?? null;
}

// ── Sport display meta (accent/name/emoji from the registry) ──

const GOLF_META = { id: 'golf' as const, name: 'Golf', emoji: '⛳', accent: '#22C55E', tagline: 'From tee to green.' };

function sportMeta(id: DemoSportId) {
  if (id === 'golf') return GOLF_META;
  const c = getSportConfig(id)!;
  return { id, name: c.name, emoji: c.emoji, accent: c.accent_hex, tagline: c.tagline };
}

/** Lightweight sport display meta (name/emoji/accent/slug) — no engine run. */
export function getDemoSportMeta(id: DemoSportId) {
  return { ...sportMeta(id), slug: slugForSport(id) };
}

// ── Drill normalisation ───────────────────────────────────────

function toDemoDrill(d: SportDrillRecommendation): DemoDrill {
  return {
    name: d.name,
    purpose: d.goal,
    steps: d.steps?.slice(0, 4),
    reps: d.reps_or_duration,
    feel: d.focus_feel,
    youtube: d.youtube_search_url,
  };
}

const DRILLS_BY_SPORT: Partial<Record<DemoSportId, SportDrillRecommendation[]>> = {
  tennis: TENNIS_DRILLS,
  pickleball: PICKLEBALL_DRILLS,
  padel: PADEL_DRILLS,
  baseball: BASEBALL_DRILLS,
  softball_slow: SLOW_PITCH_DRILLS,
  softball_fast: FAST_PITCH_DRILLS,
};

/** Real drills for the primary issue, topped up to 3 from the sport's library. */
function pickDrills(id: DemoSportId, issueId: string): DemoDrill[] {
  const lib = DRILLS_BY_SPORT[id] ?? [];
  const forIssue = lib.filter((d) => d.issue_id === issueId);
  const rest = lib.filter((d) => d.issue_id !== issueId);
  const chosen = [...forIssue, ...rest].slice(0, 3);
  return chosen.map(toDemoDrill);
}

// ── Phase strip ───────────────────────────────────────────────

function buildPhases(id: DemoSportId, affected: string[]): DemoPhase[] {
  const config = getSportConfig(id);
  if (!config) return [];
  const watch = new Set([config.phase_sequence[1], config.phase_sequence[2]]);
  return config.phase_sequence.map((pid) => {
    const def = config.phases[pid];
    const status: PhaseStatus = affected.includes(pid)
      ? 'fix'
      : watch.has(pid)
      ? 'watch'
      : 'good';
    return { label: def?.short_label || def?.label || pid, cue: def?.coaching_cue ?? '', status };
  });
}

function buildBenchmarks(id: DemoSportId): DemoBenchmark[] {
  const config = getSportConfig(id);
  if (!config) return [];
  const windows = config.benchmarks.segmented.intermediate ?? {};
  return Object.entries(windows)
    .slice(0, 4)
    .map(([key, w]) => ({
      label: humanize(key),
      target: `${w.target}${w.unit ? ` ${w.unit}` : ''}`,
      range: `${w.min}–${w.max}${w.unit ? ` ${w.unit}` : ''}`,
      note: w.description,
    }));
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Per-sport curated specs (non-golf) ────────────────────────
// Each references a REAL issue id (so real drills attach) + a real
// phase id from that sport's sequence. Copy is representative.

interface SportSpec {
  score: number;
  issueId: string;
  affectedPhases: string[];
  primary: { title: string; cause: string; whyItMatters: string };
  issues: DemoIssue[];
  whatToDoNext: string;
  profile: DemoProfileSnapshot;
}

const SPECS: Record<Exclude<DemoSportId, 'golf'>, SportSpec> = {
  tennis: {
    score: 79,
    issueId: 'late_contact',
    affectedPhases: ['contact_zone'],
    primary: {
      title: 'Late Contact Point',
      cause: 'Unit-turn preparation starts a beat late, so the ball is met beside the front hip instead of out in front.',
      whyItMatters: 'Forward contact is where racket-head speed and topspin actually transfer to the ball — meeting it late bleeds power and leaves the face open, the #1 driver of the floaty, short forehand.',
    },
    issues: [
      { label: 'Abbreviated Follow-Through', severity: 'notable', cause: 'Steering the ball with the arm instead of letting the swing finish over the shoulder.' },
      { label: 'Head Pulling Off Ball', severity: 'minor', cause: 'Anticipating the result; the shoulder rotation tows the eyes off contact.' },
    ],
    whatToDoNext: 'Spend this week training a forward contact point. Start with the Toss-and-Hit drill, then groove the windshield-wiper finish so the racket keeps flowing through the ball.',
    profile: {
      name: 'Jordan Lee', level: 'Intermediate (3.5 NTRP)', goal: 'Add topspin and consistency to the forehand',
      miss: 'Floaty forehand that lands short',
      fields: [
        { label: 'Dominant hand', value: 'Right' },
        { label: 'Grip', value: 'Semi-western' },
        { label: 'Plays', value: 'Singles, 2× / week' },
        { label: 'Racket', value: 'Wilson Blade 98, 16×19' },
      ],
    },
  },
  pickleball: {
    score: 81,
    issueId: 'pb_popping_up_dinks',
    affectedPhases: ['contact'],
    primary: {
      title: 'Popping Up Dinks',
      cause: 'Paddle face opens through a slightly upward contact, sending soft dinks high enough to attack.',
      whyItMatters: 'In the kitchen, an attackable dink loses the point. A stable, slightly-closed face on a level path keeps the ball low and unattackable — the foundation of the soft game.',
    },
    issues: [
      { label: 'Long Backswing', severity: 'notable', cause: 'Too much paddle takeaway for a touch shot reduces control and adds pace you do not want.' },
      { label: 'Wristy Contact', severity: 'minor', cause: 'Flicking the wrist at the ball instead of moving the paddle with a quiet shoulder.' },
    ],
    whatToDoNext: 'Quiet the paddle and the wrist. Drill cross-court dinks aiming to keep every ball below net-cord height, then add a target zone at the opponent’s feet.',
    profile: {
      name: 'Sam Rivera', level: 'Intermediate (3.5 DUPR)', goal: 'Win more kitchen exchanges',
      miss: 'Dinks sit up and get attacked',
      fields: [
        { label: 'Dominant hand', value: 'Right' },
        { label: 'Plays', value: 'Doubles, 3× / week' },
        { label: 'Paddle', value: 'Joola Ben Johns Hyperion' },
        { label: 'Focus', value: 'Third-shot drop + dinks' },
      ],
    },
  },
  padel: {
    score: 78,
    issueId: 'pd_late_after_wall',
    affectedPhases: ['contact'],
    primary: {
      title: 'Late After the Wall',
      cause: 'Preparation waits for the ball to come off the back glass, so contact is rushed and behind the body.',
      whyItMatters: 'Reading the rebound early is what separates padel from tennis. Prepare as the ball passes you and you can take the bandeja in front, holding the net instead of getting pushed back.',
    },
    issues: [
      { label: 'Weak Bandeja', severity: 'notable', cause: 'Flat, slow overhead that sits up — lets the opponents take the net back.' },
      { label: 'Poor Net Transition', severity: 'minor', cause: 'Hanging at the back after the rebound instead of recovering to the net line.' },
    ],
    whatToDoNext: 'Train the wall read: prepare the racket as the ball passes you, not after it bounces. Then groove a controlled bandeja that lands deep and lets you hold the net.',
    profile: {
      name: 'Diego Morales', level: 'Intermediate', goal: 'Hold the net more consistently',
      miss: 'Rushed contact off the back glass',
      fields: [
        { label: 'Dominant hand', value: 'Right' },
        { label: 'Plays', value: 'Doubles, right side' },
        { label: 'Racket', value: 'Bullpadel Vertex, teardrop' },
        { label: 'Focus', value: 'Bandeja + glass play' },
      ],
    },
  },
  baseball: {
    score: 80,
    issueId: 'casting_hands',
    affectedPhases: ['bat_lag'],
    primary: {
      title: 'Casting the Hands',
      cause: 'The hands push out and away from the body early, widening the bat path and losing lag into the zone.',
      whyItMatters: 'Casting adds length and time to the swing — you get beat by velocity and roll over outside pitches. Keeping the knob to the ball tightens the path and lets the barrel stay in the zone longer.',
    },
    issues: [
      { label: 'Arm Bar (Lead Arm)', severity: 'notable', cause: 'Lead arm straightens too early in the load, forcing the bat around the ball.' },
      { label: 'Early Shoulder Pull', severity: 'minor', cause: 'Front shoulder flies open before contact, pulling the barrel off the plane.' },
    ],
    whatToDoNext: 'Shorten the path to the ball. Work knob-to-ball connection drills this week, then layer in tee work on the outer third to feel the barrel staying inside.',
    profile: {
      name: 'Tyler Brooks', level: 'High School Varsity', goal: 'Drive the ball to all fields with more authority',
      miss: 'Rolls over to the pull side',
      fields: [
        { label: 'Bats', value: 'Right' },
        { label: 'Position', value: 'Outfield' },
        { label: 'Bat', value: 'Marucci CAT9, 32"/29oz' },
        { label: 'Focus', value: 'Bat path + connection' },
      ],
    },
  },
  softball_slow: {
    score: 82,
    issueId: 'sp_too_uppercut',
    affectedPhases: ['contact'],
    primary: {
      title: 'Over-Uppercut Swing Plane',
      cause: 'The barrel drops too far below the hands, matching the steep arc with an even steeper swing — producing pop-ups.',
      whyItMatters: 'Slow-pitch is won by matching the descending arc with a slightly-up, on-plane swing. Too much uppercut and you live under the ball; a controlled plane turns those pop-ups into line drives.',
    },
    issues: [
      { label: 'Poor Arc Timing', severity: 'notable', cause: 'Starting the swing too early on the high arc, so the barrel arrives before the ball.' },
      { label: 'Pulling Off Early', severity: 'minor', cause: 'Front side opens before contact, leaking power and spraying the pull side.' },
    ],
    whatToDoNext: 'Match the arc with a controlled plane. Drill staying on top of the ball into a slightly-up finish, then time the load to the pitch’s peak.',
    profile: {
      name: 'Casey Nguyen', level: 'Rec League', goal: 'Hit more line drives, fewer pop-ups',
      miss: 'Pop-ups under the ball',
      fields: [
        { label: 'Bats', value: 'Left' },
        { label: 'League', value: 'Co-ed slow pitch' },
        { label: 'Bat', value: 'Miken Freak, 34"/26oz' },
        { label: 'Focus', value: 'Swing plane + timing' },
      ],
    },
  },
  softball_fast: {
    score: 80,
    issueId: 'fp_poor_separation',
    affectedPhases: ['hip_fire'],
    primary: {
      title: 'Poor Hip–Shoulder Separation',
      cause: 'Hips and shoulders rotate together, so there’s no stretch to release — the swing is all arms against the rise.',
      whyItMatters: 'Against the short reaction window of fast-pitch, separation is the engine. Letting the hips fire while the shoulders stay closed stores energy you can unleash on time, on plane.',
    },
    issues: [
      { label: 'Late Load', severity: 'notable', cause: 'Loading too late for the pitch speed, forcing a rushed, all-arms swing.' },
      { label: 'Hand Drop', severity: 'minor', cause: 'Hands dip on launch, adding length and an uppercut against the rising ball.' },
    ],
    whatToDoNext: 'Build the stretch. Drill hips-first rotation with the shoulders staying closed a beat longer, then time the load earlier so you’re on plane against the rise.',
    profile: {
      name: 'Riley Carter', level: 'Travel Ball (16U)', goal: 'Catch up to higher velocity',
      miss: 'Late and jammed against the rise',
      fields: [
        { label: 'Bats', value: 'Right' },
        { label: 'Position', value: 'Middle infield' },
        { label: 'Bat', value: 'DeMarini CF, 33"/23oz' },
        { label: 'Focus', value: 'Separation + timing' },
      ],
    },
  },
};

// ── 7-day plan generator (references the real drills) ─────────

function buildPlan(primaryTitle: string, drills: DemoDrill[]): DemoPlanDay[] {
  const d0 = drills[0]?.name ?? 'the priority drill';
  const d1 = drills[1]?.name ?? d0;
  const d2 = drills[2]?.name ?? d1;
  return [
    { day: 'Day 1', focus: `Understand the fix — slow reps grooving the feel of correcting "${primaryTitle.toLowerCase()}".` },
    { day: 'Day 2', focus: `${d0} — block practice, quality over quantity.` },
    { day: 'Day 3', focus: `${d0} at full speed, then add ${d1}.` },
    { day: 'Day 4', focus: `${d1} — build it into a repeatable pattern.` },
    { day: 'Day 5', focus: `${d2} — integrate the new feel into normal swings.` },
    { day: 'Day 6', focus: 'Pressure practice — random reps and a small game/scoring challenge.' },
    { day: 'Day 7', focus: 'Re-film and retest. Compare against today to confirm the change is sticking.' },
  ];
}

// ── Builders ──────────────────────────────────────────────────

function buildGolfReport(): DemoReport {
  const session = demoDiagnoseSession();
  const shots = session.shots as Shot[];
  const result = runDiagnosticEngine(shots, 'mid_iron', session.id, 'local');
  const scores = computeSwingScores(result.stats);
  const insight = buildSessionInsight(result);
  const top = result.diagnoses[0];
  const routine = top ? getRoutineForDiagnosis(top.rule.id, 'intermediate') : null;

  const pts = shotsToDispersionPoints(
    shots.map((s) => ({ ball_data: s.ball_data as unknown as Record<string, unknown> })),
  );
  const dispersion = pts.length >= 3 ? computeDispersion(pts) : null;

  const drills: DemoDrill[] = (routine?.drill_recommendations ?? []).slice(0, 3).map((d) => ({
    name: d.name,
    purpose: d.why_this_matches,
    youtube: d.youtube_search_url,
  }));

  const meta = sportMeta('golf');
  const primaryTitle = top?.rule.name ?? 'Open Clubface at Impact';

  const metrics: DemoMetric[] = dispersion
    ? [
        { label: 'Mean Lateral', value: `${dispersion.mean_lateral > 0 ? '+' : ''}${dispersion.mean_lateral} yds`, status: Math.abs(dispersion.mean_lateral) > 10 ? 'danger' : 'neutral' },
        { label: 'Lateral StdDev', value: `${dispersion.std_lateral} yds`, status: dispersion.std_lateral > 15 ? 'danger' : dispersion.std_lateral > 8 ? 'warning' : 'good' },
        { label: 'On Target', value: `${dispersion.pct_on_target}%`, status: dispersion.pct_on_target > 60 ? 'good' : 'warning' },
        { label: 'Carry Range', value: `${dispersion.carry_range} yds`, status: dispersion.carry_range > 40 ? 'danger' : 'neutral' },
      ]
    : [];

  // Golf phase strip (display reference — golf phases live in the
  // video-analysis package; this is the standard full-swing sequence).
  const golfFix = new Set(['Impact', 'Downswing']);
  const golfWatch = new Set(['Transition']);
  const phases: DemoPhase[] = [
    ['Address', 'Athletic, balanced setup with the ball positioned for the club.'],
    ['Takeaway', 'One-piece move — hands, arms, and chest move together.'],
    ['Backswing', 'Turn into the trail side, maintaining width and posture.'],
    ['Transition', 'Lower body leads; let the club shallow into the slot.'],
    ['Downswing', 'Rotate through; keep the face square to the path.'],
    ['Impact', 'Hands ahead, face controlled, weight into the lead side.'],
    ['Follow-through', 'Full, balanced finish facing the target.'],
  ].map(([label, cue]) => ({
    label, cue,
    status: golfFix.has(label) ? 'fix' : golfWatch.has(label) ? 'watch' : 'good',
  }));

  return {
    sport: { ...meta, slug: 'golf' },
    sessionId: 'SV-0842',
    score: scores.overall,
    subScores: [
      { label: 'Overall', value: scores.overall },
      { label: 'Face', value: scores.face_control },
      { label: 'Path', value: scores.path_control },
      { label: 'Strike', value: scores.strike_quality },
      { label: 'Dispersion', value: scores.dispersion },
    ],
    primaryFix: {
      title: primaryTitle,
      cause: top?.rule.likely_cause ?? 'An open clubface relative to the swing path at impact.',
      whyItMatters: 'Face angle is the dominant factor in where the ball starts and curves. Squaring it at impact is the fastest path to straighter, longer shots and tighter dispersion.',
    },
    issues: result.diagnoses.slice(1, 3).map((d) => ({
      label: d.rule.name,
      severity: d.rule.priority === 'critical' ? 'critical' : d.rule.priority === 'high' ? 'notable' : 'minor',
      cause: d.rule.likely_cause,
    })),
    phases,
    metrics,
    drills,
    plan: buildPlan(primaryTitle, drills),
    profile: {
      name: DEMO_PROFILE.name ?? 'Alex Carter',
      level: 'Intermediate · 12 handicap',
      goal: DEMO_PROFILE.primary_goal ?? 'Break 85 consistently',
      miss: DEMO_PROFILE.current_miss ?? 'Slice with the driver',
      fields: [
        { label: 'Handedness', value: 'Right' },
        { label: 'Scoring avg', value: String(DEMO_PROFILE.scoring_average ?? 88) },
        { label: 'Desired shape', value: 'Draw' },
        { label: 'Launch monitor', value: 'Rapsodo' },
      ],
    },
    whatToDoNext: insight?.what_do_i_do_next ?? 'Prioritise squaring the face at impact — it is the highest-leverage change for your miss.',
    shots: shots.slice(0, 10),
  };
}

function buildSportReport(id: Exclude<DemoSportId, 'golf'>): DemoReport {
  const meta = sportMeta(id);
  const spec = SPECS[id];
  const drills = pickDrills(id, spec.issueId);
  return {
    sport: { ...meta, slug: slugForSport(id) },
    sessionId: `SV-${1000 + DEMO_SPORT_IDS.indexOf(id) * 137}`,
    score: spec.score,
    primaryFix: spec.primary,
    issues: spec.issues,
    phases: buildPhases(id, spec.affectedPhases),
    benchmarks: buildBenchmarks(id),
    drills,
    plan: buildPlan(spec.primary.title, drills),
    profile: spec.profile,
    whatToDoNext: spec.whatToDoNext,
  };
}

/** Build the full demo report for any sport (deterministic). */
export function buildDemoReport(id: DemoSportId): DemoReport {
  return id === 'golf' ? buildGolfReport() : buildSportReport(id);
}
