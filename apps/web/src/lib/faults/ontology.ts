// ============================================================
// SwingVantage — Multi-Sport Fault Ontology: Data + Resolver
// ------------------------------------------------------------
// A curated set of high-value faults across all five sports,
// plus an honest generic resolver so EVERY fault id (including
// the ~80 in core and any new AI-surfaced label) maps to a
// usable entry — never to fabricated detail.
//
// `resolveFault` is the function the rest of the app should call:
// it returns a curated entry when one exists, otherwise a clearly
// `generated: true` entry derived from the id/label.
// ============================================================

import type { SportId } from '@swingiq/core';
import type {
  FaultAudience,
  FaultOntologyEntry,
  FaultRetestCriteria,
  ResolveFaultOptions,
} from './types';

const ALL_SPORTS: SportId[] = ['golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast'];

/** Sensible same-condition defaults reused by most retest criteria. */
function sameConditions(extra: string[] = []): string[] {
  return [
    'Same sport and same swing/stroke type',
    'Same camera angle and roughly the same distance',
    'Same equipment where it applies',
    ...extra,
  ];
}

/** A safe default retest window for estimated, video-based findings. */
function defaultRetest(partial: Partial<FaultRetestCriteria> = {}): FaultRetestCriteria {
  return {
    activeWindowDays: 7,
    whatToReassess: 'Whether the same pattern still shows up in a fresh swing video.',
    sameConditions: sameConditions(),
    improvedWhen: 'The pattern is noticeably reduced or no longer the top priority.',
    ...partial,
  };
}

// ──────────────────────────────────────────────────────────────
// Curated entries — the most common, highest-leverage faults.
// IDs match core SportIssueId / VisualIssueId where they exist.
// ──────────────────────────────────────────────────────────────

const CURATED: FaultOntologyEntry[] = [
  // ── Golf ──────────────────────────────────────────────────────
  {
    id: 'early_extension',
    sports: ['golf'],
    name: 'Early Extension',
    description:
      'The hips push toward the ball through the downswing instead of staying back and rotating, crowding the arms and the club.',
    likelyRootCauses: [
      'Standing up out of posture to make room for the arms',
      'Driving the hips forward instead of rotating them',
      'Loss of trail-side flexion in transition',
    ],
    observableEvidence: [
      'Backside moves toward the ball through impact',
      'Hands get trapped behind the body, club gets stuck inside',
    ],
    defaultSeverity: 'notable',
    drillFamilies: ['posture & hip depth', 'rotation & sequencing'],
    retest: defaultRetest({
      whatToReassess: 'Whether your hips stay in posture (backside near the wall line) through impact.',
      improvedWhen: 'Your trail hip holds depth longer and the club is less stuck behind you.',
    }),
    safetyCautions: ['Stop if you feel any low-back pinching — rotate, do not force lateral bend.'],
    explanations: {
      parent:
        'Their body is standing up a little too early in the swing. The drills below help them stay in a steady, athletic posture — it should feel smoother, not forced.',
      coach:
        'Early extension: loss of posture/hip depth in transition. Prioritize a hip-depth retention cue (wall/chair) and re-test face-on after a short block.',
      advanced:
        'Trail hip loses flexion and thrusts toward the ball line in transition, narrowing the hip-arm gap and forcing a stuck/under shallow recovery. Train posterior pelvic depth and lead-side rotation.',
    },
    typicalEvidenceBasis: 'ai_inferred',
  },
  {
    id: 'over_the_top',
    sports: ['golf'],
    name: 'Over the Top',
    description:
      'The club moves out and over the ideal path in transition, producing an out-to-in swing direction (pulls and slices).',
    likelyRootCauses: [
      'Starting the downswing with the shoulders/arms instead of the lower body',
      'Trying to add power from the top',
    ],
    observableEvidence: [
      'Club approaches from outside the target line',
      'Ball starts left and/or slices (for a right-hander)',
    ],
    defaultSeverity: 'notable',
    drillFamilies: ['transition & sequencing', 'swing path'],
    retest: defaultRetest({
      whatToReassess: 'Whether the downswing starts from the ground up and the path is less out-to-in.',
      improvedWhen: 'Start direction is more neutral and the steep outside move is reduced.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        "The swing is coming 'over the top' instead of dropping into a better slot. The drills help them start the downswing with the lower body — it should feel less rushed.",
      coach:
        'Over-the-top transition. Sequence from the ground up; pump/slot drills, then re-film down-the-line to confirm a shallower approach.',
      advanced:
        'Early upper-body dominance throws the club outside the plane, yielding a steep out-to-in path. Re-pattern transition with lower-body lead and shallowing intent.',
    },
    typicalEvidenceBasis: 'ai_inferred',
  },

  // ── Baseball / Softball (shared mechanics) ─────────────────────
  {
    id: 'casting_hands',
    sports: ['baseball', 'softball_slow', 'softball_fast'],
    name: 'Casting — Barrel Drops Early',
    description:
      'The barrel leaves the body early in the downswing instead of staying tight, lengthening the path to the ball.',
    likelyRootCauses: [
      'Pushing with the back/top hand',
      'Trying to generate power with the arms instead of the hips',
    ],
    observableEvidence: [
      'Barrel points away from the catcher before the hands reach the zone',
      'A long, looping path to contact',
    ],
    defaultSeverity: 'critical',
    drillFamilies: ['hands inside the ball', 'connection & sequencing'],
    retest: defaultRetest({
      whatToReassess: 'Whether the hands stay tighter to the body and the path to the ball is shorter.',
      improvedWhen: 'The barrel stays back longer and the swing is more direct to contact.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        'Their hands swing out away from the body too soon, which makes the swing longer. The drills keep the hands close so the bat gets to the ball quicker — praise a short, quick path.',
      coach:
        'Casting / early barrel dump. Cue "hands inside the ball," use connection-ball or fence drills, re-test from the side to confirm a tighter path.',
      advanced:
        'Premature barrel release destroys lag and lengthens the kinetic path, bleeding bat speed and shrinking the inside coverage. Retrain connection and lag retention.',
    },
    typicalEvidenceBasis: 'estimated',
  },
  {
    id: 'hip_stall',
    sports: ['baseball', 'softball_slow', 'softball_fast'],
    name: 'Hip Rotation Stalling',
    description:
      'The hips stop rotating before the hands reach contact, cutting off the transfer of rotational power.',
    likelyRootCauses: ['Arms-only swing habit', 'Poor weight transfer', 'Limited hip mobility'],
    observableEvidence: [
      'Belt buckle is squared up — not facing the pitcher — at contact',
      'Power looks like it comes from the arms, not the body',
    ],
    defaultSeverity: 'critical',
    drillFamilies: ['hip drive & rotation', 'weight transfer'],
    retest: defaultRetest({
      whatToReassess: 'Whether the hips keep rotating through contact (buckle to the pitcher).',
      improvedWhen: 'Hips clear more fully and contact feels more powerful with less arm effort.',
    }),
    safetyCautions: ['Build hip drive gradually; stop if the lower back or lead knee complains.'],
    explanations: {
      parent:
        'Their hips stop turning a little too soon, so the swing loses power. The drills help the hips keep turning all the way through — it should feel more athletic and less "armsy."',
      coach:
        'Hip stall at contact. Train hip-lead sequencing and full clearance; re-film face-on and check buckle orientation at contact.',
      advanced:
        'Pelvic rotation decelerates prematurely, breaking the proximal-to-distal sequence and capping barrel speed. Re-pattern hip-lead with full lead-hip clearance.',
    },
    typicalEvidenceBasis: 'estimated',
  },
  {
    id: 'lunging_forward',
    sports: ['baseball', 'softball_slow', 'softball_fast'],
    name: 'Lunging — Weight Shifts Forward Too Early',
    description:
      'Weight moves onto the front foot during the stride, before rotation starts, so the hitter is early and weak on off-speed.',
    likelyRootCauses: ['Fear of being late', 'Aggressive stride', 'Poor load mechanics'],
    observableEvidence: ['Front knee heavily bent at stride landing', 'Head drifts forward early'],
    defaultSeverity: 'notable',
    drillFamilies: ['stay back & balance', 'load & timing'],
    retest: defaultRetest({
      whatToReassess: 'Whether weight stays centered through the stride instead of drifting forward.',
      improvedWhen: 'The head stays back and contact holds up better on slower pitches.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        'Their weight slides forward too soon, like a small lunge at the ball. The drills help them stay balanced and patient — think "stay back, let it come."',
      coach:
        'Forward lunge / early weight commit. Use stride-and-hold and timing drills; re-test from the side checking head position at contact.',
      advanced:
        'Premature anterior weight transfer collapses the rear-side load and disrupts timing windows, hurting adjustability vs off-speed. Train counter-rotation and posture retention.',
    },
    typicalEvidenceBasis: 'estimated',
  },
  {
    id: 'poor_hip_shoulder_separation',
    sports: ['baseball', 'softball_fast'],
    name: 'Poor Hip-Shoulder Separation',
    description:
      'Hips and shoulders rotate together instead of the hips leading, eliminating the stretch that creates bat speed.',
    likelyRootCauses: ['Arms-only habit', 'No sense of the kinetic chain'],
    observableEvidence: ['Hips and shoulders face the pitcher at the same instant'],
    defaultSeverity: 'critical',
    drillFamilies: ['separation & sequencing', 'hip drive & rotation'],
    retest: defaultRetest({
      whatToReassess: 'Whether the hips start to open while the shoulders briefly stay closed.',
      improvedWhen: 'There is a visible lag between hip turn and shoulder turn.',
    }),
    safetyCautions: ['Introduce separation work gradually to protect the lower back.'],
    explanations: {
      parent:
        "Their hips and shoulders turn at the same time, which loses some 'whip.' The drills teach the hips to lead a touch — it should feel springy, not forced.",
      coach:
        'Minimal X-factor. Train hip-lead with shoulders briefly retained; re-film and check for sequencing lag.',
      advanced:
        'Insufficient hip-shoulder separation removes the pre-stretch on the trunk, lowering elastic energy return and barrel velocity. Re-pattern sequencing.',
    },
    typicalEvidenceBasis: 'estimated',
  },
  {
    id: 'dropping_back_shoulder',
    sports: ['baseball', 'softball_slow', 'softball_fast'],
    name: 'Dropping the Back Shoulder',
    description:
      'The back shoulder dips excessively, steepening the uppercut and producing pop-ups and swings-and-misses up in the zone.',
    likelyRootCauses: ['Trying to lift the ball', 'Over-tilting to "swing up"'],
    observableEvidence: ['Pronounced back-shoulder dip before contact', 'Frequent pop-ups'],
    defaultSeverity: 'notable',
    drillFamilies: ['bat path & attack angle', 'posture'],
    retest: defaultRetest({
      whatToReassess: 'Whether the shoulders stay more level and the attack angle is less steep.',
      improvedWhen: 'Fewer pop-ups and a flatter, more matched path through the zone.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        'Their back shoulder dips down too much, which sends balls up in the air. The drills keep the swing more level — think "stay on top of it a bit more."',
      coach:
        'Excessive rear-shoulder dip / steep uppercut. Train level-to-slightly-up path; re-test from the side checking attack angle.',
      advanced:
        'Over-rotation into rear-shoulder tilt steepens attack angle beyond the optimal window, raising whiff rate in the upper zone. Re-pattern shoulder plane and attack angle.',
    },
    typicalEvidenceBasis: 'estimated',
  },
  {
    id: 'fp_late_load',
    sports: ['softball_fast'],
    name: 'Late Loading (Fast Pitch)',
    description:
      'The load starts too late for fast-pitch timing, leaving the swing rushed and often late to contact.',
    likelyRootCauses: ['Reactive rather than anticipatory load', 'Reading the pitcher late'],
    observableEvidence: ['Load begins at or after the pitcher’s release', 'Hands start late'],
    defaultSeverity: 'notable',
    drillFamilies: ['load & timing', 'rhythm & tempo'],
    retest: defaultRetest({
      whatToReassess: 'Whether the load begins earlier, giving the swing time to fire on time.',
      improvedWhen: 'Contact is more often out front and on time.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        'They start getting ready a little too late for fast pitching. The drills build an earlier rhythm so they are not rushed — think "be ready early."',
      coach:
        'Late load for fast-pitch timing. Train an earlier, rhythmic load trigger; re-test live or off machine checking contact point.',
      advanced:
        'Delayed load compresses the available time-to-contact, forcing a rushed sequence and late barrel. Advance the load trigger relative to release.',
    },
    typicalEvidenceBasis: 'estimated',
  },

  // ── Tennis ─────────────────────────────────────────────────────
  {
    id: 'late_contact',
    sports: ['tennis'],
    name: 'Late Contact',
    description:
      'The ball is met too close to or behind the body instead of out in front, costing power and control.',
    likelyRootCauses: ['Late preparation', 'Slow unit turn', 'Watching the ball too long'],
    observableEvidence: ['Contact point near the hip rather than in front', 'Cramped, defensive finish'],
    defaultSeverity: 'notable',
    drillFamilies: ['early preparation', 'contact point'],
    retest: defaultRetest({
      whatToReassess: 'Whether contact moves out in front of the lead hip.',
      improvedWhen: 'Contact is consistently in front with a freer, fuller finish.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        'They hit the ball a little late, close to the body. The drills help them prepare earlier and meet the ball out in front — it should feel less rushed.',
      coach:
        'Late contact from delayed prep. Train early unit turn and a forward contact point; re-film side-on checking contact relative to the lead hip.',
      advanced:
        'Contact posterior to the optimal forward window reduces effective racquet speed and spin control. Advance preparation timing and intercept point.',
    },
    typicalEvidenceBasis: 'ai_inferred',
  },
  {
    id: 'poor_split_step',
    sports: ['tennis'],
    name: 'Poor / Missing Split Step',
    description:
      'The split step is late or absent, so the first move to the ball is slow and reactions feel heavy.',
    likelyRootCauses: ['Watching instead of preparing', 'Static, flat-footed stance'],
    observableEvidence: ['Feet are flat as the opponent strikes', 'Slow first step'],
    defaultSeverity: 'notable',
    drillFamilies: ['footwork & timing', 'movement'],
    retest: defaultRetest({
      whatToReassess: 'Whether a small split step lands just before the opponent’s contact.',
      improvedWhen: 'The first step is quicker and movement feels lighter.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        'They are a bit flat-footed when the ball is struck. A small hop ("split step") gets them moving — make it a fun rhythm.',
      coach:
        'Absent/late split step. Train timing of the split to opponent contact; re-test in a movement rally.',
      advanced:
        'Mistimed split step delays the stretch-shortening response off the first step, degrading court coverage. Re-time the split to opponent strike.',
    },
    typicalEvidenceBasis: 'ai_inferred',
  },
  {
    id: 'open_hips_early',
    sports: ['tennis'],
    name: 'Hips Open Too Early',
    description:
      'The hips and torso open before contact, leaking power and sending the ball long or wide.',
    likelyRootCauses: ['Rushing the swing', 'Pulling off the ball to see the target'],
    observableEvidence: ['Chest faces the net well before contact', 'Off-balance, opening finish'],
    defaultSeverity: 'notable',
    drillFamilies: ['rotation & timing', 'balance'],
    retest: defaultRetest({
      whatToReassess: 'Whether the body stays sideways slightly longer before rotating through.',
      improvedWhen: 'Contact is more stable and the ball direction is more controlled.',
    }),
    safetyCautions: [],
    explanations: {
      parent:
        'Their body turns to face the net a touch too soon, which loses control. The drills help them stay sideways a bit longer — think "wait, then turn."',
      coach:
        'Early hip/torso opening. Train delayed rotation and a stable base; re-film side-on checking torso orientation at contact.',
      advanced:
        'Premature pelvic/trunk rotation decouples from the kinetic chain, scattering exit angle and reducing usable racquet speed. Re-pattern rotation timing.',
    },
    typicalEvidenceBasis: 'ai_inferred',
  },
];

// ──────────────────────────────────────────────────────────────
// Index + helpers
// ──────────────────────────────────────────────────────────────

const BY_ID = new Map<string, FaultOntologyEntry>(CURATED.map((e) => [e.id, e]));

/** Infer which sports a fault id likely applies to from its prefix. */
function inferSportsFromId(id: string): SportId[] {
  if (id.startsWith('sp_')) return ['softball_slow'];
  if (id.startsWith('fp_')) return ['softball_fast'];
  return ALL_SPORTS;
}

/** Turn a snake_case / prefixed id into a readable Title Case name. */
function humanizeId(id: string): string {
  return id
    .replace(/^sp_/, '')
    .replace(/^fp_/, '')
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Build an honest, clearly-`generated` ontology entry for any fault id we
 * have not hand-curated. It never invents specific biomechanics — it gives
 * safe, generic structure plus retest rules so the rest of the app keeps
 * working uniformly.
 */
function synthesizeEntry(id: string, opts: ResolveFaultOptions = {}): FaultOntologyEntry {
  const name = opts.label?.trim() || humanizeId(id) || 'Swing focus';
  const sports = opts.sport ? [opts.sport] : inferSportsFromId(id);
  const lower = name.toLowerCase();

  return {
    id,
    sports,
    name,
    description: `An estimated movement pattern flagged from your swing video: "${name}". SwingVantage does not yet have a detailed coaching profile for this specific pattern, so treat the detail below as general guidance.`,
    likelyRootCauses: ['Often a timing or sequencing habit — confirm with a second video before committing a lot of practice to it.'],
    observableEvidence: ['Surfaced from the video analysis; not measured with validated tools.'],
    defaultSeverity: 'notable',
    drillFamilies: ['fundamentals & balance', 'tempo & sequencing'],
    retest: defaultRetest({
      whatToReassess: `Whether "${lower}" still shows up as a top priority in a fresh video.`,
    }),
    safetyCautions: ['Stop if anything causes pain and check with a qualified coach or professional.'],
    explanations: {
      parent: `This is about "${lower}." Keep it simple and encouraging — work on one focus at a time, keep it fun, and stop if anything hurts.`,
      coach: `Athlete focus: ${name}. Treat as an estimated lead from video; confirm with your own eye and a second capture before prescribing heavily.`,
      advanced: `${name}: surfaced from video estimation rather than measurement. Validate against a second capture and your own assessment before re-patterning.`,
    },
    typicalEvidenceBasis: 'ai_inferred',
    generated: true,
  };
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/** All hand-curated fault entries (does not include generated fallbacks). */
export function getCuratedFaults(): FaultOntologyEntry[] {
  return [...CURATED];
}

/** A curated entry by exact id, or `null` if none is curated. */
export function getFault(id: string): FaultOntologyEntry | null {
  return BY_ID.get(id) ?? null;
}

/** Curated faults that apply to a given sport. */
export function getFaultsForSport(sport: SportId): FaultOntologyEntry[] {
  return CURATED.filter((e) => e.sports.includes(sport));
}

/**
 * Always returns a usable entry: the curated one if it exists, otherwise a
 * clearly-`generated` entry synthesized from the id/label. This is the
 * function callers should prefer — it guarantees the UI always has content.
 */
export function resolveFault(id: string, opts: ResolveFaultOptions = {}): FaultOntologyEntry {
  const curated = BY_ID.get(id);
  if (curated) return curated;
  return synthesizeEntry(id, opts);
}

/** The retest criteria for a fault (curated or synthesized). */
export function retestCriteriaFor(id: string, opts: ResolveFaultOptions = {}): FaultRetestCriteria {
  return resolveFault(id, opts).retest;
}

/** The audience-appropriate explanation string for a fault. */
export function explainFault(
  id: string,
  audience: FaultAudience,
  opts: ResolveFaultOptions = {},
): string {
  return resolveFault(id, opts).explanations[audience];
}

// ── Free-text → curated id matching ───────────────────────────

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Tokens worth matching on (drops short/common filler words). */
const STOP = new Set(['the', 'and', 'too', 'for', 'of', 'to', 'in', 'on', 'is', 'at', 'or', 'your', 'a', 'an']);
function tokenize(s: string): Set<string> {
  return new Set(normalizeText(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Best-effort map a free-text issue (e.g. from AI vision) to a CURATED fault id
 * for a sport, so retest criteria and explanations come from the rich entry
 * rather than the generic fallback. Returns null when nothing matches
 * confidently — callers then fall back to the honest generated entry.
 */
export function matchFaultId(text: string, sport?: SportId): string | null {
  const txt = normalizeText(text);
  if (!txt) return null;
  const candidates = sport ? getFaultsForSport(sport) : CURATED;
  const txtTokens = tokenize(text);

  let best: { id: string; score: number } | null = null;
  for (const f of candidates) {
    const name = normalizeText(f.name);
    // Strong signal: one string contains the other.
    let score = txt.includes(name) || name.includes(txt) ? 0.9 : 0;
    // Otherwise fall back to token overlap.
    score = Math.max(score, jaccard(txtTokens, tokenize(f.name)));
    if (score > (best?.score ?? 0)) best = { id: f.id, score };
  }

  return best && best.score >= 0.5 ? best.id : null;
}
