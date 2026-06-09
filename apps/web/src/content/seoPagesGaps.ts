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

/** Cross-sport technique gap pages, spread into SEO_PAGES in seoPages.ts. */
export const MULTI_SPORT_GAP_PAGES: SeoPage[] = [
  TENNIS_SERVE,
  TENNIS_VOLLEY,
  BASEBALL_LAUNCH_ANGLE,
  BASEBALL_INSIDE_BALL,
  PICKLEBALL_SERVE,
  PADEL_SERVE,
];
