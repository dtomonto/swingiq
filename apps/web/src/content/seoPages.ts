// ============================================================
// SwingVantage — SEO Content Registry
//
// Single source of truth for programmatic SEO landing pages.
// Each entry is rendered by components/seo/SeoArticle.tsx using
// the AEO/GEO format (direct answer → explanation → diagnosis →
// drills → mistakes → coach → FAQ → CTA → schema).
//
// QUALITY RULE: only entries with publishStatus 'published' are
// routed and indexed. 'draft' entries are backlog content that is
// NOT yet good enough to ship — never publish thin pages.
// ============================================================

import { WEDGE_PAGES } from './seoPagesWedges';

export type Sport = 'golf' | 'tennis' | 'baseball' | 'softball' | 'multi';
export type Audience = 'player' | 'parent' | 'coach' | 'creator' | 'team';
export type Intent = 'informational' | 'commercial' | 'transactional';
export type FunnelStage = 'awareness' | 'consideration' | 'conversion';
export type SchemaType = 'Article' | 'HowTo' | 'FAQPage' | 'Service';
export type PublishStatus = 'published' | 'draft';

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoDrill {
  name: string;
  /** Plain-English how-to, beginner-safe. */
  how: string;
}

export interface RelatedLink {
  label: string;
  href: string;
}

export interface SeoPage {
  /** URL path WITHOUT leading slash, e.g. 'golf/fix-slice'. */
  slug: string;
  sport: Sport;
  /**
   * Optional softball discipline. Lets the slow-pitch / fast-pitch hubs
   * filter their guide silo (RelatedGuides). Pages with no discipline are
   * treated as general softball and show on both hubs.
   */
  discipline?: 'slow_pitch' | 'fast_pitch';
  audience: Audience;
  keyword: string;
  intent: Intent;
  funnelStage: FunnelStage;
  /** 1 (highest) – 5 (lowest) build/SEO priority. */
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  metaDescription: string;
  /** One-paragraph direct answer shown at the very top (AEO/GEO). */
  directAnswer: string;
  /** 1–3 paragraphs explaining the problem. */
  problemExplanation: string[];
  /** Self-check / diagnosis checklist. */
  diagnosisSteps: string[];
  /** What SwingVantage specifically looks for / measures. */
  whatSwingVantageLooksFor: string[];
  /** Optional one-line worked example of a diagnosis SwingVantage might give. */
  exampleDiagnosis?: string;
  drills: SeoDrill[];
  mistakesToAvoid: string[];
  whenToWorkWithCoach: string;
  faqs: SeoFaq[];
  relatedLinks: RelatedLink[];
  cta: { label: string; href: string };
  schemaType: SchemaType;
  /** Youth/safety reminders rendered in a notice block. */
  safetyNotes: string;
  publishStatus: PublishStatus;
}

const GOLF_FIX_SLICE: SeoPage = {
  slug: 'golf/fix-slice',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to fix a slice',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Fix a Golf Slice (Beginner-Safe Guide)',
  metaDescription:
    'A slice is almost always an out-to-in club path with an open face. Here is how to diagnose it, three beginner-safe drills to fix it, and a 7-day practice plan.',
  directAnswer:
    'A slice happens when your club face is open relative to your swing path at impact — usually an out-to-in path combined with a face that points right of that path (for a right-handed golfer). Fix the path first, then the face: most slices straighten out once your club stops cutting across the ball from outside the target line.',
  problemExplanation: [
    'The ball curves because of the relationship between your club path (the direction the club head is moving) and your face angle (where the face points) at impact. When the face is open to the path, the ball spins left-to-right and slices.',
    'For most amateurs the root cause is an over-the-top downswing: the club moves up and out at the top, then comes back down outside the target line, forcing an out-to-in path. Grip and setup problems often make it worse.',
  ],
  diagnosisSteps: [
    'Note where the ball starts: a slice usually starts left of target, then curves right.',
    'Check your divots — pointing left of target is a classic out-to-in path sign.',
    'Look at your grip: can you see fewer than two knuckles on your lead hand? That weak grip tends to leave the face open.',
    'Film one swing face-on and one down-the-line; compare the club at the top and at impact.',
    'Try a few easy swings at 70% — if the slice shrinks, tempo and casting are involved.',
  ],
  whatSwingVantageLooksFor: [
    'Club path direction and steepness through impact',
    'Face-to-path relationship (the real driver of curve)',
    'Early-extension or over-the-top move in the downswing',
    'Tempo and sequencing from transition to release',
  ],
  drills: [
    {
      name: 'Headcover gate drill',
      how: 'Place a headcover just outside the ball, a few inches ahead. Make slow swings that miss the headcover — this trains an in-to-out path and stops the cut across the ball.',
    },
    {
      name: 'Split-hand release drill',
      how: 'Grip with your hands slightly apart and make half swings, feeling the lead forearm rotate so the toe of the club points up after impact. This teaches the face to square and close.',
    },
    {
      name: 'Slow-motion transition rehearsal',
      how: 'From the top, rehearse dropping your hands and trail elbow down toward your trail pocket before turning. Do 10 reps at quarter speed before any full swing.',
    },
  ],
  mistakesToAvoid: [
    'Aiming further left to "fix" the slice — this steepens the out-to-in path and makes it worse.',
    'Only working on the face while ignoring the path.',
    'Swinging at full speed before the new feel is grooved.',
    'Buying anti-slice gear before understanding your actual path and face numbers.',
  ],
  whenToWorkWithCoach:
    'If the slice persists after a week of path work, if you feel pain in your lead wrist or shoulder, or if you cannot tell whether the issue is path or face from your videos, a qualified coach can confirm the cause in minutes and keep you from grooving a compensation.',
  faqs: [
    {
      question: 'Why do I slice my driver but not my irons?',
      answer:
        'The driver is the longest club with the least loft, so the same out-to-in path and open face produce far more visible side spin. Many golfers slice every club but only notice it with the driver.',
    },
    {
      question: 'How long does it take to fix a slice?',
      answer:
        'Most golfers see noticeable improvement within one to two weeks of focused path-first practice. Fully grooving the new motion takes longer, but the curve usually shrinks quickly once the path changes.',
    },
    {
      question: 'Will a stronger grip fix my slice?',
      answer:
        'A slightly stronger grip helps the face square more easily, but it is not a complete fix on its own. Pair it with path work for lasting results.',
    },
  ],
  relatedLinks: [
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Practice golf at home', href: '/golf/practice-at-home' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
    { label: 'Golf Slice Fixer quiz', href: '/tools/golf-slice-fixer' },
  ],
  cta: { label: 'Analyze My Slice Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'Drills are low-intensity and suitable for most adult golfers. Stop if you feel pain. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_WHY_SLICE_DRIVER: SeoPage = {
  slug: 'golf/why-do-i-slice-my-driver',
  sport: 'golf',
  audience: 'player',
  keyword: 'why do I slice my driver',
  intent: 'informational',
  funnelStage: 'awareness',
  priority: 2,
  title: 'Why Do I Slice My Driver? (And How to Stop)',
  metaDescription:
    'You slice the driver more than your irons because its length and low loft magnify an open-face, out-to-in strike. Here is the real cause and how to fix it.',
  directAnswer:
    'You slice your driver because its longer shaft and lower loft amplify the same open-face, out-to-in pattern that may be hard to see with shorter clubs. The fix is the same as any slice — square the path first, then the face — but setup details unique to the driver (ball position, tee height, tilt) matter more.',
  problemExplanation: [
    'The driver swings on a flatter, longer arc and has the least loft of any club, so side spin shows up dramatically. A face just a few degrees open to the path can turn a small fade into a big slice.',
    'Driver-specific setup errors — ball too far back, no spine tilt, swinging down on it — encourage a steep out-to-in path that makes slicing almost automatic.',
  ],
  diagnosisSteps: [
    'Check ball position: the driver ball should be forward, off your lead heel.',
    'Confirm a slight tilt away from target at address so you catch the ball slightly on the upswing.',
    'Look at tee height — half the ball above the crown encourages an upward, in-to-out strike.',
    'Film down-the-line: is the club coming over the top in transition?',
  ],
  whatSwingVantageLooksFor: [
    'Angle of attack (up vs. down on the ball)',
    'Club path and face-to-path at impact',
    'Setup tilt and ball-position cues visible in your video',
    'Over-the-top sequencing',
  ],
  drills: [
    { name: 'Tee-height + forward ball check', how: 'Rehearse your setup with the ball forward and teed high, with a slight tilt away from target. Make 10 setups before hitting.' },
    { name: 'Step-through swing', how: 'Make slow swings stepping your trail foot through after impact to feel an in-to-out release and upward strike.' },
    { name: 'Headcover gate drill', how: 'Place a headcover just outside and ahead of the ball; swing without hitting it to stop the cut-across path.' },
  ],
  mistakesToAvoid: [
    'Teeing the ball low and hitting down on the driver.',
    'Playing the ball too far back in your stance.',
    'Aiming left to compensate, which steepens the slice.',
    'Swinging out of your shoes — speed magnifies side spin.',
  ],
  whenToWorkWithCoach:
    'If setup fixes and path drills do not reduce the curve within a couple of sessions, or you want your real launch numbers verified, a coach with a launch monitor can pinpoint the cause quickly.',
  faqs: [
    { question: 'Is a slice always a swing problem?', answer: 'Not always — equipment that is too stiff or a driver set too open can contribute. But for most golfers it is path and face, not gear.' },
    { question: 'Should I just buy a draw-biased driver?', answer: 'A draw-biased head can help, but it masks rather than fixes the cause. Understand your path and face first so any equipment change actually helps.' },
  ],
  relatedLinks: [
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
    { label: 'Launch monitor analysis', href: '/golf/launch-monitor-analysis' },
    { label: 'Golf Slice Fixer quiz', href: '/tools/golf-slice-fixer' },
  ],
  cta: { label: 'Analyze My Driver Swing Free', href: '/dashboard' },
  schemaType: 'FAQPage',
  safetyNotes: 'Low-intensity drills suitable for most adult golfers. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_LAUNCH_MONITOR: SeoPage = {
  slug: 'golf/launch-monitor-analysis',
  sport: 'golf',
  audience: 'player',
  keyword: 'launch monitor analysis',
  intent: 'commercial',
  funnelStage: 'consideration',
  priority: 1,
  title: 'Launch Monitor Analysis: What Your Numbers Actually Mean',
  metaDescription:
    'Confused by your launch monitor data? Learn what club speed, smash factor, spin, launch angle, and club path tell you — and how to turn them into a practice plan.',
  directAnswer:
    'Launch monitor data describes two things: how you struck the ball (speed, smash factor, spin, launch) and how the club delivered it (path, face, attack angle). The fastest way to improve is to read the club-delivery numbers first, fix the biggest gap, then watch the ball numbers follow.',
  problemExplanation: [
    'Most golfers stare at carry distance and ignore the numbers that explain it. Smash factor, spin, and launch angle tell you whether you are striking efficiently; path and face tell you why the ball curves.',
    'SwingVantage imports data from FlightScope, TrackMan, Garmin, and other monitors, normalizes the columns, and highlights your single highest-priority gap instead of leaving you with a wall of numbers.',
  ],
  diagnosisSteps: [
    'Find your smash factor (ball speed ÷ club speed). Driver near 1.50 is efficient; low values mean off-center strikes.',
    'Check spin: too high robs distance, too low can cost carry and stopping power.',
    'Compare launch angle to your spin — they work together for optimal carry.',
    'Read club path and face-to-path to explain your shot shape.',
  ],
  whatSwingVantageLooksFor: [
    'Smash factor and strike efficiency',
    'Spin/launch window for your club speed',
    'Club path and face-to-path patterns across a session',
    'Consistency (dispersion) versus one-off good shots',
  ],
  drills: [
    { name: 'Strike-mapping with foot spray', how: 'Spray a light powder on the face and hit five balls. Centeredness of contact explains most smash-factor problems.' },
    { name: 'Spin-window tee test', how: 'Hit drivers at three tee heights and note which gives the best launch-to-spin balance on your monitor.' },
    { name: 'Path gate drill', how: 'Use alignment sticks as a gate to groove a neutral path, then re-check your numbers.' },
  ],
  mistakesToAvoid: [
    'Chasing one big-distance number from a single swing.',
    'Ignoring dispersion and only looking at averages.',
    'Changing equipment before understanding your delivery numbers.',
    'Comparing your numbers to tour pros instead of your own baseline.',
  ],
  whenToWorkWithCoach:
    'A coach or fitter with a monitor is invaluable when your numbers suggest an equipment mismatch, or when strike and path both need work and you cannot prioritize. SwingVantage helps you arrive with a clear question instead of guesswork.',
  faqs: [
    { question: 'What is a good smash factor?', answer: 'For a driver, around 1.48–1.50 is efficient. Irons are progressively lower. Low smash usually means off-center contact.' },
    { question: 'Do I need an expensive launch monitor?', answer: 'No. SwingVantage works with data exported from many consumer and pro monitors, and you can also analyze video without one.' },
  ],
  relatedLinks: [
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
    { label: 'Benchmarks', href: '/benchmarks/golf' },
  ],
  cta: { label: 'Import My Launch Data Free', href: '/sessions/import' },
  schemaType: 'Article',
  safetyNotes: 'Data interpretation only — no physical risk. Always warm up before full-speed sessions.',
  publishStatus: 'published',
};

const GOLF_PRACTICE_AT_HOME: SeoPage = {
  slug: 'golf/practice-at-home',
  sport: 'golf',
  audience: 'player',
  keyword: 'practice golf at home',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Practice Golf at Home (No Range Required)',
  metaDescription:
    'You can make real progress at home with mirror work, slow-motion reps, and short-game touch drills. Here is a safe, equipment-light home practice plan.',
  directAnswer:
    'The most effective at-home golf practice is not full swings — it is slow-motion rehearsal, mirror checkpoints, and short putting/chipping touch work. These build the motor patterns that transfer to the course without needing a range or much space.',
  problemExplanation: [
    'Full-speed swinging indoors is risky and often impossible. But the swing is mostly a sequence of positions and a tempo — both of which you can train at home with feedback.',
    'A mirror, a phone camera, and a few feet of space are enough to groove transition, posture, and release, while a hallway is plenty for putting touch.',
  ],
  diagnosisSteps: [
    'Identify your top swing priority (SwingVantage can do this from one video).',
    'Pick the one position that priority depends on (e.g., transition for a slice).',
    'Set up a mirror or phone so you can see that position.',
    'Decide your daily rep count and a weekly retest.',
  ],
  whatSwingVantageLooksFor: [
    'Your highest-priority fault so home reps target the right thing',
    'Positions that are checkable without a ball',
    'Tempo and sequencing from your video',
  ],
  drills: [
    { name: 'Mirror transition reps', how: 'In a mirror, rehearse the move from the top down to impact at quarter speed, pausing to check your position. 10 slow reps.' },
    { name: 'Towel tempo swings', how: 'Swing a folded towel to feel a smooth, lag-preserving tempo without needing a ball or club speed. 15 swings.' },
    { name: 'Hallway gate putting', how: 'Putt through a gate of two objects toward a target to train start line and touch. 5 minutes.' },
  ],
  mistakesToAvoid: [
    'Trying full-speed swings in a tight space (safety and bad habits).',
    'Random reps with no checkpoint or feedback.',
    'Practicing many faults at once instead of one priority.',
    'Skipping the weekly retest, so you never know if it worked.',
  ],
  whenToWorkWithCoach:
    'If you are unsure which position to train, or your at-home reps are not transferring to the course, a short lesson to confirm your priority makes home practice far more effective.',
  faqs: [
    { question: 'Can I really improve without hitting balls?', answer: 'Yes. Slow-motion and mirror work build the motor pattern; short-game touch work transfers directly. Pair it with occasional range or course time to confirm.' },
    { question: 'How much space do I need?', answer: 'Enough to make a slow rehearsal swing safely — often a garage, basement, or backyard. Putting needs only a flat hallway.' },
  ],
  relatedLinks: [
    { label: 'At-home drill generator', href: '/tools/at-home-swing-drill-generator' },
    { label: 'Practice plan generator', href: '/tools/practice-plan-generator' },
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
  ],
  cta: { label: 'Build My Home Practice Plan', href: '/tools/practice-plan-generator' },
  schemaType: 'HowTo',
  safetyNotes:
    'Keep full-speed swings outdoors or in clearly safe spaces. Check your surroundings before any swing. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const SOFTBALL_SLOW_PITCH_POWER: SeoPage = {
  slug: 'softball/slow-pitch-power',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'slow pitch softball power',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Hit for More Power in Slow-Pitch Softball',
  metaDescription:
    'Slow-pitch power comes from matching the high arc with an upward, on-time bat path and full hip rotation — not from swinging harder. Here is how to build it safely.',
  directAnswer:
    'Power in slow-pitch softball comes from timing the descending ball with a slightly upward bat path and rotating your hips fully through contact. Because the pitch arcs down, a level-to-up swing matched to the drop produces backspin and carry — swinging harder without good timing just produces pop-ups.',
  problemExplanation: [
    'The high arc means the ball is dropping at contact, so a flat or downward swing tends to top the ball. A slightly upward path that matches the descent launches it with carry.',
    'Most lost power is timing and sequence, not strength: hips that fire late or a swing that starts with the arms leaks energy before the bat reaches the ball.',
  ],
  diagnosisSteps: [
    'Watch your ball flight: frequent pop-ups suggest a downward path into a dropping ball.',
    'Check your weight: are you rotating onto a firm front side, or drifting forward?',
    'Note your timing: are you early (rolling over) or late (weak opposite-field contact)?',
    'Film from the side to see your bat path relative to the incoming arc.',
  ],
  whatSwingVantageLooksFor: [
    'Bat path angle relative to the descending pitch',
    'Hip rotation and sequencing (hips before hands)',
    'Contact point depth and timing',
    'Weight transfer onto a firm front side',
  ],
  drills: [
    { name: 'Tee at contact height', how: 'Set a tee at your ideal contact point and groove a slightly upward path that drives the ball on a line. 15 swings.' },
    { name: 'Hip-lead rotation drill', how: 'Slow swings feeling the hips start the turn before the hands. Pause at contact to check sequence. 10 reps.' },
    { name: 'Step-and-load timing', how: 'Soft-toss timed to a count so you load and fire on time against a dropping ball. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Swinging down or chopping at a dropping ball.',
    'Starting the swing with the arms instead of the hips.',
    'Drifting forward and losing the firm front side.',
    'Equating "swing harder" with "more power."',
  ],
  whenToWorkWithCoach:
    'If pop-ups persist after path and timing work, or you want your sequence checked, a hitting coach can confirm whether the issue is path, timing, or sequence.',
  faqs: [
    { question: 'Should I uppercut in slow-pitch?', answer: 'A slight upward path that matches the ball’s descent is ideal — not an exaggerated uppercut, which causes mishits.' },
    { question: 'Is power mostly strength?', answer: 'Strength helps, but timing, sequence, and path matter more for most players. Fix those first.' },
  ],
  relatedLinks: [
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Softball swing analysis', href: '/softball-swing-analysis' },
    { label: 'Slow-pitch line-drive guide', href: '/tools/slow-pitch-line-drive-guide' },
  ],
  cta: { label: 'Analyze My Softball Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up before full-speed swings. Youth players should practice with adult supervision and an age-appropriate bat.',
  publishStatus: 'published',
};

const SOFTBALL_LINE_DRIVES: SeoPage = {
  slug: 'softball/how-to-hit-line-drives',
  sport: 'softball',
  audience: 'player',
  keyword: 'how to hit line drives softball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Hit Line Drives in Softball',
  metaDescription:
    'Line drives come from a bat path that matches the pitch, contact slightly out front, and a level-to-slightly-up swing. Here is the checkpoint and drills to groove it.',
  directAnswer:
    'Line drives come from meeting the ball with a bat path that matches the pitch plane and making contact slightly out in front with a level-to-slightly-upward swing. The key checkpoint is staying through the ball — driving the bat toward the pitcher at contact rather than rolling over or chopping down.',
  problemExplanation: [
    'Ground balls usually mean rolling over (top hand turning too early) or a steep downward path. Pop-ups usually mean swinging under the ball or dropping the back shoulder too much.',
    'The line-drive zone is a narrow window of bat path and contact timing — small, consistent adjustments matter more than big swing changes.',
  ],
  diagnosisSteps: [
    'Chart your contact: mostly grounders (rolling over) or pop-ups (under the ball)?',
    'Check contact point: are you meeting the ball out front or deep?',
    'Look at your top-hand release through contact.',
    'Film from the side to see bat path versus pitch plane.',
  ],
  whatSwingVantageLooksFor: [
    'Bat path relative to the pitch',
    'Contact depth (out front vs. deep)',
    'Top-hand timing and roll-over',
    'Level-to-slightly-up attack angle',
  ],
  drills: [
    { name: 'High-tee line drill', how: 'Set a tee at belt height and drive line drives into a net; reward flat, hard contact. 15 swings.' },
    { name: 'Stay-through cue', how: 'Soft toss focusing on driving the knob and bat toward the pitcher at contact, delaying the top-hand roll. 2 sets of 10.' },
    { name: 'Two-ball spacing', how: 'Place two balls on a line; try to drive the front ball into the back one to feel a path that stays through. 10 reps.' },
  ],
  mistakesToAvoid: [
    'Rolling the top hand over too early (grounders).',
    'Dropping the back shoulder and swinging under (pop-ups).',
    'Contacting the ball too deep in the stance.',
    'Trying to lift the ball instead of driving through it.',
  ],
  whenToWorkWithCoach:
    'If your contact pattern stays stuck on grounders or pop-ups after focused work, a coach can quickly diagnose whether it is path, timing, or hand action.',
  faqs: [
    { question: 'Why do I keep hitting grounders?', answer: 'Usually an early top-hand roll-over or a downward path. Work the stay-through cue and check your contact point.' },
    { question: 'Where should I make contact?', answer: 'Generally slightly out in front of your lead hip for most pitches, so the bat is squaring up as it reaches the ball.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch power', href: '/softball/slow-pitch-power' },
    { label: 'Softball swing analysis', href: '/softball-swing-analysis' },
    { label: 'Slow-pitch line-drive guide', href: '/tools/slow-pitch-line-drive-guide' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up first. Youth players should practice with adult supervision and an age-appropriate bat.',
  publishStatus: 'published',
};

const BASEBALL_YOUTH_HITTING: SeoPage = {
  slug: 'baseball/youth-hitting',
  sport: 'baseball',
  audience: 'parent',
  keyword: 'youth baseball hitting',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Youth Baseball Hitting: A Parent-Friendly Guide',
  metaDescription:
    'Help your young hitter build a simple, safe, repeatable swing: balanced setup, short load, level path, and contact out front. Beginner drills and what to avoid.',
  directAnswer:
    'For young hitters, keep it simple: a balanced stance, a small controlled load, a short level-to-slightly-up path, and contact out front. Most youth hitting problems come from doing too much, too fast — fewer, cleaner reps beat hard swinging every time.',
  problemExplanation: [
    'Young athletes are still developing coordination, so big mechanical overhauls rarely stick. Simple cues and consistent, low-pressure reps build confidence and a repeatable swing.',
    'Pop-ups and weak grounders are usually timing and path issues, not strength. Keep the swing athletic and let power come with growth.',
  ],
  diagnosisSteps: [
    'Is the stance balanced and comfortable, not too wide?',
    'Is the load small and controlled, or big and late?',
    'Is the bat path level to slightly up, or chopping down/under?',
    'Is contact happening out front, or deep and jammed?',
  ],
  whatSwingVantageLooksFor: [
    'Balance and posture through the swing',
    'Simple, on-time load and stride',
    'Level-to-slightly-up bat path',
    'Contact point and timing',
  ],
  drills: [
    { name: 'Tee work for path', how: 'Lots of tee reps grooving a level path and solid contact. Quality over quantity — 2 sets of 10 with a reset between.' },
    { name: 'Soft toss for timing', how: 'A parent tosses underhand from the side; the hitter focuses on a small load and on-time contact. 2 sets of 10.' },
    { name: 'Balance hold', how: 'After each swing, hold the finish for two seconds to build balance and control.' },
  ],
  mistakesToAvoid: [
    'Overloading a young hitter with too many cues at once.',
    'Encouraging max-effort swinging over balanced contact.',
    'Using a bat that is too heavy or too long.',
    'Turning practice into pressure — keep it fun.',
  ],
  whenToWorkWithCoach:
    'A youth hitting coach is helpful for confirming bat fit, keeping cues age-appropriate, and ensuring practice stays positive. SwingVantage is a between-session tool, not a replacement for coaching or for a parent’s judgment.',
  faqs: [
    { question: 'What bat size for my child?', answer: 'Fit matters more than power. A bat the child can control through the zone with good balance is right — when in doubt, go lighter and get fitted.' },
    { question: 'How often should a young player practice?', answer: 'Short, frequent, fun sessions beat long ones. Watch for fatigue and keep it positive.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'SwingVantage for parents', href: '/parents' },
    { label: 'At-home drill generator', href: '/tools/at-home-swing-drill-generator' },
  ],
  cta: { label: 'See How SwingVantage Helps Parents', href: '/parents' },
  schemaType: 'Article',
  safetyNotes:
    'This guidance is for youth athletes practicing with parent or guardian supervision. Use age-appropriate equipment, warm up, and stop if anything hurts. SwingVantage does not make youth data public by default.',
  publishStatus: 'published',
};

const TENNIS_FOREHAND: SeoPage = {
  slug: 'tennis/forehand-analysis',
  sport: 'tennis',
  audience: 'player',
  keyword: 'tennis forehand analysis',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Tennis Forehand Analysis: Fix the Most Common Faults',
  metaDescription:
    'A reliable forehand comes from a unit turn, a relaxed low-to-high swing path, and contact out front. Diagnose your fault and groove it with simple drills.',
  directAnswer:
    'A consistent forehand depends on three things: an early unit turn (shoulders and hips together), a relaxed low-to-high swing path that creates topspin, and contact comfortably out in front. Most errors — spraying long, netting, or late contact — trace back to a late turn or hitting too close to the body.',
  problemExplanation: [
    'When the turn is late, everything else rushes, and the swing becomes all arm. A full early turn lets the legs and core drive the racket, adding both control and power.',
    'Topspin from a low-to-high path is what lets you swing freely and still keep the ball in. Flat, tense swings have a much smaller margin.',
  ],
  diagnosisSteps: [
    'Are your shoulders turned before the ball bounces on your side?',
    'Is your swing relaxed and low-to-high, or tense and flat?',
    'Is contact out in front, or even with/behind your body?',
    'Film from behind to see your turn, path, and contact point.',
  ],
  whatSwingVantageLooksFor: [
    'Timing and completeness of the unit turn',
    'Low-to-high swing path and topspin generation',
    'Contact point relative to the body',
    'Tempo and relaxation through the stroke',
  ],
  drills: [
    { name: 'Early turn shadow swings', how: 'Without a ball, turn fully as soon as you imagine the ball coming, then swing low-to-high. 10 reps each side of the split-step.' },
    { name: 'Drop-feed topspin', how: 'Drop a ball and brush up the back of it to feel low-to-high topspin, contacting out front. 2 sets of 10.' },
    { name: 'Contact-point catch', how: 'Catch a soft feed at your ideal contact point (out front) to train spacing and timing. 10 reps.' },
  ],
  mistakesToAvoid: [
    'Turning late and swinging with only the arm.',
    'A flat, tense swing with no topspin margin.',
    'Letting the ball get too close or behind you.',
    'Gripping too tightly, which kills racket-head speed.',
  ],
  whenToWorkWithCoach:
    'A coach is valuable for grip and footwork details that are hard to self-diagnose, and for managing any wrist or shoulder discomfort. SwingVantage helps you practice the right priority between lessons.',
  faqs: [
    { question: 'Why does my forehand spray long?', answer: 'Often a flat, tense swing with too little topspin, or late contact. Add low-to-high brush and meet the ball further out front.' },
    { question: 'How important is the grip?', answer: 'Very — most modern forehands use a semi-western grip that supports topspin. A coach can confirm the right grip for your style.' },
  ],
  relatedLinks: [
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'At-home drill generator', href: '/tools/at-home-swing-drill-generator' },
    { label: 'Multi-sport swing quiz', href: '/tools/swing-mistake-quiz' },
  ],
  cta: { label: 'Analyze My Forehand Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up your shoulder and wrist. Stop if you feel joint pain. Junior players should practice with adult supervision.',
  publishStatus: 'published',
};

const FREE_SWING_ANALYSIS: SeoPage = {
  slug: 'free-swing-analysis',
  sport: 'multi',
  audience: 'player',
  keyword: 'free swing analysis',
  intent: 'transactional',
  funnelStage: 'conversion',
  priority: 1,
  title: 'Free Swing Analysis for Golf, Tennis, Baseball & Softball',
  metaDescription:
    'Get a free AI swing analysis — upload a video or import data and receive your top issue, beginner-safe drills, and a practice plan. No account, no credit card.',
  directAnswer:
    'SwingVantage gives you a genuinely free swing analysis for golf, tennis, baseball, and softball. Upload a swing video or import launch monitor data and you get your single highest-priority issue, three beginner-safe drills, and a simple practice plan — with no account, no credit card, and your data private by default.',
  problemExplanation: [
    'Most "free" analysis tools are demos that gate the useful part behind a paywall, or they bury you in numbers without telling you what to fix first. SwingVantage leads with one priority and a plan.',
    'Because SwingVantage keeps your full swing video on your device and your data private by default, you can try it with confidence before deciding to save anything. When you choose AI video analysis, only a few selected still frames are sent for review — never your whole video.',
  ],
  diagnosisSteps: [
    'Pick your sport.',
    'Upload a clear side-on or face-on video, or import your launch monitor data.',
    'Review your top priority issue and the evidence behind it.',
    'Follow the three drills and the practice plan, then retest.',
  ],
  whatSwingVantageLooksFor: [
    'Your highest-priority fault across sport-specific checkpoints',
    'Evidence and severity, not just a label',
    'Drills tied to your specific issue',
    'A realistic practice plan and retest point',
  ],
  drills: [
    { name: 'Start with one priority', how: 'Work only your top issue for a week before adding anything else.' },
    { name: 'Retest on a schedule', how: 'Re-record or re-import after your plan to confirm progress.' },
    { name: 'Keep videos consistent', how: 'Film from the same angle and distance so comparisons are fair.' },
  ],
  mistakesToAvoid: [
    'Trying to fix everything at once.',
    'Filming from inconsistent angles.',
    'Skipping the retest, so you never measure progress.',
    'Comparing yourself to pros instead of your own baseline.',
  ],
  whenToWorkWithCoach:
    'SwingVantage is built to make your practice and your coaching more effective — not to replace a coach. For injury concerns or advanced technique work, bring your SwingVantage priority to a qualified coach.',
  faqs: [
    { question: 'Is it really free?', answer: 'Yes. The core analysis, drills, and practice plan are free, with no account or credit card required.' },
    { question: 'Do you keep my video?', answer: 'Your full swing video stays on your device — analysis runs in your browser and only optional still frames are ever sent for AI review. Your data is private to you and never shared publicly.' },
    { question: 'Which sports are supported?', answer: 'Golf, tennis, baseball, slow-pitch softball, and fast-pitch softball — each with its own diagnostic engine.' },
  ],
  relatedLinks: [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Trust & safety', href: '/trust' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'FAQPage',
  safetyNotes:
    'Drills suggested in your analysis are beginner-safe. Youth athletes should use SwingVantage with a parent or guardian. SwingVantage does not make youth data public by default.',
  publishStatus: 'published',
};

const GOLF_HIGH_HANDICAP: SeoPage = {
  slug: 'golf/high-handicap-swing-analysis',
  sport: 'golf', audience: 'player', keyword: 'high handicap swing analysis', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'High-Handicap Swing Analysis: Where to Actually Start',
  metaDescription:
    'High handicappers improve fastest by fixing contact and the big miss first — not by chasing tour positions. Here is how to diagnose your one priority and a plan.',
  directAnswer:
    'If you are a high-handicap golfer, the fastest way to lower scores is to fix solid contact and your one big miss first — not to copy tour swing positions. Most strokes are lost to mishits and one repeatable curve, so prioritize center-face contact and taming your worst shot before fine-tuning anything else.',
  problemExplanation: [
    'High handicappers often try to fix everything at once and end up grooving nothing. Scores live and die on contact quality and how bad the bad shots are.',
    'A single repeatable miss (usually a slice) plus frequent fat/thin contact accounts for most lost strokes. Fix those two things and the score drops before any "perfect" positions matter.',
  ],
  diagnosisSteps: [
    'Track a round: how many shots are mishits (fat, thin, off the toe/heel)?',
    'Identify your one big miss — the shot that costs you penalties or do-overs.',
    'Check setup basics: grip, alignment, ball position, posture.',
    'Film one swing face-on and one down-the-line to see contact and path.',
  ],
  whatSwingVantageLooksFor: [
    'Strike quality and centeredness of contact',
    'Your single highest-priority fault (not a list of 20)',
    'The dominant miss pattern and its likely cause',
    'Setup issues visible in your video',
  ],
  drills: [
    { name: 'Center-strike spray test', how: 'Spray foot powder on the face, hit five balls, and work toward centered contact before anything else. 2 sets.' },
    { name: 'Tee-in-front low-point drill', how: 'Place a tee a few inches ahead of the ball and try to clip it after the ball to groove a forward low point. 15 reps.' },
    { name: 'Half-swing alignment reps', how: 'Make half swings with an alignment stick to fix the start line and groove a repeatable path. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to copy tour-player positions before you make solid contact.',
    'Working on five faults in one session.',
    'Ignoring setup (grip/alignment) because it feels boring.',
    'Buying new clubs to fix a contact or path problem.',
  ],
  whenToWorkWithCoach:
    'A coach is hugely valuable early — a few lessons on setup and your one priority will save you months of guessing. SwingVantage helps you arrive knowing your priority and practice it between lessons.',
  faqs: [
    { question: 'What should a high handicapper fix first?', answer: 'Solid contact and your one big miss. Those two account for most lost strokes; positions can wait.' },
    { question: 'Do I need lessons or just practice?', answer: 'Both help. A few lessons on the basics plus focused, single-priority practice between them is the fastest combination.' },
  ],
  relatedLinks: [
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
    { label: 'Stop topping the ball', href: '/golf/stop-topping-the-ball' },
    { label: 'Practice plan generator', href: '/tools/practice-plan-generator' },
  ],
  cta: { label: 'Find My #1 Priority Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Low-intensity drills suitable for most adult golfers. Warm up and stop if anything hurts. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_STOP_TOPPING: SeoPage = {
  slug: 'golf/stop-topping-the-ball',
  sport: 'golf', audience: 'player', keyword: 'how to stop topping the golf ball', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'How to Stop Topping the Golf Ball',
  metaDescription:
    'Topping the ball comes from your low point being behind the ball or your body rising through impact. Here is how to diagnose it and three drills to fix it.',
  directAnswer:
    'You top the ball when the club is still moving upward, or bottoming out behind the ball, at impact — usually from hanging back on your trail foot or standing up (early extension) through the downswing. The fix is to move your low point forward by shifting weight to your lead side and keeping your chest down through impact.',
  problemExplanation: [
    'A topped shot means the leading edge catches the top half of the ball. That happens when the swing\'s low point is behind the ball or the body lifts before contact.',
    'The two usual culprits are weight hanging on the trail foot and early extension (hips and chest rising), both of which raise the club at the worst moment.',
  ],
  diagnosisSteps: [
    'Check your finish: are you balanced on your lead foot, or falling back?',
    'Film down-the-line: do your hips and chest rise (stand up) before impact?',
    'Look at your divots — no divot or one behind the ball points to a back low point.',
    'Notice if it happens more with longer clubs (often a weight-shift issue).',
  ],
  whatSwingVantageLooksFor: [
    'Low-point location relative to the ball',
    'Weight transfer to the lead side through impact',
    'Early extension (loss of posture) in the downswing',
    'Chest and head movement through the strike',
  ],
  drills: [
    { name: 'Lead-side bump drill', how: 'Rehearse shifting pressure to your lead foot as you start down, finishing balanced on the lead side. 15 slow reps.' },
    { name: 'Towel-in-front drill', how: 'Place a towel a few inches ahead of the ball; try to brush it after the ball to move your low point forward. 2 sets of 10.' },
    { name: 'Chest-down cue', how: 'Make half swings keeping your chest pointing down at the ball slightly longer through impact to stop standing up. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to "lift" the ball — that raises your low point and makes topping worse.',
    'Hanging back on your trail foot through impact.',
    'Standing up (losing posture) to make room for your arms.',
    'Swinging harder, which exaggerates the rise.',
  ],
  whenToWorkWithCoach:
    'If topping persists after weight-shift and posture work, a coach can quickly spot whether it is sequence, posture, or setup — and keep you from grooving a compensation.',
  faqs: [
    { question: 'Why do I top the ball with my driver but not irons?', answer: 'With a teed driver you can get away with hanging back, but a thin/topped strike still shows up. With irons the back low point catches the top of the ball. Both trace to low-point control.' },
    { question: 'Is topping a posture problem?', answer: 'Often, yes — early extension (standing up) is a leading cause. Keeping your chest down and shifting forward usually helps a lot.' },
  ],
  relatedLinks: [
    { label: 'High-handicap swing analysis', href: '/golf/high-handicap-swing-analysis' },
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
    { label: 'Practice golf at home', href: '/golf/practice-at-home' },
  ],
  cta: { label: 'Analyze My Contact Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Low-intensity drills suitable for most adult golfers. Warm up and stop if anything hurts. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const SOFTBALL_STOP_POPUP: SeoPage = {
  slug: 'softball/stop-popping-up',
  sport: 'softball', discipline: 'slow_pitch', audience: 'player', keyword: 'stop popping up softball', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'How to Stop Popping Up in Softball',
  metaDescription:
    'Pop-ups come from swinging under the ball — dropping the back shoulder or chopping at a dropping pitch. Here is how to level your path and drive line drives.',
  directAnswer:
    'You pop the ball up when your bat path goes under it, usually from dropping your back shoulder too much or chopping down at a ball that is already descending. The fix is to level your swing to match the pitch and stay through the middle of the ball instead of swinging up and under it.',
  problemExplanation: [
    'A pop-up means the bat contacts the bottom half of the ball with an upward, glancing path. In slow-pitch especially, the ball is dropping, so an exaggerated uppercut sends it straight up.',
    'The common causes are a dropped back shoulder, lunging, or trying to lift the ball — all of which steepen the path under the ball.',
  ],
  diagnosisSteps: [
    'Chart your outs: mostly pop-ups, or a mix?',
    'Check your back shoulder — is it dipping low in the load?',
    'Are you trying to lift or "launch" the ball on purpose?',
    'Film from the side to see your bat path versus the pitch.',
  ],
  whatSwingVantageLooksFor: [
    'Bat path relative to the incoming pitch',
    'Back-shoulder height and posture through the swing',
    'Contact point on the ball (under vs. through the middle)',
    'Lunging or drifting that drops the barrel',
  ],
  drills: [
    { name: 'Belt-high tee drill', how: 'Set a tee at belt height and drive line drives into a net with a level path. Reward flat, hard contact. 3 sets of 10.' },
    { name: 'Level-shoulder cue', how: 'Make slow swings keeping your shoulders relatively level through the turn so the barrel stays in the zone longer. 2 sets of 10.' },
    { name: 'Stay-through soft toss', how: 'Soft toss focusing on driving through the middle of the ball toward the pitcher, not lifting it. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Dropping the back shoulder to "get under" the ball.',
    'Trying to lift or launch the ball on purpose.',
    'Lunging forward, which drops the barrel under the ball.',
    'Swinging up at a dropping pitch in slow-pitch.',
  ],
  whenToWorkWithCoach:
    'If pop-ups continue after leveling your path, a hitting coach can confirm whether it is shoulder tilt, timing, or posture and adjust your cue.',
  faqs: [
    { question: 'Why do I keep popping up?', answer: 'Almost always because the bat is traveling under the ball — usually a dropped back shoulder or trying to lift it. Level the path and stay through the middle.' },
    { question: 'Should my swing be level or slightly up?', answer: 'Match the pitch. In slow-pitch a slightly upward path matched to the drop works; an exaggerated uppercut causes pop-ups.' },
  ],
  relatedLinks: [
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Slow-pitch power', href: '/softball/slow-pitch-power' },
    { label: 'Slow-pitch line-drive guide', href: '/tools/slow-pitch-line-drive-guide' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up first and use an age-appropriate bat. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const TENNIS_BACKHAND: SeoPage = {
  slug: 'tennis/backhand-basics',
  sport: 'tennis', audience: 'player', keyword: 'tennis backhand basics', intent: 'informational',
  funnelStage: 'awareness', priority: 4,
  title: 'Tennis Backhand Basics: Build a Reliable Stroke',
  metaDescription:
    'A reliable backhand starts with an early turn, a stable base, and a low-to-high path. Here is how to diagnose your backhand and three drills to groove it.',
  directAnswer:
    'A reliable backhand — one-handed or two-handed — comes from turning early, setting a stable base, and swinging low-to-high to contact out in front. Most backhand errors come from a late turn, a cramped contact point too close to the body, or no leg drive.',
  problemExplanation: [
    'The backhand has less margin than the forehand for many players, so preparation matters even more. An early shoulder turn buys time and lets the legs and core power the stroke.',
    'Contact too close to the body or behind it kills both control and power. A low-to-high path adds the topspin that keeps the ball in.',
  ],
  diagnosisSteps: [
    'Do you turn your shoulders as soon as you read the ball to your backhand side?',
    'Is your base stable, or are you reaching and off-balance?',
    'Is contact out in front, or cramped near your body?',
    'Film from behind to see turn, spacing, and path.',
  ],
  whatSwingVantageLooksFor: [
    'Timing of the shoulder turn / preparation',
    'Contact point relative to the body',
    'Low-to-high path and topspin',
    'Balance and leg drive through the stroke',
  ],
  drills: [
    { name: 'Early turn shadow swings', how: 'Without a ball, turn your shoulders fully on the backhand side and swing low-to-high. 10 reps.' },
    { name: 'Spacing footwork drill', how: 'Practice the small adjustment steps that set contact out in front, not cramped. 2 sets of 8.' },
    { name: 'Drop-feed topspin', how: 'Drop a ball and brush up the back of it to feel low-to-high topspin on the backhand. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Turning late and reaching for the ball.',
    'Letting the ball get too close to your body.',
    'A flat, armsy swing with no leg drive.',
    'Gripping too tightly and decelerating at contact.',
  ],
  whenToWorkWithCoach:
    'A coach can confirm whether a one- or two-handed backhand suits you and fix grip/footwork details that are hard to self-diagnose. SwingVantage helps you groove the right priority between lessons.',
  faqs: [
    { question: 'One-handed or two-handed backhand?', answer: 'Both work — two-handed is often easier to control for beginners. A coach can help you choose based on your strength and style.' },
    { question: 'Why is my backhand weaker than my forehand?', answer: 'Usually less preparation and leg drive. Turn earlier, set a stable base, and drive low-to-high.' },
  ],
  relatedLinks: [
    { label: 'Tennis forehand analysis', href: '/tennis/forehand-analysis' },
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'At-home drill generator', href: '/tools/at-home-swing-drill-generator' },
  ],
  cta: { label: 'Analyze My Backhand Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up your shoulder and wrist. Stop if you feel joint pain. Junior players should practice with adult supervision.',
  publishStatus: 'published',
};

const BASEBALL_EXIT_VELO: SeoPage = {
  slug: 'baseball/exit-velocity-drills', sport: 'baseball', audience: 'player', keyword: 'baseball exit velocity drills', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'Baseball Exit Velocity: Drills to Hit the Ball Harder',
  metaDescription:
    'Exit velocity comes from sequence and centered contact, not just strength. Here is how to diagnose what is leaking power and three drills to hit the ball harder.',
  directAnswer:
    'Higher exit velocity comes from an efficient sequence — hips leading the hands — and squaring the ball up on the barrel, not just from raw strength. Most hitters leak power by starting the swing with their arms or making off-center contact; fixing sequence and barrel accuracy raises exit velocity fast.',
  problemExplanation: [
    'Exit velocity is bat speed plus quality of contact. You can swing hard and still hit the ball softly if the sequence leaks energy or contact is off the sweet spot.',
    'The most common power leak is the hands and arms firing before the lower body, which wastes the energy the legs and hips create.',
  ],
  diagnosisSteps: [
    'Do your hips start the swing before your hands, or do the arms go first?',
    'Are you squaring the ball on the barrel, or hitting it off the end/handle?',
    'Is your contact point out in front where the bat is at full speed?',
    'Film from the side to see sequence and contact.',
  ],
  whatSwingVantageLooksFor: [
    'Kinematic sequence (hips → torso → hands)',
    'Barrel accuracy and centered contact',
    'Contact point depth and timing',
    'Connection between the upper and lower body',
  ],
  drills: [
    { name: 'Hip-lead rotation drill', how: 'Slow swings feeling the hips start the turn before the hands; pause at contact to check the sequence. 2 sets of 10.' },
    { name: 'Connection ball drill', how: 'Hold a ball/glove between your lead arm and chest through the turn to keep the swing connected and powerful. 2 sets of 10.' },
    { name: 'Barrel-accuracy tee work', how: 'Hit off a tee focusing on flush, centered contact (not max effort). Reward the hardest, flushest hits. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Starting the swing with the arms instead of the lower body.',
    'Swinging max-effort at the cost of centered contact.',
    'Casting / disconnecting the lead arm from the body.',
    'Chasing exit-velo numbers with poor mechanics.',
  ],
  whenToWorkWithCoach:
    'A hitting coach can confirm your sequence and barrel path and build a strength/mechanics plan. SwingVantage helps you target the right priority between sessions.',
  faqs: [
    { question: 'Is exit velocity just strength?', answer: 'No. Strength helps, but sequence and centered contact matter more for most hitters. Fix those first, then build strength.' },
    { question: 'How do I measure exit velocity?', answer: 'A radar or hitting sensor measures it, but you can improve the inputs (sequence, contact) without one — and confirm with video.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Youth baseball hitting', href: '/baseball/youth-hitting' },
    { label: 'Practice plan generator', href: '/tools/practice-plan-generator' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_STOP_OVER_THE_TOP: SeoPage = {
  slug: 'golf/stop-coming-over-the-top',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to stop coming over the top',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Stop Coming Over the Top (Beginner-Safe Guide)',
  metaDescription:
    'Coming over the top means the club swings out and across the ball from the top of the backswing — the root cause behind most slices and pulls. Here is how to diagnose it, three drills to fix it, and a practice plan.',
  directAnswer:
    'Coming over the top is when your downswing starts with your shoulders and arms throwing the club up and outward, so it drops onto an out-to-in path that cuts across the ball. You fix it by starting the downswing from the ground up — let your weight shift and hips lead while your trail elbow drops in front of your hip — so the club falls onto an inside path instead of being thrown over it.',
  problemExplanation: [
    'The "top" in "over the top" is the top of your backswing. From there, the club should drop slightly down and to the inside before it swings out to the ball. When you come over the top, the first move is your upper body spinning and your arms casting the club outward, so it approaches from outside the target line and swings left through impact.',
    'That out-to-in path is the engine behind the two most common amateur misses: a slice (face open to that path) and a pull (face square to it). Because the path itself is the problem, chasing the face alone — grip tweaks, aiming further left — usually makes it worse.',
    'The usual causes are a sequence problem (everything fires at once from the top instead of bottom-up), a backswing that gets steep or stuck, and tension that makes you "hit from the top" rather than let the club drop.',
  ],
  diagnosisSteps: [
    'Watch your ball flight: a shot that starts left of target (for a right-handed golfer) is the calling card of an out-to-in path.',
    'Check your divots — divots pointing left of the target line indicate the club is travelling out-to-in.',
    'Film one swing down-the-line. Pause at the top, then at the first move down: are your hands and the club moving out toward the ball, or dropping down and behind?',
    'Feel your first move from the top. If your chest and shoulders spin open before your weight shifts to your lead foot, you are coming over the top.',
  ],
  whatSwingVantageLooksFor: [
    'The direction and steepness of the club path through impact',
    'Whether the downswing sequences from the ground up or from the upper body',
    'Early extension or a steep "throw" from the top',
    'The face-to-path relationship that turns the same path into a slice or a pull',
  ],
  drills: [
    {
      name: 'Pump-and-drop rehearsal',
      how: 'Swing to the top, then slowly "pump" the club halfway down twice, feeling your trail elbow drop in front of your trail hip while your hands stay back. On the third rep, swing through at half speed. This grooves the bottom-up drop instead of the over-the-top throw.',
    },
    {
      name: 'Headcover-outside-the-ball drill',
      how: 'Set a headcover a few inches outside and just behind the ball. Make swings that miss the headcover on the way down — hard if you come over the top, natural when you drop the club to the inside.',
    },
    {
      name: 'Step-through drill',
      how: 'Start with your feet together. As you start the downswing, step your lead foot toward the target, then swing. The step forces your weight and lower body to lead, so the club can no longer fire from the top.',
    },
  ],
  mistakesToAvoid: [
    'Aiming further left to cover the leftward start — it reinforces the out-to-in path.',
    'Trying to fix the face (grip, hands) without changing the sequence and path first.',
    'Swinging hard before the bottom-up feel is grooved — speed brings the old pattern straight back.',
    'Yanking the club steeply inside on the backswing, which often causes an over-the-top recovery coming down.',
  ],
  whenToWorkWithCoach:
    'If the over-the-top move persists after a week or two of sequencing work, if you feel any strain in your lower back or lead shoulder, or if your videos do not clearly show whether the issue is sequence or backswing shape, a qualified coach can pinpoint the cause quickly and stop you from grooving a compensation.',
  faqs: [
    {
      question: 'Is coming over the top the same as slicing?',
      answer:
        'Not exactly — coming over the top is the out-to-in path that causes the slice. The same path with a square face produces a pull instead. Fixing the over-the-top move addresses both misses at the source.',
    },
    {
      question: 'What is the number one cause of coming over the top?',
      answer:
        'For most amateurs it is sequence: the upper body and arms start the downswing instead of the lower body. Letting your weight shift and hips lead, with the trail elbow dropping, is the core fix.',
    },
    {
      question: 'How long does it take to stop coming over the top?',
      answer:
        'Most golfers see the path shallow out within one to two weeks of slow, sequence-first reps. Grooving it at full speed takes longer, but ball flight usually improves quickly once the first move changes.',
    },
  ],
  relatedLinks: [
    { label: 'How to fix a golf slice', href: '/golf/fix-slice' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Golf benchmarks by skill level', href: '/benchmarks/golf' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'These drills are low-intensity and suitable for most adult golfers. Stop if you feel pain. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const BASEBALL_STOP_ROLLING_OVER: SeoPage = {
  slug: 'baseball/stop-rolling-over',
  sport: 'baseball',
  audience: 'player',
  keyword: 'how to stop rolling over in baseball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Stop Rolling Over (Weak Ground Balls) in Baseball',
  metaDescription:
    'Rolling over is when your top hand turns the barrel over too early, producing weak ground balls to the pull side. Here is how to diagnose it, three drills to fix it, and a practice plan.',
  directAnswer:
    'You roll over when your wrists turn the barrel over before or at contact, so the bat face closes and you catch the top of the ball — usually a weak grounder to the pull side. The fix is to stay through the ball with a palm-up, palm-down hand position at contact and let the wrists release naturally AFTER the ball is gone, driven by a proper sequence rather than an early flip of the top hand.',
  problemExplanation: [
    'Rolling over is a contact-point and sequence problem, not just a "wrist" problem. When the hips and torso stall and the arms take over, the top hand rolls the barrel closed early. The face is shut at contact, so even a solid-feeling swing produces a topspin ground ball, often pulled.',
    'It is frequently confused with "rolling your wrists," but the wrists are usually the symptom. The real causes are casting (the barrel leaving its path early), a swing that gets long and around the ball, and stalling the lower half so the hands have to rescue the swing.',
    'The goal is not to freeze your wrists — it is to keep the barrel in the hitting zone longer and let the natural release happen past contact, where it adds bat speed instead of closing the face early.',
  ],
  diagnosisSteps: [
    'Look at your results: weak ground balls pulled to the side (third base for a righty, first base for a lefty) are the classic rolling-over pattern.',
    'Film from the open side. Freeze at contact: is your top-hand palm already turning down, or still palm-up?',
    'Check your finish — a very wrappy, around-the-body finish often means the barrel left the zone early.',
    'Hit a few off a tee aimed up the middle. If you still pull weak grounders off a stationary ball, the issue is your path and release, not timing.',
  ],
  whatSwingVantageLooksFor: [
    'Barrel path and how long it stays in the hitting zone',
    'Contact point relative to your body (too deep often forces an early roll)',
    'Sequence: whether the lower half leads or the hands take over',
    'Whether the release happens at contact or after it',
  ],
  drills: [
    {
      name: 'Tee, palm-up checkpoint',
      how: 'Set a tee at belt height. Make slow swings and stop at contact to check that your top-hand palm faces up and your bottom-hand palm faces down. Groove the feeling of arriving at the ball before the wrists release.',
    },
    {
      name: 'Two-tee path drill',
      how: 'Place a second tee about a ball-width in front of the contact tee, toward the pitcher. Try to drive both — staying through to "hit" the front tee keeps the barrel in the zone and stops the early roll.',
    },
    {
      name: 'Opposite-field tee work',
      how: 'Move the tee back slightly and hit line drives the other way for a set of reps. Going the other way is nearly impossible if you roll over, so it trains staying through the ball and releasing late.',
    },
  ],
  mistakesToAvoid: [
    'Trying to consciously freeze or stiffen your wrists — it kills bat speed and does not fix the path.',
    'Setting the contact point too deep in the zone, which forces the barrel to close early.',
    'Swinging harder to "drive" the grounders — more speed with the same path just hits them harder into the ground.',
    'Only working off a tee at full speed before the staying-through feel is grooved.',
  ],
  whenToWorkWithCoach:
    'If you keep rolling over after a couple of weeks of tee and path work, if it only shows up against live pitching (a timing issue), or if you cannot tell from video whether it is path or sequence, a hitting coach can confirm the cause quickly and build a plan. SwingVantage helps you target the right priority between sessions.',
  faqs: [
    {
      question: 'What does "rolling over" mean in baseball?',
      answer:
        'It means your wrists turn the bat barrel over too early, closing the face at contact. The result is usually a weak ground ball pulled to the side. The wrists are typically the symptom of a path or sequence problem, not the root cause.',
    },
    {
      question: 'Why do I keep hitting weak ground balls?',
      answer:
        'Most weak grounders come from catching the top half of the ball — an early barrel roll or a steep, out-of-the-zone path. Staying through the ball and releasing after contact turns those into line drives.',
    },
    {
      question: 'Is rolling over a timing problem or a mechanics problem?',
      answer:
        'It can be either. If you roll over even off a tee, it is mechanics (path and release). If it only happens against live pitching, it is more likely timing — getting beat and rescuing the swing with your hands.',
    },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Baseball exit velocity drills', href: '/baseball/exit-velocity-drills' },
    { label: 'Baseball benchmarks by age', href: '/benchmarks/baseball' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_FIX_HOOK: SeoPage = {
  slug: 'golf/how-to-fix-a-hook',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to fix a hook',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Fix a Hook in Golf (Beginner-Safe Guide)',
  metaDescription:
    'A hook happens when the club face is closed relative to your swing path at impact, so the ball curves hard left. Here is how to diagnose it, three drills to fix it, and a practice plan.',
  directAnswer:
    'A hook is the mirror image of a slice: the club face is closed relative to your path at impact (for a right-handed golfer the ball starts right of target and curves hard left). You fix it by neutralizing an overly strong grip and calming overactive hands so the face stops closing too fast — and by checking that your path is not excessively in-to-out, which exaggerates the curve.',
  problemExplanation: [
    'The ball curves from the relationship between path and face. When the face points well left of your path at impact, the ball gets right-to-left side spin and hooks. A little draw is desirable; a hook is when it turns over too much and runs off the target.',
    'The most common causes are a grip that is too strong (hands rotated too far away from the target), hands that flip and close the face through impact, and a path that swings too far in-to-out so the face has further to rotate.',
    'Hooks often appear after a golfer over-corrects a slice. The cure is balance: a neutral grip and a face that squares with body rotation rather than a fast hand flip.',
  ],
  diagnosisSteps: [
    'Watch the start line: a hook usually starts right of target (for a right-handed golfer), then curves left.',
    'Check your grip — can you see three or more knuckles on your lead hand? That strong grip tends to shut the face.',
    'Film one swing down-the-line and watch the club face after impact: is the toe flipping past the heel quickly?',
    'Hit a few easy shots at 70%. If the hook shrinks, overactive hands and timing are involved.',
  ],
  whatSwingVantageLooksFor: [
    'Face-to-path relationship at impact (the real driver of the curve)',
    'How fast the face is rotating (closing) through impact',
    'Whether the path is excessively in-to-out',
    'Grip strength clues and release timing',
  ],
  drills: [
    {
      name: 'Neutral-grip checkpoint',
      how: 'Set your grip so you see about two knuckles on the lead hand and the trail palm faces the target. Hit slow wedges and confirm the ball flight straightens before adding speed.',
    },
    {
      name: 'Body-rotation release',
      how: 'Make half swings feeling your chest keep turning through impact while your hands stay quiet. Letting the body square the face — instead of a hand flip — tames the closing rate.',
    },
    {
      name: 'Gate path check',
      how: 'Place two tees just wider than the club head to form a gate on the target line. Swing through the gate so your path is closer to neutral, reducing the in-to-out exaggeration.',
    },
  ],
  mistakesToAvoid: [
    'Weakening the grip so much that you start slicing — aim for neutral, not the opposite extreme.',
    'Trying to hold the face open by stiffening the hands, which kills speed and consistency.',
    'Ignoring the path: a big in-to-out swing makes any face issue worse.',
    'Adding full speed before the new grip and release feel are grooved.',
  ],
  whenToWorkWithCoach:
    'If the hook persists after a week of grip and release work, if you cannot tell whether the cause is grip, hands, or path from your videos, or if you feel any wrist discomfort, a qualified coach can confirm the cause quickly and prevent a new compensation.',
  faqs: [
    {
      question: 'What is the difference between a hook and a draw?',
      answer:
        'Both curve right-to-left for a right-handed golfer, but a draw is a small, controlled curve that holds its line while a hook turns over too much and runs off target. The fix is to reduce how fast the face closes, not to eliminate the curve entirely.',
    },
    {
      question: 'Does a strong grip cause a hook?',
      answer:
        'Often, yes. A grip rotated too far from the target makes the face close more easily through impact. Moving to a neutral grip is usually the first and biggest fix.',
    },
    {
      question: 'Why did I start hooking after fixing my slice?',
      answer:
        'Slice fixes (stronger grip, more in-to-out path, more release) can overshoot into a hook. Dial each one back toward neutral until the ball flight straightens.',
    },
  ],
  relatedLinks: [
    { label: 'How to fix a golf slice', href: '/golf/fix-slice' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Golf benchmarks by skill level', href: '/benchmarks/golf' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'These drills are low-intensity and suitable for most adult golfers. Stop if you feel pain. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_STOP_FAT: SeoPage = {
  slug: 'golf/stop-hitting-it-fat',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to stop hitting it fat',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Stop Hitting It Fat (Chunked Irons) in Golf',
  metaDescription:
    'A fat shot happens when the club hits the ground before the ball, usually because your low point is behind the ball. Here is how to diagnose it, three drills, and a practice plan.',
  directAnswer:
    'You hit it fat when the lowest point of your swing arc falls behind the ball, so the club digs into the turf before contact and loses speed and distance. The fix is to move your low point forward — get your weight onto your lead side by impact and keep your chest turning through — so the club bottoms out just in front of the ball.',
  problemExplanation: [
    'With an iron, the club should still be descending at impact and bottom out a few inches in front of the ball, taking a divot after contact. A fat shot means the arc bottomed out too early, behind the ball.',
    'The usual causes are weight hanging on the trail foot at impact, early extension or a backward lean of the upper body, and casting the club so it releases too soon. All of them move the low point backward.',
    'The single biggest lever for most golfers is pressure shift: getting onto the lead foot through impact moves the bottom of the arc forward where it belongs.',
  ],
  diagnosisSteps: [
    'Look at your divots: no divot, or one that starts behind the ball, points to a low point that is too far back.',
    'Notice the pattern — fat shots that alternate with thin shots usually mean an unstable low point, not bad luck.',
    'Film face-on: at impact, is your weight still on your trail foot or has it shifted to your lead side?',
    'Do a step-and-hit rehearsal; if striking improves when your weight clearly moves forward, pressure shift is the issue.',
  ],
  whatSwingVantageLooksFor: [
    'Where the low point of the swing falls relative to the ball',
    'Weight/pressure shift to the lead side through impact',
    'Early extension or backward upper-body lean at impact',
    'Casting or early release that bottoms the club out too soon',
  ],
  drills: [
    {
      name: 'Lead-side pressure step',
      how: 'Start with feet together; as you start down, step your lead foot toward the target and swing. The forced weight shift moves your low point in front of the ball.',
    },
    {
      name: 'Towel-behind-the-ball drill',
      how: 'Lay a small towel a few inches behind the ball. Make swings that miss the towel and strike ball-then-turf — impossible if your low point is too far back.',
    },
    {
      name: 'Line drill',
      how: 'Draw a short line on a mat or spray a line in the grass. Practice taking your divot on the target side of the line, training a forward low point.',
    },
  ],
  mistakesToAvoid: [
    'Trying to "lift" the ball — that adds backward lean and makes fat (and thin) shots worse.',
    'Hanging back on the trail foot to help the ball up.',
    'Gripping tighter and swinging harder instead of fixing the low point.',
    'Ignoring ball position: too far forward in the stance can also move the low point behind the ball.',
  ],
  whenToWorkWithCoach:
    'If fat shots persist after a week of pressure-shift work, if you also feel lower-back strain, or if your videos do not show whether the cause is weight shift or early extension, a qualified coach can pinpoint it quickly.',
  faqs: [
    {
      question: 'Why do I hit it fat with irons but not my driver?',
      answer:
        'The driver is hit off a tee on the upswing, so a low point that is slightly behind the ball still catches it cleanly. Irons need a descending strike with the low point in front of the ball, which exposes the fault.',
    },
    {
      question: 'Is hitting fat a weight-shift problem?',
      answer:
        'For most amateurs, yes — weight stuck on the trail foot at impact is the most common cause. Getting onto the lead side through impact is usually the biggest single fix.',
    },
    {
      question: 'Where should my divot be?',
      answer:
        'With an iron, your divot should start at or just after the ball, on the target side — not behind it. A divot behind the ball is the signature of a fat strike.',
    },
  ],
  relatedLinks: [
    { label: 'How to stop topping the ball', href: '/golf/stop-topping-the-ball' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Golf benchmarks by skill level', href: '/benchmarks/golf' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'These drills are low-intensity and suitable for most adult golfers. Stop if you feel pain. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const TENNIS_GRIPS: SeoPage = {
  slug: 'tennis/tennis-grips-explained',
  sport: 'tennis',
  audience: 'player',
  keyword: 'tennis grips explained',
  intent: 'informational',
  funnelStage: 'awareness',
  priority: 1,
  title: 'Tennis Grips Explained: Forehand, Backhand & Serve',
  metaDescription:
    'A plain-English guide to the main tennis grips — continental, eastern, semi-western, western — and which to use for the forehand, backhand, serve, and volley.',
  directAnswer:
    'Tennis grips are named by where the base knuckle of your index finger sits on the handle. The practical starting points: a semi-western grip for a modern topspin forehand, an eastern or two-handed grip for the backhand, and a continental grip for serves and volleys. Your grip sets your natural spin and contact point, so getting it right is the foundation almost every other stroke fix depends on.',
  problemExplanation: [
    'The handle has eight bevels; which bevel your index knuckle rests on defines the grip. Continental, eastern, semi-western, and western move progressively "under" the handle, adding topspin potential but raising the comfortable contact point.',
    'A grip that is too far one way fights you: continental on a forehand makes topspin very hard, while a full western makes low balls and volleys awkward. Most recreational players are best served by a semi-western forehand and a continental for serve and net play.',
    'Backhands split by style: a one-handed backhand uses an eastern backhand grip, while a two-handed backhand typically uses a continental in the dominant hand and an eastern forehand in the non-dominant hand.',
  ],
  diagnosisSteps: [
    'Find the bevel: hold the racket edge-on and lay your palm flat on the strings, then slide down to the handle — that is roughly a continental grip.',
    'Check your forehand: if topspin feels impossible and balls fly long, you may be too close to continental; if low balls feel awful, you may be too far to western.',
    'Check your serve and volleys: if you cannot slice the serve or punch a volley, you are likely using a forehand grip instead of continental.',
    'Note grip changes: do you re-grip between forehand, backhand, and serve? Beginners often forget to, which limits every stroke.',
  ],
  whatSwingVantageLooksFor: [
    'Contact point relative to the body for each stroke',
    'Whether spin and trajectory match the grip you are using',
    'Consistency of the grip change between strokes',
    'Wrist and forearm position through contact',
  ],
  drills: [
    {
      name: 'Grip-change shadow swings',
      how: 'Without a ball, cycle through forehand, backhand, serve, and volley grips, re-gripping each time. Build the habit of changing grips automatically before each shot.',
    },
    {
      name: 'Semi-western feed drill',
      how: 'From a semi-western forehand grip, have a partner feed easy balls. Brush up the back of the ball and feel the topspin; adjust the bevel slightly until the trajectory clears the net comfortably and dips in.',
    },
    {
      name: 'Continental serve taps',
      how: 'With a continental grip, tap serves gently into the box, feeling the edge of the racket lead so you can later add slice and spin. If the ball only goes flat and long, your grip has crept toward a forehand.',
    },
  ],
  mistakesToAvoid: [
    'Using one grip for everything — especially a forehand grip on serves and volleys.',
    'Jumping straight to a full western grip before you can handle low balls.',
    'Forgetting to re-grip between strokes during rallies.',
    'Gripping the handle too tightly, which restricts the wrist and reduces spin.',
  ],
  whenToWorkWithCoach:
    'A coach can confirm your grip on each stroke in minutes and spot grip changes that are hard to feel on your own. If you are battling a stubborn forehand or serve, a quick grip check is often the fastest win.',
  faqs: [
    {
      question: 'What grip should a beginner use for the forehand?',
      answer:
        'An eastern or semi-western forehand grip is the friendliest starting point. Eastern is the easiest to control; semi-western adds the topspin most modern players want once the basics feel comfortable.',
    },
    {
      question: 'What grip is best for serving?',
      answer:
        'The continental grip. It lets you hit flat, slice, and kick serves from the same grip and is also the grip for volleys and overheads.',
    },
    {
      question: 'Do I really need to change grips during a point?',
      answer:
        'Yes. Different strokes need different grips, and changing automatically is a core skill. Practicing grip changes without a ball builds the habit faster than you would expect.',
    },
  ],
  relatedLinks: [
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'Tennis forehand analysis', href: '/tennis/forehand-analysis' },
    { label: 'Tennis backhand basics', href: '/tennis/backhand-basics' },
    { label: 'Tennis benchmarks by level', href: '/benchmarks/tennis' },
  ],
  cta: { label: 'Analyze My Strokes Free', href: '/dashboard' },
  schemaType: 'Article',
  safetyNotes:
    'Grip changes are low-impact, but build up gradually to avoid wrist or forearm strain. Junior players should practice with adult supervision.',
  publishStatus: 'published',
};

const SOFTBALL_HIT_SLOW_PITCH: SeoPage = {
  slug: 'softball/how-to-hit-slow-pitch',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'how to hit a slow pitch softball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Hit a Slow Pitch Softball (Timing & Contact)',
  metaDescription:
    'Hitting a slow pitch is a timing challenge: let the ball travel and stay back instead of lunging. Here is how to diagnose timing problems, three drills, and a practice plan.',
  directAnswer:
    'The hardest part of hitting a slow, arcing pitch is timing: because the ball floats in, hitters get anxious, start early, and decelerate or lunge, which kills power. The fix is to let the ball travel deeper, keep your weight back until it arrives, and then drive through contact near your front hip rather than reaching out for it.',
  problemExplanation: [
    'A high, arcing slow pitch gives you lots of time — and that is the trap. Players load early, drift forward, and then have to slow the swing down to make contact, producing weak fly balls and rollovers.',
    'Because the ball is descending steeply, your contact point and timing matter more than raw effort. Staying back and letting the ball get deep lets you swing on time and on plane with the descending pitch.',
    'The goal is a patient load and a committed, accelerating swing through the ball — not an early, decelerating one.',
  ],
  diagnosisSteps: [
    'Notice your misses: weak fly balls and pop-ups often mean you started early and got under the descending ball.',
    'Check your weight: are you drifting onto your front foot before the ball arrives?',
    'Film from the side: is your swing still accelerating at contact, or slowing down?',
    'Try letting one pitch travel an extra beat before you swing — if contact improves, your timing was early.',
  ],
  whatSwingVantageLooksFor: [
    'Timing of the load and stride relative to the pitch',
    'Contact point relative to the body (too far out front loses power)',
    'Whether the swing is accelerating or decelerating through contact',
    'Swing plane matched to the descending pitch',
  ],
  drills: [
    {
      name: 'Stay-back count drill',
      how: 'Have a partner toss high, arcing feeds. Count "one" as it peaks and swing on "two," forcing yourself to let the ball travel before committing.',
    },
    {
      name: 'Belly-button contact tee',
      how: 'Set a tee so contact is near your front hip / belly button, not way out front. Drive line drives from there to groove a deeper, more powerful contact point.',
    },
    {
      name: 'Accelerate-through finish',
      how: 'On soft feeds, exaggerate finishing the swing high and full. Feeling the swing speed up through the ball cures the deceleration that causes weak contact.',
    },
  ],
  mistakesToAvoid: [
    'Lunging or drifting forward before the ball arrives.',
    'Decelerating mid-swing to "guide" the ball — commit and accelerate.',
    'Trying to pull every pitch; let a deep pitch go the other way for power.',
    'Swinging level under a steeply descending ball, which produces pop-ups.',
  ],
  whenToWorkWithCoach:
    'If you keep getting under the ball or feel stuck lunging after a couple of weeks of timing work, a hitting coach can read your load and contact point quickly. SwingVantage helps you target the right priority between sessions.',
  faqs: [
    {
      question: 'Why do I keep popping up slow pitches?',
      answer:
        'Pop-ups usually come from starting early and swinging up under a steeply descending ball, often with a dropped back shoulder. Staying back, letting the ball travel, and matching the swing to the descending pitch fixes most of them.',
    },
    {
      question: 'Where should I make contact on a slow pitch?',
      answer:
        'Closer to your body than you think — around your front hip rather than reached out front. A deeper contact point keeps your swing powerful and on plane with the descending ball.',
    },
    {
      question: 'How do I stop slowing down my swing?',
      answer:
        'Commit to a patient load, then accelerate all the way through to a full finish. Drills that exaggerate finishing high retrain a swing that speeds up at contact.',
    },
  ],
  relatedLinks: [
    { label: 'Softball swing analysis', href: '/softball-swing-analysis' },
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Slow pitch power', href: '/softball/slow-pitch-power' },
    { label: 'Softball benchmarks', href: '/benchmarks/softball' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

// ── Draft backlog (NOT routed/indexed until fully written) ──────
const DRAFTS: SeoPage[] = [
  {
    slug: 'parents/youth-baseball-hitting',
    sport: 'baseball', audience: 'parent', keyword: 'youth baseball hitting for parents', intent: 'informational',
    funnelStage: 'consideration', priority: 3,
    title: 'Youth Baseball Hitting for Parents', metaDescription: 'Draft — see /baseball/youth-hitting for the published version.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingVantageLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'See how SwingVantage helps parents', href: '/parents' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'compare/private-lessons',
    sport: 'multi', audience: 'player', keyword: 'swing app vs private lessons', intent: 'commercial',
    funnelStage: 'consideration', priority: 3,
    title: 'SwingVantage vs Private Lessons', metaDescription: 'Draft — needs a dedicated comparison template (not the problem/HowTo format).',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingVantageLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Try SwingVantage free', href: '/dashboard' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'compare/youtube-swing-tips',
    sport: 'multi', audience: 'player', keyword: 'youtube swing tips vs analysis', intent: 'commercial',
    funnelStage: 'consideration', priority: 3,
    title: 'SwingVantage vs YouTube Swing Tips', metaDescription: 'Draft — pending full content.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingVantageLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Try SwingVantage free', href: '/dashboard' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
];

export const SEO_PAGES: SeoPage[] = [
  GOLF_FIX_SLICE,
  GOLF_WHY_SLICE_DRIVER,
  GOLF_LAUNCH_MONITOR,
  GOLF_PRACTICE_AT_HOME,
  SOFTBALL_SLOW_PITCH_POWER,
  SOFTBALL_LINE_DRIVES,
  BASEBALL_YOUTH_HITTING,
  TENNIS_FOREHAND,
  FREE_SWING_ANALYSIS,
  GOLF_HIGH_HANDICAP,
  GOLF_STOP_TOPPING,
  SOFTBALL_STOP_POPUP,
  TENNIS_BACKHAND,
  BASEBALL_EXIT_VELO,
  GOLF_STOP_OVER_THE_TOP,
  BASEBALL_STOP_ROLLING_OVER,
  GOLF_FIX_HOOK,
  GOLF_STOP_FAT,
  TENNIS_GRIPS,
  SOFTBALL_HIT_SLOW_PITCH,
  // Phase 3 SEO growth wedges (slow-pitch + fast-pitch + baseball) —
  // kept in a sibling file to keep this registry edit minimal.
  ...WEDGE_PAGES,
  ...DRAFTS,
];

/** All published pages (routed + indexed + in sitemap). */
export const PUBLISHED_SEO_PAGES: SeoPage[] = SEO_PAGES.filter(
  (p) => p.publishStatus === 'published',
);

/** Look up a published page by slug (without leading slash). */
export function getPublishedSeoPage(slug: string): SeoPage | undefined {
  return PUBLISHED_SEO_PAGES.find((p) => p.slug === slug);
}
