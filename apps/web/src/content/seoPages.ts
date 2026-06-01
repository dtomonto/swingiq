// ============================================================
// SwingIQ — SEO Content Registry
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
  /** What SwingIQ specifically looks for / measures. */
  whatSwingIQLooksFor: string[];
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
  whatSwingIQLooksFor: [
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
  whatSwingIQLooksFor: [
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
    'SwingIQ imports data from FlightScope, TrackMan, Garmin, and other monitors, normalizes the columns, and highlights your single highest-priority gap instead of leaving you with a wall of numbers.',
  ],
  diagnosisSteps: [
    'Find your smash factor (ball speed ÷ club speed). Driver near 1.50 is efficient; low values mean off-center strikes.',
    'Check spin: too high robs distance, too low can cost carry and stopping power.',
    'Compare launch angle to your spin — they work together for optimal carry.',
    'Read club path and face-to-path to explain your shot shape.',
  ],
  whatSwingIQLooksFor: [
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
    'A coach or fitter with a monitor is invaluable when your numbers suggest an equipment mismatch, or when strike and path both need work and you cannot prioritize. SwingIQ helps you arrive with a clear question instead of guesswork.',
  faqs: [
    { question: 'What is a good smash factor?', answer: 'For a driver, around 1.48–1.50 is efficient. Irons are progressively lower. Low smash usually means off-center contact.' },
    { question: 'Do I need an expensive launch monitor?', answer: 'No. SwingIQ works with data exported from many consumer and pro monitors, and you can also analyze video without one.' },
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
    'Identify your top swing priority (SwingIQ can do this from one video).',
    'Pick the one position that priority depends on (e.g., transition for a slice).',
    'Set up a mirror or phone so you can see that position.',
    'Decide your daily rep count and a weekly retest.',
  ],
  whatSwingIQLooksFor: [
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
  whatSwingIQLooksFor: [
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
  whatSwingIQLooksFor: [
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
  whatSwingIQLooksFor: [
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
    'A youth hitting coach is helpful for confirming bat fit, keeping cues age-appropriate, and ensuring practice stays positive. SwingIQ is a between-session tool, not a replacement for coaching or for a parent’s judgment.',
  faqs: [
    { question: 'What bat size for my child?', answer: 'Fit matters more than power. A bat the child can control through the zone with good balance is right — when in doubt, go lighter and get fitted.' },
    { question: 'How often should a young player practice?', answer: 'Short, frequent, fun sessions beat long ones. Watch for fatigue and keep it positive.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'SwingIQ for parents', href: '/parents' },
    { label: 'At-home drill generator', href: '/tools/at-home-swing-drill-generator' },
  ],
  cta: { label: 'See How SwingIQ Helps Parents', href: '/parents' },
  schemaType: 'Article',
  safetyNotes:
    'This guidance is for youth athletes practicing with parent or guardian supervision. Use age-appropriate equipment, warm up, and stop if anything hurts. SwingIQ does not make youth data public by default.',
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
  whatSwingIQLooksFor: [
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
    'A coach is valuable for grip and footwork details that are hard to self-diagnose, and for managing any wrist or shoulder discomfort. SwingIQ helps you practice the right priority between lessons.',
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
    'SwingIQ gives you a genuinely free swing analysis for golf, tennis, baseball, and softball. Upload a swing video or import launch monitor data and you get your single highest-priority issue, three beginner-safe drills, and a simple practice plan — with no account, no credit card, and your data private by default.',
  problemExplanation: [
    'Most "free" analysis tools are demos that gate the useful part behind a paywall, or they bury you in numbers without telling you what to fix first. SwingIQ leads with one priority and a plan.',
    'Because analysis runs in your browser and your data stays local by default, you can try it with confidence before deciding to save anything.',
  ],
  diagnosisSteps: [
    'Pick your sport.',
    'Upload a clear side-on or face-on video, or import your launch monitor data.',
    'Review your top priority issue and the evidence behind it.',
    'Follow the three drills and the practice plan, then retest.',
  ],
  whatSwingIQLooksFor: [
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
    'SwingIQ is built to make your practice and your coaching more effective — not to replace a coach. For injury concerns or advanced technique work, bring your SwingIQ priority to a qualified coach.',
  faqs: [
    { question: 'Is it really free?', answer: 'Yes. The core analysis, drills, and practice plan are free, with no account or credit card required.' },
    { question: 'Do you keep my video?', answer: 'Analysis runs in your browser and your data is stored locally by default. Videos are not shared publicly by default.' },
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
    'Drills suggested in your analysis are beginner-safe. Youth athletes should use SwingIQ with a parent or guardian. SwingIQ does not make youth data public by default.',
  publishStatus: 'published',
};

// ── Draft backlog (NOT routed/indexed until fully written) ──────
const DRAFTS: SeoPage[] = [
  {
    slug: 'golf/high-handicap-swing-analysis',
    sport: 'golf', audience: 'player', keyword: 'high handicap swing analysis', intent: 'informational',
    funnelStage: 'consideration', priority: 3,
    title: 'High-Handicap Swing Analysis', metaDescription: 'Draft — pending full content.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingIQLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'softball/stop-popping-up',
    sport: 'softball', audience: 'player', keyword: 'stop popping up softball', intent: 'informational',
    funnelStage: 'consideration', priority: 3,
    title: 'How to Stop Popping Up in Softball', metaDescription: 'Draft — pending full content.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingIQLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
    schemaType: 'HowTo', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'parents/youth-baseball-hitting',
    sport: 'baseball', audience: 'parent', keyword: 'youth baseball hitting for parents', intent: 'informational',
    funnelStage: 'consideration', priority: 3,
    title: 'Youth Baseball Hitting for Parents', metaDescription: 'Draft — see /baseball/youth-hitting for the published version.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingIQLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'See how SwingIQ helps parents', href: '/parents' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'compare/private-lessons',
    sport: 'multi', audience: 'player', keyword: 'swing app vs private lessons', intent: 'commercial',
    funnelStage: 'consideration', priority: 3,
    title: 'SwingIQ vs Private Lessons', metaDescription: 'Draft — pending full content.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingIQLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Try SwingIQ free', href: '/dashboard' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'compare/youtube-swing-tips',
    sport: 'multi', audience: 'player', keyword: 'youtube swing tips vs analysis', intent: 'commercial',
    funnelStage: 'consideration', priority: 3,
    title: 'SwingIQ vs YouTube Swing Tips', metaDescription: 'Draft — pending full content.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingIQLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Try SwingIQ free', href: '/dashboard' },
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
