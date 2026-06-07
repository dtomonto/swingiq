// ============================================================
// SwingVantage — BodySync: Health-Aware Coaching Engine
//
// Turns a readiness assessment into a concrete, sport-specific practice
// recommendation: session type, duration, intensity cap, warm-up, drill
// difficulty, volume, rest, and plain-English reasons. Conservative and
// non-medical — it adjusts training, it never diagnoses.
// ============================================================

import type {
  ReadinessAssessment, ManualCheckin, CoachingRecommendation, ReadinessZone,
  SessionType, SportId, BodyRegion,
} from './types';
import { SAFE_LANGUAGE } from './constants';

interface ZoneTemplate {
  sessionType: SessionType;
  durationMinutes: number;
  intensityCap: number;
  drillDifficulty: CoachingRecommendation['drillDifficulty'];
  volume: CoachingRecommendation['volume'];
  restRecommended: boolean;
  recoveryNote: string;
}

const ZONE_TEMPLATES: Record<ReadinessZone, ZoneTemplate> = {
  green: {
    sessionType: 'speed_power', durationMinutes: 75, intensityCap: 100,
    drillDifficulty: 'hard', volume: 'extended', restRecommended: false,
    recoveryNote: 'You are well-recovered — a good day to push speed, power, or performance work.',
  },
  yellow: {
    sessionType: 'technical', durationMinutes: 55, intensityCap: 75,
    drillDifficulty: 'moderate', volume: 'normal', restRecommended: false,
    recoveryNote: 'Solid but not peak — train with quality, keep the very-high-effort reps modest.',
  },
  orange: {
    sessionType: 'light_technical', durationMinutes: 35, intensityCap: 50,
    drillDifficulty: 'easy', volume: 'reduced', restRecommended: false,
    recoveryNote: `${SAFE_LANGUAGE.fatigue} Favor unhurried technical reps and mobility over speed.`,
  },
  red: {
    sessionType: 'recovery', durationMinutes: 20, intensityCap: 30,
    drillDifficulty: 'easy', volume: 'minimal', restRecommended: true,
    recoveryNote: `${SAFE_LANGUAGE.lighter} Mobility, putting/short game, or full rest will serve you better than hard swings today.`,
  },
};

// ── Sport-specific emphasis ──────────────────────────────────
const SPORT_EMPHASIS: Record<SportId, string[]> = {
  golf: [
    'Protect rotational mobility and the lower back — rotate within a comfortable range today.',
    'If you walk the course, factor walking fatigue into your energy budget.',
    'Fine motor control fades with fatigue — putting and wedges are a smart low-readiness focus.',
  ],
  tennis: [
    'Manage change-of-direction and lower-body load — shorten footwork ladders if legs feel heavy.',
    'Shoulder and elbow take serving/overhead stress — scale serve volume to readiness.',
    'Reaction time dips when tired — quality over chaotic, high-volume rallying.',
  ],
  pickleball: [
    'Quick first steps to the kitchen tax the calves and knees — warm them up before fast exchanges.',
    'Repetitive overheads and speed-ups load the shoulder — scale volume to readiness.',
    'Soft-hands touch (dinks, resets) fades when tired — favor control work over hard drives on low days.',
  ],
  padel: [
    'Constant change of direction and back-pedaling for lobs loads the legs — warm up movement first.',
    'Overheads (bandeja/víbora/smash) stress the shoulder — manage volume across long sessions.',
    'Reaction and wall-read sharpness dip when tired — prioritize quality points over marathon rallies.',
  ],
  baseball: [
    'Rotational power leans on hips and core — warm up rotation before max-effort swings/throws.',
    'Shoulder and elbow carry throwing load — respect any arm discomfort.',
    'Cap hitting/throwing volume when recovery is low to protect the lower back and forearm.',
  ],
  softball_slow: [
    'Recreational reality: warm up before the first hard sprint or throw — sudden max efforts cold are a common strain risk.',
    'Inconsistent sleep/work stress matters — let today\'s energy set the effort.',
    'Keep it fun and low-pressure; technical reps beat all-out swings on a tired day.',
  ],
  softball_fast: [
    'Throwing load and rotational speed are high-stress — manage them across multi-game days.',
    'Lower-body explosiveness needs a real warm-up — prioritize it on tournament weekends.',
    'Tournament fatigue accumulates — bank recovery between games, not just after.',
  ],
};

// ── Injury-sensitive adjustments ─────────────────────────────
const REGION_NOTE: Partial<Record<BodyRegion, string>> = {
  shoulder: 'shoulder discomfort — ease overhead and high-effort rotational load',
  elbow: 'elbow discomfort — reduce throwing/high-grip-force reps',
  wrist: 'wrist discomfort — soften impact reps and grip pressure',
  forearm: 'forearm discomfort — limit high-grip-force and heavy-impact reps',
  lower_back: 'lower-back discomfort — keep rotation gentle and avoid loaded extension',
  hip: 'hip discomfort — reduce deep rotational range',
  knee: 'knee discomfort — limit hard lateral pushes and deep loading',
  hamstring: 'hamstring discomfort — skip max sprints and explosive lower-body work',
};

function injuryNote(painAreas: BodyRegion[], pain: number): string | null {
  if (pain < 3 || painAreas.length === 0) return null;
  const notes = painAreas.map((rg) => REGION_NOTE[rg]).filter(Boolean) as string[];
  const body = notes.length ? notes.join('; ') : 'reported discomfort — keep aggravating movements light';
  return `Because of ${body}. ${SAFE_LANGUAGE.pain}`;
}

/** Which body regions to de-emphasize in drill filtering today. */
export function regionsToAvoid(today: ManualCheckin | null): BodyRegion[] {
  if (!today || (today.pain ?? 0) < 3) return [];
  return today.painAreas ?? [];
}

function warmupFor(zone: ReadinessZone, sport: SportId, today: ManualCheckin | null): string {
  const sore = (today?.soreness ?? 1) >= 4;
  const base =
    zone === 'red' || zone === 'orange'
      ? 'Extended, gentle warm-up'
      : zone === 'yellow'
        ? 'Standard progressive warm-up'
        : 'Brisk activation warm-up';
  const rot = sport === 'golf' || sport === 'baseball' || sport.startsWith('softball')
    ? ' with unloaded rotation'
    : ' with dynamic lower-body mobility';
  return `${base}${rot}${sore ? ', adding light mobility for sore areas' : ''}.`;
}

export function buildRecommendation(
  assessment: ReadinessAssessment, sport: SportId, today: ManualCheckin | null,
): CoachingRecommendation {
  const t = ZONE_TEMPLATES[assessment.zone];
  const explanation: string[] = [];

  // Top contributors that moved readiness, in plain English.
  const movers = [...assessment.readiness.contributors, ...assessment.recovery.contributors]
    .filter((c) => Math.abs(c.impact) >= 5)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3);
  for (const m of movers) {
    explanation.push(`${m.label} ${m.impact >= 0 ? 'helped' : 'weighed on'} today's readiness.`);
  }
  if (assessment.injuryRisk.reasons.length) {
    explanation.push(`Watch-outs: ${assessment.injuryRisk.reasons.join('; ')}.`);
  }
  if (assessment.confidence === 'low') {
    explanation.push(SAFE_LANGUAGE.uncertain);
  }

  const note = injuryNote(today?.painAreas ?? [], today?.pain ?? 0);

  // Performance-opportunity bump: a great day can extend the green plan.
  let durationMinutes = t.durationMinutes;
  let sessionType = t.sessionType;
  if (assessment.zone === 'green' && assessment.performanceOpportunity.score >= 80) {
    sessionType = 'performance';
    durationMinutes += 15;
    explanation.push('Strong recovery + positive trend — a genuine performance-window day.');
  }

  return {
    zone: assessment.zone,
    sessionType,
    durationMinutes,
    intensityCap: t.intensityCap,
    warmup: warmupFor(assessment.zone, sport, today),
    drillDifficulty: t.drillDifficulty,
    volume: t.volume,
    restRecommended: t.restRecommended,
    recoveryNote: t.recoveryNote,
    injuryNote: note,
    confidence: assessment.confidence,
    explanation,
    sportNotes: SPORT_EMPHASIS[sport] ?? SPORT_EMPHASIS.golf,
  };
}
