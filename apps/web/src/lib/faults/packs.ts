// ============================================================
// SwingVantage — Multi-Sport Fault Ontology: Symptom Packs
// ------------------------------------------------------------
// These entries describe the common, athlete-REPORTED miss patterns
// (the symptoms a player picks in the questionnaire / Instant Estimate
// flow) across all seven sports, and map each to its likely causes,
// the drill families that fix it, and how to retest it.
//
// They complement the curated mechanical faults in `ontology.ts`
// (which describe what a swing IS doing) by covering what the BALL or
// the OUTCOME is doing — the language a player actually uses.
//
// HONESTY: every entry here is `typicalEvidenceBasis: 'user_entered'`.
// They are derived from a reported outcome, not a measured or video-
// confirmed mechanic. The deterministic engine surfaces them as
// "likely" causes and recommends video/AI escalation when the picture
// is ambiguous (see lib/intelligence/diagnose).
//
// Organized per-sport so packs stay tree-shakeable and a new sport can
// be added without touching the core resolver.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { FaultOntologyEntry, FaultRetestCriteria } from './types';

/** Same-condition defaults shared by symptom retests (mirrors ontology.ts). */
function sameConditions(extra: string[] = []): string[] {
  return [
    'Same sport and same swing/stroke type',
    'Same setup, target, and roughly the same effort level',
    'Same equipment where it applies',
    ...extra,
  ];
}

function retest(partial: Partial<FaultRetestCriteria> = {}): FaultRetestCriteria {
  return {
    activeWindowDays: 7,
    whatToReassess: 'Whether the same miss pattern still shows up under fair, repeated conditions.',
    sameConditions: sameConditions(),
    improvedWhen: 'The miss is noticeably less frequent or less severe than your starting point.',
    ...partial,
  };
}

/** Mark a pack entry as athlete-reported (the honest default for symptoms). */
function reported(entry: Omit<FaultOntologyEntry, 'typicalEvidenceBasis'>): FaultOntologyEntry {
  return { ...entry, typicalEvidenceBasis: 'user_entered' };
}

// ──────────────────────────────────────────────────────────────
// GOLF — ball-flight + contact misses
// ──────────────────────────────────────────────────────────────

const GOLF: FaultOntologyEntry[] = [
  reported({
    id: 'slice',
    sports: ['golf'],
    name: 'Slice',
    description: 'The ball curves hard away from you in the air (to the right for a right-hander), usually from an open face relative to an out-to-in path.',
    likelyRootCauses: [
      'Clubface open to the swing path at impact',
      'Out-to-in (over-the-top) swing direction',
      'Weak grip or a face that never squares',
    ],
    observableEvidence: ['Ball starts left and curves right (RH)', 'Loss of distance from added sidespin'],
    defaultSeverity: 'notable',
    drillFamilies: ['face control & grip', 'swing path', 'release & rotation'],
    retest: retest({
      whatToReassess: 'Whether the curve is reduced and start direction is more neutral.',
      improvedWhen: 'The big left-to-right curve shrinks toward a small, playable shape.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball is curving away to the side and losing distance. The drills help square the clubface and swing more in-to-out — expect a straighter, longer shot.',
      coach: 'Slice: open face to an out-to-in path. Prioritize face-to-path closure (grip/release) before path; re-test start line and curvature on the range.',
      advanced: 'Positive face-to-path with an out-to-in club direction yields left-start, right-curving ball flight and high spin-loft. Close the face-to-path window via release pattern and shallow the path.',
    },
  }),
  reported({
    id: 'hook',
    sports: ['golf'],
    name: 'Hook',
    description: 'The ball curves hard toward you in the air (to the left for a right-hander), usually from a closed face relative to an in-to-out path.',
    likelyRootCauses: [
      'Clubface closed to the swing path at impact',
      'Overly in-to-out path with an aggressive release',
      'Strong grip or hands too active through impact',
    ],
    observableEvidence: ['Ball starts right and curves left (RH)', 'Low, running, left-finishing flight'],
    defaultSeverity: 'notable',
    drillFamilies: ['face control & grip', 'swing path', 'release & rotation'],
    retest: retest({
      whatToReassess: 'Whether the curve is reduced and the face is less closed to the path.',
      improvedWhen: 'The hard right-to-left curve calms toward a controllable draw.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball is curving hard the other way. The drills calm the hands down and neutralize the grip so the shot holds its line better.',
      coach: 'Hook: closed face to an in-to-out path. Check grip strength and release timing; quiet the hands and re-test curvature.',
      advanced: 'Negative face-to-path on an in-to-out direction produces right-start, left-curving flight. Neutralize grip and de-load the active release to bring face-to-path toward zero.',
    },
  }),
  reported({
    id: 'pull',
    sports: ['golf'],
    name: 'Pull',
    description: 'The ball starts and stays left of target (for a right-hander) with little curve — the face is square to a leftward path.',
    likelyRootCauses: ['Out-to-in path with a face matched left', 'Upper-body-dominant transition', 'Aim/alignment drifting left'],
    observableEvidence: ['Ball starts left and holds left (RH)', 'Straight but offline'],
    defaultSeverity: 'notable',
    drillFamilies: ['swing path', 'transition & sequencing', 'alignment & setup'],
    retest: retest({
      whatToReassess: 'Whether the start line moves back toward the target with a more neutral path.',
      improvedWhen: 'Shots start closer to the target line more often.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball goes straight but to the side of the target. The drills fix the swing direction and aim so it starts on line.',
      coach: 'Pull: face square to a leftward (out-to-in) path. Check alignment first, then sequence the downswing from the ground up; re-test start line.',
      advanced: 'Out-to-in direction with face ≈ path gives a straight-left pull. Re-pattern transition sequencing and confirm setup alignment before path work.',
    },
  }),
  reported({
    id: 'push',
    sports: ['golf'],
    name: 'Push',
    description: 'The ball starts and stays right of target (for a right-hander) with little curve — the face is square to a rightward path.',
    likelyRootCauses: ['In-to-out path with face matched right', 'Hanging back / staying behind the ball', 'Aim/alignment drifting right'],
    observableEvidence: ['Ball starts right and holds right (RH)', 'Straight but offline'],
    defaultSeverity: 'notable',
    drillFamilies: ['swing path', 'weight transfer', 'alignment & setup'],
    retest: retest({
      whatToReassess: 'Whether the start line moves back toward the target with better weight transfer.',
      improvedWhen: 'Shots start closer to the target line more often.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball goes straight but out to the other side. The drills help the body turn through and the aim point set up square.',
      coach: 'Push: face square to a rightward (in-to-out) path. Confirm alignment, then train fuller rotation/weight transfer through impact.',
      advanced: 'In-to-out direction with face ≈ path produces a straight-right push, often with stalled rotation. Train lead-side post-up and confirm setup alignment.',
    },
  }),
  reported({
    id: 'fat_contact',
    sports: ['golf'],
    name: 'Fat / Heavy Contact',
    description: 'The club hits the ground before the ball, taking a divot behind it and losing big distance.',
    likelyRootCauses: ['Low point behind the ball', 'Early extension or hanging back', 'Casting / adding loft early'],
    observableEvidence: ['Divot starts behind the ball', 'Heavy, short, soft-feeling shots'],
    defaultSeverity: 'critical',
    drillFamilies: ['low point control', 'weight transfer', 'strike & contact'],
    retest: retest({
      whatToReassess: 'Whether the low point moves to in front of the ball and divots start after contact.',
      improvedWhen: 'Cleaner contact with the divot after the ball more consistently.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The club is hitting the ground first, so shots come up short. The drills help them hit the ball first, then the turf.',
      coach: 'Fat strike: low point behind the ball. Train pressure shift to the lead side and forward low point; re-test divot location.',
      advanced: 'Rearward low point from insufficient lead-side pressure or early release. Train ground-up sequencing and a lead-biased pressure trace; verify divot after ball.',
    },
  }),
  reported({
    id: 'thin_contact',
    sports: ['golf'],
    name: 'Thin / Bladed Contact',
    description: 'The club catches the upper half of the ball, sending a low, hot, often skulled shot with little spin or control.',
    likelyRootCauses: ['Rising low point / standing up through impact', 'Early extension', 'Trying to lift or scoop the ball'],
    observableEvidence: ['Low screaming flight', 'Stinging feel, ball flies far on full shots / over the green on chips'],
    defaultSeverity: 'notable',
    drillFamilies: ['low point control', 'posture retention', 'strike & contact'],
    retest: retest({
      whatToReassess: 'Whether contact moves to the center of the face with a steadier low point.',
      improvedWhen: 'Fewer thin/bladed strikes and more flush, controlled contact.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The club is catching the top of the ball, so it flies low and hard. The drills help them stay down and strike the middle.',
      coach: 'Thin strike: rising low point / loss of posture. Train posture retention and a downward strike on irons; re-test contact location.',
      advanced: 'Upward low-point migration from early extension or scoop release raises strike on the face. Retain posture and stabilize the low point ahead of the ball.',
    },
  }),
  reported({
    id: 'topped',
    sports: ['golf'],
    name: 'Topped Shot',
    description: 'The club strikes the very top of the ball, rolling it along the ground — an extreme thin from a high low point or lifted posture.',
    likelyRootCauses: ['Standing up out of posture', 'Trying to help the ball into the air', 'Severe early extension'],
    observableEvidence: ['Ball rolls or skids along the ground', 'No air time'],
    defaultSeverity: 'critical',
    drillFamilies: ['posture retention', 'low point control', 'strike & contact'],
    retest: retest({
      whatToReassess: 'Whether posture holds through impact and the ball gets airborne consistently.',
      improvedWhen: 'Topped shots are rare and contact gets the ball up reliably.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The club is just clipping the top of the ball. The drills help them stay in their posture and trust the loft to lift it.',
      coach: 'Top: extreme high low point from posture loss. Train spine-angle retention and stop the lift instinct; re-test consistent air time.',
      advanced: 'Gross upward low-point error from posture loss/early extension. Retain pelvic-thorax geometry and remove the lift compensation; rebuild a forward, ground-seeking low point.',
    },
  }),
  reported({
    id: 'shank',
    sports: ['golf'],
    name: 'Shank',
    description: 'The ball strikes the hosel and shoots sharply right (for a right-hander) — usually the club moving out toward the ball or hands moving away from the body.',
    likelyRootCauses: ['Hosel-first contact (heel of the face)', 'Weight to the toes / hands drifting out in transition', 'Path moving steeply out toward the ball'],
    observableEvidence: ['Ball fires dead right off the hosel', 'Sudden, jarring contact'],
    defaultSeverity: 'critical',
    drillFamilies: ['strike & contact', 'posture & balance', 'swing path'],
    retest: retest({
      activeWindowDays: 5,
      whatToReassess: 'Whether contact moves toward the center of the face and the hosel is avoided.',
      improvedWhen: 'No hosel strikes across a short, controlled block of shots.',
    }),
    safetyCautions: ['Keep effort moderate while rebuilding contact — chasing speed mid-fix tends to reinforce the miss.'],
    explanations: {
      parent: 'The ball is hitting the neck of the club and shooting sideways. The drills help them keep balance and present the middle of the face — small, calm swings first.',
      coach: 'Shank: hosel contact. Address pressure to heels/hands-out in transition; gate drills (board outside the ball) and re-test center contact.',
      advanced: 'Heel/hosel strike from an out-trending hand path or anterior pressure shift. Re-center pressure, retain radius in transition, and gate contact toward the center of the face.',
    },
  }),
  reported({
    id: 'toe_strike',
    sports: ['golf'],
    name: 'Toe Strike',
    description: 'Contact is out toward the toe of the face, costing distance and producing a duller, sometimes left-leaking strike.',
    likelyRootCauses: ['Early extension pulling the club in', 'Standing too far from the ball', 'Pulling the arms in through impact'],
    observableEvidence: ['Toe-side contact mark', 'Distance loss and a dead feel'],
    defaultSeverity: 'notable',
    drillFamilies: ['strike & contact', 'posture & hip depth', 'setup & spacing'],
    retest: retest({
      whatToReassess: 'Whether contact moves toward the center with steadier spacing to the ball.',
      improvedWhen: 'Strike pattern centers up and distance returns.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They are hitting the end of the club instead of the middle. The drills set the right distance to the ball and keep the body steady.',
      coach: 'Toe bias: club pulled in (often early extension) or setup spacing. Train hip-depth retention and re-test face-tape contact.',
      advanced: 'Toe-side strike from radius loss / early extension drawing the head inside. Retain trail-hip depth and posture to keep the sweet spot on plane.',
    },
  }),
  reported({
    id: 'heel_strike',
    sports: ['golf'],
    name: 'Heel Strike',
    description: 'Contact is in toward the heel of the face, costing distance and often leaking the ball offline — a milder cousin of the shank.',
    likelyRootCauses: ['Hands/club drifting out in transition', 'Standing too close to the ball', 'Casting the club outward'],
    observableEvidence: ['Heel-side contact mark', 'Distance loss; misses can leak right'],
    defaultSeverity: 'notable',
    drillFamilies: ['strike & contact', 'swing path', 'setup & spacing'],
    retest: retest({
      whatToReassess: 'Whether contact moves toward the center with a more neutral hand path.',
      improvedWhen: 'Strike pattern centers up and the hosel is well clear.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They are hitting the inside part of the club face. The drills fix the spacing and keep the swing on a steadier path.',
      coach: 'Heel bias: hands-out / casting or too-close setup. Train radius retention and re-test contact; watch for a creeping shank.',
      advanced: 'Heel-side strike from an out-trending hand path. Retain radius and de-cast transition to re-center contact and protect against hosel migration.',
    },
  }),
  reported({
    id: 'sky_pop_up',
    sports: ['golf'],
    name: 'Sky / Pop-Up (Driver)',
    description: 'The driver contacts high on the face or under the ball, producing a towering, short, often sky-marked tee shot.',
    likelyRootCauses: ['Steep, downward attack with the driver', 'Teeing too low / ball too far back', 'Over-the-top, chopping move'],
    observableEvidence: ['Very high, short tee shot', 'Sky mark on top of the driver crown'],
    defaultSeverity: 'notable',
    drillFamilies: ['attack angle', 'tee height & setup', 'swing path'],
    retest: retest({
      whatToReassess: 'Whether the attack angle shallows and contact moves to the center of the face.',
      improvedWhen: 'Tee shots launch on a normal window with center-face contact.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The driver is hitting down on the ball and popping it straight up. The drills set the tee height and teach a sweeping, up-strike.',
      coach: 'Driver sky: steep attack / high-face contact. Set tee height + ball position and train an ascending strike; re-test launch and contact mark.',
      advanced: 'Negative attack angle with the driver raising strike on the face. Shift ball position forward, raise tee, and re-pattern an ascending angle of attack.',
    },
  }),
  reported({
    id: 'low_launch',
    sports: ['golf'],
    name: 'Low Launch / Knockdown Flight',
    description: 'Shots fly lower than expected, reducing carry and stopping power — too little dynamic loft or a downward strike that delofts the club.',
    likelyRootCauses: ['Hands too far forward / shaft leaning excessively', 'Ball position too far back', 'Not enough loft delivered at impact'],
    observableEvidence: ['Flight peaks low', 'Reduced carry and less stopping power on greens'],
    defaultSeverity: 'minor',
    drillFamilies: ['launch & loft delivery', 'setup & ball position', 'strike & contact'],
    retest: retest({
      whatToReassess: 'Whether peak height and carry return to a normal window for the club.',
      improvedWhen: 'Flight climbs to a fuller, more stopping trajectory.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball is flying too low and not carrying. The drills set the ball position and help deliver more loft at impact.',
      coach: 'Low launch: delofting at impact / rearward ball position. Restore presented loft and ball position; re-test peak height and carry.',
      advanced: 'Insufficient dynamic loft from excessive shaft lean or low launch + low spin combination. Recalibrate ball position and loft delivery toward the club’s optimal launch window.',
    },
  }),
  reported({
    id: 'excessive_spin',
    sports: ['golf'],
    name: 'Excessive Spin / Ballooning Flight',
    description: 'Shots climb and balloon with too much backspin, losing distance and getting knocked around by wind.',
    likelyRootCauses: ['Steep, downward strike adding spin loft', 'High spin-loft delivery', 'Equipment / ball mismatch'],
    observableEvidence: ['Flight balloons up and drops short', 'Big distance loss into wind'],
    defaultSeverity: 'minor',
    drillFamilies: ['attack angle', 'spin-loft control', 'strike & contact'],
    retest: retest({
      whatToReassess: 'Whether peak height and spin come down toward a penetrating, holding flight.',
      improvedWhen: 'Flight is more penetrating and holds distance in wind.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball is spinning too much and floating up short. The drills flatten the strike a bit so it flies more solidly.',
      coach: 'High spin: excessive spin loft / steep delivery. Reduce spin loft (shallower attack, ball-first compression); re-test trajectory.',
      advanced: 'Elevated backspin from high spin-loft. Lower spin loft via attack-angle and dynamic-loft management (and check ball/equipment fit) to regain a penetrating window.',
    },
  }),
  reported({
    id: 'distance_loss',
    sports: ['golf'],
    name: 'Distance Loss',
    description: 'Shots are flying shorter than they used to or shorter than expected — usually an efficiency (strike) or speed problem rather than one single fault.',
    likelyRootCauses: ['Off-center strike costing smash factor', 'Poor energy transfer / sequencing', 'Sub-optimal launch and spin window'],
    observableEvidence: ['Carry shorter than your norm', 'Inconsistent or weak-feeling contact'],
    defaultSeverity: 'notable',
    drillFamilies: ['strike & contact', 'speed & sequencing', 'launch & spin optimization'],
    retest: retest({
      whatToReassess: 'Whether center-strike frequency and carry return toward your normal numbers.',
      improvedWhen: 'Carry climbs back toward your baseline with cleaner contact.',
    }),
    safetyCautions: ['Build speed work gradually and stop if anything strains.'],
    explanations: {
      parent: 'Shots are coming up shorter than usual. We start with cleaner contact (the biggest free distance) before chasing more speed.',
      coach: 'Distance loss: most often a strike/efficiency issue before speed. Center the strike, then sequence for speed; re-test carry vs baseline.',
      advanced: 'Reduced carry typically traces to smash-factor loss (off-center strike) and/or a sub-optimal launch-spin window before raw clubhead speed. Sequence centeredness → efficiency → speed.',
    },
  }),
];

// ──────────────────────────────────────────────────────────────
// BASEBALL / SOFTBALL — contact + outcome misses
// ──────────────────────────────────────────────────────────────

const BAT_ALL: SportId[] = ['baseball', 'softball_slow', 'softball_fast'];

const BAT: FaultOntologyEntry[] = [
  reported({
    id: 'pop_up',
    sports: BAT_ALL,
    name: 'Pop-Up',
    description: 'The ball goes weakly up in the air — usually contact under the ball from a steep, uppercut path or dropped back shoulder.',
    likelyRootCauses: ['Back shoulder dropping / over-tilting to lift', 'Swinging under the ball', 'Late, steep barrel into the zone'],
    observableEvidence: ['Frequent infield pop-ups', 'Contact on the bottom of the ball'],
    defaultSeverity: 'notable',
    drillFamilies: ['bat path & attack angle', 'posture & level shoulders', 'on-plane contact'],
    retest: retest({
      whatToReassess: 'Whether the attack angle flattens and the barrel matches the pitch plane.',
      improvedWhen: 'Fewer pop-ups and more line drives / hard ground contact.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They keep popping the ball straight up. The drills keep the swing more level so they hit the middle of the ball.',
      coach: 'Pop-up: contact under the ball from a steep path / shoulder dip. Train an on-plane, slightly-up attack and level shoulders; re-test launch on the tee.',
      advanced: 'Sub-ball contact from an over-steep attack angle (rear-shoulder dip). Match barrel plane to pitch plane and cap attack angle in the optimal window.',
    },
  }),
  reported({
    id: 'rollover_grounder',
    sports: BAT_ALL,
    name: 'Rollover Ground Ball',
    description: 'The top hand rolls over early and the ball is pulled weakly into the ground — barrel cutting across and over the ball.',
    likelyRootCauses: ['Top-hand rollover before contact', 'Pulling off / spinning out early', 'Casting the barrel around the ball'],
    observableEvidence: ['Weak pull-side ground balls', 'Hooking, low contact'],
    defaultSeverity: 'notable',
    drillFamilies: ['palm-up palm-down at contact', 'stay through the ball', 'hands inside the ball'],
    retest: retest({
      whatToReassess: 'Whether the barrel stays through the ball longer with less early rollover.',
      improvedWhen: 'More hard line drives and fewer weak rollover grounders.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They keep rolling the wrists over and topping it into the ground. The drills teach them to stay behind and through the ball.',
      coach: 'Rollover: premature top-hand pronation / spin-out. Train palm-up/palm-down at contact and staying through the ball; re-test contact quality.',
      advanced: 'Early top-hand pronation and across-the-ball barrel exit. Delay supination, keep the barrel in the hitting zone longer, and quiet the early trunk spin-out.',
    },
  }),
  reported({
    id: 'late_contact_bat',
    sports: BAT_ALL,
    name: 'Late Contact',
    description: 'The ball gets deep on the hitter and contact is behind the front foot — late timing or a long, slow path to the ball.',
    likelyRootCauses: ['Late or slow load/trigger', 'Long, casty swing path', 'Pitch recognition / timing late'],
    observableEvidence: ['Contact behind the front foot', 'Foul balls to the opposite side, jammed feel'],
    defaultSeverity: 'notable',
    drillFamilies: ['load & timing', 'hands inside the ball', 'rhythm & tempo'],
    retest: retest({
      whatToReassess: 'Whether contact moves out front and timing is on time more often.',
      improvedWhen: 'Contact is more consistently out front with authority.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They are getting to the ball a little late. The drills build an earlier rhythm and a shorter path so they are on time.',
      coach: 'Late contact: late load or long path. Advance the timing trigger and shorten the path (hands inside); re-test contact point.',
      advanced: 'Posterior contact point from delayed load timing and/or an elongated barrel path. Advance the trigger relative to pitch and tighten the path to compress time-to-contact.',
    },
  }),
  reported({
    id: 'early_contact',
    sports: BAT_ALL,
    name: 'Early / Out-Front Contact (Rushing)',
    description: 'The hitter commits early and meets the ball too far in front, getting fooled by off-speed and pulling weakly.',
    likelyRootCauses: ['Rushing / lunging forward', 'Early weight commit', 'Guessing pitch timing'],
    observableEvidence: ['Weak early pulls', 'Out in front on off-speed, head drifting forward'],
    defaultSeverity: 'notable',
    drillFamilies: ['stay back & balance', 'load & timing', 'rhythm & tempo'],
    retest: retest({
      whatToReassess: 'Whether the hitter stays back and holds timing against changing speeds.',
      improvedWhen: 'Better adjustability to off-speed and centered contact.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They are committing too early and getting fooled. The drills help them stay back and be patient — "let it travel."',
      coach: 'Early/rushing: premature weight commit. Train stay-back and timing windows; re-test vs mixed speeds.',
      advanced: 'Anterior weight transfer collapses the rear load and shrinks adjustability windows. Train counter-move and posture retention to widen timing tolerance.',
    },
  }),
  reported({
    id: 'weak_oppo_contact',
    sports: BAT_ALL,
    name: 'Weak Opposite-Field Contact',
    description: 'Outside pitches are met late and pushed weakly the other way with no drive — the barrel never gets out front on the outer pitch.',
    likelyRootCauses: ['Pulling off the outside pitch', 'Not letting the ball travel with intent', 'Barrel late to the outer third'],
    observableEvidence: ['Soft opposite-field flares', 'No authority on outer-half pitches'],
    defaultSeverity: 'minor',
    drillFamilies: ['oppo-field drive', 'stay through the ball', 'hands inside the ball'],
    retest: retest({
      whatToReassess: 'Whether outer-half pitches are driven with authority the other way.',
      improvedWhen: 'Harder, lined opposite-field contact on outside pitches.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They can\'t drive the outside pitch the other way. The drills teach them to let it travel and hit it hard to the opposite field.',
      coach: 'Weak oppo: pulling off outer pitches. Train oppo-gap intent and staying through the ball; re-test outer-third contact.',
      advanced: 'Outer-third coverage fails from early trunk rotation. Retain direction and connection to drive the outer pitch with backspin to the oppo gap.',
    },
  }),
  reported({
    id: 'undercut_ball',
    sports: BAT_ALL,
    name: 'Under-Cutting / Excessive Uppercut',
    description: 'The swing gets under the ball with too steep an upward attack, producing high spin, weak fly balls, and swings-and-misses up in the zone.',
    likelyRootCauses: ['Over-steep upward attack angle', 'Excessive back-shoulder tilt', 'Trying to lift everything'],
    observableEvidence: ['Lazy fly balls and pop-ups', 'Whiffs at the top of the zone'],
    defaultSeverity: 'notable',
    drillFamilies: ['attack angle', 'on-plane contact', 'posture & level shoulders'],
    retest: retest({
      whatToReassess: 'Whether the attack angle settles into a productive, slightly-up window.',
      improvedWhen: 'More line drives, fewer weak fly balls and high whiffs.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The swing is going up too much and getting under the ball. The drills level it out so they square the ball up.',
      coach: 'Under-cut: attack angle too steep up. Cap the upward attack and match plane; re-test launch/contact distribution.',
      advanced: 'Excessive positive attack angle and tilt raise whiff rate up-zone and pop-up rate. Constrain attack angle to the optimal band and match barrel-to-pitch plane.',
    },
  }),
  reported({
    id: 'jammed_contact',
    sports: ['baseball', 'softball_fast'],
    name: 'Jammed / Inside Contact',
    description: 'Inside pitches tie the hitter up and contact is in on the hands — the barrel can\'t clear inside in time.',
    likelyRootCauses: ['Hands not staying inside the ball', 'Late on inner-half velocity', 'Diving toward the plate'],
    observableEvidence: ['Sawed-off contact in on the hands', 'Weak inside-pitch results'],
    defaultSeverity: 'minor',
    drillFamilies: ['hands inside the ball', 'load & timing', 'turn the barrel'],
    retest: retest({
      whatToReassess: 'Whether the hitter clears the barrel on inside pitches with authority.',
      improvedWhen: 'Inside pitches are turned on and driven instead of jammed.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'Inside pitches are tying them up. The drills teach them to keep the hands in and turn the barrel quickly.',
      coach: 'Jammed: barrel late to the inner third. Train hands-inside and quick barrel turn; re-test inner-half contact.',
      advanced: 'Inner-third coverage fails from a late barrel and plate-dive. Keep hands inside, sharpen barrel turn, and hold direction to clear the inside pitch out front.',
    },
  }),
  reported({
    id: 'low_carry_good_contact',
    sports: BAT_ALL,
    name: 'Good Contact but Low Carry',
    description: 'Contact feels solid but the ball doesn\'t carry — usually a flat or downward attack angle producing low line drives and grounders.',
    likelyRootCauses: ['Attack angle too flat / slightly down', 'Hitting the top half of the ball', 'Limited bat speed into the air window'],
    observableEvidence: ['Hard but low contact', 'Line drives that sink, few balls in the air'],
    defaultSeverity: 'minor',
    drillFamilies: ['attack angle', 'on-plane contact', 'bat speed & sequencing'],
    retest: retest({
      whatToReassess: 'Whether a slightly more upward attack adds carry without losing contact quality.',
      improvedWhen: 'More balls driven in the air with the same hard contact.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They are squaring it up but it stays low. The drills add a little lift to the swing so good contact carries.',
      coach: 'Low carry on good contact: flat/negative attack angle. Nudge the attack up into the optimal window; re-test launch on solid contact.',
      advanced: 'Solid contact with depressed launch from a flat/negative attack angle. Raise attack angle into the optimal band while preserving on-plane match to convert exit velocity into carry.',
    },
  }),
];

// ──────────────────────────────────────────────────────────────
// TENNIS / PICKLEBALL / PADEL — shared racket-sport outcome misses
// ──────────────────────────────────────────────────────────────

const RACKET_ALL: SportId[] = ['tennis', 'pickleball', 'padel'];

const RACKET: FaultOntologyEntry[] = [
  reported({
    id: 'net_errors',
    sports: RACKET_ALL,
    name: 'Net Errors (Hitting Into the Net)',
    description: 'Shots repeatedly land in the net — usually low contact, a downward swing path, or a closed racket face with not enough lift.',
    likelyRootCauses: ['Closing the face / not enough low-to-high', 'Decelerating into contact', 'Late preparation forcing a downward swipe'],
    observableEvidence: ['Ball into the net', 'Short, jabby finish'],
    defaultSeverity: 'notable',
    drillFamilies: ['low-to-high swing path', 'racket face & lift', 'early preparation'],
    retest: retest({
      whatToReassess: 'Whether net errors drop and the ball clears with margin.',
      improvedWhen: 'Far fewer balls into the net with a fuller, lifting swing.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball keeps going into the net. The drills add a low-to-high brush and a fuller finish so it clears with room.',
      coach: 'Net errors: insufficient net clearance from face/path. Train low-to-high with topspin and accelerate through contact; re-test clearance margin.',
      advanced: 'Net-side errors trace to a closed face / descending path and deceleration. Build low-to-high racket-head speed and net-clearance margin; confirm forward contact.',
    },
  }),
  reported({
    id: 'long_errors',
    sports: RACKET_ALL,
    name: 'Long Errors (Hitting Past the Baseline)',
    description: 'Shots sail long beyond the court — usually too flat with no topspin to bring the ball down, or over-hitting with an open face.',
    likelyRootCauses: ['Too flat / not enough topspin', 'Open face at contact', 'Over-swinging without shape'],
    observableEvidence: ['Ball lands beyond the line', 'Flat, fast, uncontrolled trajectory'],
    defaultSeverity: 'notable',
    drillFamilies: ['topspin & shape', 'racket face control', 'tempo & control'],
    retest: retest({
      whatToReassess: 'Whether the ball drops inside the line with more shape and control.',
      improvedWhen: 'Far fewer balls long, with topspin pulling the ball down in the court.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'The ball keeps flying long. The drills add topspin so it dips down inside the lines instead of sailing.',
      coach: 'Long errors: flat trajectory / open face. Add topspin shape and control face at contact; re-test depth.',
      advanced: 'Depth control fails from low net-rotation (topspin) and/or an open face. Increase spin to curve the ball down and stabilize face at contact to regulate depth.',
    },
  }),
  reported({
    id: 'mishit_offcenter',
    sports: RACKET_ALL,
    name: 'Mishits / Off-Center Contact',
    description: 'Frequent shanks and frame/off-center hits — usually inconsistent contact point, watching the ball poorly, or rushed footwork.',
    likelyRootCauses: ['Inconsistent contact point', 'Late or unbalanced footwork', 'Eyes leaving the ball early'],
    observableEvidence: ['Frame hits / shanks', 'Unpredictable depth and direction'],
    defaultSeverity: 'notable',
    drillFamilies: ['contact point & spacing', 'footwork & balance', 'eyes on contact'],
    retest: retest({
      whatToReassess: 'Whether center-string contact and consistency improve.',
      improvedWhen: 'Cleaner, more repeatable contact with fewer frame hits.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They keep mishitting off the frame. The drills set the spacing and footwork so they meet the ball in the sweet spot.',
      coach: 'Mishits: variable contact point/spacing. Train spacing, balanced footwork, and quiet eyes to contact; re-test center-string rate.',
      advanced: 'Off-center contact from spacing/contact-point variability and footwork instability. Standardize the intercept window and stabilize the base to recenter strike.',
    },
  }),
  reported({
    id: 'late_contact_racket',
    sports: RACKET_ALL,
    name: 'Late Contact / Cramped Swing',
    description: 'The ball is met too close to or behind the body instead of out in front, cramping the swing and leaking power and control.',
    likelyRootCauses: ['Late preparation / slow unit turn', 'Watching the ball too long', 'Standing too close to the contact'],
    observableEvidence: ['Contact near the hip rather than in front', 'Cramped, defensive finishes'],
    defaultSeverity: 'notable',
    drillFamilies: ['early preparation', 'contact point & spacing', 'movement & timing'],
    retest: retest({
      whatToReassess: 'Whether contact moves out in front with a freer, fuller swing.',
      improvedWhen: 'Contact is consistently in front with a relaxed, complete finish.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They hit the ball a little late and cramped. The drills get them ready earlier so they meet it out in front.',
      coach: 'Late contact: delayed prep. Train early unit turn and a forward contact point; re-test contact relative to the lead hip.',
      advanced: 'Posterior contact from delayed preparation compresses the swing and bleeds racket speed. Advance preparation and the intercept point forward of the lead hip.',
    },
  }),
  reported({
    id: 'weak_serve',
    sports: RACKET_ALL,
    name: 'Weak / Inconsistent Serve',
    description: 'The serve lacks pace, spin, or consistency — usually an inconsistent toss, no leg drive, or a tight, arm-only motion.',
    likelyRootCauses: ['Inconsistent toss placement', 'No leg drive / weight transfer', 'Arm-only, tense motion with no racket-head speed'],
    observableEvidence: ['Slow, short, or erratic serves', 'High fault rate'],
    defaultSeverity: 'notable',
    drillFamilies: ['toss consistency', 'leg drive & rhythm', 'racket-head speed & release'],
    retest: retest({
      whatToReassess: 'Whether toss consistency, pace, and first-serve percentage improve.',
      improvedWhen: 'More repeatable toss and a freer, faster serve with fewer faults.',
    }),
    safetyCautions: ['Build serve volume gradually to protect the shoulder.'],
    explanations: {
      parent: 'Their serve is a bit weak and inconsistent. The drills steady the toss and add leg drive so it has more pace and lands in.',
      coach: 'Weak serve: toss variability + no kinetic chain. Standardize the toss and add leg drive/loose arm; re-test pace and first-serve %.',
      advanced: 'Serve underperforms from toss dispersion and a truncated kinetic chain (no ground force / tense release). Standardize toss window and sequence ground-up into a loose, fast release.',
    },
  }),
  reported({
    id: 'poor_recovery',
    sports: ['tennis', 'padel'],
    name: 'Poor Recovery / Out of Position',
    description: 'After hitting, the player is slow to recover and gets caught out of position for the next ball.',
    likelyRootCauses: ['No recovery step after contact', 'Ball-watching instead of resetting', 'Poor court positioning awareness'],
    observableEvidence: ['Caught flat-footed for the next ball', 'Stretched, late on the following shot'],
    defaultSeverity: 'minor',
    drillFamilies: ['recovery footwork', 'court positioning', 'movement & timing'],
    retest: retest({
      whatToReassess: 'Whether recovery to a balanced position is quicker and more consistent.',
      improvedWhen: 'On balance and in position for the next ball more often.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They don\'t reset their position after hitting. The drills build a quick recovery so they\'re ready for the next ball.',
      coach: 'Poor recovery: no reset after contact. Train recovery footwork and positioning to the next likely ball; re-test in live rallies.',
      advanced: 'Recovery deficit leaves the player geometrically exposed. Train post-contact recovery patterning and positional anticipation to restore court coverage.',
    },
  }),
  reported({
    id: 'footwork_breakdown',
    sports: RACKET_ALL,
    name: 'Footwork Breakdown',
    description: 'Movement to the ball is slow, heavy, or unbalanced — late first step, no split step, and reaching instead of moving the feet.',
    likelyRootCauses: ['Late or missing split step', 'Flat-footed, reactive movement', 'Reaching with the racket instead of the feet'],
    observableEvidence: ['Slow first step', 'Off-balance, reaching contact'],
    defaultSeverity: 'notable',
    drillFamilies: ['split step & first move', 'footwork & balance', 'movement & timing'],
    retest: retest({
      whatToReassess: 'Whether the first step and balance to the ball improve.',
      improvedWhen: 'Quicker, lighter movement and more balanced contact.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'Their feet are a step slow to the ball. The drills add a little hop ("split step") and quick feet so they arrive balanced.',
      coach: 'Footwork breakdown: late split/first step. Train split-step timing and adjustment steps; re-test balance at contact in movement drills.',
      advanced: 'Movement inefficiency from a mistimed split and poor adjustment-step economy. Re-time the split to opponent contact and train load-and-explode patterns for balanced intercepts.',
    },
  }),
  reported({
    id: 'mishit_under_pressure',
    sports: RACKET_ALL,
    name: 'Breaks Down Under Pressure',
    description: 'Technique holds up in practice but mishits and errors spike in matches or on big points — tension and decision-making under pressure.',
    likelyRootCauses: ['Tightening up / decelerating on big points', 'Poor shot selection under stress', 'Breathing/routine breaks down'],
    observableEvidence: ['Error rate jumps in matches vs practice', 'Tentative, short swings on key points'],
    defaultSeverity: 'minor',
    drillFamilies: ['pressure routines & breathing', 'high-percentage shot selection', 'commit to the swing'],
    retest: retest({
      whatToReassess: 'Whether match/pressure error rate moves closer to practice level.',
      improvedWhen: 'More committed swings and steadier choices on important points.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They play great in practice but tighten up in matches. The drills build a calm routine and smart shot choices for big points.',
      coach: 'Pressure breakdown: tension + selection under stress. Train between-point routines, breathing, and high-percentage patterns; re-test in pressure games.',
      advanced: 'Performance-pressure decrement from arousal-driven deceleration and degraded selection. Train routine, arousal regulation, and conservative pattern defaults to hold technique under load.',
    },
  }),
  reported({
    id: 'poor_spacing',
    sports: ['pickleball', 'padel', 'tennis'],
    name: 'Poor Spacing / Crowding the Ball',
    description: 'The player lets the ball get too close to the body, cramping the swing — common at the kitchen line / net where reactions are fast.',
    likelyRootCauses: ['Not adjusting feet to create space', 'Late read of the incoming ball', 'Standing too square / too close'],
    observableEvidence: ['Jammed, cramped contact', 'Popped-up or weak resets'],
    defaultSeverity: 'minor',
    drillFamilies: ['spacing & adjustment steps', 'contact point & spacing', 'soft hands at the net'],
    retest: retest({
      whatToReassess: 'Whether the player creates room and contacts the ball comfortably out front.',
      improvedWhen: 'More balanced, uncramped contact with better resets.',
    }),
    safetyCautions: [],
    explanations: {
      parent: 'They let the ball get too close to their body. The drills teach small steps to make room so the swing isn\'t cramped.',
      coach: 'Crowding: no space-making footwork. Train adjustment steps and contact-point spacing, especially at the net; re-test reset quality.',
      advanced: 'Spacing collapse compresses the intercept window. Train adjustment-step economy to preserve a forward, comfortable contact point and clean resets.',
    },
  }),
];

/**
 * All symptom-pack fault entries across every sport. Concatenated into the
 * curated ontology so `resolveFault`, drill matching, retest, and the
 * deterministic diagnosis engine all see them as first-class entries.
 */
export const SYMPTOM_FAULT_PACKS: FaultOntologyEntry[] = [...GOLF, ...BAT, ...RACKET];
