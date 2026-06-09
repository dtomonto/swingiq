// ============================================================
// SwingVantage — Feature Registry: Training & Drills
// ============================================================

import type { Feature } from './types';

export const TRAINING_FEATURES: Feature[] = [
  {
    slug: 'fix-stack',
    name: 'Fix Stack — One Fix at a Time',
    group: 'Training & Drills',
    sports: 'All 7 sports',
    summary:
      'SwingVantage finds your single highest-impact issue and turns it into a three-step loop: one body cue to feel, the best-matched drill for your level and the gear you have, and an honest before/after retest.',
    note: 'Deterministic and local-first — it learns from what worked for you and needs no account.',
    overview: [
      'The Fix Stack is how a diagnosis becomes actual improvement. It takes your single highest-impact issue and turns it into a tight three-step loop: one body cue to feel, the best-matched drill for your level and the equipment you actually have, and an honest before/after retest to prove whether it worked.',
      'The discipline of "one fix at a time" is deliberate. Improvement comes from focused repetition on the thing that matters most, not from juggling a checklist. By collapsing your whole diagnosis into a single feel, a single drill, and a single test, the Fix Stack removes the paralysis of not knowing what to practise.',
      'It is deterministic and local-first — it runs without an account and learns from what worked for you specifically, so its drill matching gets better the more you mark whether a drill helped.',
    ],
    bestFor: [
      'Anyone who freezes at "I have ten things to fix — where do I start?"',
      'Self-coached players who want a concrete, repeatable practice loop',
    ],
    guide: [
      {
        title: 'Open your priority fix',
        body: 'From a diagnosis, open the Fix Stack for the top-ranked fault. It gives you exactly one thing to work on.',
      },
      {
        title: 'Feel the body cue',
        body: 'Internalise the single cue before you start hitting — it’s the feeling that drives the change, not a swing thought to overthink.',
      },
      {
        title: 'Run the matched drill',
        body: 'Do the recommended drill, which is chosen for your level and the gear you have. Then mark whether it helped — this teaches the system what works for you.',
      },
      {
        title: 'Retest honestly',
        body: 'Re-capture under the same conditions and let the before/after retest show whether the fault actually moved. Only then move to the next fix.',
      },
    ],
    proTips: [
      'Mark every drill verdict (helped / too hard / not relevant) — that feedback is what personalises future matches.',
      'Resist stacking a second fix before retesting the first; the whole point is one lever at a time.',
    ],
    limitations: [
      'It surfaces one fix by design — if you want the full fault list, the diagnosis still shows everything.',
    ],
    faqs: [
      {
        question: 'Why only one fix at a time?',
        answer:
          'Because focused repetition on the highest-leverage fault produces change; scattering attention across many does not. The Fix Stack enforces focus, then lets you move on once you’ve proven the first fix with a retest.',
      },
      {
        question: 'Does it need an account?',
        answer:
          'No. The Fix Stack is deterministic and local-first. It works offline and learns from your drill feedback on your device.',
      },
    ],
    relatedSlugs: ['personalized-drill-recommendations', 'retest', 'player-arc', 'ai-diagnostic-engine'],
  },
  {
    slug: 'personalized-drill-recommendations',
    name: 'Personalized Drill Recommendations',
    group: 'Training & Drills',
    sports: 'All 7 sports',
    summary:
      'Every diagnosis generates 3–5 sport-specific drills tailored to your exact fault pattern. Each drill includes a YouTube search link so you can immediately find video demonstrations.',
    note: 'Drills are ranked by expected impact on your primary fault.',
    overview: [
      'Every diagnosis comes with 3–5 drills chosen specifically for your fault pattern, sport, and level — ranked by their expected impact on your primary issue. Instead of a generic drill list, you get the handful most likely to move your actual problem.',
      'Each drill includes a YouTube search link so you can instantly pull up a video demonstration, and the matcher accounts for the equipment you have so it never recommends something you can’t do. As you mark which drills helped, the recommendations adapt to what works for you.',
    ],
    bestFor: [
      'Players who want a short, targeted drill list instead of an overwhelming library',
      'Anyone who learns drills best with a quick video to follow',
    ],
    guide: [
      {
        title: 'Start with the top-ranked drill',
        body: 'Drills are ordered by expected impact on your priority fault. Begin at the top rather than cherry-picking.',
      },
      {
        title: 'Watch a demo via the search link',
        body: 'Tap the YouTube search link to see the drill performed, then mirror it. Reading a drill is never as clear as watching it.',
      },
      {
        title: 'Mark the verdict',
        body: 'After trying it, record whether it helped. This is the single most important step for making future recommendations smarter for you.',
      },
    ],
    proTips: [
      'If a drill feels too hard or too easy, mark it — the matcher uses that to calibrate difficulty next time.',
    ],
    limitations: [
      'YouTube demonstrations are external search links; SwingVantage curates the query but does not host the videos.',
    ],
    faqs: [
      {
        question: 'How are the drills chosen?',
        answer:
          'They’re matched to your specific fault, sport, and level, filtered by the equipment you have, and ranked by expected impact. Your drill feedback then personalises future matches.',
      },
    ],
    relatedSlugs: ['fix-stack', 'drill-library', 'training-routine-generator'],
  },
  {
    slug: 'training-routine-generator',
    name: 'Training Routine Generator',
    group: 'Training & Drills',
    sports: 'All 7 sports',
    summary:
      'Generates a structured training routine based on your active diagnosis and skill level. Includes warm-up, focused drill work, and feedback checkpoints.',
    overview: [
      'The Training Routine Generator builds a structured session around your current diagnosis and skill level: a warm-up to prime the right movements, focused drill work on your priority fault, and feedback checkpoints so you know whether the session is landing.',
      'It turns "I have 45 minutes — what should I do?" into a sequenced plan that spends your time where it counts. Because it’s tied to your active diagnosis, the routine changes as your priorities change, so you’re never practising last month’s problem.',
    ],
    bestFor: [
      'Players who want their practice time structured rather than improvised',
      'Anyone training around a specific diagnosed fault',
    ],
    guide: [
      {
        title: 'Generate from your active diagnosis',
        body: 'With a current diagnosis in place, generate a routine — it’s built around your priority fault and level.',
      },
      {
        title: 'Follow the warm-up first',
        body: 'Don’t skip the activation work; it primes the movements the drill block depends on.',
      },
      {
        title: 'Hit the feedback checkpoints',
        body: 'Pause at each checkpoint to self-assess. These are where you catch whether the session is working.',
      },
      {
        title: 'Regenerate as your diagnosis evolves',
        body: 'After a retest changes your priority, generate a fresh routine so you’re always training the current bottleneck.',
      },
    ],
    limitations: [
      'A routine is only as relevant as your latest diagnosis — keep your data current for the best plan.',
    ],
    relatedSlugs: ['practice-schedule', 'personalized-drill-recommendations', 'pre-round-pre-game-warm-up'],
  },
  {
    slug: 'practice-schedule',
    name: 'Practice Schedule',
    group: 'Training & Drills',
    sports: 'All 7 sports',
    summary:
      'Creates a 7-day practice schedule based on your available days and session length. Each day has a focused theme tied to your current training priorities.',
    overview: [
      'The Practice Schedule turns your priorities into a 7-day plan that fits your real life. Tell it which days you can train and how long you have, and it lays out a week where each day has a single focused theme tied to your current training needs.',
      'Themed days prevent the most common practice mistake: doing a little of everything and improving at nothing. By assigning one focus per session, the schedule keeps your week coherent and your reps concentrated where they matter.',
    ],
    bestFor: [
      'Players who train several times a week and want a coherent plan',
      'Anyone who tends to "practise everything" and wants more focus',
    ],
    guide: [
      {
        title: 'Set your availability',
        body: 'Choose the days you can realistically train and your typical session length. Honest inputs make a usable plan.',
      },
      {
        title: 'Follow one theme per day',
        body: 'Each day targets a single theme tied to your priorities. Stick to the theme rather than freelancing.',
      },
      {
        title: 'Rebuild the week as priorities shift',
        body: 'When your diagnosis changes, regenerate the schedule so the themes track your current needs.',
      },
    ],
    relatedSlugs: ['training-routine-generator', 'pre-round-pre-game-warm-up', 'session-history'],
  },
  {
    slug: 'drill-library',
    name: 'Drill Library',
    group: 'Training & Drills',
    sports: 'All 7 sports',
    summary:
      'Browse the full drill library filtered by sport, issue category, and difficulty. Each drill entry explains what it corrects and how to perform it.',
    overview: [
      'The Drill Library is the full catalogue behind SwingVantage’s recommendations, open for you to browse directly. Filter by sport, issue category, and difficulty to find drills for whatever you want to work on, each with a clear explanation of what it corrects and how to perform it.',
      'While the Fix Stack and personalised recommendations push the right drill to you automatically, the library is there for the times you want to explore — to build your own block, work a secondary issue, or simply understand the range of tools available for your sport.',
    ],
    bestFor: [
      'Self-directed players who like to browse and build their own sessions',
      'Coaches assembling drill blocks for athletes',
    ],
    guide: [
      {
        title: 'Filter to your need',
        body: 'Narrow by sport, issue category, and difficulty so you only see drills relevant to what you’re working on.',
      },
      {
        title: 'Read "what it corrects" before "how to do it"',
        body: 'Pick drills by the fault they target, not by novelty — then learn the execution.',
      },
      {
        title: 'Match difficulty to your level',
        body: 'Choose a difficulty you can perform with quality; a drill done sloppily teaches the wrong pattern.',
      },
    ],
    relatedSlugs: ['personalized-drill-recommendations', 'fix-stack', 'training-routine-generator'],
  },
  {
    slug: 'pre-round-pre-game-warm-up',
    name: 'Pre-Round / Pre-Game Warm-Up',
    group: 'Training & Drills',
    sports: 'All 7 sports',
    summary:
      'Generates a personalized pre-round warm-up sequence for golf, or a sport-specific pre-game activation checklist for tennis, baseball, and softball.',
    note: 'Warm-ups are adapted to your active diagnosis and how much time you have before play.',
    overview: [
      'The Pre-Round / Pre-Game Warm-Up gives you a focused activation sequence for the minutes before you play — a pre-round routine for golf, or a sport-specific activation checklist for tennis, baseball, softball and the rest. It’s adapted to your active diagnosis and to how much time you actually have, whether that’s five minutes or twenty-five.',
      'A good warm-up does two jobs: it readies your body, and it primes the one feel you’re trying to bring into competition. By tying the sequence to your current fix, SwingVantage turns warm-up time into a final, low-pressure rehearsal of the change you’ve been practising.',
    ],
    bestFor: [
      'Players who arrive and immediately play with no structured warm-up',
      'Anyone trying to carry a practice fix into actual competition',
    ],
    guide: [
      {
        title: 'Tell it how long you have',
        body: 'Set the time available before play; the sequence scales from a quick activation to a full routine.',
      },
      {
        title: 'Prime your active fix last',
        body: 'End the warm-up by rehearsing the feel from your current Fix Stack so it’s fresh when you start.',
      },
      {
        title: 'Keep it low-pressure',
        body: 'Warm-up is for readiness, not score — don’t turn it into a results-driven session.',
      },
    ],
    limitations: [
      'General readiness guidance for healthy athletes — not medical or rehab advice.',
    ],
    relatedSlugs: ['training-routine-generator', 'readiness-recovery', 'fix-stack'],
  },
];
