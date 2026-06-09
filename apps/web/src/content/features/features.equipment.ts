// ============================================================
// SwingVantage — Feature Registry: Equipment & Cross-Sport Intelligence
// ============================================================

import type { Feature } from './types';

export const EQUIPMENT_FEATURES: Feature[] = [
  // ── Equipment ────────────────────────────────────────────
  {
    slug: 'golf-bag-manager',
    name: 'Golf Bag Manager',
    group: 'Equipment',
    sports: 'Golf',
    summary:
      'Log every club in your bag — brand, model, loft, shaft flex, typical carry distance. SwingVantage uses this data to add equipment context to your diagnoses.',
    overview: [
      'The Golf Bag Manager is where you record every club you carry — brand, model, loft, shaft flex, and typical carry distance. Once your bag is in, SwingVantage can factor equipment into your diagnoses, distinguishing a swing problem from a gapping or gear problem.',
      'It also unlocks the rest of the equipment tools: loft gapping analysis to find distance holes, and loft autofill to populate specs quickly. A well-maintained bag is the foundation for honest distance and gapping insight.',
    ],
    bestFor: [
      'Golfers who want equipment context folded into their analysis',
      'Anyone planning a re-gap, fitting, or new-club decision',
    ],
    guide: [
      {
        title: 'Add every club you carry',
        body: 'Enter each club with as much detail as you have — brand, model, loft, flex, and a realistic carry distance.',
      },
      {
        title: 'Use realistic carry numbers',
        body: 'Log your actual average carry, not your best-ever. Honest numbers make gapping analysis meaningful.',
      },
      {
        title: 'Keep it current',
        body: 'Update the bag when you change clubs or shafts so diagnoses and gapping stay accurate.',
      },
    ],
    relatedSlugs: ['loft-gapping-analysis', 'loft-autofill', 'launch-monitor-csv-import'],
    relatedLinks: [{ label: 'Golf equipment', href: '/equipment/golf' }],
  },
  {
    slug: 'loft-gapping-analysis',
    name: 'Loft Gapping Analysis',
    group: 'Equipment',
    sports: 'Golf',
    summary:
      'See the carry distance gap between every club in your bag. SwingVantage highlights clubs where the gap is too large (missing distance window) or too small (overlap).',
    note: '30+ club model specs are pre-loaded. Generic defaults fill in any gaps.',
    overview: [
      'Loft Gapping Analysis maps the carry-distance gaps between every club in your bag and flags the problems: gaps that are too large (a distance window you can’t cover) and gaps that are too small (two clubs doing the same job). It’s the fastest way to see whether your set is actually built to score.',
      'With 30+ club-model specs pre-loaded and sensible defaults filling any blanks, you get a clear picture without measuring everything by hand. Fixing a gapping hole is often worth more strokes than a swing change — and this shows you exactly where the holes are.',
    ],
    bestFor: [
      'Golfers unsure whether their distance gaps are sensible',
      'Players considering adding, removing, or re-lofting a club',
    ],
    guide: [
      {
        title: 'Populate your bag first',
        body: 'Gapping is only as good as your carry numbers — log realistic distances in the Bag Manager.',
      },
      {
        title: 'Hunt the large gaps',
        body: 'Find any window where you’d have to swing harder or take something off — those are the gaps that cost shots.',
      },
      {
        title: 'Resolve the overlaps',
        body: 'Where two clubs carry nearly the same distance, consider re-lofting or swapping one for better coverage.',
      },
    ],
    limitations: [
      'Uses your logged carry distances and model specs; for precise gapping, confirm carries on a launch monitor.',
    ],
    relatedSlugs: ['golf-bag-manager', 'loft-autofill', 'launch-monitor-csv-import'],
  },
  {
    slug: 'loft-autofill',
    name: 'Loft Autofill',
    group: 'Equipment',
    sports: 'Golf',
    summary:
      'Select your club brand and model and SwingVantage auto-fills the stock loft. You can override with your actual measured loft for fitted clubs.',
    overview: [
      'Loft Autofill removes the busywork of building your bag: pick a brand and model and SwingVantage fills in the stock loft automatically. For fitted or bent clubs, you can override with your actual measured loft so the data reflects your real equipment.',
      'It’s a small convenience that pays off across the equipment tools — accurate lofts make gapping analysis and equipment-aware diagnoses trustworthy, and autofill gets you there in seconds instead of looking up specs one by one.',
    ],
    bestFor: [
      'Anyone setting up their bag who doesn’t want to look up every spec',
      'Players with fitted clubs who want to override stock values precisely',
    ],
    guide: [
      {
        title: 'Select brand and model',
        body: 'Choose your club from the list and let SwingVantage fill the stock loft.',
      },
      {
        title: 'Override for fitted clubs',
        body: 'If your loft was bent or fitted, replace the stock value with your measured loft for accuracy.',
      },
    ],
    relatedSlugs: ['golf-bag-manager', 'loft-gapping-analysis'],
  },

  // ── Cross-Sport Intelligence ─────────────────────────────
  {
    slug: 'athlete-general-intelligence',
    name: 'Athlete General Intelligence (AGI)',
    group: 'Cross-Sport Intelligence',
    sports: 'All 7 sports',
    summary:
      'One engine looks across every sport you analyze at once and finds your “keystone” — the single skill that, if you improve it, lifts the most sports together.',
    note: 'Every number carries its basis and confidence, and the whole read gets a simple A–D trust grade. “General” means breadth across your sports, not human-level AI; single-camera values are estimates.',
    overview: [
      'Athlete General Intelligence looks across every sport you analyse at once and finds your "keystone" — the single underlying skill that, improved, lifts the most sports together. Instead of treating golf, tennis, and baseball as separate projects, AGI sees the athlete underneath them all.',
      'It shows what transfers between your sports, factors in today’s readiness, and turns the whole picture into one prioritised plan you can share with a coach. Every number carries its basis and confidence, and the entire read gets a simple A–D trust grade so you always know how solid it is.',
      '"General" here means breadth across your sports — not human-level AI. It’s honest about its inputs: single-camera values are estimates, and cross-sport transfer is opt-in, so you stay in control of how the engine reasons about you.',
    ],
    bestFor: [
      'Multi-sport athletes who want one unified development priority',
      'Coaches working with an athlete across more than one sport',
    ],
    guide: [
      {
        title: 'Analyse at least two sports',
        body: 'AGI’s cross-sport reasoning needs breadth — give it data from two or more sports to find your keystone.',
      },
      {
        title: 'Opt in to cross-sport transfer',
        body: 'Cross-sport reasoning is opt-in by design. Enable it when you want the engine to connect skills across your sports.',
      },
      {
        title: 'Read the keystone and trust grade',
        body: 'Focus on the single keystone skill, and weigh it by the A–D trust grade attached to the read.',
      },
      {
        title: 'Share the plan with a coach',
        body: 'Export the prioritised plan — its evidence and confidence are laid out so a coach can act on it immediately.',
      },
    ],
    limitations: [
      'Breadth across your sports, not human-level AI; single-camera inputs are estimates.',
      'Cross-sport transfer is opt-in and needs two or more analysed sports to be meaningful.',
    ],
    faqs: [
      {
        question: 'What is a "keystone" skill?',
        answer:
          'The single underlying ability that influences the most across your sports — improving it produces the widest gain. AGI identifies it from the patterns shared between the sports you analyse.',
      },
    ],
    relatedSlugs: ['athletic-journey', 'daily-notes', 'player-arc', 'swingvantage-labs'],
  },
  {
    slug: 'athletic-journey',
    name: 'Athletic Journey',
    group: 'Cross-Sport Intelligence',
    sports: 'Golf, Tennis, Pickleball, Padel live · Baseball & Softball in development',
    summary:
      'Your personalized roadmap from beginner to professional-level performance. It classifies your current stage from a blend of your profile, any ratings, your videos, logged play, and practice — then shows what to work on next and builds a weekly plan.',
    note: 'It explains the evidence for and against each stage instead of just labeling you. Optional handicap, UTR/NTRP, or DUPR sharpen the read. In-development sports show an honest waitlist — never a faked score.',
    overview: [
      'Athletic Journey is your roadmap from beginner to professional-level performance. It classifies your current development stage from a blend of signals — your profile, any ratings you hold, your videos, logged play, and practice — and then shows what to work on next, packaged into a weekly plan.',
      'What sets it apart is the honesty of the classification: it explains the evidence for and against each stage rather than slapping a label on you. Optional inputs like a handicap, UTR/NTRP, or DUPR sharpen the read, and sports still in development show a transparent waitlist instead of a fabricated score.',
    ],
    bestFor: [
      'Players who want a clear "where am I and what’s next" pathway',
      'Athletes with a formal rating (handicap, UTR/NTRP, DUPR) to fold in',
    ],
    guide: [
      {
        title: 'Complete your profile and add ratings',
        body: 'Fill in your profile and any formal ratings — they sharpen the stage classification.',
      },
      {
        title: 'Read the evidence for your stage',
        body: 'Look at the for/against evidence, not just the label, to understand exactly what’s holding you at your current stage.',
      },
      {
        title: 'Follow the weekly plan',
        body: 'Work the "what’s next" plan it builds, then re-check as your data accumulates.',
      },
    ],
    limitations: [
      'Live for golf, tennis, pickleball, and padel; baseball and softball are in development with an honest waitlist.',
    ],
    relatedSlugs: ['athlete-general-intelligence', 'daily-notes', 'verified-recruiting-profile'],
    relatedLinks: [{ label: 'Open your Journey', href: '/journey' }],
  },
  {
    slug: 'daily-notes',
    name: 'Daily Notes',
    group: 'Cross-Sport Intelligence',
    sports: 'All 7 sports',
    summary:
      'After any round, match, game, or practice, rate how you played and jot a few words. SwingVantage reads the faults out of your own language and adds them to your cross-sport profile — no launch monitor or video needed.',
    note: 'Self-ratings are clearly labeled low-confidence self-reports, never measurements. When the same issue keeps appearing across your days, it gets flagged as a pattern worth a dedicated fix.',
    overview: [
      'Daily Notes is the lowest-friction way to feed SwingVantage: after any round, match, game, or practice, rate how you played and jot a few words about it. The engine reads the faults out of your own language — "kept pulling it left," "slow first step" — and folds them into your cross-sport profile. No launch monitor or video required.',
      'Over time, these notes become a powerful pattern detector. Self-ratings are clearly labelled as low-confidence self-reports — never measurements — but when the same issue keeps surfacing across your days, SwingVantage flags it as a pattern worth a dedicated fix. It’s how the app stays useful even on the days you can’t capture data.',
    ],
    bestFor: [
      'Players who compete more than they capture data',
      'Anyone who wants a frictionless way to keep feeding their profile',
    ],
    guide: [
      {
        title: 'Jot a note after you play',
        body: 'Rate the outing and write a sentence or two in your own words while it’s fresh.',
      },
      {
        title: 'Describe what went wrong plainly',
        body: 'Plain language is enough — SwingVantage extracts the likely faults from how you describe it.',
      },
      {
        title: 'Watch for flagged patterns',
        body: 'When the same issue recurs across notes, it gets flagged as a pattern — that’s your cue to start a dedicated fix.',
      },
    ],
    limitations: [
      'Self-ratings are low-confidence self-reports, clearly labelled — useful for patterns, not precision.',
    ],
    relatedSlugs: ['manual-session-log', 'athlete-general-intelligence', 'ai-diagnostic-engine'],
  },
];
