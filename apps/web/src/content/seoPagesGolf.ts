// ============================================================
// SwingVantage — SEO Growth Pages: Golf scoring gaps
//
// High-intent golf pages SearchIntelligenceOS flagged as content gaps
// (no owned page for "how to break 90", "iron consistency", "wedge distance
// control"). Kept in a sibling file to keep edits to the large seoPages.ts
// minimal; spread into SEO_PAGES there. Same SeoPage shape + AEO/GEO format.
// Honest, original instruction — no fabricated stats.
// ============================================================

import type { SeoPage } from './seoPages';

const GOLF_CTA = { label: 'Analyze My Golf Swing Free', href: '/start?sport=golf' };
const GOLF_SAFETY =
  'Warm up before full-speed swings, build speed gradually, and use properly fitted clubs. Stop if anything hurts.';

// ── Break 90 practice plan ──────────────────────────────────────
const GOLF_BREAK_90: SeoPage = {
  slug: 'golf/practice-plan-to-break-90',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to break 90 in golf',
  intent: 'commercial',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Break 90 in Golf: A Simple Practice Plan',
  metaDescription:
    'Breaking 90 is about eliminating doubles and three-putts, not adding distance. Here is a focused practice plan and the misses to fix first.',
  directAnswer:
    'Most golfers break 90 by removing big mistakes, not by hitting it farther. Bogey on every hole is 90, so the goal is to avoid the doubles and triples that come from penalty shots, chunked chips, and three-putts. Tighten a reliable tee shot, the short game inside 30 yards, and lag putting, and the score follows — usually without changing your full swing at all.',
  problemExplanation: [
    'Breaking 90 means averaging a bogey (or a touch better) per hole. The strokes that keep you above 90 are almost never pars you just missed — they are the blow-up holes: a tee shot out of bounds, a chunked or bladed chip, a three- or four-putt.',
    'Because of that, the fastest path under 90 is fewer disasters, not a longer drive. Smart targets, a dependable short game, and lag putting move the number far more than ball speed for a mid-handicapper.',
  ],
  diagnosisSteps: [
    'Track your last five rounds and count the "big numbers" (double bogey or worse) — that is your real leak.',
    'Note how many came from the tee (penalty/OB), the short game (chunk/blade), or putting (3+ putts).',
    'Check your tee-shot dispersion: how often is the ball actually in play versus a penalty?',
    'Count three-putts per round and how many start from outside 30 feet.',
  ],
  whatSwingVantageLooksFor: [
    'A repeatable tee-shot pattern you can aim (even a reliable fade) vs. a two-way miss',
    'Low-point control on chips and pitches — are you bottoming out behind the ball?',
    'Tempo and face control that predict where the ball starts and curves',
    'Whether your misses are mechanical or decision-making',
  ],
  exampleDiagnosis:
    'Example: "Four of your last five doubles started with a tee shot you could not predict — your face is 4–6° open to your path on the miss. A stock shot you can aim takes the penalty strokes out and is worth more than 10 extra yards."',
  drills: [
    { name: 'Two-club tee-shot game', how: 'On the range, pick a target and one stock shot (e.g., a small fade). Hit 10 and count how many would be in play on a 30-yard-wide fairway. Goal: 7/10 before changing anything mechanical.' },
    { name: 'Up-and-down ladder', how: 'From 5, 10, and 15 yards off the green, hit 3 chips each and try to get up and down (or at worst two-putt). Track your up-and-down %. This is where doubles disappear.' },
    { name: 'Lag-putt circle', how: 'Place balls at 25, 35, and 45 feet and putt into a 3-foot circle around the hole. Score how many finish inside the circle. Removing three-putts is free strokes.' },
  ],
  mistakesToAvoid: [
    'Practicing only full-swing drives while your doubles come from inside 30 yards.',
    'Aiming at every flag instead of the fat side of the green.',
    'Trying a hero shot from trouble instead of pitching out to safety.',
    'Ignoring lag putting — most three-putts start from long range, not short.',
  ],
  whenToWorkWithCoach:
    'If your two-way miss off the tee will not settle no matter how you aim, or your chips keep coming up fat or thin, a lesson focused on one stock shot and low-point control pays for itself fast.',
  faqs: [
    { question: 'How long does it take to break 90?', answer: 'It depends where you start, but many golfers who shoot in the mid-90s get there in a season by cutting doubles — not by overhauling their swing. Track your big numbers and attack the most common cause first.' },
    { question: 'Do I need to hit it longer to break 90?', answer: 'Usually no. Reliable contact, a tee shot you can aim, and avoiding three-putts move the score far more than distance for a mid-handicapper.' },
    { question: 'What should I practice most to break 90?', answer: 'Prioritize the shots that cause your blow-up holes — for most players that is a dependable tee shot and the short game inside 30 yards, then lag putting.' },
  ],
  relatedLinks: [
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Hit your irons consistently', href: '/golf/hit-your-irons-consistently' },
    { label: 'Practice golf at home', href: '/golf/practice-at-home' },
    { label: 'Golf benchmarks', href: '/benchmarks/golf' },
  ],
  cta: GOLF_CTA,
  schemaType: 'HowTo',
  safetyNotes: GOLF_SAFETY,
  publishStatus: 'published',
};

// ── Iron consistency ────────────────────────────────────────────
const GOLF_IRON_CONSISTENCY: SeoPage = {
  slug: 'golf/hit-your-irons-consistently',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to hit your irons consistently',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Hit Your Irons Consistently',
  metaDescription:
    'Consistent iron contact comes from a stable low point — ball first, then a shallow divot in front. Here is how to diagnose fat/thin shots and groove it.',
  directAnswer:
    'Consistent irons come from controlling your low point: the club should reach the bottom of its arc just after the ball, so you strike ball-first then take a shallow divot in front. Fat and thin shots are both low-point errors — the bottom of the swing is behind the ball. Get your weight onto your lead side at impact and keep your chest over the ball, and contact stabilizes.',
  problemExplanation: [
    'An iron is built to strike the ball on a slightly descending blow — ball first, then the ground. The low point of your swing arc should sit a few inches in front of the ball. When it sits behind the ball you hit it fat; when you compensate by lifting, you catch it thin.',
    'Most inconsistency is one root cause showing up two ways: weight hanging back and the upper body backing up through impact, which moves the low point behind the ball.',
  ],
  diagnosisSteps: [
    'Check your divots: do they start in front of the ball (good) or behind it (low point too early)?',
    'Note your miss pattern — alternating fat and thin is a classic low-point problem.',
    'Film face-on: where is your weight and chest at impact — forward, or hanging back?',
    'Draw a line on the ground, place the ball on it, and see where the club actually bottoms out.',
  ],
  whatSwingVantageLooksFor: [
    'Low-point location relative to the ball',
    'Pressure shift into the lead side through impact',
    'Whether the upper body stays centered or backs up',
    'Shaft lean and angle of attack at contact',
  ],
  exampleDiagnosis:
    'Example: "Your low point is about two inches behind the ball because your weight stays ~60% on your trail foot at impact — that is why you alternate fat and thin. Get to roughly 80% lead-side pressure and the divot moves in front of the ball."',
  drills: [
    { name: 'Towel-behind-the-ball drill', how: 'Place a folded towel about 4 inches behind the ball. Make swings that miss the towel and strike the ball first. If you hit the towel, your low point is too early. 3 sets of 8.' },
    { name: 'Lead-side pressure step', how: 'Make slow swings feeling your weight move onto your lead foot in the downswing — finish with the trail heel up and most of your weight forward. Then hit shots holding that feel.' },
    { name: 'Line drill', how: 'Draw a line (or spray a line) and place the ball on it. Try to make your divot start on or just in front of the line, never behind it. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to "lift" the ball into the air — the loft does that; hit down and through.',
    'Hanging back on the trail foot to help it up.',
    'Scooping with the hands at impact, which flips the low point behind the ball.',
    'Judging contact by one shot instead of your divot pattern.',
  ],
  whenToWorkWithCoach:
    'If you cannot move your divot in front of the ball after a week of low-point drills, or the fat/thin pattern returns under pressure, a coach can confirm whether it is pressure shift, sequencing, or setup.',
  faqs: [
    { question: 'Why do I hit my irons fat and thin?', answer: 'Both come from the same thing — the low point of your swing is behind the ball, usually because your weight hangs back. Fat is the club bottoming out early; thin is the lift you add to avoid hitting it fat.' },
    { question: 'Should I hit down on my irons?', answer: 'Yes — irons work best with a slightly descending strike: ball first, then a shallow divot in front. The clubface loft launches the ball, so you do not need to help it up.' },
    { question: 'How do I stop topping my irons?', answer: 'Topping is an extreme thin. Get your weight forward and keep your chest over the ball so the low point moves ahead of it; the towel-behind-the-ball drill helps quickly.' },
  ],
  relatedLinks: [
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Stop hitting it fat', href: '/golf/stop-hitting-it-fat' },
    { label: 'Stop topping the ball', href: '/golf/stop-topping-the-ball' },
    { label: 'Break 90 practice plan', href: '/golf/practice-plan-to-break-90' },
  ],
  cta: GOLF_CTA,
  schemaType: 'HowTo',
  safetyNotes: GOLF_SAFETY,
  publishStatus: 'published',
};

// ── Wedge distance control ──────────────────────────────────────
const GOLF_WEDGE_DISTANCE: SeoPage = {
  slug: 'golf/wedge-distance-control',
  sport: 'golf',
  audience: 'player',
  keyword: 'wedge distance control',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Wedge Distance Control: How to Dial In Your Yardages',
  metaDescription:
    'Wedge distance comes from controlling backswing length, not swinging harder. Here is the clock system and how to build repeatable wedge yardages.',
  directAnswer:
    'You control wedge distance with the length of your backswing and a consistent tempo — not by swinging harder or softer. Pick two or three reference swing lengths (picture a clock: lead arm to 8, 9, and 10 o’clock), keep your tempo the same, and accelerate through the ball. Each length then produces a repeatable carry number. Map those numbers and you stop guessing inside 100 yards.',
  problemExplanation: [
    'Scoring clubs reward precision, not power. The biggest reason wedge yardages feel random is that golfers vary effort and tempo on every swing — decelerating on one, jabbing the next — so the same club flies three different distances.',
    'A repeatable system fixes this: a few defined backswing lengths with identical tempo and a slight acceleration through the ball. Distance then becomes a function of length, which you can rehearse and trust.',
  ],
  diagnosisSteps: [
    'Do you know your carry number for a full, three-quarter, and half wedge? If not, that is the gap.',
    'Film from the side: is your backswing length consistent for the same intended distance?',
    'Notice deceleration — do you slow down into the ball on partial shots?',
    'Check whether you cover in-between yardages by changing clubs or by changing effort.',
  ],
  whatSwingVantageLooksFor: [
    'Backswing-length consistency for a given target distance',
    'Tempo and acceleration through impact (no deceleration)',
    'Low-point and contact quality on partial shots',
    'Whether distance changes come from length or from effort',
  ],
  exampleDiagnosis:
    'Example: "Your 50-yard swings vary because your backswing length changes by nearly a full clock position and you decelerate on the shorter ones. Lock in a 9 o’clock length with steady tempo and your carry tightens to within a few yards."',
  drills: [
    { name: 'Clock-system carry map', how: 'Hit 10 shots each at three backswing lengths (8, 9, 10 o’clock) with one wedge. Record the average carry for each. You now have three trusted numbers. Repeat for each wedge.' },
    { name: 'Same-tempo metronome', how: 'Use a steady count (or metronome app) and keep the same tempo on every partial swing — only the length changes. This kills the decel/jab habit. 3 sets of 10.' },
    { name: 'Ladder challenge', how: 'Pick three targets (e.g., 40, 60, 80 yards) and hit to each in rotation, scoring how close you land. Trains feel between your mapped numbers. 2 rounds.' },
  ],
  mistakesToAvoid: [
    'Trying to control distance with effort instead of backswing length.',
    'Decelerating into the ball on short shots — accelerate through.',
    'Having only one "full" wedge swing and no partial reference points.',
    'Practicing distances you never face instead of your common 40–90 yard shots.',
  ],
  whenToWorkWithCoach:
    'If your contact is inconsistent on partial wedges (fat or thin), fix low point first — a coach or your analysis can tell you whether the distance problem is really a contact problem.',
  faqs: [
    { question: 'How do I control wedge distance?', answer: 'Change your backswing length, not your effort. Build two or three reference lengths with identical tempo, map the carry for each, and you get repeatable yardages.' },
    { question: 'What is the clock system for wedges?', answer: 'You picture your lead arm as a clock hand and swing it back to set positions — for example 8, 9, and 10 o’clock — each producing a known carry distance at the same tempo.' },
    { question: 'Why are my wedge distances inconsistent?', answer: 'Usually varying tempo and effort, plus deceleration on short shots. Define a few backswing lengths, keep tempo constant, and accelerate through the ball.' },
  ],
  relatedLinks: [
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Hit your irons consistently', href: '/golf/hit-your-irons-consistently' },
    { label: 'Break 90 practice plan', href: '/golf/practice-plan-to-break-90' },
    { label: 'Launch monitor analysis', href: '/golf/launch-monitor-analysis' },
  ],
  cta: GOLF_CTA,
  schemaType: 'HowTo',
  safetyNotes: GOLF_SAFETY,
  publishStatus: 'published',
};

/** Golf scoring-gap pages, spread into SEO_PAGES in seoPages.ts. */
export const GOLF_GAP_PAGES: SeoPage[] = [
  GOLF_BREAK_90,
  GOLF_IRON_CONSISTENCY,
  GOLF_WEDGE_DISTANCE,
];
