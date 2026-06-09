// ============================================================
// SwingVantage — SEO Growth Pages: cross-sport technique gaps
//
// Top swing/technique gaps SearchIntelligenceOS flagged for the secondary
// sports (tennis, baseball, pickleball, padel) that fit the analysis core.
// Sibling file spread into SEO_PAGES in seoPages.ts; same AEO/GEO SeoPage
// format. Honest, original instruction — no fabricated stats.
// NOTE: tennis/baseball use `sport/topic` slugs; pickleball/padel use
// top-level `pickleball-topic` / `padel-topic` slugs (matching the registry).
// ============================================================

import type { SeoPage } from './seoPages';

const TENNIS_CTA = { label: 'Analyze My Tennis Swing Free', href: '/start?sport=tennis' };
const BASEBALL_CTA = { label: 'Analyze My Swing Free', href: '/start?sport=baseball' };
const PICKLEBALL_CTA = { label: 'Analyze My Pickleball Stroke Free', href: '/start?sport=pickleball' };
const PADEL_CTA = { label: 'Analyze My Padel Stroke Free', href: '/start?sport=padel' };
const RACKET_SAFETY =
  'Warm up your shoulder and wrist before full-speed serves and swings, and stop if anything hurts. Youth players should practice with adult supervision.';
const BASEBALL_SAFETY =
  'Warm up before full-speed swings and use age-appropriate, league-legal equipment. Youth players should practice with adult supervision.';

// ── Tennis: serve ───────────────────────────────────────────────
const TENNIS_SERVE: SeoPage = {
  slug: 'tennis/serve-technique',
  sport: 'tennis',
  audience: 'player',
  keyword: 'tennis serve technique',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'Tennis Serve Technique: Build a Reliable, Powerful Serve',
  metaDescription:
    'A reliable tennis serve comes from a loose arm, a consistent toss, and an up-and-out swing into the court — not muscling it. Here is how to diagnose and groove it.',
  directAnswer:
    'A consistent, powerful serve comes from three things: a repeatable toss, a relaxed arm that whips up rather than muscles through, and contact reached up and slightly in front. Most serving problems are a toss that drifts or a tight, early arm — fix the toss first, then let the arm accelerate up to the ball, and both depth and pace improve.',
  problemExplanation: [
    'The serve is a throwing motion: you load, the arm trails, then it whips up and out to a high contact point. Power comes from relaxed acceleration and the kinetic chain (legs → trunk → arm), not from a tight, all-arm hit.',
    'The single biggest variable is the toss. An inconsistent toss forces you to adjust mid-swing, which kills rhythm and contact. Most “serve” problems are really toss problems.',
  ],
  diagnosisSteps: [
    'Toss 10 balls and let them drop without hitting — do they land in the same spot, slightly in front of your hitting shoulder?',
    'Film from the side: is your contact point high and out front, or low and cramped?',
    'Is your arm loose and whippy, or tight and pushing the ball?',
    'Do you use your legs and trunk, or serve all-arm?',
  ],
  whatSwingVantageLooksFor: [
    'Toss height and location consistency',
    'Contact-point height and how far in front it is',
    'Arm relaxation and racket-head acceleration',
    'Use of the legs/trunk in the kinetic chain',
  ],
  exampleDiagnosis:
    'Example: "Your toss drifts behind your head on the misses, so you arch back and contact late — that is why depth is inconsistent. A more in-front toss plus a looser arm raised your contact point and added easy pace."',
  drills: [
    { name: 'Toss-and-catch', how: 'Toss as if to serve and catch the ball at full extension without swinging. Repeat until 9/10 land in the same in-front spot. Fix the toss before anything else. 3 sets of 10.' },
    { name: 'Throw a ball over the net', how: 'Throw a ball overhand into the service box to feel the relaxed up-and-out arm motion the serve copies. Then serve with the same feel. 2 sets of 10.' },
    { name: 'Contact-point reach', how: 'Serve while focusing only on reaching up to the highest comfortable contact, slightly in front. Don’t aim hard — let the height create the angle down into the box. 3 sets of 10.' },
  ],
  mistakesToAvoid: [
    'An inconsistent toss — the root cause of most serve misses.',
    'A tight arm that pushes the ball instead of whipping up to it.',
    'Contact too low and cramped against the body.',
    'Serving all-arm with no leg drive or trunk rotation.',
  ],
  whenToWorkWithCoach:
    'If your toss is consistent but pace or reliability still won’t come, a coach can check your grip (continental), trophy position, and leg drive — small fixes there unlock the chain.',
  faqs: [
    { question: 'Why is my tennis serve so inconsistent?', answer: 'Almost always the toss. If it drifts in location or height, your contact point changes every serve. Groove a repeatable, slightly-in-front toss first; the rest of the serve stabilizes around it.' },
    { question: 'How do I add power to my serve?', answer: 'Relax your arm and let the racket head accelerate up to a high contact point, and add leg drive and trunk rotation. Power is whip and chain, not muscle.' },
    { question: 'Where should my toss land?', answer: 'For a flat/first serve, slightly in front of your hitting shoulder, at the height of your full reach. Let it drop and check that it lands consistently in that spot.' },
  ],
  relatedLinks: [
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'Tennis grips explained', href: '/tennis/tennis-grips-explained' },
    { label: 'Forehand analysis', href: '/tennis/forehand-analysis' },
    { label: 'Tennis benchmarks', href: '/benchmarks/tennis' },
  ],
  cta: TENNIS_CTA,
  schemaType: 'HowTo',
  safetyNotes: RACKET_SAFETY,
  publishStatus: 'published',
};

// ── Tennis: volley ──────────────────────────────────────────────
const TENNIS_VOLLEY: SeoPage = {
  slug: 'tennis/volley-technique',
  sport: 'tennis',
  audience: 'player',
  keyword: 'how to hit a tennis volley',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Hit a Tennis Volley (Punch, Don’t Swing)',
  metaDescription:
    'A clean tennis volley is a short punch with a firm wrist and a continental grip — not a swing. Here is how to diagnose and groove compact, controlled volleys.',
  directAnswer:
    'A volley is a short, firm punch out in front — not a groundstroke swing. Hold a continental grip, keep a firm wrist, meet the ball in front with a compact “catch and push,” and let your body move forward into it. Most volley errors come from taking a backswing or breaking the wrist; shorten the motion and stay firm and contact cleans up immediately.',
  problemExplanation: [
    'At the net you have very little time, so the volley is a controlled block/punch: racket out in front, firm wrist, minimal backswing, and a small forward push through the ball.',
    'Players bring groundstroke habits to the net — a backswing and a wristy stroke — which produces late, spraying contact. Compactness and a firm wrist are what create control.',
  ],
  diagnosisSteps: [
    'Are you taking the racket back behind your body before volleying? (You shouldn’t.)',
    'Is contact in front of you, or beside/behind your body?',
    'Does your wrist stay firm, or flick at the ball?',
    'Are you moving forward through the volley or standing still and reaching?',
  ],
  whatSwingVantageLooksFor: [
    'Backswing length (should be minimal)',
    'Contact point in front of the body',
    'Wrist firmness through contact',
    'Forward movement / weight transfer into the ball',
  ],
  exampleDiagnosis:
    'Example: "You take a half-backswing and contact the ball beside your hip, so volleys fly long. Cutting the backswing and meeting the ball a foot in front turned them into controlled, deep punches."',
  drills: [
    { name: 'No-backswing wall punches', how: 'Stand close to a wall and volley with zero backswing — just punch and recover. If the ball keeps coming back controlled, your motion is compact enough. 3 sets of 20.' },
    { name: 'Catch-the-ball volley', how: 'Have a partner feed; instead of hitting, “catch” the ball on your strings out in front to feel the firm, in-front contact, then add a small push. 2 sets of 10.' },
    { name: 'Step-in feeds', how: 'On each feed, step forward with the opposite foot as you volley so your weight moves through the ball. 2 sets of 10 each side.' },
  ],
  mistakesToAvoid: [
    'Taking a backswing — there’s no time, and it causes late contact.',
    'A loose, flicking wrist instead of a firm punch.',
    'Letting the ball get beside or behind you.',
    'Standing flat-footed and reaching instead of moving forward.',
  ],
  whenToWorkWithCoach:
    'If your volleys float long or sit up no matter how compact you are, a coach can check your grip (continental) and whether you’re opening the racket face too much.',
  faqs: [
    { question: 'Should you swing at a volley?', answer: 'No. A volley is a short punch with a firm wrist and almost no backswing. The pace comes from the incoming ball and a small forward push, not a swing.' },
    { question: 'What grip should I use for volleys?', answer: 'The continental (“hammer”) grip lets you hit both forehand and backhand volleys without changing — essential given how little time you have at the net.' },
    { question: 'Why do my volleys go long?', answer: 'Usually a backswing plus an open racket face. Shorten to a punch, firm the wrist, and meet the ball in front.' },
  ],
  relatedLinks: [
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'Serve technique', href: '/tennis/serve-technique' },
    { label: 'Tennis grips explained', href: '/tennis/tennis-grips-explained' },
    { label: 'Tennis benchmarks', href: '/benchmarks/tennis' },
  ],
  cta: TENNIS_CTA,
  schemaType: 'HowTo',
  safetyNotes: RACKET_SAFETY,
  publishStatus: 'published',
};

// ── Baseball: launch angle for power ────────────────────────────
const BASEBALL_LAUNCH_ANGLE: SeoPage = {
  slug: 'baseball/launch-angle-for-power',
  sport: 'baseball',
  audience: 'player',
  keyword: 'baseball launch angle for power',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Baseball Launch Angle: How to Drive the Ball for Power',
  metaDescription:
    'Driving the ball comes from matching your bat path to the pitch and getting on plane early — not swinging up. Here is how to find a productive launch angle.',
  directAnswer:
    'Productive power comes from getting your bat on the plane of the pitch early and matching a slightly upward path to it — which produces hard line drives and backspin carry, generally in a 10–25° launch window. You don’t create this by “swinging up”; you create it with bat path and an on-time, behind-the-ball contact point. Hit the ball hard on a line first, and useful launch follows.',
  problemExplanation: [
    'Launch angle is the up/down angle the ball leaves the bat. The most productive hitters live in a line-drive-to-slight-lift window because that combines exit velocity with carry — not the highest possible angle.',
    'You earn that angle through bat path: getting the barrel on plane with the pitch early and staying through it, with contact slightly out front. Trying to manufacture lift by uppercutting steepens the path and produces weak fly balls and swings-and-misses.',
  ],
  diagnosisSteps: [
    'Chart contact: mostly hard line drives, or ground balls and lazy fly balls?',
    'Film from the side — does your barrel get on the pitch plane early, or drop then chop?',
    'Where is contact: out front (good) or deep by your body?',
    'Are you trying to “lift” with the back shoulder dipping?',
  ],
  whatSwingVantageLooksFor: [
    'Bat path on-plane with the pitch (attack angle)',
    'Contact-point depth (out front vs. deep)',
    'Back-shoulder tilt and posture',
    'Whether power comes from sequence or from steepening the path',
  ],
  exampleDiagnosis:
    'Example: "Your barrel drops below the plane then chops up, so you alternate grounders and pop-ups. Getting on plane earlier and keeping contact out front turned those into line drives with real carry."',
  drills: [
    { name: 'High-tee / low-tee', how: 'Alternate a higher and a lower tee and drive line drives off both. If one becomes a grounder or pop-up, it exposes your path tendency. 3 rounds of 8.' },
    { name: 'On-plane top-hand drill', how: 'Choke up and swing one-handed (top hand) at half speed, feeling the barrel match the pitch plane and stay through it. Re-blend two hands. 2 sets of 8.' },
    { name: 'Line-drive tee blocks', how: 'Drive balls into the top third of a net 15 ft away off a belt-high tee; score line drives out of 10. Build the path before chasing distance. 3 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Uppercutting to “lift” the ball — it steepens the path and adds whiffs.',
    'Dropping the back shoulder to get under it.',
    'Letting the barrel get deep instead of contacting out front.',
    'Judging a swing by one home run instead of consistent hard contact.',
  ],
  whenToWorkWithCoach:
    'If your contact stays inconsistent (grounders and pop-ups) after tee path work, a hitting coach or your swing analysis can confirm whether it’s attack angle, contact depth, or sequence.',
  faqs: [
    { question: 'What launch angle is best in baseball?', answer: 'For most hitters a line-drive-to-slight-lift window (roughly 10–25°) combines exit velocity with carry. The highest launch angles are not the most productive — they trade hard contact for easy fly-outs.' },
    { question: 'How do I hit for more power?', answer: 'Get your bat on the pitch plane early, contact the ball out front, and use your legs and trunk to sequence the swing. Power is path + sequence + exit velocity, not swinging up.' },
    { question: 'Should I try to swing up?', answer: 'No — match a slightly upward path to the pitch via bat path, not by uppercutting. Manufactured lift usually steepens the swing and costs you contact.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Exit velocity drills', href: '/baseball/exit-velocity-drills' },
    { label: 'Stop rolling over', href: '/baseball/stop-rolling-over' },
    { label: 'Baseball benchmarks', href: '/benchmarks/baseball' },
  ],
  cta: BASEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: BASEBALL_SAFETY,
  publishStatus: 'published',
};

// ── Baseball: staying inside the ball ───────────────────────────
const BASEBALL_INSIDE_BALL: SeoPage = {
  slug: 'baseball/staying-inside-the-ball',
  sport: 'baseball',
  audience: 'player',
  keyword: 'how to stay inside the baseball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 3,
  title: 'How to Stay Inside the Baseball (Stop Casting)',
  metaDescription:
    'Staying inside the ball means leading with the hands and knob, not casting the barrel out early. Here is how to diagnose casting and groove a tight, quick path.',
  directAnswer:
    'Staying inside the ball means your hands and the knob of the bat lead toward the ball while the barrel stays back, then releases through contact — instead of “casting” the barrel out and around early. The fix is sequence and connection: turn with the body, keep the hands close, and let the barrel whip last. Stay inside and you square more pitches, especially inside ones, with a quicker, more direct path.',
  problemExplanation: [
    'Casting is when the barrel flies away from your body early in the swing, creating a long, loopy path. It produces rollovers to the pull side, weak contact on inside pitches, and being late on velocity.',
    'Staying inside means the hands lead and the barrel lags and releases through the zone — a shorter, quicker path that lets you adjust and drive the ball where it’s pitched.',
  ],
  diagnosisSteps: [
    'Do you roll over and pull weak grounders, especially on inside pitches?',
    'Film from the side/behind: does the barrel fly out early or stay back as the hands move first?',
    'Are you late on faster pitches because the path is long?',
    'Can you drive an inside pitch, or do you get jammed/pull off?',
  ],
  whatSwingVantageLooksFor: [
    'Hand path and knob direction to the ball',
    'Barrel lag vs. early casting',
    'Connection between the hands and the turning body',
    'Contact quality by pitch location',
  ],
  exampleDiagnosis:
    'Example: "Your barrel casts out early, so your path is long and you roll over inside pitches. A connection drill that keeps the hands in tightened the path and you started driving the inside pitch."',
  drills: [
    { name: 'Towel/glove under the lead arm', how: 'Tuck a small towel under your lead armpit and take swings keeping it pinned through contact. It teaches connection so the barrel can’t cast out early. 3 sets of 8.' },
    { name: 'Inside-pitch tee', how: 'Set the tee inside (closer to your hands) and drive it to the pull-side gap on a line. You can only do it by staying inside the ball. 3 sets of 8.' },
    { name: 'Knob-to-the-ball cue', how: 'Slow swings feeling the knob of the bat lead toward the ball before the barrel releases. Build the feel, then add speed. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Casting the barrel out and around early (long, loopy path).',
    'Throwing the hands away from the body.',
    'Trying to pull everything — it reinforces casting.',
    'Confusing “staying inside” with pushing the ball the other way weakly — it’s a quicker path, not a softer one.',
  ],
  whenToWorkWithCoach:
    'If you keep rolling over or getting jammed inside after connection drills, a coach can check your sequence and grip — casting often starts at the top with the upper body unwinding first.',
  faqs: [
    { question: 'What does “stay inside the ball” mean?', answer: 'It means leading with your hands and the knob of the bat while the barrel stays back, then releases through contact — a short, direct path instead of casting the barrel out early.' },
    { question: 'How do I stop casting in my swing?', answer: 'Build connection (hands close to the body) and sequence (body turns, barrel whips last). The towel-under-the-arm and inside-pitch tee drills groove it quickly.' },
    { question: 'Why do I roll over on inside pitches?', answer: 'Usually casting — the long, around path gets the barrel out early so you hook inside pitches into weak grounders. Staying inside lets you square and drive them.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Stop rolling over', href: '/baseball/stop-rolling-over' },
    { label: 'Hit the other way', href: '/baseball/hit-the-other-way' },
    { label: 'Launch angle for power', href: '/baseball/launch-angle-for-power' },
  ],
  cta: BASEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: BASEBALL_SAFETY,
  publishStatus: 'published',
};

// ── Pickleball: serve ───────────────────────────────────────────
const PICKLEBALL_SERVE: SeoPage = {
  slug: 'pickleball-serve',
  sport: 'pickleball',
  audience: 'player',
  keyword: 'pickleball serve technique',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Pickleball Serve Technique: Deep, Consistent, and Legal',
  metaDescription:
    'A good pickleball serve is deep and consistent with a low-to-high swing and a legal below-the-waist contact. Here is how to groove depth without faulting.',
  directAnswer:
    'A reliable pickleball serve is about depth and consistency, not power: use a smooth low-to-high swing, contact the ball below your waist with an upward arc (volley-serve rules), and aim deep toward the baseline. Most serve problems are inconsistent contact or serving short — slow down, keep a relaxed arm, and groove a repeatable toss/drop and swing.',
  problemExplanation: [
    'The serve only starts the point, so the priority is getting it in deep and consistently — a deep serve pushes opponents back and buys you time. Power that costs you consistency is a bad trade.',
    'The standard volley serve must be struck below the waist with an upward motion and the paddle head below the wrist. Faults and inconsistency usually come from rushing, a tense arm, or an inconsistent ball release.',
  ],
  diagnosisSteps: [
    'Do your serves land deep (last few feet), or short and attackable?',
    'Is your contact below the waist with an upward arc (legal), or borderline?',
    'Is your ball release/drop consistent serve to serve?',
    'Is your arm relaxed, or tight and jabby?',
  ],
  whatSwingVantageLooksFor: [
    'Contact height and the low-to-high swing path',
    'Consistency of the ball release and contact point',
    'Arm relaxation and smooth acceleration',
    'Depth and direction control',
  ],
  exampleDiagnosis:
    'Example: "Your toss/drop varies and you tense up, so serves land short and inconsistent. A repeatable release and a smoother low-to-high swing put them consistently deep."',
  drills: [
    { name: 'Deep-target serve', how: 'Place a target (towel) in the last 3 feet before the baseline and serve to land it. Score makes out of 10. Train depth over power. 3 sets of 10.' },
    { name: 'Consistent-drop reps', how: 'Practice releasing/dropping the ball to the same spot every time without hitting, then add the swing. A repeatable release fixes most inconsistency. 2 sets of 10.' },
    { name: 'Smooth low-to-high', how: 'Serve at 70% effort focusing only on a relaxed, low-to-high swing and clean contact below the waist. Speed comes later. 3 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Going for power and sacrificing depth and consistency.',
    'An inconsistent ball release/drop.',
    'A tense, jabby arm instead of a smooth swing.',
    'Serving short, which lets opponents step in and attack.',
  ],
  whenToWorkWithCoach:
    'If your serve depth won’t stabilize or you’re unsure your motion is legal, a coach or rec-center clinic can confirm your contact point and smooth out the swing.',
  faqs: [
    { question: 'What makes a good pickleball serve?', answer: 'Depth and consistency. A serve that lands deep and goes in every time is worth far more than a fast one you miss — it pushes opponents back and starts the point in your favor.' },
    { question: 'What are the pickleball serve rules?', answer: 'For the standard volley serve, contact must be below your waist with an upward (low-to-high) motion and the paddle head below your wrist. The drop serve is also allowed. Check current USA Pickleball rules for specifics.' },
    { question: 'Why is my serve inconsistent?', answer: 'Usually an inconsistent ball release plus a tense arm. Groove a repeatable drop/toss and a smooth low-to-high swing at moderate effort.' },
  ],
  relatedLinks: [
    { label: 'Pickleball analysis', href: '/pickleball' },
    { label: 'Third-shot drop', href: '/pickleball-third-shot-drop' },
    { label: 'Dinking', href: '/pickleball-dinking' },
    { label: 'Pickleball benchmarks', href: '/benchmarks/pickleball' },
  ],
  cta: PICKLEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: RACKET_SAFETY,
  publishStatus: 'published',
};

// ── Padel: serve ────────────────────────────────────────────────
const PADEL_SERVE: SeoPage = {
  slug: 'padel-serve',
  sport: 'padel',
  audience: 'player',
  keyword: 'padel serve technique',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Padel Serve Technique: Placement Over Power',
  metaDescription:
    'A good padel serve is an underarm serve placed low and wide so you can take the net — not a power serve. Here is how to groove a consistent, well-placed serve.',
  directAnswer:
    'The padel serve is an underarm serve (contact at or below waist, ball bounced first) where placement beats power: serve low and wide so the ball stays low off the side wall and you can move in to take the net. Consistency and a relaxed, controlled swing matter far more than speed — a well-placed serve sets up the point; a hard one mostly helps your opponent.',
  problemExplanation: [
    'In padel the server’s goal is to win the net, so the serve is a controlled setup shot, not a weapon. You bounce the ball, contact it at or below waist height, and place it — typically low and toward the side wall — then move forward.',
    'Trying to hit it hard tends to sit the ball up off the back glass for an easy return, and costs you the consistency you need to keep taking the net.',
  ],
  diagnosisSteps: [
    'Does your serve stay low and tight to the side wall, or sit up off the glass?',
    'Is your contact controlled at/below the waist after a clean bounce?',
    'Are you moving in to take the net after serving, or staying back?',
    'Is your swing relaxed and repeatable, or a tense power swing?',
  ],
  whatSwingVantageLooksFor: [
    'Contact height and control on the underarm motion',
    'Placement (low, wide, into the side wall)',
    'Consistency of the bounce + contact',
    'Transition forward to take the net',
  ],
  exampleDiagnosis:
    'Example: "You swing hard and the serve sits up off the back wall for easy returns. A slower, placed serve low into the side wall let you take the net and control the point."',
  drills: [
    { name: 'Wide-and-low target', how: 'Place a target near the side wall in the service box and serve to land it low and wide. Score makes out of 10 — reward placement, not pace. 3 sets of 10.' },
    { name: 'Bounce-and-place', how: 'Focus only on a consistent bounce and a controlled at/below-waist contact, placing the ball softly and accurately. 2 sets of 10.' },
    { name: 'Serve-and-move', how: 'After each serve, move forward to the net position so the serve and transition become one habit. 2 sets of 8.' },
  ],
  mistakesToAvoid: [
    'Serving for power — it sits up off the glass for an easy return.',
    'Inconsistent bounce/contact height.',
    'Staying back after serving instead of taking the net.',
    'Aiming for the middle instead of low and wide.',
  ],
  whenToWorkWithCoach:
    'If your serve keeps sitting up off the back wall or your placement is erratic, a padel coach can check your contact point and the simple swing that keeps it low.',
  faqs: [
    { question: 'How do you serve in padel?', answer: 'Underarm: bounce the ball once, then contact it at or below waist height and place it — usually low and toward the side wall — then move in to take the net. Placement and consistency beat power.' },
    { question: 'Should a padel serve be hard?', answer: 'No. A hard serve tends to bounce up off the back glass for an easy return. A low, well-placed serve keeps the ball awkward and lets you take the net.' },
    { question: 'Where should I aim my padel serve?', answer: 'Generally low and wide so the ball stays low off the side wall, making the return difficult while you move forward.' },
  ],
  relatedLinks: [
    { label: 'Padel analysis', href: '/padel' },
    { label: 'Bandeja technique', href: '/padel-bandeja' },
    { label: 'Wall rebound technique', href: '/padel-wall-rebound-technique' },
    { label: 'Padel benchmarks', href: '/benchmarks/padel' },
  ],
  cta: PADEL_CTA,
  schemaType: 'HowTo',
  safetyNotes: RACKET_SAFETY,
  publishStatus: 'published',
};

// ── Golf: how to hit a driver ───────────────────────────────────
const GOLF_DRIVER: SeoPage = {
  slug: 'golf/how-to-hit-a-driver',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to hit a driver',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Hit a Driver: Tee It High and Hit Up',
  metaDescription:
    'The driver is the one club you hit UP on: tee it high, play it forward, and catch it on the upswing for distance with low spin. Here is how to groove it.',
  directAnswer:
    'A good driver swing is built for an upward strike. Tee the ball high (about half the ball above the crown), play it forward off your lead heel, widen your stance, and add a slight tilt away from the target so you catch the ball on the upswing. Unlike irons (ball-first, hitting down), the driver wants a positive attack angle — hit up on it and you gain distance with less spin and a straighter ball.',
  problemExplanation: [
    'The driver is your longest, lowest-loft club and it sits on a tee, so it rewards an ascending strike and a wide, sweeping arc. Hitting up launches the ball higher with less backspin — the recipe for carry.',
    'Most driver problems come from treating it like an iron: ball too far back, a narrow stance, and a downward, steep strike that adds spin and produces pop-ups, slices, and short, ballooning shots.',
  ],
  diagnosisSteps: [
    'Where is the ball teed and positioned — high and off the lead heel, or low and centered?',
    'Film from behind: are you hitting down on it (steep) or sweeping up?',
    'Is your stance wide enough to create a shallow, wide arc?',
    'Do you have a slight tilt away from the target at address and impact?',
  ],
  whatSwingVantageLooksFor: [
    'Angle of attack (should be positive/upward with a driver)',
    'Ball position and tee height',
    'Width of the swing arc and shallowness',
    'Spine tilt away from the target through impact',
  ],
  exampleDiagnosis:
    'Example: "You hit down on the driver from a centered ball position, so your shots balloon with spin and leak right. Moving the ball forward and feeling an upward strike added carry and straightened the flight."',
  drills: [
    { name: 'High-tee sweep', how: 'Tee the ball high and try to sweep it off the tee without taking any grass — catch it slightly on the upswing. If you keep clipping the tee down, you’re still hitting down. 3 sets of 8.' },
    { name: 'Ball-forward + tilt', how: 'Set the ball off your lead heel and tilt your trail shoulder slightly down at address. Hold that tilt through impact so the low point is behind the ball (good for driver). 2 sets of 8.' },
    { name: 'Wide-and-slow takeaway', how: 'Make slow swings feeling a wide, low takeaway and a full turn, building the sweeping arc the driver needs. Then add speed. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Playing the ball back/centered and hitting down (high spin, pop-ups).',
    'Teeing the ball too low.',
    'A narrow stance that steepens the swing.',
    'Swinging out of your shoes — tempo and an upward strike beat raw effort.',
  ],
  whenToWorkWithCoach:
    'If you keep hitting down on the driver or slicing it despite ball-position and tee changes, a coach can check your attack angle and path — driver faults often trace back to setup and an out-to-in path.',
  faqs: [
    { question: 'Should you hit up or down on a driver?', answer: 'Up. The driver is the one club you want to strike on the upswing (a positive attack angle) for more carry and less spin. Irons are the opposite — you hit down on those.' },
    { question: 'Where should I tee the ball for a driver?', answer: 'High — about half the ball above the crown of the driver — and forward, off your lead heel. That setup makes the upward strike natural.' },
    { question: 'Why do I pop up or slice my driver?', answer: 'Usually hitting down on it from a ball that’s too far back, often with an out-to-in path. Move the ball forward, tee it higher, and feel an upward sweep.' },
  ],
  relatedLinks: [
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Why do I slice my driver?', href: '/golf/why-do-i-slice-my-driver' },
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
    { label: 'Break 90 practice plan', href: '/golf/practice-plan-to-break-90' },
  ],
  cta: { label: 'Analyze My Golf Swing Free', href: '/start?sport=golf' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up before full-speed swings, build speed gradually, and use a properly fitted driver. Stop if anything hurts.',
  publishStatus: 'published',
};

// ── Pickleball: drive ───────────────────────────────────────────
const PICKLEBALL_DRIVE: SeoPage = {
  slug: 'pickleball-drive',
  sport: 'pickleball',
  audience: 'player',
  keyword: 'pickleball drive shot',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 3,
  title: 'The Pickleball Drive: Pace With Topspin (Not a Blast)',
  metaDescription:
    'A good pickleball drive is a controlled low-to-high groundstroke with topspin — pace plus net clearance and dip, not a flat blast that sails out. Here is how.',
  directAnswer:
    'A pickleball drive is a controlled groundstroke off the bounce that you hit with pace and topspin to pressure opponents or set up your third shot. Brush low-to-high up the back of the ball for net clearance and downward dip, keep the swing compact, and contact out in front. The mistake is a flat, all-out blast — without topspin it sails long, and without control it’s easy to counter.',
  problemExplanation: [
    'The drive is most useful as a pressure shot off a higher/shorter ball or as a fourth/fifth-shot option — pace that forces a pop-up you can attack. Topspin is what lets you swing hard and still land it in.',
    'Players hit it flat and as hard as possible, so it either sails out or comes back fast. A low-to-high brush adds the spin that brings the ball down inside the lines and makes it dip at your opponent’s feet.',
  ],
  diagnosisSteps: [
    'Do your drives sail long, or land in with margin over the net?',
    'Are you brushing up the back of the ball (topspin) or hitting flat?',
    'Is contact out in front, or beside/behind you?',
    'Is the swing compact and controlled, or a big flat blast?',
  ],
  whatSwingVantageLooksFor: [
    'Low-to-high swing path and topspin',
    'Contact point out in front',
    'Compactness and control vs. over-swinging',
    'Net clearance and depth of the drive',
  ],
  exampleDiagnosis:
    'Example: "You drive flat and as hard as you can, so it sails out. Brushing low-to-high for topspin let you keep the pace but bring the ball down inside the baseline."',
  drills: [
    { name: 'Topspin brush', how: 'Feed yourself balls off the bounce and focus only on brushing low-to-high so the ball dips. Aim deep but inside the baseline. Score landings in. 3 sets of 10.' },
    { name: 'Compact-swing drive', how: 'Drive at 80% with a shorter backswing and follow-through, prioritizing control and contact out front over raw pace. 2 sets of 10.' },
    { name: 'Drive-then-recover', how: 'After each drive, split-step and prepare for the counter so the drive becomes part of a sequence, not a one-off swing. 2 sets of 8.' },
  ],
  mistakesToAvoid: [
    'Hitting flat and as hard as possible — it sails out.',
    'No topspin, so you can’t create margin or dip.',
    'Letting the ball get beside or behind you.',
    'Driving from a low/defensive ball you should reset instead.',
  ],
  whenToWorkWithCoach:
    'If your drive keeps sailing out even with a brush motion, a coach can check your paddle face angle and contact point — an open face plus flat path is the usual culprit.',
  faqs: [
    { question: 'How do you hit a drive in pickleball?', answer: 'Take a compact low-to-high swing and brush up the back of the ball for topspin, contacting it out in front. The spin lets you add pace while still bringing the ball down inside the lines.' },
    { question: 'When should I drive in pickleball?', answer: 'Off a higher or shorter ball, or as a fourth/fifth-shot pressure option — to force a pop-up you can attack. Don’t drive a low, defensive ball; reset it instead.' },
    { question: 'Why do my drives go out?', answer: 'Usually a flat, hard swing with no topspin and/or an open paddle face. Brush low-to-high to add spin and dip, and contact the ball in front.' },
  ],
  relatedLinks: [
    { label: 'Pickleball analysis', href: '/pickleball' },
    { label: 'Serve technique', href: '/pickleball-serve' },
    { label: 'Third-shot drop', href: '/pickleball-third-shot-drop' },
    { label: 'Dinking', href: '/pickleball-dinking' },
  ],
  cta: PICKLEBALL_CTA,
  schemaType: 'HowTo',
  safetyNotes: RACKET_SAFETY,
  publishStatus: 'published',
};

// ── Padel: vibora ───────────────────────────────────────────────
const PADEL_VIBORA: SeoPage = {
  slug: 'padel-vibora',
  sport: 'padel',
  audience: 'player',
  keyword: 'padel vibora technique',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 3,
  title: 'Padel Vibora: The Attacking Slice Overhead',
  metaDescription:
    'The padel vibora is an aggressive sliced overhead with side-spin that skids low and keeps you at the net — more attacking than a bandeja. Here is how to hit it.',
  directAnswer:
    'The vibora is an aggressive, sliced overhead hit with the racket face slightly open and a brushing, side-spin action — more attacking than a bandeja but more controlled than a smash. You contact the ball slightly in front with a compact, downward-and-across brush so it skids low and stays awkward, letting you hold the net. It’s a control-and-pressure shot, not an all-out winner.',
  problemExplanation: [
    'The vibora lives between the safe bandeja and the go-for-it smash: it carries more pace and a wicked side-spin skid that pressures opponents while still letting you keep your net position.',
    'The shot is defined by the brushing slice. Hitting it flat turns it into a risky smash; not brushing enough makes it sit up. The cut (side and under) is what makes the ball skid low and kick off the side wall.',
  ],
  diagnosisSteps: [
    'Are you brushing the ball (side-spin slice) or hitting it flat?',
    'Is contact slightly in front and at a comfortable height, or behind/too high?',
    'Does the ball skid low after the bounce, or sit up?',
    'Do you keep your net position after the shot, or get pushed back?',
  ],
  whatSwingVantageLooksFor: [
    'Brushing slice action (side + under spin)',
    'Contact point in front and to the side',
    'Compact, controlled swing vs. an all-out smash',
    'Body position and recovery to hold the net',
  ],
  exampleDiagnosis:
    'Example: "You flatten the vibora into a half-smash that pops up off the back glass. Adding a true brushing slice with contact more in front produced a low, skidding ball that kept you at the net."',
  drills: [
    { name: 'Shadow the brush', how: 'Without a ball, rehearse the high-to-low-and-across brushing motion with a slightly open face until it’s smooth and repeatable. 3 sets of 15.' },
    { name: 'Feed-and-cut', how: 'Have a partner feed easy lobs; focus only on brushing side-spin and placing the ball low and wide, not on power. Score low-skidding placements. 3 sets of 10.' },
    { name: 'Vibora-and-hold', how: 'Hit the vibora and immediately re-set your net position so the shot and recovery become one habit. 2 sets of 8.' },
  ],
  mistakesToAvoid: [
    'Flattening it into a risky smash instead of brushing a slice.',
    'Contact too high or behind you (loss of control).',
    'Going for an outright winner and sacrificing your net position.',
    'No side-spin, so the ball sits up off the glass.',
  ],
  whenToWorkWithCoach:
    'If your vibora sits up or sails, a padel coach can check your contact point and the brushing action — the side-and-under cut is subtle and easiest to learn with eyes on it.',
  faqs: [
    { question: 'What is a vibora in padel?', answer: 'An aggressive sliced overhead with side-spin, hit between a bandeja (safe, controlled) and a smash (all-out). It skids low and keeps opponents pinned while you hold the net.' },
    { question: 'How is the vibora different from the bandeja?', answer: 'The bandeja is a safe, controlled overhead to maintain position; the vibora carries more pace and side-spin to pressure opponents. Both let you keep the net, but the vibora is the more attacking of the two.' },
    { question: 'How do I hit a vibora?', answer: 'Open the face slightly and brush the ball high-to-low and across (side-spin), contacting it a little in front with a compact swing. Place it low and wide so it skids — control over power.' },
  ],
  relatedLinks: [
    { label: 'Padel analysis', href: '/padel' },
    { label: 'Bandeja technique', href: '/padel-bandeja' },
    { label: 'Serve technique', href: '/padel-serve' },
    { label: 'Wall rebound technique', href: '/padel-wall-rebound-technique' },
  ],
  cta: PADEL_CTA,
  schemaType: 'HowTo',
  safetyNotes: RACKET_SAFETY,
  publishStatus: 'published',
};

/** Cross-sport technique gap pages, spread into SEO_PAGES in seoPages.ts. */
export const MULTI_SPORT_GAP_PAGES: SeoPage[] = [
  TENNIS_SERVE,
  TENNIS_VOLLEY,
  BASEBALL_LAUNCH_ANGLE,
  BASEBALL_INSIDE_BALL,
  PICKLEBALL_SERVE,
  PADEL_SERVE,
  GOLF_DRIVER,
  PICKLEBALL_DRIVE,
  PADEL_VIBORA,
];
