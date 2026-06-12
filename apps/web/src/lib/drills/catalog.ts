// ============================================================
// SwingVantage — Unified Drill Catalog (isomorphic, pure)
// ------------------------------------------------------------
// One canonical, richly-detailed drill model that powers BOTH the
// user-facing Drill Library grid and the per-drill detail page.
//
// It reuses the app's real drill sources — it does NOT invent drills:
//   • Golf      → GOLF_LIBRARY_DRILLS (below) enriched from DRILLS_CONTENT
//                 (data/drills-content.ts) for full description/steps/tips.
//   • Non-golf  → the core SportDrillRecommendation catalogs
//                 (TENNIS/BASEBALL/SLOW_PITCH/FAST_PITCH_DRILLS) which already
//                 carry steps, focus-feel cues and coach hints.
//
// Every entry exposes a stable URL slug so a drill can open into its own
// comprehensive page. Pure + deterministic so it is fully unit-testable.
// ============================================================

import {
  TENNIS_DRILLS,
  BASEBALL_DRILLS,
  SLOW_PITCH_DRILLS,
  FAST_PITCH_DRILLS,
} from '@swingiq/core';
import type { SportId } from '@swingiq/core';
import { DRILLS_CONTENT, type DrillContent } from '@/data/drills-content';

export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** One fully-resolved drill — everything the detail page needs to teach it. */
export interface DrillEntry {
  /** URL-safe, stable identifier used in /drills/[slug]. */
  slug: string;
  /** Source id (kept for traceability). */
  id: string;
  sport: SportId;
  name: string;
  /** One-line purpose. */
  goal: string;
  /** Longer explanation; falls back to goal when no richer copy exists. */
  description: string;
  difficulty: DrillDifficulty;
  /** Swing phase this drill targets, humanized (e.g. "Downswing"), or null. */
  phase: string | null;
  /** Grouping label (e.g. "Club Path"), or null. */
  category: string | null;
  /** Reps / time prescription. */
  repsOrDuration: string;
  /** Human equipment string ("2 tees", "Bat, batting tee, ball"). */
  equipment: string;
  /** Safety caveat, or null. */
  safetyNote: string | null;
  /** Ordered, step-by-step walkthrough. */
  steps: string[];
  /** Coaching tips / things to watch for. */
  tips: string[];
  /** Proprioceptive "what it should feel like" cue, or null. */
  focusFeel: string | null;
  /** The fault / weakness this drill fixes, humanized. */
  targetFault: string | null;
  /** Suggested YouTube coach channels, or null. */
  coachChannelHint: string | null;
  /** YouTube search link for video reference. */
  youtubeSearchUrl: string;
}

// ------------------------------------------------------------
// Golf source — surfaced on the library grid. Enriched below from
// DRILLS_CONTENT when a matching rich entry exists; the three drills
// without a DRILLS_CONTENT twin carry their full walkthrough inline so
// EVERY golf drill still opens into a comprehensive page.
// ------------------------------------------------------------

interface GolfSeed {
  id: string;
  name: string;
  goal: string;
  difficulty: DrillDifficulty;
  phase: string;
  reps_or_duration: string;
  equipment_needed: string;
  safety_note: string | null;
  youtube_search_url: string;
  /** Inline walkthrough for drills that have no DRILLS_CONTENT twin. */
  extra?: { description: string; targetFault: string; steps: string[]; tips: string[] };
}

const GOLF_LIBRARY_DRILLS: GolfSeed[] = [
  { id: 'g1', name: 'Gate Drill', goal: 'Groove a square face at impact', difficulty: 'beginner', phase: 'downswing', reps_or_duration: '20 reps', equipment_needed: '2 tees', safety_note: null, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+gate+drill+face+control' },
  { id: 'g2', name: 'Pause at P3 Drill', goal: 'Check club face angle mid-backswing', difficulty: 'beginner', phase: 'backswing', reps_or_duration: '15 reps', equipment_needed: 'Club', safety_note: null, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+P3+pause+drill+face+angle',
    extra: {
      description: 'A backswing checkpoint drill. By pausing when your lead arm is parallel to the ground (the "P3" position) you can verify the clubface is square before it ever reaches the top — the single biggest predictor of where the face points at impact.',
      targetFault: 'Open or shut clubface in the backswing (face-control errors)',
      steps: [
        'Take your normal address position with a mid-iron.',
        'Swing back slowly until your lead arm is parallel to the ground (P3).',
        'Stop and hold. Look up at the clubhead.',
        'The leading edge of the face should roughly match your spine angle — toe up to slightly closed is neutral.',
        'If the toe points straight down, the face is shut; if it points to the sky, it is open. Adjust your grip/forearm rotation and repeat.',
        'Once it looks square at P3, complete the swing at half speed to let the position transfer.',
      ],
      tips: [
        'Use a mirror or a phone on a tripod (down-the-line view) to check the face yourself.',
        'This is a feel-and-checkpoint drill — do not rush it; the pause is the point.',
        'A square P3 makes a square top far more likely, which makes a square impact far more likely.',
        'Do 10–15 slow reps before hitting balls so the checkpoint carries into your full swing.',
      ],
    },
  },
  { id: 'g3', name: 'Hip Clearance Drill', goal: 'Learn proper hip rotation through impact', difficulty: 'intermediate', phase: 'downswing', reps_or_duration: '10 slow, 10 full', equipment_needed: 'Club', safety_note: null, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+hip+rotation+drill+clearance+impact',
    extra: {
      description: 'Trains the lead hip to rotate and clear out of the way through impact instead of sliding toward the target. Clearing the hips creates room for the arms to swing through and is a primary source of effortless speed.',
      targetFault: 'Stalled hips / lateral hip slide (loss of speed and a blocked release)',
      steps: [
        'Set up to a ball with a mid-iron in your normal posture.',
        'Make a half backswing.',
        'On the way down, feel your lead hip rotate backward (behind you), as if clearing it out of the way.',
        'Your belt buckle should finish pointing left of the target (for a right-hander) at the finish.',
        'Do 10 slow rehearsals exaggerating the rotation, then 10 full-speed swings keeping the same feel.',
        'Check your finish: most of your weight should be on the lead foot with the hips fully turned through.',
      ],
      tips: [
        'Think "rotate, don\'t slide" — the lead hip turns deep, it does not bump toward the target.',
        'A great feel: try to point your lead back pocket at the target through impact.',
        'If you tend to hang back, hold your finish for three seconds to confirm a full weight shift.',
        'Filming face-on shows whether the hips clear or stall.',
      ],
    },
  },
  { id: 'g4', name: 'High Tee Driver Drill', goal: 'Train positive attack angle to reduce spin', difficulty: 'intermediate', phase: 'impact', reps_or_duration: '15 reps', equipment_needed: 'Driver, high tees', safety_note: null, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+high+tee+drill+driver+attack+angle+low+spin' },
  { id: 'g5', name: 'Alignment Stick Path Drill', goal: 'Visualize and improve club path direction', difficulty: 'beginner', phase: 'setup', reps_or_duration: '20 reps', equipment_needed: '2 alignment sticks', safety_note: null, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+alignment+stick+path+drill+outside+in' },
  { id: 'g6', name: 'Impact Bag Drill', goal: 'Build a strong impact position with forward shaft lean', difficulty: 'beginner', phase: 'impact', reps_or_duration: '30 reps', equipment_needed: 'Impact bag or cushion', safety_note: 'Do not swing at full speed into the bag.', youtube_search_url: 'https://www.youtube.com/results?search_query=golf+impact+bag+drill+shaft+lean+position' },
  { id: 'g7', name: 'Step Drill', goal: 'Improve weight transfer and sequencing', difficulty: 'intermediate', phase: 'downswing', reps_or_duration: '20 reps', equipment_needed: 'Iron', safety_note: null, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+step+drill+weight+transfer+sequence',
    extra: {
      description: 'Borrowed from baseball hitting, the step drill teaches the proper downswing sequence — lower body first. By stepping toward the target as you start down, you physically can\'t fire your arms early, so weight transfer and sequencing fall into place.',
      targetFault: 'Reverse pivot / poor weight transfer / arms-first downswing (casting)',
      steps: [
        'Address the ball with your feet together, weight neutral, holding a mid-iron.',
        'Start your backswing and, as you reach the top, step your lead foot toward the target.',
        'Let the step trigger the downswing — the lower body moves first, then the arms follow.',
        'Swing through to a balanced finish with your weight on the lead foot.',
        'Do 10 slow rehearsals feeling the step-then-swing timing, then 10 reps hitting soft shots.',
        'Gradually blend the feel into your normal stance without the exaggerated step.',
      ],
      tips: [
        'The step should feel athletic and unhurried — like throwing a ball, not jumping.',
        'If you cast or come over the top, this drill is one of the fastest fixes because it forces lower-body lead.',
        'Keep it to short irons and partial swings at first.',
        'Stop if balance feels off — re-set rather than forcing the step.',
      ],
    },
  },
  { id: 'g8', name: 'Pump Drill', goal: 'Shallow the club on the downswing', difficulty: 'advanced', phase: 'transition', reps_or_duration: '20 slow reps', equipment_needed: 'Iron', safety_note: null, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+pump+drill+shallow+downswing+lag' },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Humanize a snake_case token: "late_contact" → "Late contact". */
function humanize(token: string | null): string | null {
  if (!token) return null;
  const t = token.replace(/[-_]/g, ' ').trim();
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Match a golf seed to its rich DRILLS_CONTENT twin by title (case-insensitive). */
function findGolfContent(name: string): DrillContent | undefined {
  const key = name.trim().toLowerCase();
  return DRILLS_CONTENT.find((d) => d.sport === 'golf' && d.title.trim().toLowerCase() === key);
}

function golfToEntry(seed: GolfSeed): DrillEntry {
  const rich = findGolfContent(seed.name);
  const description = rich?.description ?? seed.extra?.description ?? seed.goal;
  const steps = rich?.steps ?? seed.extra?.steps ?? [];
  const tips = rich?.tips ?? seed.extra?.tips ?? [];
  const targetFault = rich?.targetFault ?? seed.extra?.targetFault ?? null;
  return {
    slug: '',
    id: seed.id,
    sport: 'golf',
    name: seed.name,
    goal: seed.goal,
    description,
    difficulty: seed.difficulty,
    phase: humanize(seed.phase),
    category: rich?.category ?? null,
    repsOrDuration: seed.reps_or_duration,
    equipment: seed.equipment_needed,
    safetyNote: seed.safety_note,
    steps,
    tips,
    focusFeel: null,
    targetFault,
    coachChannelHint: null,
    youtubeSearchUrl: seed.youtube_search_url,
  };
}

/** Minimal structural shape of a core SportDrillRecommendation (superset in core). */
interface CoreDrillLike {
  id: string;
  sport_id: SportId;
  issue_id: string | null;
  phase: string | null;
  name: string;
  goal: string;
  steps: string[];
  reps_or_duration: string;
  difficulty: DrillDifficulty;
  equipment_needed: string;
  safety_note: string | null;
  youtube_search_url: string;
  coach_channel_hint?: string;
  focus_feel?: string;
}

function coreToEntry(d: CoreDrillLike): DrillEntry {
  const tips: string[] = [];
  if (d.focus_feel) tips.push(d.focus_feel);
  return {
    slug: '',
    id: d.id,
    sport: d.sport_id,
    name: d.name,
    goal: d.goal,
    description: d.goal,
    difficulty: d.difficulty,
    phase: humanize(d.phase),
    category: humanize(d.issue_id),
    repsOrDuration: d.reps_or_duration,
    equipment: d.equipment_needed,
    safetyNote: d.safety_note,
    steps: d.steps ?? [],
    tips,
    focusFeel: d.focus_feel ?? null,
    targetFault: humanize(d.issue_id),
    coachChannelHint: d.coach_channel_hint ?? null,
    youtubeSearchUrl: d.youtube_search_url,
  };
}

/** Assign unique slugs (sport-prefixed); de-dupe collisions with the source id. */
function withSlugs(entries: DrillEntry[]): DrillEntry[] {
  const used = new Set<string>();
  return entries.map((e) => {
    let slug = `${slugify(e.sport)}-${slugify(e.name)}`;
    if (used.has(slug)) slug = `${slug}-${slugify(e.id)}`;
    used.add(slug);
    return { ...e, slug };
  });
}

// ------------------------------------------------------------
// Catalog (built once, module-level)
// ------------------------------------------------------------

const CATALOG: DrillEntry[] = withSlugs([
  ...GOLF_LIBRARY_DRILLS.map(golfToEntry),
  ...(TENNIS_DRILLS as unknown as CoreDrillLike[]).map(coreToEntry),
  ...(BASEBALL_DRILLS as unknown as CoreDrillLike[]).map(coreToEntry),
  ...(SLOW_PITCH_DRILLS as unknown as CoreDrillLike[]).map(coreToEntry),
  ...(FAST_PITCH_DRILLS as unknown as CoreDrillLike[]).map(coreToEntry),
]);

const BY_SLUG = new Map(CATALOG.map((d) => [d.slug, d]));

/** Every drill in the library, in display order (golf first, then by sport). */
export function getAllDrills(): DrillEntry[] {
  return CATALOG;
}

/** Resolve a single drill by its URL slug, or undefined. */
export function getDrillBySlug(slug: string): DrillEntry | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Related drills for the detail page: same sport, ranked by shared
 * category/phase, excluding the drill itself. Deterministic order.
 */
export function getRelatedDrills(drill: DrillEntry, limit = 3): DrillEntry[] {
  const score = (o: DrillEntry): number => {
    let s = 0;
    if (o.category && o.category === drill.category) s += 2;
    if (o.phase && o.phase === drill.phase) s += 1;
    if (o.difficulty === drill.difficulty) s += 1;
    return s;
  };
  return CATALOG.filter((o) => o.sport === drill.sport && o.slug !== drill.slug)
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s || a.o.name.localeCompare(b.o.name))
    .slice(0, limit)
    .map((x) => x.o);
}
