// ============================================================
// SwingVantage — SEO Content: Pickleball & Padel
//
// Racket-sport SEO landing pages, kept in this sibling file (like
// seoPagesWedges.ts) to keep the main registry edit minimal. Spread
// into SEO_PAGES via RACKET_PAGES.
//
// QUALITY RULE: only 'published' entries are routed + indexed. Each
// published entry MUST have a matching page.tsx route. 'draft'
// entries are prepared backlog (the full pillar map for pickleball
// and padel) that are NOT yet routed — promote to 'published' and
// add a page.tsx when the content is shipped.
// ============================================================

import type { SeoPage } from './seoPages';

// ──────────────────────────────────────────────────────────────
// Pickleball — published
// ──────────────────────────────────────────────────────────────

const PICKLEBALL_PILLAR: SeoPage = {
  slug: 'pickleball',
  sport: 'pickleball',
  audience: 'player',
  keyword: 'pickleball swing analysis',
  intent: 'commercial',
  funnelStage: 'consideration',
  priority: 1,
  title: 'Pickleball Swing & Video Analysis (AI Coaching)',
  metaDescription:
    'SwingVantage analyzes your pickleball strokes — dinks, third-shot drops, drives, and volleys — and gives your top priority, beginner-safe drills, and a plan. Free to start.',
  directAnswer:
    'SwingVantage is an AI swing and video analysis platform built specifically for pickleball — not adapted from tennis. Upload a video of your dink, third-shot drop, or drive and you get your single highest-priority issue, the visible evidence behind it, beginner-safe drills, and a simple practice plan. Pickleball rewards a compact stroke, paddle-face control, and the non-volley-zone (kitchen) game, and the analysis is tuned for exactly that.',
  problemExplanation: [
    'Most coaching content treats pickleball like small-court tennis. It is not: the stroke is compact with no long backswing, the paddle has no strings to brush, and the kitchen line governs footwork and shot selection. Tennis advice often makes pickleball errors worse.',
    'SwingVantage reads your stroke against pickleball-specific checkpoints — backswing compactness, paddle-face angle, contact height, the soft game, and kitchen-line movement — so the feedback fits the sport you actually play.',
  ],
  diagnosisSteps: [
    'Pick the shot you want to improve (dink, third-shot drop, drive, reset, or volley).',
    'Film side-on so the paddle face, contact height, and arc are visible.',
    'Review your top priority and the visible evidence behind it.',
    'Follow the three drills and the practice plan, then retest.',
  ],
  whatSwingVantageLooksFor: [
    'Backswing compactness (pickleball is not a tennis loop)',
    'Paddle-face angle and stability at contact',
    'Contact height and contact point relative to the body',
    'Low-to-high lift for dinks/drops vs. a level path for drives/volleys',
    'Split-step timing and kitchen-line footwork',
  ],
  drills: [
    { name: 'Net-skimmer dink gate', how: 'Cross-court dink over a target ~6 inches above the net, keeping the paddle face stable and lifting with the legs. 5 minutes.' },
    { name: 'Third-shot drop arc', how: 'From the baseline, hit drops that arc to peak on your side of the net and land soft in the kitchen. 3 sets of 15.' },
    { name: 'Compact-backswing fence drill', how: 'Volley a foot from a fence — if the paddle hits it, the backswing is too long. Keep prep in front of the back hip.' },
  ],
  mistakesToAvoid: [
    'Taking a long, tennis-style backswing.',
    'Opening the paddle face and popping dinks up into the attack zone.',
    'Speeding up balls that are below net height.',
    'Rushing through the transition zone instead of resetting.',
  ],
  whenToWorkWithCoach:
    'A coach or clinic is valuable for grip, footwork, and the timing of the soft game. SwingVantage helps you practice the right priority between sessions and see whether it is sticking.',
  faqs: [
    { question: 'Is pickleball analysis just tennis analysis?', answer: 'No. SwingVantage uses a pickleball-specific engine — compact stroke, paddle-face control, the kitchen, and the third-shot drop — not tennis groundstroke checkpoints.' },
    { question: 'Do I need special equipment?', answer: 'No. A phone video filmed side-on is enough. Your full video stays on your device; only selected frames are ever sent for optional AI review.' },
    { question: 'Can it help my DUPR?', answer: 'It targets the mechanics and shot selection behind your rating — the third-shot drop, resets, and speed-up discipline that move DUPR most. Improvement still comes from practice.' },
  ],
  relatedLinks: [
    { label: 'Pickleball third-shot drop', href: '/pickleball-third-shot-drop' },
    { label: 'Pickleball dinking', href: '/pickleball-dinking' },
    { label: 'Padel swing analysis', href: '/padel' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Pickleball Free', href: '/dashboard' },
  schemaType: 'Service',
  safetyNotes:
    'Drills are beginner-safe. Warm up and stop if anything hurts. Wear eye protection for fast hands battles. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const PICKLEBALL_THIRD_SHOT_DROP: SeoPage = {
  slug: 'pickleball-third-shot-drop',
  sport: 'pickleball',
  audience: 'player',
  keyword: 'pickleball third shot drop',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Hit a Better Third-Shot Drop in Pickleball',
  metaDescription:
    'A reliable third-shot drop comes from lifting with your legs on a soft arc that peaks before the net and lands in the kitchen. Diagnose yours and groove it with drills.',
  directAnswer:
    'A great third-shot drop is a soft shot that arcs up, peaks on your side of the net, and lands unattackable in the kitchen so your team can move to the line. The keys are lifting with your legs (not your wrist), keeping a stable, slightly open paddle face, contacting out in front, and not decelerating into the ball. Most netted drops come from a flat, all-arm swing with no leg lift.',
  problemExplanation: [
    'The third-shot drop is the shot that gets a serving team from the baseline to the kitchen line — the most important real estate in pickleball. Without it you are stuck defending drives.',
    'The two failure modes are netting it (decelerating, no leg lift, contact behind the body) and floating it too high (open face, too much pace) so it gets attacked. The fix is a calm, leg-driven lift on a soft arc.',
  ],
  diagnosisSteps: [
    'Chart your drops: mostly into the net, or popping up to be attacked?',
    'Check the lift: are your legs bending and extending, or is it all arm?',
    'Check contact: is it out in front, or behind your body?',
    'Film side-on to see the arc relative to the net.',
  ],
  whatSwingVantageLooksFor: [
    'Leg drive and a low-to-high paddle path',
    'Paddle-face angle and stability at contact',
    'Contact point out in front of the body',
    'Arc shape — peaking before the net vs. after it',
  ],
  drills: [
    { name: 'Third-shot drop arc drill', how: 'Partner feeds from the kitchen; you drop to a cone target inside the NVZ, lifting with the legs. 3 sets of 15.' },
    { name: 'Drop-and-advance', how: 'Hit a drop, take two steps in and split-step; only advance behind an unattackable ball. 3 sets of 6.' },
    { name: 'Soft-hands feel', how: 'Half-speed drops focusing on a relaxed grip and a paddle face that stays quiet through contact. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Swinging with the arm and no leg lift.',
    'Decelerating into the ball (it dies in the net).',
    'An open face that floats the ball up to be attacked.',
    'Sprinting forward before the drop is actually unattackable.',
  ],
  whenToWorkWithCoach:
    'If drops keep netting or floating after focused practice, a coach can confirm whether it is your contact point, your lift, or your grip pressure.',
  faqs: [
    { question: 'Should the drop have backspin?', answer: 'A little slice can help it sit, but consistency and a soft arc matter far more than spin. Groove the arc first.' },
    { question: 'Drive or drop on the third shot?', answer: 'Both have a place — drop to get to the line, drive to force a pop-up you can then drop or attack. Build the drop first; it is the harder, higher-value skill.' },
  ],
  relatedLinks: [
    { label: 'Pickleball swing analysis', href: '/pickleball' },
    { label: 'Pickleball dinking', href: '/pickleball-dinking' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Third Shot Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Beginner-safe drills. Warm up and stop if anything hurts. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const PICKLEBALL_DINKING: SeoPage = {
  slug: 'pickleball-dinking',
  sport: 'pickleball',
  audience: 'player',
  keyword: 'pickleball dinking',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Stop Popping Up Your Dinks in Pickleball',
  metaDescription:
    'Dinks pop up when the paddle face is too open or the wrist lifts the ball. Keep dinks low and unattackable with a stable face and leg-driven lift. Diagnosis and drills.',
  directAnswer:
    'You pop up dinks when your paddle face is too open at contact or you lift the ball with your wrist instead of your legs. The fix is a stable, slightly open face, soft hands, and a small lift from the legs so the ball clears the net low and unattackable. Low dinks force errors; high ones get attacked.',
  problemExplanation: [
    'Dinking is the heart of the pickleball soft game — the patient battle at the kitchen line that sets up every attack. A dink that sits up above net height is an invitation for your opponent to speed it up.',
    'The usual causes of a popped-up dink are an open, unstable paddle face and a wristy, lifting motion. Quiet hands and a leg-driven lift keep the ball low and consistent.',
  ],
  diagnosisSteps: [
    'Watch your dink height: are they clearing low, or floating up to shoulder height?',
    'Check the paddle face — is it stable, or opening through contact?',
    'Check the source of the lift — legs, or a flicking wrist?',
    'Film side-on at the kitchen to see the face angle and arc.',
  ],
  whatSwingVantageLooksFor: [
    'Paddle-face angle and stability through contact',
    'Wrist quietness vs. flicking',
    'Lift coming from the legs rather than the hand',
    'Dink height over the net',
  ],
  drills: [
    { name: 'Net-skimmer dink gate', how: 'Cross-court dink over a target ~6 inches above the net; count consecutive low, unattackable dinks. 5 minutes each side.' },
    { name: 'Paddle-face wall drill', how: 'Continuous dink rally against a wall; high marks mean the face is too open — adjust to a stable, slightly open face. 8 minutes.' },
    { name: 'Soft-hands dink rally', how: 'Cooperative cross-court dinks focusing on a relaxed grip and quiet wrist. Build a long, low rally.' },
  ],
  mistakesToAvoid: [
    'An open paddle face that lofts the ball up.',
    'Flicking the wrist to lift the dink.',
    'Standing tall instead of bending the knees to lift.',
    'Trying to win every dink instead of staying patient and low.',
  ],
  whenToWorkWithCoach:
    'A coach can quickly spot whether your pop-ups come from grip, face angle, or wrist action, and adjust your cue.',
  faqs: [
    { question: 'Cross-court or straight-ahead dinks?', answer: 'Cross-court dinks are higher percentage (longer, over the lower middle of the net) — start there, then add straight-ahead dinks to move opponents.' },
    { question: 'Should I add spin to dinks?', answer: 'Topspin and slice dinks are advanced tools. Master a low, consistent flat dink first.' },
  ],
  relatedLinks: [
    { label: 'Pickleball swing analysis', href: '/pickleball' },
    { label: 'Pickleball third-shot drop', href: '/pickleball-third-shot-drop' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Dinks Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Beginner-safe drills. Warm up and stop if anything hurts. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

// ──────────────────────────────────────────────────────────────
// Padel — published
// ──────────────────────────────────────────────────────────────

const PADEL_PILLAR: SeoPage = {
  slug: 'padel',
  sport: 'padel',
  audience: 'player',
  keyword: 'padel swing analysis',
  intent: 'commercial',
  funnelStage: 'consideration',
  priority: 1,
  title: 'Padel Swing & Video Analysis (AI Coaching)',
  metaDescription:
    'SwingVantage analyzes your padel strokes — the bandeja, víbora, smash, volleys, lobs, and wall play — and gives you your top priority, drills, and a plan. Free to start.',
  directAnswer:
    'SwingVantage is an AI swing and video analysis platform built specifically for padel — not adapted from tennis. Upload a video of your bandeja, volley, or back-glass play and you get your single highest-priority issue, the visible evidence behind it, drills, and a simple practice plan. Padel rewards control over power, reading the ball off the glass, and holding the net with the overhead family, and the analysis is tuned for exactly that.',
  problemExplanation: [
    'Padel is not "tennis with walls." The glass is in play, the game is always doubles, and the defining shots are the overhead family — the bandeja, víbora, and smash — used to keep the net. A full tennis serve motion on the bandeja is a common, costly mistake.',
    'SwingVantage reads your stroke against padel-specific checkpoints — overhead control, the wall read, lob depth, net transition, and partner positioning — so the feedback fits the sport you actually play.',
  ],
  diagnosisSteps: [
    'Pick the shot you want to improve (bandeja, volley, lob, smash, or wall play).',
    'Film side-on so the overhead motion and contact height are visible; include back-glass reps.',
    'Review your top priority and the visible evidence behind it.',
    'Follow the drills and the practice plan, then retest.',
  ],
  whatSwingVantageLooksFor: [
    'Overhead control — bandeja/víbora vs. an over-hit smash',
    'Reading and giving space to balls off the glass',
    'Paddle-face angle and contact point (out front, controlled height)',
    'Lob depth and net-transition positioning',
    'Partner spacing and court position',
  ],
  drills: [
    { name: 'Bandeja control & depth', how: 'Partner lobs; you hit controlled, sliced bandejas deep cross-court, finishing low and out. 3 sets of 12.' },
    { name: 'Back-glass spacing', how: 'Track deep balls into the wall, give the rebound space, and contact out of the corner on balance. 3 sets of 10.' },
    { name: 'Smash-or-bandeja decision game', how: 'Only flat-smash short, high balls; play awkward lobs as a bandeja. Lose a point for any overhit smash.' },
  ],
  mistakesToAvoid: [
    'Swinging a full tennis serve on the bandeja.',
    'Crowding the ball against the back glass.',
    'Overhitting the smash when a bandeja would hold the net.',
    'Getting caught in mid-court instead of committing to the net or the back.',
  ],
  whenToWorkWithCoach:
    'A coach is valuable for the overhead family and the timing of glass play, which are hard to self-diagnose. SwingVantage helps you practice the right priority between sessions.',
  faqs: [
    { question: 'Is padel analysis just tennis analysis?', answer: 'No. SwingVantage uses a padel-specific engine — the bandeja/víbora overhead family, glass play, net control, and doubles positioning — not tennis groundstroke checkpoints.' },
    { question: 'Do I need a special court or camera?', answer: 'No. A phone video filmed side-on is enough, ideally including a few back-glass reps. Your full video stays on your device; only selected frames are ever sent for optional AI review.' },
    { question: 'Why is the bandeja so important?', answer: 'It is the controlled overhead that lets your team keep the net under pressure. Most points at every level are won or lost by net control.' },
  ],
  relatedLinks: [
    { label: 'Padel bandeja', href: '/padel-bandeja' },
    { label: 'Padel wall rebound technique', href: '/padel-wall-rebound-technique' },
    { label: 'Pickleball swing analysis', href: '/pickleball' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Padel Free', href: '/dashboard' },
  schemaType: 'Service',
  safetyNotes:
    'Drills are beginner-safe. Warm up your shoulder before overheads and stop if anything hurts. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const PADEL_BANDEJA: SeoPage = {
  slug: 'padel-bandeja',
  sport: 'padel',
  audience: 'player',
  keyword: 'how to hit a bandeja in padel',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Hit a Bandeja in Padel (Hold the Net)',
  metaDescription:
    'The bandeja is the controlled overhead that keeps you at the net. Turn side-on, contact out front with slice, and finish low and out. Diagnosis and drills.',
  directAnswer:
    'The bandeja is a controlled, sliced overhead — not a smash — that you hit deep and cross-court to keep your team at the net. Turn side-on early, contact the ball slightly in front and above shoulder height, brush with a little slice for control, and finish low and out toward the target rather than over your shoulder. A weak, flat bandeja sits up for a counter; an over-hit smash on the same ball surrenders the net when it misses.',
  problemExplanation: [
    'When opponents lob you, the bandeja is how you answer without giving up the net. It trades power for control and depth, keeping pressure on while you stay forward.',
    'Most bandeja problems come from a square stance, contact behind the body, no slice, or trying to smash a ball that should be controlled. The result is a short, sitting ball or an error.',
  ],
  diagnosisSteps: [
    'Are you turning side-on early, or facing the net square?',
    'Is contact slightly in front and above the shoulder, or behind your head?',
    'Is there a controlled slice brush, or a flat, all-power swing?',
    'Film side-on to see your preparation, contact, and finish.',
  ],
  whatSwingVantageLooksFor: [
    'Side-on preparation and footwork under the ball',
    'Contact point in front and above the shoulder',
    'Slice/brush for control and depth',
    'A low, controlled finish (not over the shoulder)',
  ],
  drills: [
    { name: 'Bandeja control & depth', how: 'Partner lobs to your overhead; hit bandejas deep cross-court to a target near the side glass. 3 sets of 12.' },
    { name: 'Shadow bandeja reps', how: 'Slow side-on overhead reps grooving the turn, contact out front, and low finish. 3 sets of 12.' },
    { name: 'Smash-or-bandeja decision', how: 'Mix deep lobs and short sit-ups; bandeja the deep ones, only smash the easy ones. Track your choices.' },
  ],
  mistakesToAvoid: [
    'Hitting a full smash on a ball that should be controlled.',
    'A square stance and contact behind your head.',
    'A flat overhead with no slice (it sits up).',
    'Falling backward off the net after the shot.',
  ],
  whenToWorkWithCoach:
    'The overhead family (bandeja, víbora, smash) benefits a lot from a coach\'s eye on timing and contact point. SwingVantage helps you groove the priority between sessions.',
  faqs: [
    { question: 'Bandeja vs. víbora vs. smash?', answer: 'The bandeja is the safe, controlled overhead to hold the net; the víbora adds side-spin and aggression; the smash is to finish an easy, short ball. Build the bandeja first.' },
    { question: 'Where should the bandeja land?', answer: 'Usually deep and cross-court toward the side glass, keeping opponents back and pinned while you hold the net.' },
  ],
  relatedLinks: [
    { label: 'Padel swing analysis', href: '/padel' },
    { label: 'Padel wall rebound technique', href: '/padel-wall-rebound-technique' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Bandeja Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up your shoulder before overheads and stop if anything hurts. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const PADEL_WALL_REBOUND: SeoPage = {
  slug: 'padel-wall-rebound-technique',
  sport: 'padel',
  audience: 'player',
  keyword: 'padel wall rebound technique',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Padel Wall Rebound Technique: Read the Glass',
  metaDescription:
    'Playing the ball off the back glass is what makes padel padel. Give the rebound space, turn early, and contact out of the corner on balance. Diagnosis and drills.',
  directAnswer:
    'To play a ball off the back glass well, turn and track it into the wall early, move back with it, and give the rebound space so you can contact it out of the corner on balance. The most common mistake is crowding the ball against the glass, which jams your swing. Let the wall bring the ball back to you, then play it calmly — deep, or as a lob to reset the point.',
  problemExplanation: [
    'The walls are what separate padel from tennis. A ball that beats you in the air is not lost — it comes off the back (and sometimes the side) glass, giving you a second chance if you read it.',
    'Beginners crowd the corner and get jammed. Reading the rebound and creating space turns desperate defense into a controlled shot, and often into offense.',
  ],
  diagnosisSteps: [
    'Do you turn and track the ball into the wall, or watch it pass flat-footed?',
    'Do you give the rebound space, or crowd the corner?',
    'Is contact out of the corner on balance, or jammed and late?',
    'Film from behind to see your spacing off the glass.',
  ],
  whatSwingVantageLooksFor: [
    'Early turn to track the ball into the wall',
    'Creating space — moving back with the rebound',
    'Contact point out of the corner, on balance',
    'A clean, unhurried paddle face after the bounce',
  ],
  drills: [
    { name: 'Back-glass spacing drill', how: 'Partner feeds deep; track the ball into the wall, move back with it, and contact with room. 3 sets of 10.' },
    { name: 'Early-turn off the glass', how: 'Turn side-on the instant you read a deep ball; set the paddle low behind the rebound. 3 sets of 12.' },
    { name: 'Double-wall reps', how: 'Progress to side-then-back (double-wall) rebounds, recovering and resetting with a deep ball or lob.' },
  ],
  mistakesToAvoid: [
    'Crowding the ball against the glass.',
    'Turning late and getting jammed.',
    'Trying to attack a difficult glass ball instead of resetting with a lob.',
    'Standing flat and watching the ball pass.',
  ],
  whenToWorkWithCoach:
    'Glass play is timing-heavy and benefits from a coach feeding controlled rebounds. SwingVantage helps you see whether your spacing is improving between sessions.',
  faqs: [
    { question: 'When should I lob off the glass?', answer: 'When the rebound pushes you deep or off balance, a lob resets the point and can flip you back to offense. Attack only comfortable rebounds.' },
    { question: 'Can I use the side glass too?', answer: 'Yes — side and side-then-back (double-wall) balls are common. The same principles apply: read it, give it space, contact out of the corner.' },
  ],
  relatedLinks: [
    { label: 'Padel swing analysis', href: '/padel' },
    { label: 'Padel bandeja', href: '/padel-bandeja' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Padel Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Beginner-safe drills. Warm up and stop if anything hurts. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

// ──────────────────────────────────────────────────────────────
// Prepared backlog (draft — not routed/indexed until a page.tsx
// exists and the content is shipped). Mirrors the full pillar map
// the expansion calls for.
// ──────────────────────────────────────────────────────────────

function draft(slug: string, sport: 'pickleball' | 'padel', keyword: string, title: string): SeoPage {
  return {
    slug,
    sport,
    audience: 'player',
    keyword,
    intent: 'informational',
    funnelStage: 'consideration',
    priority: 3,
    title,
    metaDescription: `Draft — prepared ${sport} pillar page. Promote to published and add a page.tsx route when shipped.`,
    directAnswer: '',
    problemExplanation: [],
    diagnosisSteps: [],
    whatSwingVantageLooksFor: [],
    drills: [],
    mistakesToAvoid: [],
    whenToWorkWithCoach: '',
    faqs: [],
    relatedLinks: [],
    cta: { label: 'Try SwingVantage free', href: '/dashboard' },
    schemaType: 'Article',
    safetyNotes: '',
    publishStatus: 'draft',
  };
}

const RACKET_DRAFTS: SeoPage[] = [
  draft('pickleball-video-analysis', 'pickleball', 'pickleball video analysis', 'Pickleball Video Analysis'),
  draft('pickleball-practice-plan', 'pickleball', 'pickleball practice plan', 'Pickleball Practice Plan for Beginners'),
  draft('pickleball-drills', 'pickleball', 'best pickleball drills', 'Best Pickleball Drills for Beginners'),
  draft('pickleball-serve-analysis', 'pickleball', 'pickleball serve mechanics', 'Pickleball Serve Mechanics & Analysis'),
  draft('pickleball-dupr-improvement', 'pickleball', 'dupr improvement plan', 'DUPR Improvement Plan: How to Raise Your Rating'),
  draft('padel-video-analysis', 'padel', 'padel video analysis', 'Padel Video Analysis'),
  draft('padel-practice-plan', 'padel', 'padel practice plan', 'Padel Practice Plan for Beginners'),
  draft('padel-drills', 'padel', 'padel footwork drills', 'Padel Drills & Footwork for Beginners'),
  // 'padel-vibora' is the canonical, fully-written published page in
  // seoPagesGaps.ts (PADEL_VIBORA / MULTI_SPORT_GAP_PAGES). This thin draft stub
  // was superseded once that page was authored — removed to keep slugs unique
  // (a duplicate slug collides on React keys in the PublishingOS publish queue).
  draft('padel-serve-analysis', 'padel', 'padel serve mechanics', 'Padel Serve Mechanics & Analysis'),
  draft('padel-doubles-strategy', 'padel', 'padel doubles strategy', 'Padel Doubles Strategy & Positioning'),
];

// ──────────────────────────────────────────────────────────────
// Export — spread into SEO_PAGES (RACKET_PAGES)
// ──────────────────────────────────────────────────────────────

export const RACKET_PAGES: SeoPage[] = [
  PICKLEBALL_PILLAR,
  PICKLEBALL_THIRD_SHOT_DROP,
  PICKLEBALL_DINKING,
  PADEL_PILLAR,
  PADEL_BANDEJA,
  PADEL_WALL_REBOUND,
  ...RACKET_DRAFTS,
];
