// ============================================================
// SwingVantage — SEO Growth Wedge Pages (Phase 3)
//
// Parity SEO silos for the headline sports: slow-pitch (spearhead),
// fast-pitch, and baseball. Kept in a separate file from the main
// registry to keep edits to the large seoPages.ts minimal; spread
// into SEO_PAGES there. Same SeoPage shape + AEO/GEO format.
//
// See docs/FIVE_PERSONA_MASTER_PLAN.md §8.
// ============================================================

import type { SeoPage } from './seoPages';

const SLOW_PITCH_CTA = { label: 'Analyze My Slow-Pitch Swing Free', href: '/start?sport=softball_slow' };
const FAST_PITCH_CTA = { label: 'Analyze My Fast-Pitch Swing Free', href: '/start?sport=softball_fast' };
const BASEBALL_CTA = { label: 'Analyze My Swing Free', href: '/start?sport=baseball' };

const SLOW_PITCH_SAFETY =
  'Warm up before full-speed swings and use an age-appropriate, league-legal bat. Youth players should practice with adult supervision.';
const FAST_PITCH_SAFETY =
  'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision. Stop if anything hurts.';
const BASEBALL_SAFETY =
  'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision.';

// ── Slow-pitch wedge (8A) ───────────────────────────────────────

const SP_LAUNCH_ANGLE: SeoPage = {
  slug: 'softball/best-launch-angle-slow-pitch',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'best launch angle slow pitch softball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Best Launch Angle for Slow-Pitch Softball',
  metaDescription:
    'The best slow-pitch launch angle is a line-drive-to-slight-lift window — roughly 15–25°. Higher feels powerful but cuts carry. Here is how to find and groove it.',
  directAnswer:
    'For most slow-pitch hitters the most productive launch angle is a line-drive-to-slight-lift window, roughly 15–25 degrees. Because the ball is dropping steeply at contact, a slightly upward path that matches the descent produces carrying line drives — chasing a much higher angle feels powerful but trades distance and average for easy fly-outs.',
  problemExplanation: [
    'Launch angle is the up-or-down angle the ball leaves your bat. In slow-pitch the pitch arrives on a steep downward arc, so the relationship between your bat path and that descent decides whether you drive a line drive or pop it up.',
    'Hitters often equate "lift" with power and try to launch everything, but very high launch angles balloon into outs. The sweet spot is matching a slightly upward path to the drop so the ball carries on a line.',
  ],
  diagnosisSteps: [
    'Chart your batted balls: mostly line drives and gappers, or lazy flies and pop-ups?',
    'Film from the side and watch your bat path against the incoming arc.',
    'Check your back shoulder — a big dip steepens the path under the ball.',
    'Note where you make contact (out front vs. deep) and whether you are lifting on purpose.',
  ],
  whatSwingVantageLooksFor: [
    'Bat path angle relative to the descending pitch',
    'Back-shoulder tilt and posture through the swing',
    'Contact-point depth and timing',
    'Whether you are matching the descent or swinging up under it',
  ],
  exampleDiagnosis:
    'Example: "Your bat path is ~10° steeper than the incoming arc and your back shoulder dips in the load — the ball is leaving around 35–40°, which is why you are getting carry-less fly balls. Flatten toward a 15–25° window."',
  drills: [
    { name: 'Belt-high tee line drill', how: 'Set a tee at belt height and drive line drives into a net with a slightly upward, on-plane path. Reward flat, hard contact over height. 3 sets of 10.' },
    { name: 'Two-ball carry check', how: 'Off a tee, try to drive the ball into the top third of a net ~15 feet away. Too low = grounders; too high = pop-ups. Find the window that lines out. 2 sets of 10.' },
    { name: 'Match-the-arc soft toss', how: 'Have a partner toss on a slight arc and feel your path matching the descent — not chopping down, not swinging straight up. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to launch everything for max distance — it produces easy fly-outs.',
    'Dropping the back shoulder to "get under" the ball.',
    'Swinging level (flat) into a steeply dropping pitch, which tops it.',
    'Judging a swing by one big fly ball instead of consistent line drives.',
  ],
  whenToWorkWithCoach:
    'If you cannot tell from video whether your misses are path or timing, or your launch stays stuck too high after a week of tee work, a hitting coach can confirm the cause quickly.',
  faqs: [
    { question: 'What launch angle hits the most home runs in slow pitch?', answer: 'Power hitters often live a bit higher (roughly 25–30°), but for most players a 15–25° line-drive window produces more total bases and fewer easy outs. Build the line drive first, then add lift.' },
    { question: 'Should I swing up in slow pitch?', answer: 'Slightly — a path that matches the ball’s descent. An exaggerated uppercut sends it straight up. Match the arc, do not exceed it.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Stop popping up', href: '/softball/stop-popping-up' },
    { label: 'Sample slow-pitch report', href: '/sample-report/slow-pitch' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

const SP_END_LOADED_BAT: SeoPage = {
  slug: 'softball/end-loaded-bat-swing',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'how to swing an end-loaded slow pitch bat',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 3,
  title: 'How to Swing an End-Loaded Slow-Pitch Bat',
  metaDescription:
    'An end-loaded bat rewards a smooth, early load and letting the barrel work — not muscling it. Here is how to time and swing an end-loaded slow-pitch bat for power.',
  directAnswer:
    'An end-loaded bat puts more weight toward the barrel, so it builds more momentum through the zone — but only if you start your load a touch earlier and let the barrel swing rather than forcing it with your hands. Stay smooth and on time and the extra mass does the work; rush it and you get late, under-the-ball contact.',
  problemExplanation: [
    'End-loaded bats have a higher swing weight (MOI). That extra barrel mass adds power potential but also takes slightly longer to get going, so timing and sequence matter more than raw effort.',
    'Most problems with end-loaded bats are timing and tension: hitters feel the heavier barrel, get anxious, and either start late or try to muscle it with the arms — both kill the smooth path the bat is designed for.',
  ],
  diagnosisSteps: [
    'Are you late on pitches you used to square up with a balanced bat?',
    'Do you feel the barrel "drag" or get under the ball?',
    'Are you gripping tight and steering with the hands instead of letting the barrel go?',
    'Film from the side: is your load starting on time or rushed?',
  ],
  whatSwingVantageLooksFor: [
    'Load and stride timing relative to the pitch',
    'Sequencing (hips before hands) so the barrel arrives on time',
    'Bat path and contact depth',
    'Tension/steering vs. a free-swinging barrel',
  ],
  exampleDiagnosis:
    'Example: "You are starting your load about a half-beat late, so the heavier barrel arrives under the ball — start the load earlier and let the barrel release through contact instead of pushing it."',
  drills: [
    { name: 'Early-load count', how: 'On soft toss, start your load on an earlier count than feels natural so the heavier barrel is moving on time. 2 sets of 10.' },
    { name: 'Smooth-tempo tee work', how: 'Take relaxed, smooth-tempo swings off a tee, feeling the barrel swing the hands rather than the hands forcing the barrel. 2 sets of 10.' },
    { name: 'Hip-lead sequence drill', how: 'Slow swings feeling the hips start before the hands so the barrel stays connected and on time. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Muscling the bat with your arms instead of letting the barrel work.',
    'Starting your load at the same time you would with a balanced bat (too late).',
    'Choosing an end-load that is heavier than you can control through the zone.',
    'Gripping too tightly, which slows the barrel and shortens your finish.',
  ],
  whenToWorkWithCoach:
    'If you cannot get on time with an end-loaded bat after adjusting your load, a coach can check your sequence and confirm whether the bat’s swing weight fits you.',
  faqs: [
    { question: 'Is an end-loaded or balanced bat better for slow pitch?', answer: 'Stronger, on-time hitters who like to feel the barrel often prefer end-loaded for power; players who want quicker, more controllable swings prefer balanced. Fit and timing matter more than the label.' },
    { question: 'Why am I late with my new end-loaded bat?', answer: 'The higher swing weight takes slightly longer to get moving. Start your load a touch earlier and let the barrel swing — do not muscle it.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'Slow-pitch power', href: '/softball/slow-pitch-power' },
    { label: 'Slow-pitch bat speed & exit velocity', href: '/softball/bat-speed-exit-velocity' },
    { label: 'Sample slow-pitch report', href: '/sample-report/slow-pitch' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

const SP_BAT_PATH_MISTAKES: SeoPage = {
  slug: 'softball/bat-path-mistakes',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'slow pitch bat path mistakes',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 3,
  title: 'Slow-Pitch Bat Path Mistakes (and How to Fix Them)',
  metaDescription:
    'The most common slow-pitch bat path mistakes: chopping down, swinging straight up, casting, and dropping the back shoulder. Here is how to spot and fix each one.',
  directAnswer:
    'The four bat path mistakes that wreck slow-pitch hitting are chopping down on a dropping ball, swinging straight up (uppercutting) into it, casting the barrel away from your body, and dropping the back shoulder. Each one moves your barrel off the plane of the descending pitch — the fix is a connected, slightly upward path that matches the arc.',
  problemExplanation: [
    'In slow-pitch the ball is dropping at contact, so your bat path has to match that descent to drive it on a line. Small path errors are magnified because the contact window is narrow.',
    'Most path mistakes trace back to one of two root causes: trying to lift the ball on purpose, or getting long and disconnected (casting) so the barrel leaves its plane early.',
  ],
  diagnosisSteps: [
    'Grounders and topped balls? You are likely chopping down into the drop.',
    'Pop-ups and lazy flies? You are likely swinging up under it or dropping the back shoulder.',
    'Weak contact off the end? You may be casting the barrel away from your body.',
    'Film from the side to see your barrel’s plane versus the incoming arc.',
  ],
  whatSwingVantageLooksFor: [
    'Bat path plane relative to the descending pitch',
    'Connection (barrel staying in the slot) vs. casting',
    'Back-shoulder tilt and posture',
    'Contact-point depth and barrel direction at contact',
  ],
  exampleDiagnosis:
    'Example: "Your barrel casts away from your body early and then drops under the ball — that is why you are mixing weak end-of-bat contact with pop-ups. Stay connected and match the arc."',
  drills: [
    { name: 'Connection ball drill', how: 'Hold a ball/glove between your lead arm and chest through the turn to keep the barrel connected and on plane. 2 sets of 10.' },
    { name: 'Belt-high tee line drill', how: 'Drive line drives off a belt-high tee with a slightly upward, on-plane path. Reward flat, hard contact. 3 sets of 10.' },
    { name: 'Two-tee path drill', how: 'Set a second tee a ball-width toward the pitcher; drive both to train a path that stays through the ball. 2 sets of 8.' },
  ],
  mistakesToAvoid: [
    'Chopping down on a ball that is already dropping.',
    'Exaggerated uppercutting to "lift" it.',
    'Casting the barrel away from your body (long swing).',
    'Dropping the back shoulder to get under the ball.',
  ],
  whenToWorkWithCoach:
    'If your contact pattern stays mixed after working one path cue at a time, a hitting coach can identify which mistake is dominant and give you the right single fix.',
  faqs: [
    { question: 'What is the ideal slow-pitch bat path?', answer: 'A connected, slightly upward path that matches the ball’s descent and stays through the ball toward the pitcher — not down, not straight up.' },
    { question: 'How do I stop casting in slow pitch?', answer: 'Keep the barrel connected to your turn (connection-ball drill) and let the hips lead, so the barrel stays in the slot instead of flying away from your body early.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'Best launch angle for slow pitch', href: '/softball/best-launch-angle-slow-pitch' },
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Sample slow-pitch report', href: '/sample-report/slow-pitch' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

const SP_HIT_BACKSIDE: SeoPage = {
  slug: 'softball/how-to-hit-backside',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'how to hit backside slow pitch softball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 3,
  title: 'How to Hit the Ball Backside in Slow-Pitch Softball',
  metaDescription:
    'Hitting backside (the other way) in slow-pitch means letting the ball travel, staying inside it, and driving it to the opposite-field gap. Here is how to do it.',
  directAnswer:
    'To hit backside in slow-pitch, let the ball travel a little deeper, keep your hands inside the ball, and drive through it toward the opposite-field gap instead of pulling everything. It beats defenses that shade you to pull, and it is built on staying back and not rolling over — the same skills that cure pull-side grounders.',
  problemExplanation: [
    'Going the other way ("backside") means contacting the ball slightly deeper and directing it to the opposite-field gap. In slow-pitch this is a huge weapon because most defenses overshift to the pull side.',
    'The two things that prevent backside contact are pulling off the ball early and rolling the top hand over, both of which yank the barrel to the pull side and close the face.',
  ],
  diagnosisSteps: [
    'Do you pull almost everything, even outside pitches?',
    'Do outside pitches turn into weak rollover grounders?',
    'Are you stepping/spinning open instead of staying square a beat longer?',
    'Film from behind to see contact depth and where the barrel is pointing at contact.',
  ],
  whatSwingVantageLooksFor: [
    'Contact-point depth (deeper for backside)',
    'Whether the hands stay inside the ball',
    'Top-hand timing (late release vs. early roll)',
    'Lower-half direction — staying square vs. spinning open',
  ],
  exampleDiagnosis:
    'Example: "On outside pitches you spin open and roll the top hand, so they become weak pull-side grounders. Let the ball travel and stay inside it to drive the opposite-field gap."',
  drills: [
    { name: 'Oppo tee work', how: 'Set a tee slightly deeper and just off your back hip; drive line drives to the opposite-field gap. 3 sets of 10.' },
    { name: 'Inside-the-ball soft toss', how: 'Partner tosses from the side; focus on the knob leading and the hands staying inside the ball to the oppo gap. 2 sets of 10.' },
    { name: 'Stay-square cue', how: 'Slow swings keeping your front side closed a beat longer so you do not pull off the ball. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to pull outside pitches (weak rollovers).',
    'Spinning/stepping open early and pulling off the ball.',
    'Rolling the top hand over before contact.',
    'Reaching out front for a ball you should let travel.',
  ],
  whenToWorkWithCoach:
    'If you can hit backside off a tee but not in games, it is usually timing — a coach can help you read pitches that should go the other way.',
  faqs: [
    { question: 'Why can’t I hit the other way?', answer: 'Usually because you pull off the ball early or roll your top hand. Let the ball travel deeper, keep your hands inside it, and stay square a beat longer.' },
    { question: 'Where should I contact the ball to go oppo?', answer: 'A little deeper than your pull-side contact — around your back hip — so the barrel directs the ball to the opposite-field gap.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Bat path mistakes', href: '/softball/bat-path-mistakes' },
    { label: 'Sample slow-pitch report', href: '/sample-report/slow-pitch' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

const SP_TIMING_GUIDE: SeoPage = {
  slug: 'softball/timing-guide',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'slow pitch softball timing',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Slow-Pitch Softball Timing Guide',
  metaDescription:
    'Slow-pitch timing is about staying back and letting the high arc come to you, then accelerating through contact. Here is a simple timing system and drills.',
  directAnswer:
    'Good slow-pitch timing is mostly about patience: load early and smoothly, let the high arc travel deep, then accelerate through contact near your front hip. The classic mistake is the opposite — drifting forward early and decelerating to meet the ball — which kills both power and contact quality.',
  problemExplanation: [
    'The high, slow arc gives you lots of time, and that is the trap. Hitters load early, drift forward, and then have to slow the swing down to make contact — producing weak fly balls and rollovers.',
    'A repeatable timing system (a load trigger tied to the pitch’s peak) lets you stay back and arrive at contact still accelerating, which is where power and line drives come from.',
  ],
  diagnosisSteps: [
    'Do you drift onto your front foot before the ball arrives?',
    'Is your swing still accelerating at contact, or slowing down to "guide" it?',
    'Are you early (rolling over) or late (weak the other way)?',
    'Film from the side to see your weight and tempo against the arc.',
  ],
  whatSwingVantageLooksFor: [
    'Timing of the load/stride relative to the pitch peak',
    'Weight staying back vs. drifting forward',
    'Acceleration vs. deceleration through contact',
    'Contact-point depth',
  ],
  exampleDiagnosis:
    'Example: "You start your stride as the ball peaks and drift forward, so you are decelerating at contact — load on the peak, stay back, and accelerate through near your front hip."',
  drills: [
    { name: 'Stay-back count drill', how: 'Partner lobs high arcs; count "one" at the peak and swing on "two" so you let the ball travel before committing. 2 sets of 10.' },
    { name: 'Accelerate-through finish', how: 'On soft feeds, exaggerate a full, high finish so the swing speeds up through the ball instead of slowing to meet it. 2 sets of 10.' },
    { name: 'Front-hip contact tee', how: 'Set the tee near your front hip and drive line drives, grooving a deeper, on-time contact point. 3 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Drifting forward before the ball arrives.',
    'Decelerating mid-swing to "guide" the ball.',
    'Loading too late on a pitch that gives you plenty of time.',
    'Reaching out front instead of letting the ball travel.',
  ],
  whenToWorkWithCoach:
    'If you stay stuck drifting or late after timing work, a coach can give you a load trigger that fits your swing and the pitchers you face.',
  faqs: [
    { question: 'How do I stop being early in slow pitch?', answer: 'Let the ball travel deeper and tie your load to the pitch’s peak. Early contact usually means you committed before the ball got into your zone.' },
    { question: 'Where should I make contact for the best timing?', answer: 'Around your front hip, not way out front — a deeper contact point keeps you on plane with the descending ball and lets you accelerate through it.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'How to hit a slow pitch', href: '/softball/how-to-hit-slow-pitch' },
    { label: 'Best launch angle for slow pitch', href: '/softball/best-launch-angle-slow-pitch' },
    { label: 'Sample slow-pitch report', href: '/sample-report/slow-pitch' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

const SP_BAT_SPEED_EXIT_VELO: SeoPage = {
  slug: 'softball/bat-speed-exit-velocity',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'slow pitch bat speed exit velocity',
  intent: 'commercial',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Slow-Pitch Bat Speed & Exit Velocity Guide',
  metaDescription:
    'Exit velocity in slow-pitch is bat speed plus centered contact plus matching the arc. Here is what the numbers mean and how to raise them without losing contact.',
  directAnswer:
    'Slow-pitch exit velocity comes from three things working together: bat speed, centered (barrel) contact, and matching the descending pitch. Swinging harder only raises exit velocity if the barrel stays on plane and squares the ball — most lost ball-speed is mishit contact and a path that does not match the arc, not a lack of effort.',
  problemExplanation: [
    'Exit velocity is how fast the ball leaves the bat. It depends on bat speed and how flush you square the ball — a fast swing that catches the ball off-center or under it produces soft contact.',
    'In slow-pitch, the steep descent means a path mismatch quietly robs exit velocity even on hard swings. Improving sequence and barrel accuracy usually adds more ball speed than simply swinging harder.',
  ],
  diagnosisSteps: [
    'Do hard swings still produce soft, mishit contact?',
    'Are you squaring the barrel, or catching it off the end/handle?',
    'Is your path matching the arc or going under it?',
    'If you have a bat sensor, compare bat speed to exit velocity — a big gap means mishit contact.',
  ],
  whatSwingVantageLooksFor: [
    'Sequencing (hips → torso → hands) for bat speed',
    'Barrel accuracy / centered contact',
    'Bat path matched to the descending pitch',
    'Contact-point depth and connection',
  ],
  exampleDiagnosis:
    'Example: "Your bat speed is solid but exit velocity lags — contact is off the end of the bat and slightly under the ball. Center the barrel and match the arc to convert swing speed into ball speed."',
  drills: [
    { name: 'Barrel-accuracy tee work', how: 'Hit off a tee focusing on flush, centered contact (not max effort). Reward the hardest, flushest hits. 2 sets of 10.' },
    { name: 'Hip-lead rotation drill', how: 'Slow swings feeling the hips start before the hands to build sequenced bat speed. 2 sets of 10.' },
    { name: 'Overload/underload smooth swings', how: 'Alternate a slightly heavier and lighter bat with smooth, on-plane swings to build speed without losing control. 2 sets of 8 (use safe, appropriate weights).' },
  ],
  mistakesToAvoid: [
    'Chasing exit-velo numbers with max-effort, off-center swings.',
    'Ignoring barrel accuracy in favor of raw speed.',
    'A path that does not match the arc (under-the-ball contact).',
    'Comparing your numbers to elite players instead of your own baseline.',
  ],
  whenToWorkWithCoach:
    'If your bat speed is good but exit velocity stays low, a coach (or a session with a bat sensor) can confirm whether it is barrel accuracy, path, or sequence.',
  faqs: [
    { question: 'What is a good slow-pitch exit velocity?', answer: 'It varies widely by league and player. Track your own baseline and aim to raise it; a large gap between your bat speed and exit velocity points to off-center contact.' },
    { question: 'How do I increase bat speed for slow pitch?', answer: 'Improve sequence (hips before hands) and stay connected, then add controlled strength. Smooth, on-plane speed beats muscling the bat.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'Slow-pitch power', href: '/softball/slow-pitch-power' },
    { label: 'End-loaded bat swing', href: '/softball/end-loaded-bat-swing' },
    { label: 'Sample slow-pitch report', href: '/sample-report/slow-pitch' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'Article',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

// ── Fast-pitch wedge (8B) ───────────────────────────────────────

const FP_RISE_BALL: SeoPage = {
  slug: 'softball/how-to-hit-a-rise-ball',
  sport: 'softball',
  discipline: 'fast_pitch',
  audience: 'player',
  keyword: 'how to hit a rise ball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Hit a Rise Ball in Fast-Pitch Softball',
  metaDescription:
    'You beat the rise ball by laying off the high one and hitting it early in its path with a short, slightly flatter swing. Here is how to recognize it and drills to fix it.',
  directAnswer:
    'The rise ball is designed to be swung at and missed up in the zone, so the first skill is recognizing it and laying off the one above the strike zone. On the strikeable rise, you have to commit early and meet it earlier in its flight with a short, slightly flatter path — a long, uppercut swing will always end up under it.',
  problemExplanation: [
    'A good rise ball climbs as it reaches the plate, so a normal swing plane ends up beneath the ball and you foul it straight back or swing over the top.',
    'Two things beat it: pitch recognition (laying off the one out of the zone) and a shorter, slightly flatter path that meets the strikeable rise earlier, before it climbs above the barrel.',
  ],
  diagnosisSteps: [
    'Are you fouling rise balls straight back or swinging under them?',
    'Are you chasing rise balls above the strike zone?',
    'Is your swing long and uppercut, making it easy to get beat up top?',
    'Film from the side to see your path versus the climbing pitch.',
  ],
  whatSwingVantageLooksFor: [
    'Swing path/attack angle (too much uppercut gets beat up top)',
    'Timing and how early you commit',
    'Contact-point depth',
    'Whether you chase pitches above the zone',
  ],
  exampleDiagnosis:
    'Example: "Your attack angle is steeply up and you commit late, so rise balls climb above your barrel and you foul them back — flatten slightly, start earlier, and lay off the one above the zone."',
  drills: [
    { name: 'High-tee flatter-path drill', how: 'Set a tee at the top of the zone and drive line drives with a short, slightly flatter path. Trains meeting the high pitch on plane. 3 sets of 8.' },
    { name: 'Lay-off recognition', how: 'On front toss, have the feeder mix in pitches above the zone; practice taking them and only swinging at the strikeable one. 2 sets of 10.' },
    { name: 'Short-path "A-to-B" tee', how: 'The most direct route from launch to the ball, no sweep, to get the barrel up to a high pitch in time. 3 sets of 8.' },
  ],
  mistakesToAvoid: [
    'Chasing rise balls above the strike zone.',
    'A long, uppercut swing that gets beat up top.',
    'Committing late so the ball climbs above your barrel.',
    'Trying to lift the rise ball — it produces pop-ups and foul-backs.',
  ],
  whenToWorkWithCoach:
    'Pitch recognition is hard to self-coach. A hitting coach or live looks can confirm whether you are getting beat by path, timing, or chasing balls out of the zone.',
  faqs: [
    { question: 'Why do I keep fouling back the rise ball?', answer: 'Fouling straight back is a timing signature — you are just under and slightly late. Commit a touch earlier and flatten your path to meet it on plane.' },
    { question: 'Should I swing up at a rise ball?', answer: 'No — a slightly flatter, short path beats it. An uppercut leaves the barrel under a ball that is climbing.' },
  ],
  relatedLinks: [
    { label: 'Fast-pitch swing analysis', href: '/softball-swing-analysis/fast-pitch' },
    { label: 'Fast-pitch timing', href: '/softball/fast-pitch-timing' },
    { label: 'Stop getting jammed', href: '/softball/stop-getting-jammed' },
    { label: 'Sample fast-pitch report', href: '/sample-report/fast-pitch' },
  ],
  cta: FAST_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: FAST_PITCH_SAFETY,
  publishStatus: 'published',
};

const FP_TIMING: SeoPage = {
  slug: 'softball/fast-pitch-timing',
  sport: 'softball',
  discipline: 'fast_pitch',
  audience: 'player',
  keyword: 'how to catch up to fast pitching',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Catch Up to Fast Pitching (Fast-Pitch Timing)',
  metaDescription:
    'Catching up to speed is about starting earlier and shortening your swing, not swinging harder. Here is a fast-pitch timing system and drills to stop being late.',
  directAnswer:
    'To catch up to fast pitching, start your load earlier and shorten the path from launch to contact — get the barrel to the zone sooner so you can meet the ball out front. Swinging harder makes you later; an earlier start and a shorter, more direct swing is what buys you time against speed.',
  problemExplanation: [
    'Against 55–70+ mph pitching there is very little time, so any wasted movement or late start means you are beaten before you swing.',
    'The fix is rarely "be quicker" through effort — it is starting the load earlier (an on-time trigger) and trimming the path so the barrel reaches the ball in fewer milliseconds.',
  ],
  diagnosisSteps: [
    'Are you consistently late — fouling pitches back or swinging through fastballs?',
    'Does your load start after the pitcher has released?',
    'Is your swing long/sweepy rather than short and direct?',
    'Film at game speed to see when your load starts relative to release.',
  ],
  whatSwingVantageLooksFor: [
    'When the load/launch starts relative to release',
    'Path length from launch to contact',
    'Contact-point depth (out front vs. deep)',
    'Wasted movement (hitch, bat wrap) that costs time',
  ],
  exampleDiagnosis:
    'Example: "Your load starts just after release and your path is long, so you are a step late on the fastball — start your load as the arm comes through and shorten the path to the ball."',
  drills: [
    { name: 'Early-load timing trigger', how: 'On front toss at game speed, start your load on a count tied to the feeder’s arm so you are ready early. 2 sets of 10.' },
    { name: 'Short-path "A-to-B" tee', how: 'Drill the most direct route from launch to contact — knob to the ball, no sweep. Reward quickness. 3 sets of 8.' },
    { name: 'Quick-toss reaction', how: 'Partner front-tosses at a faster cadence; focus on an early, short swing rather than effort. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Swinging harder to catch up (it makes you later).',
    'Starting your load after the pitcher releases.',
    'A long, sweepy path with wasted movement.',
    'Letting the ball get deep instead of meeting it out front.',
  ],
  whenToWorkWithCoach:
    'If you start earlier and shorten your path but are still late in games, it may be recognition — a coach or live looks can confirm.',
  faqs: [
    { question: 'How do I stop being late on fastballs?', answer: 'Start your load earlier and shorten the path to the ball so the barrel arrives sooner. Quickness comes from an early start and a short swing, not from swinging harder.' },
    { question: 'Where should I make contact against fast pitching?', answer: 'Out in front of your lead hip, so the barrel is squaring up as it reaches the ball. Deep contact means you are late.' },
  ],
  relatedLinks: [
    { label: 'Fast-pitch swing analysis', href: '/softball-swing-analysis/fast-pitch' },
    { label: 'Fast-pitch contact point', href: '/softball/fast-pitch-contact-point' },
    { label: 'How to hit a rise ball', href: '/softball/how-to-hit-a-rise-ball' },
    { label: 'Sample fast-pitch report', href: '/sample-report/fast-pitch' },
  ],
  cta: FAST_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: FAST_PITCH_SAFETY,
  publishStatus: 'published',
};

const FP_CONTACT_POINT: SeoPage = {
  slug: 'softball/fast-pitch-contact-point',
  sport: 'softball',
  discipline: 'fast_pitch',
  audience: 'player',
  keyword: 'fast pitch softball contact point',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Fast-Pitch Contact Point: Where to Meet the Ball',
  metaDescription:
    'In fast-pitch, contact point depends on pitch location: meet inside pitches further out front, outside pitches a touch deeper. Here is how to find and groove it.',
  directAnswer:
    'In fast-pitch your contact point shifts with the pitch: meet inside pitches further out in front so you can clear your hands, and let outside pitches travel a touch deeper to drive them the other way. The common fault is one fixed contact point — usually too deep — which leads to jammed inside pitches and rolled-over outside ones.',
  problemExplanation: [
    'Contact point is where the barrel meets the ball relative to your body. It is not a single spot — it moves out front for inside pitches and slightly deeper for outside pitches.',
    'Hitters who use one contact point get jammed inside (contact too deep) or roll over outside pitches (contact too far out front), losing the ability to cover the whole plate.',
  ],
  diagnosisSteps: [
    'Are inside pitches jamming you (sawed-off contact)?',
    'Are outside pitches becoming weak rollover grounders?',
    'Do you make contact at the same depth regardless of location?',
    'Film from behind to see contact depth on inside vs. outside pitches.',
  ],
  whatSwingVantageLooksFor: [
    'Contact-point depth relative to pitch location',
    'Whether the hands clear on inside pitches',
    'Top-hand timing on outside pitches (roll vs. drive)',
    'Adjustability across the plate',
  ],
  exampleDiagnosis:
    'Example: "You contact every pitch at the same depth, so inside pitches jam you and outside pitches roll over — meet the inside pitch further out front and let the outside one travel."',
  drills: [
    { name: 'Inside/outside tee map', how: 'Set the tee at three locations (in, middle, out) and drive each to its natural field — inside out front, outside deeper. 3 rounds of 6.' },
    { name: 'Inside-pitch clear-the-hands drill', how: 'Tee the inside pitch out front; practice clearing your hands so you pull it hard instead of getting jammed. 2 sets of 8.' },
    { name: 'Oppo-gap soft toss', how: 'Toss outside; let it travel and drive it to the opposite-field gap without rolling over. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Using one fixed contact point for every pitch.',
    'Letting inside pitches get deep (jammed).',
    'Reaching out front for outside pitches (rollovers).',
    'Pulling everything regardless of location.',
  ],
  whenToWorkWithCoach:
    'If you can hit each location off a tee but not in games, it is timing/recognition — a coach can help you adjust in real at-bats.',
  faqs: [
    { question: 'Where should I make contact in fast-pitch?', answer: 'It depends on location: inside pitches further out front, outside pitches a little deeper. A single fixed contact point can’t cover the whole plate.' },
    { question: 'Why do I keep getting jammed?', answer: 'You are letting inside pitches travel too deep. Recognize the inside pitch and meet it further out front so you can clear your hands.' },
  ],
  relatedLinks: [
    { label: 'Fast-pitch swing analysis', href: '/softball-swing-analysis/fast-pitch' },
    { label: 'Stop getting jammed', href: '/softball/stop-getting-jammed' },
    { label: 'Fast-pitch timing', href: '/softball/fast-pitch-timing' },
    { label: 'Sample fast-pitch report', href: '/sample-report/fast-pitch' },
  ],
  cta: FAST_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: FAST_PITCH_SAFETY,
  publishStatus: 'published',
};

const FP_STOP_JAMMED: SeoPage = {
  slug: 'softball/stop-getting-jammed',
  sport: 'softball',
  discipline: 'fast_pitch',
  audience: 'player',
  keyword: 'stop getting jammed fastpitch',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Stop Getting Jammed in Fast-Pitch Softball',
  metaDescription:
    'Getting jammed means the inside pitch beats you deep. Fix it by recognizing inside early, starting your hands sooner, and clearing your hips. Drills inside.',
  directAnswer:
    'You get jammed when an inside pitch reaches you before your hands can clear, so contact happens deep near your hands instead of out front on the barrel. The fix is to start a touch earlier on inside pitches and let your hips clear so your hands get the barrel out in front where the inside pitch should be hit.',
  problemExplanation: [
    'A jam is a contact-depth problem on inside pitches: the ball beats your hands, so you make contact off the label or handle with no barrel behind it.',
    'It is usually a combination of being slightly late and not clearing the hips/hands, so the barrel never gets out front in time for the inside pitch.',
  ],
  diagnosisSteps: [
    'Are inside pitches producing sawed-off, weak contact?',
    'Do you make contact deep (near your hands) on inside pitches?',
    'Are your hips clearing, or are your hands stuck behind your body?',
    'Film from behind to see contact depth and hip clearance on inside pitches.',
  ],
  whatSwingVantageLooksFor: [
    'Contact-point depth on inside pitches',
    'Hip clearance and hand path to the inside pitch',
    'Timing / how early the swing starts',
    'Short vs. long path to the ball',
  ],
  exampleDiagnosis:
    'Example: "On inside pitches your hips stall and your hands stay behind you, so you contact the ball deep and get sawed off — clear the hips and get the barrel out front earlier."',
  drills: [
    { name: 'Inside-pitch out-front tee', how: 'Tee the inside pitch well out in front; drive it hard to the pull side, training the barrel to get out front. 3 sets of 8.' },
    { name: 'Hip-clear turn drill', how: 'Slow swings feeling the hips clear so the hands can whip the barrel out front. 2 sets of 10.' },
    { name: 'Short-path quick toss', how: 'Quick inside front-toss; start early and take the shortest path to get the barrel out front. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Letting inside pitches travel too deep.',
    'Stalling the hips so the hands get stuck behind the body.',
    'A long path that can’t get the barrel out front in time.',
    'Starting the swing late on hard inside pitches.',
  ],
  whenToWorkWithCoach:
    'If you stop getting jammed off a tee but not in games, it is timing/recognition on the inside pitch — a coach or live looks can help.',
  faqs: [
    { question: 'Why do I keep getting jammed inside?', answer: 'The inside pitch is beating your hands. Start a touch earlier and clear your hips so the barrel gets out in front, where inside pitches should be hit.' },
    { question: 'Is getting jammed a timing or mechanics problem?', answer: 'Both — usually slightly late plus hips that don’t clear. Fix the contact point off a tee first, then the timing against live pitching.' },
  ],
  relatedLinks: [
    { label: 'Fast-pitch swing analysis', href: '/softball-swing-analysis/fast-pitch' },
    { label: 'Fast-pitch contact point', href: '/softball/fast-pitch-contact-point' },
    { label: 'Fast-pitch timing', href: '/softball/fast-pitch-timing' },
    { label: 'Sample fast-pitch report', href: '/sample-report/fast-pitch' },
  ],
  cta: FAST_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: FAST_PITCH_SAFETY,
  publishStatus: 'published',
};

const FP_SLAP_HIT: SeoPage = {
  slug: 'softball/how-to-slap-hit',
  sport: 'softball',
  discipline: 'fast_pitch',
  audience: 'player',
  keyword: 'how to slap hit in fastpitch softball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Slap Hit in Fast-Pitch Softball',
  metaDescription:
    'Slap hitting uses footwork and a short, controlled swing to put the ball in play while moving toward first. Here is the footwork, contact, and drills for lefty slappers.',
  directAnswer:
    'Slap hitting is a left-side skill where you use a crossover/running start through the box and a short, controlled swing to hit the ball on the ground or on a line while already moving toward first base. The keys are clean footwork that keeps you in the box, contact slightly deeper, and bat control to direct the ball away from the defense.',
  problemExplanation: [
    'Slapping turns speed into a weapon: by moving through the box as you contact the ball, a fast runner can beat out balls that would be routine outs from a stationary swing.',
    'The hard parts are footwork (timing the crossover so you contact in the box, not out of it) and bat control (a short, directional swing rather than a full power swing).',
  ],
  diagnosisSteps: [
    'Are you contacting the ball inside the batter’s box, or drifting out (illegal/awkward)?',
    'Is your swing short and controlled, or a full power cut?',
    'Can you direct the ball (soft slap, hard slap, fake-slap) on purpose?',
    'Film from the side/behind to see footwork timing and contact depth.',
  ],
  whatSwingVantageLooksFor: [
    'Footwork timing and staying in the box',
    'Contact-point depth for a controlled slap',
    'Bat control / barrel direction',
    'Balance and momentum toward first',
  ],
  exampleDiagnosis:
    'Example: "Your crossover is a touch early so you are leaving the box before contact — delay the crossover slightly and shorten the swing to make controlled contact in the box."',
  drills: [
    { name: 'Footwork-only walkthroughs', how: 'No ball: rehearse the crossover/running start so you contact in the box and exit toward first in rhythm. 2 sets of 8.' },
    { name: 'Short-swing slap tee', how: 'Off a tee, take a short, controlled swing aiming ground balls/line drives to the left side. 3 sets of 8.' },
    { name: 'Soft-toss direction drill', how: 'Partner tosses; practice soft slap, hard slap, and taking the ball where it’s pitched. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Leaving the batter’s box before contact.',
    'Taking a full power swing instead of a short, controlled one.',
    'Crossing over too early or too late (mistimed footwork).',
    'Slapping without a plan — know your soft/hard slap and bunt options.',
  ],
  whenToWorkWithCoach:
    'Slapping footwork is genuinely hard to self-teach. A coach who has taught slappers can save you weeks and keep your footwork legal and balanced.',
  faqs: [
    { question: 'Do you have to be left-handed to slap?', answer: 'Slapping is done from the left side because it gets you moving toward first. Right-handed players who are fast sometimes learn to hit and run from the left side specifically to slap.' },
    { question: 'Is slapping just bunting?', answer: 'No — slapping is a short, controlled swing (soft or hard) while moving through the box, which covers more of the field than a bunt and is harder to defend.' },
  ],
  relatedLinks: [
    { label: 'Fast-pitch swing analysis', href: '/softball-swing-analysis/fast-pitch' },
    { label: 'Fast-pitch timing', href: '/softball/fast-pitch-timing' },
    { label: 'Fast-pitch contact point', href: '/softball/fast-pitch-contact-point' },
    { label: 'Sample fast-pitch report', href: '/sample-report/fast-pitch' },
  ],
  cta: FAST_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: FAST_PITCH_SAFETY,
  publishStatus: 'published',
};

const FP_BAT_SPEED: SeoPage = {
  slug: 'softball/fast-pitch-bat-speed',
  sport: 'softball',
  discipline: 'fast_pitch',
  audience: 'player',
  keyword: 'fast pitch bat speed and exit velocity',
  intent: 'commercial',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Fast-Pitch Bat Speed & Exit Velocity Guide',
  metaDescription:
    'Fast-pitch bat speed and exit velocity come from sequence, a short connected path, and centered contact. Here is what the numbers mean and how to raise them.',
  directAnswer:
    'In fast-pitch, bat speed and exit velocity come from an efficient sequence (lower body leading), a short connected path, and squaring the ball on the barrel. Because you have so little time, a shorter, better-sequenced swing usually adds more usable bat speed than swinging harder — and centered contact is what turns that speed into exit velocity.',
  problemExplanation: [
    'Bat speed is how fast the barrel moves; exit velocity is how fast the ball leaves the bat, which also depends on squaring it up. A fast but off-center swing produces soft contact.',
    'In fast-pitch the constraint is time, so wasted movement and a long path cost you both speed and the chance to square the ball. Sequence and connection raise usable speed without lengthening the swing.',
  ],
  diagnosisSteps: [
    'Do hard swings still produce mishit, soft contact?',
    'Do the hands fire before the lower body (out of sequence)?',
    'Is the path long, leaking speed before contact?',
    'If you have a sensor, compare bat speed to exit velocity — a gap means off-center contact.',
  ],
  whatSwingVantageLooksFor: [
    'Kinematic sequence (hips → torso → hands)',
    'Connection and path length',
    'Barrel accuracy / centered contact',
    'Contact-point depth',
  ],
  exampleDiagnosis:
    'Example: "Your hands fire before your lower body and your path is long, so bat speed leaks before contact — sequence the lower body first and shorten the path to add usable speed."',
  drills: [
    { name: 'Hip-lead rotation drill', how: 'Slow swings feeling the hips start before the hands so speed sequences correctly. 2 sets of 10.' },
    { name: 'Connection ball drill', how: 'Keep a ball/glove between lead arm and chest through the turn to stay connected and short. 2 sets of 10.' },
    { name: 'Barrel-accuracy tee work', how: 'Hit off a tee for flush, centered contact (not max effort) to convert speed into exit velocity. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Chasing bat-speed numbers with a long, max-effort swing.',
    'Firing the hands before the lower body.',
    'Disconnecting the lead arm (casting).',
    'Ignoring centered contact in favor of raw speed.',
  ],
  whenToWorkWithCoach:
    'If your bat speed is good but exit velocity lags, a coach or a sensor session can confirm whether it’s sequence, connection, or barrel accuracy.',
  faqs: [
    { question: 'What is a good fast-pitch bat speed?', answer: 'It varies widely by age and level. Track your own baseline and work to raise it; a big gap between bat speed and exit velocity points to off-center contact.' },
    { question: 'How do I add bat speed without getting late?', answer: 'Add speed through sequence and connection, not a longer swing. A short, well-sequenced swing is both quicker and faster at contact.' },
  ],
  relatedLinks: [
    { label: 'Fast-pitch swing analysis', href: '/softball-swing-analysis/fast-pitch' },
    { label: 'Fast-pitch timing', href: '/softball/fast-pitch-timing' },
    { label: 'Fast-pitch contact point', href: '/softball/fast-pitch-contact-point' },
    { label: 'Sample fast-pitch report', href: '/sample-report/fast-pitch' },
  ],
  cta: FAST_PITCH_CTA,
  schemaType: 'Article',
  safetyNotes: FAST_PITCH_SAFETY,
  publishStatus: 'published',
};

// ── Baseball wedge (8C) ─────────────────────────────────────────

const BB_STOP_CHASING_HIGH: SeoPage = {
  slug: 'baseball/stop-chasing-high-pitches',
  sport: 'baseball',
  audience: 'player',
  keyword: 'stop swinging at high pitches',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Stop Chasing High Pitches in Baseball',
  metaDescription:
    'Chasing high fastballs comes from a steep uppercut path and late commitment. Fix it with a flatter path to the top of the zone and laying off the one above it.',
  directAnswer:
    'You chase high pitches because a steep, uppercut swing gets beat at the top of the zone, so the high fastball looks hittable and ends up a swing-and-miss or foul-back. The fix is two-part: flatten your path so you can cover the top of the zone, and train your eyes to lay off the pitch above it.',
  problemExplanation: [
    'A steep uppercut path matches low pitches but leaves the barrel under high pitches — so high fastballs are missed or fouled straight back, and pitchers keep climbing the ladder.',
    'Beating it is a path issue plus a recognition issue: a slightly flatter path covers the high strike, and disciplined eyes lay off the ball above the zone.',
  ],
  diagnosisSteps: [
    'Are you swinging through or fouling back high fastballs?',
    'Is your swing path a steep uppercut?',
    'Do you chase fastballs above the strike zone?',
    'Film from the side to see your attack angle versus high pitches.',
  ],
  whatSwingVantageLooksFor: [
    'Attack angle / path (too steep gets beat up top)',
    'Contact ability at the top of the zone',
    'Chase tendency above the zone',
    'Timing and commitment',
  ],
  exampleDiagnosis:
    'Example: "Your attack angle is steeply up, so the high fastball is above your barrel — flatten the path to cover the top of the zone and lay off the one above it."',
  drills: [
    { name: 'High-tee flatter-path drill', how: 'Tee at the top of the zone; drive line drives with a slightly flatter path. 3 sets of 8.' },
    { name: 'Lay-off recognition toss', how: 'Front toss mixing in pitches above the zone; only swing at the strikeable high pitch. 2 sets of 10.' },
    { name: 'Two-strike flat-path cue', how: 'Practice a shorter, flatter two-strike swing that covers the top of the zone. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'A steep uppercut that can’t cover the high strike.',
    'Chasing fastballs above the zone.',
    'Trying to lift the high pitch (pop-ups, foul-backs).',
    'Committing late so the fastball beats you up top.',
  ],
  whenToWorkWithCoach:
    'Pitch recognition and path both matter; a coach or live looks can tell you which is costing you more.',
  faqs: [
    { question: 'Why do I keep swinging under high fastballs?', answer: 'Your path is too steep (uppercut), so the barrel is under the high pitch. Flatten it to cover the top of the zone.' },
    { question: 'How do I stop chasing high?', answer: 'Train your eyes with lay-off drills and flatten your path so the high strike is actually coverable — then the ball above the zone is an easy take.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Two-strike approach', href: '/baseball/two-strike-approach' },
    { label: 'How to time a pitch', href: '/baseball/how-to-time-a-pitch' },
    { label: 'Sample baseball report', href: '/sample-report/baseball' },
  ],
  cta: BASEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: BASEBALL_SAFETY,
  publishStatus: 'published',
};

const BB_TIME_A_PITCH: SeoPage = {
  slug: 'baseball/how-to-time-a-pitch',
  sport: 'baseball',
  audience: 'player',
  keyword: 'baseball hitting timing',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Time a Pitch in Baseball (Load, Stride & Trigger)',
  metaDescription:
    'Good timing is a consistent load and stride that gets your foot down early, plus a trigger tied to the pitcher. Here is a simple timing system and drills.',
  directAnswer:
    'Timing a pitch comes down to a repeatable load and stride that gets your front foot down early — before the ball arrives — so you can react with your hands. Tie a simple trigger to the pitcher’s motion, get the foot down on time, and let your hands adjust; most timing problems are a late or inconsistent foot-down, not slow hands.',
  problemExplanation: [
    'Timing is the rhythm that syncs your swing to the pitch. The single biggest checkpoint is when your front foot gets down: too late and everything rushes.',
    'A consistent trigger (a small movement tied to the pitcher’s delivery) and an early foot-down give your hands time to read and adjust to speed and location.',
  ],
  diagnosisSteps: [
    'Is your front foot down early, or are you still striding as the ball arrives?',
    'Is your load the same every pitch, or rushed/variable?',
    'Are you late on fastballs and way out front on off-speed?',
    'Film from the side to see foot-down timing relative to release.',
  ],
  whatSwingVantageLooksFor: [
    'Foot-down timing relative to the pitch',
    'Consistency and size of the load/stride',
    'A repeatable trigger tied to the pitcher',
    'Balance through the stride',
  ],
  exampleDiagnosis:
    'Example: "Your front foot lands late and your stride size varies, so you’re rushed and late — shrink and standardize the stride and get the foot down earlier."',
  drills: [
    { name: 'Foot-down-early front toss', how: 'On front toss, focus only on getting your front foot down before the ball is released. 2 sets of 10.' },
    { name: 'Consistent-load tee work', how: 'Use the same small, repeatable load on every tee swing to standardize your rhythm. 2 sets of 10.' },
    { name: 'Trigger-timing rhythm drill', how: 'Tie a small trigger to a partner’s arm action so you start on time every pitch. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'A big, late stride that leaves you rushed.',
    'A different load every pitch (no rhythm).',
    'No trigger tied to the pitcher.',
    'Trying to fix timing with faster hands instead of an earlier foot-down.',
  ],
  whenToWorkWithCoach:
    'Timing against live pitching is hard to self-coach. A coach or live at-bats can confirm your foot-down timing and trigger.',
  faqs: [
    { question: 'Why am I always late or early?', answer: 'Usually an inconsistent or late foot-down. Standardize a small load/stride and get the front foot down early, then let your hands adjust to speed.' },
    { question: 'What is a hitting trigger?', answer: 'A small movement (a hand load, leg lift, or toe tap) tied to the pitcher’s delivery that starts your swing on time, every pitch.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Stop rolling over', href: '/baseball/stop-rolling-over' },
    { label: 'Two-strike approach', href: '/baseball/two-strike-approach' },
    { label: 'Sample baseball report', href: '/sample-report/baseball' },
  ],
  cta: BASEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: BASEBALL_SAFETY,
  publishStatus: 'published',
};

const BB_TWO_STRIKE: SeoPage = {
  slug: 'baseball/two-strike-approach',
  sport: 'baseball',
  audience: 'player',
  keyword: 'two strike approach baseball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Two-Strike Approach in Baseball: Battle and Put It in Play',
  metaDescription:
    'A good two-strike approach: choke up a hair, widen your stance, shorten your swing, and battle to put the ball in play. Here is how to build it and drills.',
  directAnswer:
    'A good two-strike approach trades some power for contact: choke up slightly, widen your stance, shorten and flatten your swing, expand the zone just enough to protect, and focus on hitting the ball hard up the middle or the other way. The goal is to put the ball in play and extend the at-bat, not to hit a home run.',
  problemExplanation: [
    'With two strikes the cost of a strikeout is highest, so elite hitters shift to a contact-first mindset and a shorter swing rather than their full A-swing.',
    'The adjustments are simple and physical (choke up, widen, shorten) plus mental (expand the zone to protect, look the other way), and they dramatically cut strikeouts.',
  ],
  diagnosisSteps: [
    'Do you use the same full swing with two strikes as 0-0?',
    'Are you striking out on pitches just off the plate?',
    'Do you shorten up, or keep trying to do damage?',
    'Track your two-strike at-bats: strikeouts vs. balls in play.',
  ],
  whatSwingVantageLooksFor: [
    'Swing length and attack angle (shorter/flatter with two strikes)',
    'Contact ability across the expanded zone',
    'Setup adjustments (choke up, stance width)',
    'Approach: middle/oppo vs. pull',
  ],
  exampleDiagnosis:
    'Example: "You keep your full A-swing with two strikes and chase just off the plate — choke up, shorten the swing, and look to drive the ball up the middle to cut the strikeouts."',
  drills: [
    { name: 'Two-strike short-swing tee', how: 'Choke up and take a shorter, flatter swing off the tee, driving the ball up the middle. 3 sets of 8.' },
    { name: 'Expand-the-zone toss', how: 'Front toss including pitches just off the plate; practice fouling off or poking them the other way. 2 sets of 10.' },
    { name: 'Two-strike approach reps', how: 'Live or machine reps where every count is two strikes; battle and put it in play. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Keeping your full power swing with two strikes.',
    'Chasing pitches well off the plate.',
    'Trying to pull/lift instead of going up the middle.',
    'Giving up on the at-bat instead of battling.',
  ],
  whenToWorkWithCoach:
    'A coach can help you find the right two-strike adjustments for your swing and build the discipline to use them in games.',
  faqs: [
    { question: 'Should I choke up with two strikes?', answer: 'A small choke-up gives more bat control and a quicker, shorter swing — a common and effective two-strike adjustment.' },
    { question: 'What should I be thinking with two strikes?', answer: 'Protect the plate, shorten up, and hit the ball hard up the middle or the other way. Put it in play and extend the at-bat.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Stop chasing high pitches', href: '/baseball/stop-chasing-high-pitches' },
    { label: 'Hit the ball the other way', href: '/baseball/hit-the-other-way' },
    { label: 'Sample baseball report', href: '/sample-report/baseball' },
  ],
  cta: BASEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: BASEBALL_SAFETY,
  publishStatus: 'published',
};

const BB_OTHER_WAY: SeoPage = {
  slug: 'baseball/hit-the-other-way',
  sport: 'baseball',
  audience: 'player',
  keyword: 'how to hit the ball the other way',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Hit the Ball the Other Way in Baseball',
  metaDescription:
    'Hitting the other way means letting the ball travel, staying inside it, and driving the opposite-field gap. Here is how to do it and drills to groove it.',
  directAnswer:
    'To hit the ball the other way, let it travel a little deeper, keep your hands inside the ball, and drive through it to the opposite-field gap instead of pulling and rolling over. It beats the shift, handles outside pitches, and is built on the same staying-through skill that fixes weak pull-side grounders.',
  problemExplanation: [
    'Going the other way means contacting the ball slightly deeper and directing it to the opposite-field gap — a must against outside pitches and defensive shifts.',
    'The faults that block it are pulling off the ball and rolling the top hand over early, both of which yank the barrel to the pull side and close the face.',
  ],
  diagnosisSteps: [
    'Do you pull almost everything, even outside pitches?',
    'Do outside pitches become weak rollover grounders?',
    'Are you spinning open instead of staying square a beat longer?',
    'Film from behind to see contact depth and barrel direction.',
  ],
  whatSwingVantageLooksFor: [
    'Contact-point depth (deeper for oppo)',
    'Hands staying inside the ball',
    'Top-hand timing (late release vs. early roll)',
    'Lower-half direction (staying square vs. spinning open)',
  ],
  exampleDiagnosis:
    'Example: "You spin open and roll the top hand on outside pitches, so they become weak grounders — let the ball travel and stay inside it to drive the oppo gap."',
  drills: [
    { name: 'Oppo-gap tee work', how: 'Set the tee deeper and just off your back hip; drive line drives to the opposite-field gap. 3 sets of 10.' },
    { name: 'Inside-the-ball soft toss', how: 'Toss from the side; keep the knob leading and hands inside the ball to the oppo gap. 2 sets of 10.' },
    { name: 'Stay-square cue', how: 'Slow swings keeping the front side closed a beat longer so you don’t pull off the ball. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to pull outside pitches (weak rollovers).',
    'Spinning/stepping open early.',
    'Rolling the top hand over before contact.',
    'Reaching out front for a ball you should let travel.',
  ],
  whenToWorkWithCoach:
    'If you can go oppo off a tee but not in games, it is timing/recognition — a coach can help you read pitches to take the other way.',
  faqs: [
    { question: 'Why can’t I hit the ball the other way?', answer: 'Usually you pull off the ball or roll the top hand. Let the ball travel deeper, keep the hands inside it, and stay square a beat longer.' },
    { question: 'Does hitting the other way lose power?', answer: 'Oppo-gap line drives are very productive and beat the shift. You are not slapping it weakly — you are driving it the other way with a path that stays through the ball.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Stop rolling over', href: '/baseball/stop-rolling-over' },
    { label: 'Two-strike approach', href: '/baseball/two-strike-approach' },
    { label: 'Sample baseball report', href: '/sample-report/baseball' },
  ],
  cta: BASEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: BASEBALL_SAFETY,
  publishStatus: 'published',
};

export const WEDGE_PAGES: SeoPage[] = [
  // Slow-pitch (8A)
  SP_LAUNCH_ANGLE,
  SP_END_LOADED_BAT,
  SP_BAT_PATH_MISTAKES,
  SP_HIT_BACKSIDE,
  SP_TIMING_GUIDE,
  SP_BAT_SPEED_EXIT_VELO,
  // Fast-pitch (8B)
  FP_RISE_BALL,
  FP_TIMING,
  FP_CONTACT_POINT,
  FP_STOP_JAMMED,
  FP_SLAP_HIT,
  FP_BAT_SPEED,
  // Baseball (8C)
  BB_STOP_CHASING_HIGH,
  BB_TIME_A_PITCH,
  BB_TWO_STRIKE,
  BB_OTHER_WAY,
];
