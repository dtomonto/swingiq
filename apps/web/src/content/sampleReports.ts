// ============================================================
// SwingVantage — Sample Reports (content config, DEVELOPER-ONLY)
//
// Eight sport-specific worked examples so any visitor can "see what
// they'll get" before starting. ALL data here is illustrative — it
// is never presented as a real athlete's result (see confidenceLevel
// + trustDisclaimer on every entry). The detected issue, drills, and
// coaching cues are grounded in the real per-sport registry content in
// packages/core/src/sports/<sport>/{drills,phases,benchmarks,analysis}.ts.
// Rendered by components/report/SampleReportTemplate.tsx.
//
// See docs/FIVE_PERSONA_MASTER_PLAN.md §7.
// ============================================================

export type SampleReportSlug =
  | 'golf'
  | 'tennis'
  | 'pickleball'
  | 'padel'
  | 'baseball'
  | 'slow-pitch'
  | 'fast-pitch'
  | 'softball';

export interface SampleDrill {
  name: string;
  how: string;
}

export interface SamplePlanDay {
  day: string;
  focus: string;
}

export interface SampleReport {
  slug: SampleReportSlug;
  sportLabel: string;
  sportEmoji: string;
  /** Engine sport id for /start?sport=… (omitted for the chooser). */
  startSport?: string;
  metaTitle: string;
  metaDescription: string;
  title: string;
  /** One-line framing under the H1. */
  intro: string;

  userProfile: string;
  inputData: string[];
  issueDetected: string;
  highestPriorityFix: string;
  evidenceUsed: string[];
  /** Honest, illustrative confidence label. */
  confidenceLevel: string;
  confidenceNote: string;
  whyItMatters: string;
  drills: SampleDrill[];
  practicePlan7Day: SamplePlanDay[];
  retestInstructions: string;
  progressMetrics: string[];
  coachSummary: string;
  parentSummary?: string;
  /** The honest limits — what the system cannot infer from this input. */
  whatWeCannotKnow: string[];
  trustDisclaimer: string;

  /** Feeds the shareable/printable ShareableReportCard. */
  card: { topIssue: string; drills: string[]; planSummary: string };

  /** When set, the report ends with a slow/fast chooser instead of a
   *  single "analyze" CTA (used by the general-softball sample). */
  modeChooser?: { slowHref: string; fastHref: string };
}

const ILLUSTRATIVE = 'Illustrative example (not your data)';

const GOLF: SampleReport = {
  slug: 'golf',
  sportLabel: 'Golf',
  sportEmoji: '⛳',
  startSport: 'golf',
  metaTitle: 'Sample Golf Swing Report — Fixing a Slice',
  metaDescription:
    'See a complete SwingVantage golf report: the top fix for a slice, the evidence behind it, three drills, a 7-day plan, and how to retest. Built from sample data.',
  title: 'Sample Golf Report: Fixing a Slice',
  intro:
    'A worked example for a recreational golfer who slices the driver. Your real report is built from your own swing.',
  userProfile:
    'Recreational golfer, plays ~twice a month, estimates an 18 handicap. Main complaint: the driver starts left and curves hard right.',
  inputData: [
    'One down-the-line swing video (driver)',
    'Self-reported ball flight: starts left of target, curves right',
    'No launch-monitor data provided',
  ],
  issueDetected: 'Out-to-in club path with a face open to that path — a classic slice pattern.',
  highestPriorityFix:
    'Shallow the downswing so the club approaches from the inside. Fix the path first; the face is far easier to square once the path is neutral.',
  evidenceUsed: [
    'In the down-the-line view, the club drops outside the target line in transition',
    'Reported ball flight (starts left, curves right) matches an out-to-in path with an open face',
    'Upper body appears to start the downswing before the lower body (over-the-top)',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'A single down-the-line video supports a confident read on path direction and sequence. Exact path and face numbers would need a launch monitor.',
  whyItMatters:
    'The path is the engine of the curve. Aiming further left or only changing your grip usually makes a slice worse — shallowing the path straightens ball flight at its source and is the fastest single change for most slicers.',
  drills: [
    { name: 'Headcover gate drill', how: 'Place a headcover a few inches outside and just behind the ball. Make swings that miss it on the way down — natural when the club drops to the inside, hard when you come over the top. 2 sets of 10 slow.' },
    { name: 'Pump-and-drop transition', how: 'From the top, slowly pump the club halfway down twice, feeling the trail elbow drop in front of the hip while the hands stay back. Swing through on the third rep. 10 reps.' },
    { name: 'Split-hand release', how: 'Grip with hands slightly apart, make half swings, and feel the lead forearm rotate so the toe points up after impact. Trains the face to square. 2 sets of 10.' },
  ],
  practicePlan7Day: [
    { day: 'Days 1–2', focus: 'Headcover gate drill at half speed only. Groove the inside approach — no full swings yet.' },
    { day: 'Days 3–4', focus: 'Add the pump-and-drop transition. Alternate with the gate drill.' },
    { day: 'Day 5', focus: 'Add the split-hand release to square the face. Keep speed at 70%.' },
    { day: 'Day 6', focus: 'Combine all three at 80%. Notice the start line shifting toward target.' },
    { day: 'Day 7', focus: 'Retest: re-film one driver swing from the same angle and compare.' },
  ],
  retestInstructions:
    'On day 7, re-film one driver swing from the same down-the-line angle and distance. Compare transition (does the club drop inside now?) and start line. Re-record every 1–2 weeks to track the trend, not a single swing.',
  progressMetrics: [
    'Start line (left of target → on target)',
    'Curve amount (big slice → small fade → straight)',
    'Centeredness of contact',
  ],
  coachSummary:
    'Player presents an out-to-in path with an open face on the driver. Priority: shallow the transition before any face/grip work. Drills assigned: gate, pump-and-drop, split-hand release. Retest in 7 days from a fixed camera angle.',
  whatWeCannotKnow: [
    'Exact club path and face angles in degrees (needs a launch monitor)',
    'Whether equipment (shaft, lie, loft) is contributing',
    'Anything about wrist or shoulder health — stop if you feel pain',
  ],
  trustDisclaimer:
    'This is an illustrative example built from sample data, not a real golfer’s result, and not certified instruction. SwingVantage gives heuristic estimates that sharpen as you add more swings. For injury concerns or advanced work, pair it with a qualified coach.',
  card: {
    topIssue: 'Out-to-in club path producing a slice',
    drills: ['Headcover gate drill (path)', 'Pump-and-drop transition (sequence)', 'Split-hand release (face)'],
    planSummary: '7 days: shallow the path first → add release → build speed → retest on day 7.',
  },
};

const TENNIS: SampleReport = {
  slug: 'tennis',
  sportLabel: 'Tennis',
  sportEmoji: '🎾',
  startSport: 'tennis',
  metaTitle: 'Sample Tennis Swing Report — Fixing Late Contact',
  metaDescription:
    'See a complete SwingVantage tennis report: why your forehand is late, the top fix to meet the ball out front, three drills, a 7-day plan, and how to retest. Sample data.',
  title: 'Sample Tennis Report: Meeting the Ball Out Front',
  intro:
    'A worked example for a recreational player whose forehand keeps arriving late. Your real report is built from your own swing.',
  userProfile:
    'Recreational 3.0–3.5 player, plays weekly doubles. Main complaint: the forehand feels rushed and "pushy" — little pace and a lot of balls floating long or into the net.',
  inputData: [
    'One side-view swing video (forehand groundstrokes)',
    'Self-reported pattern: rushed, pushed forehands with no pace',
    'No racket-sensor or radar data provided',
  ],
  issueDetected:
    'Late contact point: the hitting arm is beside or behind the front hip at contact rather than out in front — a preparation-and-timing issue, not a grip problem.',
  highestPriorityFix:
    'Prepare the unit turn earlier and meet the ball out in front of the lead hip, extending the arm through contact instead of pushing at the ball beside the body.',
  evidenceUsed: [
    'On the side view, the racket is still preparing when the ball is already arriving (late unit turn)',
    'Contact appears beside/behind the hip line rather than roughly an arm-length in front',
    'A short, blocked finish suggests the arm never extended through the contact zone',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'A clear side-view video supports a confident read on preparation timing and contact point. Exact racket-head speed would need a sensor or radar.',
  whyItMatters:
    'Contact point sets everything downstream. Meeting the ball late forces an arm-only "push" with no pace or margin; getting turned early and contacting out front lets the body drive the shot and adds both control and power without swinging harder.',
  drills: [
    { name: 'Toss-and-hit contact-point drill', how: 'Drop or self-toss a ball to the exact spot you want to contact it — in front of and out from the lead hip — and hit over a cone placed there. Train the same forward contact every rep. 3 sets of 20 feeds.' },
    { name: 'Shadow-swing extension', how: 'Shadow-swing in slow motion in front of a mirror and pause at contact. Check the arm is roughly 80% extended out front (long, not locked). Add 10 wall-touches at the correct contact point. ~3 minutes.' },
    { name: 'Early-preparation bounce-call', how: 'In a rally, call "turn!" the instant your opponent contacts the ball; the racket must be back and loaded before the ball bounces on your side. Trains preparation off the opponent’s cue, not the bounce. 20-minute rally.' },
  ],
  practicePlan7Day: [
    { day: 'Days 1–2', focus: 'Toss-and-hit contact-point drill only. Groove a forward contact in front of the hip.' },
    { day: 'Days 3–4', focus: 'Add shadow-swing extension to feel the arm reach through contact.' },
    { day: 'Day 5', focus: 'Add the early-preparation bounce-call in cooperative rallies at 70%.' },
    { day: 'Day 6', focus: 'Combine all three in live rallies; notice the ball jumping off the strings with more pace.' },
    { day: 'Day 7', focus: 'Retest: re-film forehands from the same side angle and compare contact point.' },
  ],
  retestInstructions:
    'On day 7, re-film 10–15 forehands from the same side-view angle and distance. Freeze at contact: is the racket out in front of the lead hip now, with the arm extended? Re-record every 1–2 weeks to track the trend, not a single ball.',
  progressMetrics: [
    'Contact point (beside/behind the hip → roughly an arm-length out front)',
    'Arm extension through contact (blocked/short → long finish)',
    'Racket-head speed at contact, if you ever measure it (intermediate target ~65 mph)',
  ],
  coachSummary:
    'Player contacts the forehand late, beside the body, producing pushed strokes with no pace. Priority: earlier unit turn and contact out front with extension. Drills assigned: toss-and-hit contact point, shadow extension, early-preparation bounce-call. Retest in 7 days from a fixed side angle.',
  whatWeCannotKnow: [
    'Exact racket-head speed or spin without a sensor/radar',
    'Whether footwork or ball-reading is part of the lateness (needs live, multi-angle looks)',
    'Anything about wrist, elbow, or shoulder health — stop if you feel pain',
  ],
  trustDisclaimer:
    'This is an illustrative example built from sample data, not a real player’s result, and not certified instruction. SwingVantage gives heuristic estimates that sharpen as you add more swings. For injury concerns or advanced work, pair it with a qualified coach.',
  card: {
    topIssue: 'Late contact point on the forehand → pushed, paceless strokes',
    drills: ['Toss-and-hit contact point (out front)', 'Shadow-swing extension (reach)', 'Early-preparation bounce-call (timing)'],
    planSummary: '7 days: prepare earlier → contact out front → extend through the ball → retest on day 7.',
  },
};

const PICKLEBALL: SampleReport = {
  slug: 'pickleball',
  sportLabel: 'Pickleball',
  sportEmoji: '🏓',
  startSport: 'pickleball',
  metaTitle: 'Sample Pickleball Swing Report — Stop Popping Up Dinks',
  metaDescription:
    'See a complete SwingVantage pickleball report: why your dinks float up to get attacked, the top fix to keep them low, three drills, a 7-day plan, and how to retest. Sample data.',
  title: 'Sample Pickleball Report: Keeping Dinks Low',
  intro:
    'A worked example for a player whose dinks keep floating up into the attack zone. Your real report is built from your own swing.',
  userProfile:
    'Rec 3.0–3.5 player who loses kitchen exchanges. Main complaint: dinks sit up at net height and get put away, so they keep losing the soft game.',
  inputData: [
    'One side-view swing video (cross-court dinking at the kitchen line)',
    'Self-reported pattern: dinks pop up and get attacked',
    'No paddle-sensor data provided',
  ],
  issueDetected:
    'Dinks popping up: the paddle face is too open at contact (or the ball is lifted with the wrist instead of the legs), so the ball leaves high and sits in the attack zone.',
  highestPriorityFix:
    'Stabilize a slightly-open, quiet paddle face and lift with the legs, not the wrist, so the ball skims low over the net and stays unattackable.',
  evidenceUsed: [
    'On the side view the paddle face is angled noticeably upward at contact',
    'The dink trajectory rises above net-and-shoulder height (an attackable arc)',
    'A wristy, flicking motion suggests the lift is coming from the hand rather than the legs',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'A side-view video supports a confident read on paddle-face angle and dink arc. Precise net-clearance height would need a fixed reference or sensor to confirm.',
  whyItMatters:
    'In the soft game, anything above net height is a free attack for your opponent. Keeping the dink low — a few inches over the tape with a quiet face — removes their put-away and is the single biggest swing in who controls the kitchen.',
  drills: [
    { name: 'Net-skimmer dink gate', how: 'Set a string or eye-line target a few inches above the net tape and dink cross-court trying to send every ball just over it. Keep the face slightly open and stable; lift with the legs, not the wrist. 5 minutes cross-court, then 5 straight-ahead.' },
    { name: 'Paddle-face control wall', how: 'Stand a few feet from a wall and dink continuously against it. Ball striking high means the face is too open — adjust to a square/slightly-open face that returns it low, keeping the wrist quiet through contact. ~8 minutes.' },
    { name: 'Attackable-ball recognition', how: 'Dink with a partner and call "up!" or "down!" before each contact: roll-attack only balls above net height, keep everything below it soft. Trains patience and shot selection. 10-minute game, tracking unforced speed-ups.' },
  ],
  practicePlan7Day: [
    { day: 'Days 1–2', focus: 'Net-skimmer dink gate only. Groove a low arc just over the tape with a quiet face.' },
    { day: 'Days 3–4', focus: 'Add the paddle-face control wall to stabilize the face angle.' },
    { day: 'Day 5', focus: 'Add attackable-ball recognition; speed up only the balls that float above the net.' },
    { day: 'Day 6', focus: 'Live kitchen exchanges keeping the low, leg-driven feel.' },
    { day: 'Day 7', focus: 'Retest: re-film cross-court dinks from the same side angle and compare arc height.' },
  ],
  retestInstructions:
    'On day 7, re-film a cross-court dink rally from the same side angle. Watch net clearance and face angle: are the dinks skimming low (a few inches over) instead of sitting up? Chart attackable vs. unattackable dinks over the next couple of weeks.',
  progressMetrics: [
    'Dink net clearance (sitting up → a few inches over the tape, intermediate target ~7")',
    'Paddle-face angle at contact (open/lifting → quiet and stable)',
    'Unforced speed-up errors (down toward zero)',
  ],
  coachSummary:
    'Player pops dinks up with an open, wristy face, giving away free attacks. Priority: stable slightly-open face, leg-driven lift, keep dinks low. Drills: net-skimmer gate, paddle-face wall, attackable-ball recognition. Retest in 7 days from a fixed side angle.',
  whatWeCannotKnow: [
    'Exact net-clearance height or paddle speed without a fixed reference/sensor',
    'Whether positioning or footwork at the kitchen line is contributing (needs live looks)',
    'Anything about wrist or shoulder health — stop if you feel pain',
  ],
  trustDisclaimer:
    'This is an illustrative example built from sample data, not a real player’s result, and not certified instruction. SwingVantage gives heuristic estimates that sharpen as you add more swings. For injury concerns or advanced work, pair it with a qualified coach.',
  card: {
    topIssue: 'Dinks popping up into the attack zone',
    drills: ['Net-skimmer dink gate (low arc)', 'Paddle-face control wall (stable face)', 'Attackable-ball recognition (selection)'],
    planSummary: '7 days: quiet the face → lift with the legs → keep dinks low → retest arc height on day 7.',
  },
};

const PADEL: SampleReport = {
  slug: 'padel',
  sportLabel: 'Padel',
  sportEmoji: '🎾',
  startSport: 'padel',
  metaTitle: 'Sample Padel Swing Report — Fixing a Weak Bandeja',
  metaDescription:
    'See a complete SwingVantage padel report: why your bandeja sits up and gets countered, the top fix to hold the net, three drills, a 7-day plan, and how to retest. Sample data.',
  title: 'Sample Padel Report: A Bandeja That Holds the Net',
  intro:
    'A worked example for a player whose bandeja keeps sitting up and losing the net. Your real report is built from your own swing.',
  userProfile:
    'Recreational player who keeps getting pushed back off the net. Main complaint: the bandeja lands short and floats, so opponents counter and take over the point.',
  inputData: [
    'One side-view swing video (bandeja on backhand-side lobs)',
    'Self-reported pattern: short, sitting bandejas that get countered',
    'No racket-sensor data provided',
  ],
  issueDetected:
    'Weak / sitting bandeja: a flat, short overhead with a high finish — usually a square stance, contact behind the body, or no slice brush on the ball — so it lacks the depth and control to hold the net.',
  highestPriorityFix:
    'Turn side-on early and contact slightly in front with a slice brush, finishing low and out toward a deep cross-court target so the bandeja holds the net instead of sitting up.',
  evidenceUsed: [
    'On the side view the stance is square and contact is behind the body line',
    'A flat overhead with a high follow-through rather than a low, controlled finish toward the target',
    'The resulting short, floaty depth matches a bandeja with no slice control',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'A clear side-view video supports a confident read on stance, contact point, and finish on the bandeja. Exact ball speed and spin would need a sensor.',
  whyItMatters:
    'In padel the bandeja is a placement shot whose whole job is to keep you at the net. A flat, short one hands the initiative back; a deep, sliced bandeja that finishes low buys time and holds your net position — usually more decisive than trying to smash every lob.',
  drills: [
    { name: 'Bandeja control & depth', how: 'A partner lobs to your backhand-side overhead; turn side-on early, contact slightly in front with a slice brush, and aim deep cross-court near the side glass. Finish low and out toward the target — not over the shoulder. 3 sets of 12.' },
    { name: 'Smash-or-bandeja decision', how: 'Partner mixes deep lobs and short, high sit-ups. Play a controlled bandeja/víbora on deep or awkward lobs; only flat-smash the short, comfortable ones. Call your choice aloud before contact. 15-minute game, tracking selection.' },
    { name: 'Net volley block & place', how: 'Partner feeds drives and dipping balls; block with a firm, slightly-open, stable face and minimal swing, punching the volley deep to the corners. Keeps you set at the net after the bandeja. 3 sets of 15.' },
  ],
  practicePlan7Day: [
    { day: 'Days 1–2', focus: 'Bandeja control & depth only. Groove the side-on turn, forward contact, and low finish.' },
    { day: 'Days 3–4', focus: 'Add the smash-or-bandeja decision game to default to control under pressure.' },
    { day: 'Day 5', focus: 'Add net volley block & place to hold the net after the overhead.' },
    { day: 'Day 6', focus: 'Live points keeping the deep, sliced bandeja and staying forward.' },
    { day: 'Day 7', focus: 'Retest: re-film bandejas from the same side angle and compare depth and finish.' },
  ],
  retestInstructions:
    'On day 7, re-film 10–15 bandejas from the same side-view angle. Check the stance (side-on?), contact point (in front?), and finish (low and out?). Chart how often the bandeja lands deep and you hold the net over the next couple of weeks.',
  progressMetrics: [
    'Bandeja depth/control (short and sitting → deep and repeatable, intermediate target ~0.72)',
    'Finish direction (high over the shoulder → low and out toward the target)',
    'Net-hold rate through bandeja exchanges (intermediate target ~58%)',
  ],
  coachSummary:
    'Player hits a flat, short bandeja from a square stance with contact behind the body, losing the net. Priority: side-on turn, contact in front, slice brush, low finish, deep cross-court. Drills: bandeja control & depth, smash-or-bandeja decision, net volley block & place. Retest in 7 days from a fixed side angle.',
  whatWeCannotKnow: [
    'Exact ball speed or spin without a sensor',
    'Court positioning and footwork patterns from a single-shot clip (needs live looks)',
    'Anything about shoulder or back health — warm up the overhead and stop if you feel pain',
  ],
  trustDisclaimer:
    'This is an illustrative example built from sample data, not a real player’s result, and not certified instruction. SwingVantage gives heuristic estimates that sharpen as you add more swings. For injury concerns or advanced work, pair it with a qualified coach.',
  card: {
    topIssue: 'Weak, sitting bandeja that loses the net',
    drills: ['Bandeja control & depth (slice, deep)', 'Smash-or-bandeja decision (selection)', 'Net volley block & place (hold the net)'],
    planSummary: '7 days: side-on turn → contact in front with slice → finish low and deep → retest on day 7.',
  },
};

const BASEBALL: SampleReport = {
  slug: 'baseball',
  sportLabel: 'Baseball',
  sportEmoji: '⚾',
  startSport: 'baseball',
  metaTitle: 'Sample Baseball Swing Report — Rollover & Low Exit Velocity',
  metaDescription:
    'See a complete SwingVantage baseball report: why you roll over into weak grounders, the top fix, three drills, a 7-day plan, and how to retest. Sample data.',
  title: 'Sample Baseball Report: Rollover & Low Exit Velocity',
  intro:
    'A worked example for a hitter who keeps rolling over into weak ground balls. Your real report is built from your own swing.',
  userProfile:
    'High-school hitter, mostly pulls weak ground balls to the left side, feels like he "swings hard but hits it soft."',
  inputData: [
    'One open-side swing video (live BP)',
    'Self-reported pattern: weak grounders pulled to third base',
    'Optional exit-velocity note: ~72 mph off a tee',
  ],
  issueDetected:
    'Early top-hand roll-over: the barrel closes before contact, catching the top of the ball — a contact-point and sequence issue, not just "wrists."',
  highestPriorityFix:
    'Stay through the ball with a palm-up / palm-down hand position at contact and let the release happen AFTER the ball, driven by sequence rather than an early flip.',
  evidenceUsed: [
    'At contact the top-hand palm is already turning down (should still be up)',
    'A wrappy, around-the-body finish suggests the barrel left the zone early',
    'Reported weak pull-side grounders match an early-roll, closed-face contact',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'A clear open-side video gives a confident read on contact-point and release timing. Bat speed and exit velocity numbers would need a sensor or radar to confirm.',
  whyItMatters:
    'Exit velocity is bat speed plus quality of contact. Catching the top half of the ball turns hard swings into soft grounders. Staying through the ball converts those into line drives — usually a bigger gain than swinging harder.',
  drills: [
    { name: 'Tee, palm-up checkpoint', how: 'Set a tee at belt height. Swing slowly and stop at contact to check that the top-hand palm faces up. Groove arriving at the ball before the wrists release. 2 sets of 10.' },
    { name: 'Two-tee path drill', how: 'Place a second tee a ball-width in front of the contact tee toward the pitcher. Drive both — staying through to the front tee keeps the barrel in the zone. 2 sets of 8.' },
    { name: 'Opposite-field tee work', how: 'Move the tee slightly back and hit line drives the other way. Going oppo is nearly impossible if you roll over, so it trains a late release. 2 sets of 10.' },
  ],
  practicePlan7Day: [
    { day: 'Days 1–2', focus: 'Palm-up checkpoint, slow tee reps only. Feel the hand position at contact.' },
    { day: 'Days 3–4', focus: 'Add the two-tee path drill. Reward flush contact over power.' },
    { day: 'Day 5', focus: 'Opposite-field tee work to lock in a late release.' },
    { day: 'Day 6', focus: 'Mix all three, then add easy front-toss keeping the same feel.' },
    { day: 'Day 7', focus: 'Retest: re-film from the same open-side angle; chart contact.' },
  ],
  retestInstructions:
    'On day 7, re-film from the same open-side angle and hit 10 tee balls. Freeze at contact: is the top-hand palm up now? Chart line drives vs. grounders over the next two weeks.',
  progressMetrics: [
    'Line-drive rate vs. weak-grounder rate',
    'Top-hand position at contact (palm up vs. rolled)',
    'Exit velocity off the tee (if measured)',
  ],
  coachSummary:
    'Hitter rolls over early, producing pull-side grounders. Priority: stay through the ball, release after contact. Drills: palm-up checkpoint, two-tee path, oppo tee work. Retest in 7 days; chart contact quality.',
  parentSummary:
    'Your hitter is catching the top of the ball, which turns good effort into soft grounders. The plan is three simple tee drills over a week — no extra strength needed yet. Keep it positive and let them feel solid contact.',
  whatWeCannotKnow: [
    'Exact bat speed or exit velocity without a sensor/radar',
    'Whether it is timing vs. mechanics until we also see live pitching',
    'Bat fit and any physical limitations — use age-appropriate gear and stop if it hurts',
  ],
  trustDisclaimer:
    'This is an illustrative example built from sample data, not a real player’s result, and not certified instruction. SwingVantage gives heuristic estimates that sharpen with more swings. Youth athletes should practice with adult supervision.',
  card: {
    topIssue: 'Early top-hand roll-over → weak pull-side grounders',
    drills: ['Palm-up tee checkpoint', 'Two-tee path drill', 'Opposite-field tee work'],
    planSummary: '7 days: stay through the ball → late release → retest contact on day 7.',
  },
};

const SLOW_PITCH: SampleReport = {
  slug: 'slow-pitch',
  sportLabel: 'Slow Pitch Softball',
  sportEmoji: '🥎',
  startSport: 'softball_slow',
  metaTitle: 'Sample Slow-Pitch Softball Report — Stop Popping Up',
  metaDescription:
    'See a complete SwingVantage slow-pitch report: why you pop up, the top fix to hit line drives, three drills, a 7-day plan, and how to retest. Sample data.',
  title: 'Sample Slow-Pitch Report: Stop Popping Up',
  intro:
    'A worked example for a slow-pitch hitter who keeps popping up instead of driving line drives. Your real report is built from your own swing.',
  userProfile:
    'Rec-league slow-pitch hitter, frequent infield/shallow-outfield pop-ups, wants to "stop hitting lazy flies and start driving it."',
  inputData: [
    'One side-view swing video (live at-bats)',
    'Self-reported pattern: lots of pop-ups and weak fly balls',
    'No bat-sensor data provided',
  ],
  issueDetected:
    'Bat path travels under the descending ball — usually a dropped back shoulder or an exaggerated uppercut into an already-dropping pitch.',
  highestPriorityFix:
    'Level the swing to match the arc and stay through the middle of the ball instead of swinging up and under it.',
  evidenceUsed: [
    'Back shoulder dips low in the load on the side view',
    'Bat path angles up steeply into a steeply descending pitch',
    'Reported pop-ups and weak flies match under-the-ball contact',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'A side-view video supports a confident read on bat path relative to the pitch and shoulder tilt. Precise launch angle and bat speed would need a sensor.',
  whyItMatters:
    'In slow pitch the ball is dropping at contact, so an exaggerated uppercut sends it straight up. Matching a slightly upward path to the descent — without swinging under it — is what turns pop-ups into carrying line drives.',
  drills: [
    { name: 'Belt-high tee drill', how: 'Set a tee at belt height and drive line drives into a net with a level path. Reward flat, hard contact. 3 sets of 10.' },
    { name: 'Level-shoulder cue', how: 'Make slow swings keeping shoulders relatively level through the turn so the barrel stays in the zone longer. 2 sets of 10.' },
    { name: 'Stay-through soft toss', how: 'Soft toss focused on driving through the middle of the ball toward the pitcher — not lifting it. 2 sets of 10.' },
  ],
  practicePlan7Day: [
    { day: 'Days 1–2', focus: 'Belt-high tee drill only. Feel flat, hard, line-drive contact.' },
    { day: 'Days 3–4', focus: 'Add the level-shoulder cue at slow speed.' },
    { day: 'Day 5', focus: 'Stay-through soft toss; drive the ball back at the feeder.' },
    { day: 'Day 6', focus: 'Live reps keeping the level feel against a real arc.' },
    { day: 'Day 7', focus: 'Retest: re-film from the same side angle; chart contact.' },
  ],
  retestInstructions:
    'On day 7, re-film from the same side angle and take 10–15 swings. Watch shoulder tilt and bat path. Chart line drives vs. pop-ups over the next couple of weeks.',
  progressMetrics: [
    'Line-drive rate vs. pop-up rate',
    'Back-shoulder tilt in the load',
    'Bat path relative to the pitch (level vs. under)',
  ],
  coachSummary:
    'Hitter swings under a descending ball (dropped back shoulder + uppercut). Priority: level the path, stay through the middle. Drills: belt-high tee, level-shoulder, stay-through toss. Retest in 7 days.',
  whatWeCannotKnow: [
    'Exact launch angle and bat speed without a sensor',
    'Bat certification/fit considerations',
    'Any physical limitations — warm up and use an appropriate bat',
  ],
  trustDisclaimer:
    'This is an illustrative example built from sample data, not a real player’s result, and not certified instruction. SwingVantage gives heuristic estimates that sharpen with more swings.',
  card: {
    topIssue: 'Bat path under a descending ball → pop-ups',
    drills: ['Belt-high tee (level path)', 'Level-shoulder cue', 'Stay-through soft toss'],
    planSummary: '7 days: level the path → stay through the ball → retest line-drive rate on day 7.',
  },
};

const FAST_PITCH: SampleReport = {
  slug: 'fast-pitch',
  sportLabel: 'Fast Pitch Softball',
  sportEmoji: '🥎',
  startSport: 'softball_fast',
  metaTitle: 'Sample Fast-Pitch Softball Report — Late Contact',
  metaDescription:
    'See a complete SwingVantage fast-pitch report: why you’re late and getting jammed, the top fix, three drills, a 7-day plan, and how to retest. Sample data.',
  title: 'Sample Fast-Pitch Report: Catching Up to Speed',
  intro:
    'A worked example for a fast-pitch hitter who is late and getting jammed. Your real report is built from your own swing.',
  userProfile:
    'Travel-ball fast-pitch hitter, gets beat by speed, fouls pitches straight back, and gets jammed inside.',
  inputData: [
    'One side-view swing video (live or front-toss at game speed)',
    'Self-reported pattern: late, fouling pitches back, jammed inside',
    'No bat-sensor data provided',
  ],
  issueDetected:
    'Late timing with a long path to the ball: the swing starts too late and travels too far, so contact happens deep and gets jammed.',
  highestPriorityFix:
    'Start the swing earlier with a shorter, more direct path — get the barrel to the zone sooner and move the contact point in front.',
  evidenceUsed: [
    'Load/launch begins after the pitch is already on the way',
    'A long, sweepy path to the ball on the side view',
    'Fouling pitches straight back is a timing signature (just late)',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'A game-speed side video supports a confident read on timing and path length. Exact reaction time and bat speed would need sensors or multi-angle capture.',
  whyItMatters:
    'Against 50–70+ mph pitching there is very little time. A shorter path and earlier start are what let you meet the ball out front with authority instead of fouling it back or getting jammed.',
  drills: [
    { name: 'Short-path "A-to-B" tee', how: 'Tee work focused on the most direct route from launch to contact — knob to the ball, no sweep. Reward quickness, not effort. 3 sets of 8.' },
    { name: 'Early-load timing count', how: 'On front toss, start your load on a count well before release so the swing is ready early. 2 sets of 10.' },
    { name: 'Contact-point-out-front toss', how: 'Front toss with a target contact point in front of the lead hip; drive line drives from there. 2 sets of 10.' },
  ],
  practicePlan7Day: [
    { day: 'Days 1–2', focus: 'Short-path tee work only. Feel the barrel arrive quickly.' },
    { day: 'Days 3–4', focus: 'Add the early-load timing count on front toss.' },
    { day: 'Day 5', focus: 'Contact-point-out-front toss; drive it back at the feeder.' },
    { day: 'Day 6', focus: 'Game-speed reps keeping the early start and short path.' },
    { day: 'Day 7', focus: 'Retest: re-film at game speed; check timing + contact depth.' },
  ],
  retestInstructions:
    'On day 7, re-film at game speed and take 10–15 swings. Check whether the load starts earlier and contact is more out in front. Chart solid contact vs. late/jammed over two weeks.',
  progressMetrics: [
    'Contact depth (out front vs. deep/jammed)',
    'On-time rate vs. late (fouled-back) rate',
    'Path length from launch to contact',
  ],
  coachSummary:
    'Hitter is late with a long path, getting jammed. Priority: earlier start + shorter, direct path; contact out front. Drills: short-path tee, early-load count, contact-out-front toss. Retest at game speed in 7 days.',
  parentSummary:
    'Your hitter is getting beat by speed because the swing starts late and travels too far. The plan is a week of short, quick reps — quickness over effort. Keep it light and positive.',
  whatWeCannotKnow: [
    'Exact reaction time or bat speed without sensors',
    'Whether the pitch read/recognition is part of the lateness (needs live looks)',
    'Bat fit and physical limitations — use appropriate gear and warm up',
  ],
  trustDisclaimer:
    'This is an illustrative example built from sample data, not a real player’s result, and not certified instruction. SwingVantage gives heuristic estimates that sharpen with more swings. Youth athletes should practice with adult supervision.',
  card: {
    topIssue: 'Late timing + long path → jammed, fouled-back contact',
    drills: ['Short-path A-to-B tee', 'Early-load timing count', 'Contact-out-front toss'],
    planSummary: '7 days: start earlier → shorten the path → contact out front → retest at game speed.',
  },
};

const SOFTBALL_CHOOSER: SampleReport = {
  slug: 'softball',
  sportLabel: 'Softball',
  sportEmoji: '🥎',
  metaTitle: 'Sample Softball Report — Slow Pitch vs Fast Pitch',
  metaDescription:
    'Slow pitch and fast pitch need different swings. See how the same hitter gets a different SwingVantage diagnosis in each — then pick your mode. Sample data.',
  title: 'Sample Softball Report: Which Swing Path Is Right for You?',
  intro:
    'Slow pitch and fast pitch ask for almost opposite swings. Here is how the same hitter gets a different read in each — then pick your mode.',
  userProfile:
    'A softball hitter who plays both slow pitch (weeknights) and fast pitch (travel ball) and wonders why one swing does not work for both.',
  inputData: [
    'One side-view swing video',
    'Self-reported: "great in one league, lost in the other"',
    'Discipline not yet selected',
  ],
  issueDetected:
    'The same swing is matched to the wrong pitch. Slow pitch drops steeply at contact (you must match the descent); fast pitch arrives flat and fast (you must shorten and start early). One swing cannot optimally do both.',
  highestPriorityFix:
    'Pick your discipline first — that decides everything else. Then match your path: level-to-slightly-up for the slow-pitch arc, short-and-early for fast-pitch speed.',
  evidenceUsed: [
    'Slow pitch: pop-ups come from swinging under a steeply dropping ball',
    'Fast pitch: jammed/late contact comes from a long path and late start',
    'The same hitter shows both symptoms because the pitch is different, not the player',
  ],
  confidenceLevel: ILLUSTRATIVE,
  confidenceNote:
    'Once you select slow or fast pitch, SwingVantage loads the right benchmarks and a discipline-specific diagnosis. This sample shows the contrast, not a single verdict.',
  whyItMatters:
    'Most "I lost my swing" frustration in softball is really a mode mismatch. Choosing the right discipline and matching your path to it fixes more than any single mechanical tweak.',
  drills: [
    { name: 'Slow pitch → belt-high tee', how: 'Level path, drive line drives, stay through the middle of a dropping ball. (Full plan in the slow-pitch path.)' },
    { name: 'Fast pitch → short-path tee', how: 'Most direct route to the ball, contact out front, quickness over effort. (Full plan in the fast-pitch path.)' },
    { name: 'Either way → retest', how: 'Re-film from the same angle after a week and compare to your discipline’s checkpoints.' },
  ],
  practicePlan7Day: [
    { day: 'Step 1', focus: 'Confirm your discipline: slow pitch or fast pitch.' },
    { day: 'Step 2', focus: 'Open the matching path below for a full 7-day plan and drills.' },
    { day: 'Step 3', focus: 'Retest after a week against that discipline’s checkpoints.' },
  ],
  retestInstructions:
    'Use the retest from whichever discipline you choose — the checkpoints differ for slow vs fast pitch.',
  progressMetrics: [
    'Slow pitch: line-drive rate vs. pop-ups',
    'Fast pitch: on-time rate + contact depth',
    'Both: consistency from a fixed camera angle',
  ],
  coachSummary:
    'Hitter plays both disciplines with one swing. Priority: select the discipline, then coach the matching path (level-up for slow pitch, short-early for fast pitch). Send to the matching path for the full plan.',
  whatWeCannotKnow: [
    'Which discipline matters most to you right now — only you can choose',
    'Anything discipline-specific until a mode is selected',
    'Physical limitations — warm up and use appropriate gear',
  ],
  trustDisclaimer:
    'This is an illustrative comparison built from sample data, not a real player’s result, and not certified instruction. Pick a discipline to get a focused, honest read.',
  card: {
    topIssue: 'One swing matched to the wrong pitch (slow vs fast)',
    drills: ['Slow pitch: level path', 'Fast pitch: short, early path', 'Retest against your mode'],
    planSummary: 'Pick slow or fast pitch, then follow that discipline’s 7-day plan and retest.',
  },
  modeChooser: {
    slowHref: '/softball-swing-analysis/slow-pitch',
    fastHref: '/softball-swing-analysis/fast-pitch',
  },
};

export const SAMPLE_REPORTS: SampleReport[] = [
  GOLF,
  TENNIS,
  PICKLEBALL,
  PADEL,
  BASEBALL,
  SLOW_PITCH,
  FAST_PITCH,
  SOFTBALL_CHOOSER,
];

export function getSampleReport(slug: string): SampleReport | undefined {
  return SAMPLE_REPORTS.find((r) => r.slug === slug);
}
