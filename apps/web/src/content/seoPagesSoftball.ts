// ============================================================
// SwingVantage — SEO Growth Pages: Slow-pitch softball gaps
//
// High-intent slow-pitch pages SearchIntelligenceOS flagged as gaps that fit
// the swing-analysis core (hitting, not fielding): a focused practice plan and
// line-drive hitting drills. Sibling file spread into SEO_PAGES in seoPages.ts,
// same AEO/GEO SeoPage format. Honest, original instruction.
// ============================================================

import type { SeoPage } from './seoPages';

const SLOW_PITCH_CTA = { label: 'Analyze My Slow-Pitch Swing Free', href: '/start?sport=softball_slow' };
const SLOW_PITCH_SAFETY =
  'Warm up before full-speed swings and use an age-appropriate, league-legal bat. Youth players should practice with adult supervision. Stop if anything hurts.';

// ── Slow-pitch practice plan ────────────────────────────────────
const SP_PRACTICE_PLAN: SeoPage = {
  slug: 'softball/slow-pitch-practice-plan',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'slow pitch softball practice plan',
  intent: 'commercial',
  funnelStage: 'consideration',
  priority: 2,
  title: 'A Simple Slow-Pitch Softball Practice Plan',
  metaDescription:
    'A focused slow-pitch practice plan that builds line-drive contact, bat path, and timing — not just swinging harder. Here is what to work on and in what order.',
  directAnswer:
    'A good slow-pitch practice plan trains the three things that actually raise your average — line-drive bat path (matching the descending pitch), consistent timing on the arc, and contact you can repeat — in that order. Spend most of your reps on tee and short-toss line drives before live BP, and measure progress by how often you square it up, not how far one ball goes.',
  problemExplanation: [
    'Slow-pitch hitting is a timing-and-path game, not a strength contest. The pitch arrives on a steep downward arc, so the swing that produces hard line drives matches that descent with a slightly upward path — and repeats it.',
    'Most practice is unstructured live BP where it is hard to tell whether a miss was path, timing, or contact. A plan that isolates each piece (tee → short toss → live) builds the skill faster and tells you what is actually breaking down.',
  ],
  diagnosisSteps: [
    'Chart a session: what share of your batted balls are line drives vs. grounders vs. pop-ups?',
    'On grounders, are you on top of the ball? On pop-ups, are you dropping the back shoulder?',
    'Is your timing early (rolling over) or late (under the ball)?',
    'Can you repeat good contact, or is it one good swing in five?',
  ],
  whatSwingVantageLooksFor: [
    'Bat path relative to the descending pitch',
    'Back-shoulder tilt and posture through contact',
    'Timing of the load + stride against the arc',
    'Contact-point depth and consistency',
  ],
  exampleDiagnosis:
    'Example: "About 60% of your batted balls are grounders because your bat path is a touch steep and you are slightly early — the barrel is on top of the ball. A line-drive tee progression plus a timing cue cleaned it up in two sessions."',
  drills: [
    { name: 'Tee line-drive blocks (most reps)', how: 'Belt-high tee — drive line drives into the top third of a net ~15 ft away. Score line drives out of 10. Do 3–4 blocks of 10 to START every session; this is the foundation.' },
    { name: 'Short-toss arc match', how: 'A partner tosses on a slight downward arc; feel your path matching the descent — not chopping down, not scooping up. 2 sets of 10.' },
    { name: 'Live BP to a target', how: 'In live BP, try to hit line drives to a specific gap. Track squared-up %. Finish here, once the tee/toss work is grooved.' },
  ],
  mistakesToAvoid: [
    'Starting every session with max-effort live BP instead of grooving the path on a tee.',
    'Chasing distance (launching everything) — it produces easy fly-outs.',
    'Dropping the back shoulder to "lift" the ball.',
    'Measuring practice by one big hit instead of consistent line drives.',
  ],
  whenToWorkWithCoach:
    'If you cannot tell whether your grounders/pop-ups are path or timing after a couple of tee sessions, a hitting coach (or your swing analysis) can pinpoint the cause quickly.',
  faqs: [
    { question: 'How often should I practice slow-pitch hitting?', answer: 'Two or three focused 20–30 minute sessions a week beat one long unstructured one. Start each with tee line-drive work, then add toss and live BP.' },
    { question: 'What should I work on first in slow-pitch?', answer: 'Line-drive bat path on a tee, then timing against the arc, then live contact. Path and timing fix most slow-pitch problems before power ever matters.' },
    { question: 'Why do I hit so many ground balls in slow pitch?', answer: 'Usually a bat path that is too steep or flat for the descending pitch, often with slightly early timing. Tee line-drive blocks plus a timing cue fix it.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Best launch angle (slow-pitch)', href: '/softball/best-launch-angle-slow-pitch' },
    { label: 'Slow-pitch hitting drills', href: '/softball/slow-pitch-hitting-drills' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

// ── Slow-pitch hitting drills ───────────────────────────────────
const SP_HITTING_DRILLS: SeoPage = {
  slug: 'softball/slow-pitch-hitting-drills',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'slow pitch softball hitting drills',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Slow-Pitch Softball Hitting Drills (Line-Drive Focused)',
  metaDescription:
    'The best slow-pitch hitting drills build a repeatable line-drive path and timing — at a tee, off short toss, and in live BP. Here are the ones that move the needle.',
  directAnswer:
    'The most useful slow-pitch hitting drills train one thing: a repeatable bat path that matches the descending pitch and produces line drives. Start at a tee to groove the path, add short toss to time the arc, and finish with live BP to a target. Skip "power" drills until line-drive contact is consistent — path and timing fix far more than strength.',
  problemExplanation: [
    'Slow-pitch pitches drop steeply, so the swing that drives line drives uses a slightly upward path that matches the descent. The goal of every good drill is to make that path automatic and repeatable.',
    'Random live BP makes it hard to isolate what is breaking down. Drills that constrain one variable — path, timing, or contact — build the skill faster and give clear feedback.',
  ],
  diagnosisSteps: [
    'Hit 10 off a tee: how many are true line drives vs. grounders or pop-ups?',
    'Watch your barrel — is it on top of the ball (grounders) or under it (pop-ups)?',
    'Off live toss, are you consistently early or late against the arc?',
    'Does good contact repeat, or is it random?',
  ],
  whatSwingVantageLooksFor: [
    'Bat path matching the descending pitch',
    'Repeatability of contact across reps',
    'Timing of load/stride vs. the arc',
    'Back-shoulder posture through contact',
  ],
  exampleDiagnosis:
    'Example: "Your barrel works slightly above the ball, so tee balls come off as grounders. The high-tee/low-tee path drill flattened it into line drives within a session."',
  drills: [
    { name: 'Top-third tee drill', how: 'Drive line drives into the top third of a net ~15 ft away off a belt-high tee. Score line drives out of 10 — this is your baseline drill. 3 sets of 10.' },
    { name: 'High-tee / low-tee path check', how: 'Alternate a slightly higher and lower tee. If you can line-drive both, your path is on plane; if one becomes a grounder or pop-up, it shows your path tendency. 2 rounds of 8.' },
    { name: 'Short-toss arc match', how: 'Partner tosses on a slight downward arc; match your path to the descent and drive line drives. 2 sets of 10.' },
    { name: 'Top-hand path drill', how: 'Choke up and swing one-handed (top hand) at half speed to feel the barrel staying on plane through contact. 2 sets of 8, then re-blend two hands.' },
    { name: 'Live BP to a gap', how: 'Pick a gap and try to hit line drives there. Track squared-up %. Use this last, after the constrained drills above.' },
  ],
  mistakesToAvoid: [
    'Going straight to live BP without grooving the path on a tee first.',
    'Swinging for distance — it costs you line drives and average.',
    'Dropping the back shoulder to get under the ball.',
    'Doing reps without a way to score them (line drive vs. not).',
  ],
  whenToWorkWithCoach:
    'If a drill is not transferring to live at-bats, a hitting coach (or your swing analysis) can tell you whether it is path, timing, or a setup issue.',
  faqs: [
    { question: 'What is the best slow-pitch hitting drill?', answer: 'The top-third tee drill — driving line drives into the top of a net off a belt-high tee. It grooves the line-drive path that everything else builds on.' },
    { question: 'How do I stop hitting ground balls in slow pitch?', answer: 'Your barrel is likely working above the ball. The high-tee/low-tee path check and top-third tee drill flatten the path into line drives.' },
    { question: 'Can I practice slow-pitch hitting at home?', answer: 'Yes — a tee and a net are enough for the most important work (path + contact). Add a partner for short toss when you can.' },
  ],
  relatedLinks: [
    { label: 'Slow-pitch swing analysis', href: '/softball-swing-analysis/slow-pitch' },
    { label: 'Slow-pitch practice plan', href: '/softball/slow-pitch-practice-plan' },
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Stop popping up', href: '/softball/stop-popping-up' },
  ],
  cta: SLOW_PITCH_CTA,
  schemaType: 'HowTo',
  safetyNotes: SLOW_PITCH_SAFETY,
  publishStatus: 'published',
};

/** Slow-pitch softball gap pages, spread into SEO_PAGES in seoPages.ts. */
export const SOFTBALL_GAP_PAGES: SeoPage[] = [
  SP_PRACTICE_PLAN,
  SP_HITTING_DRILLS,
];
