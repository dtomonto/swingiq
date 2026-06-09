// ============================================================
// SwingVantage — Feature Registry: Progress & AI Coach
// ============================================================

import type { Feature } from './types';

export const PROGRESS_FEATURES: Feature[] = [
  {
    slug: 'session-history',
    name: 'Session History',
    group: 'Progress & AI Coach',
    sports: 'All 7 sports',
    summary:
      'Every session is saved with its full shot data, diagnosis, scores, and training recommendations. Filter by sport, date range, or club/movement type.',
    overview: [
      'Session History is your complete, searchable training record. Every session you import or log is saved in full — shot data, the diagnosis it produced, scores, and the recommendations that followed — so nothing is lost and everything is comparable over time.',
      'A durable history is what makes real progress visible. You can filter by sport, date range, or club/movement type to answer questions like "is my driver actually getting better?" or "what was I working on last spring?" — turning scattered practice into a story you can learn from.',
    ],
    bestFor: [
      'Players who want every session preserved and comparable',
      'Anyone tracking improvement across months or seasons',
    ],
    guide: [
      {
        title: 'Capture sessions consistently',
        body: 'The more consistently you import or log, the more useful the history. Aim to record every meaningful session.',
      },
      {
        title: 'Filter to answer a question',
        body: 'Use the sport, date, and club/movement filters to isolate exactly what you want to review — e.g. only driver sessions this month.',
      },
      {
        title: 'Export for safekeeping',
        body: 'Periodically export a backup so your record is yours forever, independent of any device.',
      },
    ],
    relatedSlugs: ['swing-score-trends', 'player-arc', 'backup-restore'],
  },
  {
    slug: 'swing-score-trends',
    name: 'Swing Score Trends',
    group: 'Progress & AI Coach',
    sports: 'Golf',
    summary:
      'Track your overall swing score, face control, path control, strike quality, consistency, and dispersion across sessions on a time-series chart.',
    overview: [
      'Swing Score Trends plots the components of your golf swing over time — overall score, face control, path control, strike quality, consistency, and dispersion — on a single time-series chart. Instead of judging a session by feel, you see whether the numbers are actually trending the right way.',
      'Trends cut through day-to-day noise. One bad range session means little; a face-control line that’s been climbing for a month means a real change has taken hold. Watching the right sub-score move is the clearest proof that the fix you’ve been working is paying off.',
    ],
    bestFor: [
      'Golfers who want objective proof that practice is working',
      'Players tuning a specific component (e.g. strike quality) over time',
    ],
    guide: [
      {
        title: 'Watch the sub-score tied to your fix',
        body: 'If you’re working on path, watch the path-control line specifically — the overall score can lag a real component gain.',
      },
      {
        title: 'Judge trends, not single points',
        body: 'Look at the direction over several sessions, not one data point, before concluding anything.',
      },
      {
        title: 'Keep conditions consistent',
        body: 'Capture under similar conditions so the trend reflects your swing, not the venue.',
      },
    ],
    limitations: [
      'Golf-specific today, where the scoring model is most developed.',
    ],
    relatedSlugs: ['session-history', 'ai-diagnostic-engine', 'retest'],
  },
  {
    slug: 'milestones',
    name: 'Milestones',
    group: 'Progress & AI Coach',
    sports: 'All 7 sports',
    summary:
      'Automatically tracks key milestones — sessions completed, videos analyzed, personal bests, streaks, and improvement markers.',
    overview: [
      'Milestones automatically recognises the markers worth celebrating — sessions completed, videos analysed, personal bests, streaks, and improvement moments — so your progress is acknowledged as it happens, not just measured.',
      'Beyond motivation, milestones give shape to the long road of improvement. Streaks reward consistency, personal bests mark real gains, and improvement markers flag the moments your data took a genuine step forward — small signals that keep practice rewarding over months.',
    ],
    bestFor: [
      'Players who stay motivated by visible progress and streaks',
      'Anyone who wants their consistency recognised, not just their scores',
    ],
    guide: [
      {
        title: 'Let them accrue',
        body: 'Milestones track automatically as you use SwingVantage — just keep training and capturing.',
      },
      {
        title: 'Protect your streaks',
        body: 'Use streaks as a gentle nudge to stay consistent; consistency is the real driver of improvement.',
      },
    ],
    relatedSlugs: ['session-history', 'player-arc'],
  },
  {
    slug: 'retest',
    name: 'Retest — Prove the Change',
    group: 'Progress & AI Coach',
    sports: 'All 7 sports',
    summary:
      'SwingVantage reminds you when a diagnosed finding is due for a retest, then — after you re-analyze under the same conditions — shows an honest before-and-after read of whether it actually changed.',
    note: 'Comparisons are labeled directional reads from your data and video, not lab-measured biomechanics.',
    overview: [
      'Retest closes the improvement loop. When you’ve been working a diagnosed fault, SwingVantage reminds you that it’s due for a retest, then — once you re-analyse under the same conditions — shows an honest before-and-after read of whether the issue actually moved.',
      'This is the antidote to "I feel like it’s better." Feel is unreliable; a same-conditions comparison is not. Retesting tells you whether to bank the fix and move on, or keep working it — and it builds an evidence trail of what genuinely changed your swing.',
      'In keeping with SwingVantage’s honesty, comparisons are labelled as directional reads from your data and video, not lab-measured biomechanics — confident enough to guide decisions, honest about what they are.',
    ],
    bestFor: [
      'Anyone who has ever "fixed" something and wasn’t sure it stuck',
      'Players who want proof before moving to the next fix',
    ],
    guide: [
      {
        title: 'Wait for the retest prompt',
        body: 'Give a fix real practice time. SwingVantage reminds you when a finding is due to be re-checked.',
      },
      {
        title: 'Re-capture under the same conditions',
        body: 'Use the same range, camera angle, and setup as the original so the comparison is fair.',
      },
      {
        title: 'Read the before/after honestly',
        body: 'If it moved, bank it and move on. If it didn’t, the fix or the practice needs to change — that’s useful information, not failure.',
      },
    ],
    proTips: [
      'A retest that shows no change often means the cue was right but the reps were too few — keep conditions identical and look at volume.',
    ],
    limitations: [
      'Directional reads from your data and video — not laboratory biomechanics.',
    ],
    faqs: [
      {
        question: 'Why does the retest insist on the same conditions?',
        answer:
          'Because a fair comparison requires it. Changing the venue, angle, or setup introduces variables that muddy whether your swing actually changed. Same conditions in, trustworthy comparison out.',
      },
    ],
    relatedSlugs: ['fix-stack', 'player-arc', 'swing-score-trends'],
  },
  {
    slug: 'player-arc',
    name: 'Player Arc',
    group: 'Progress & AI Coach',
    sports: 'All 7 sports',
    summary:
      'The story of your improvement over time — the faults that keep coming back, which drills actually worked for you, and honest proof of what each retest changed. It builds with every session.',
    overview: [
      'Player Arc is the narrative your data tells about you: the faults that keep returning, the drills that actually worked for you specifically, and honest proof — from your retests — of what changed and what didn’t. It builds itself with every session you log.',
      'Where Session History is the raw record and Score Trends are the charts, Player Arc is the meaning. It connects the dots into a personal coaching memory: this is your recurring weakness, this is the drill that fixed it last time, this is the change that held. Over time it becomes the single most personalised asset in the app.',
    ],
    bestFor: [
      'Long-term players who want the through-line of their development',
      'Anyone who wants to know which drills work for them, not in general',
    ],
    guide: [
      {
        title: 'Feed it by closing loops',
        body: 'Player Arc gets richer every time you diagnose, fix, and retest. The loop is what creates the story.',
      },
      {
        title: 'Use it to short-circuit recurring faults',
        body: 'When an old fault returns, check the arc for the drill that beat it last time instead of starting from scratch.',
      },
      {
        title: 'Share it with a coach',
        body: 'The arc is a concise, honest brief a coach can read in a minute to understand your history.',
      },
    ],
    relatedSlugs: ['retest', 'session-history', 'fix-stack', 'athlete-general-intelligence'],
  },
  {
    slug: 'swingvantage-labs',
    name: 'SwingVantage Labs',
    group: 'Progress & AI Coach',
    sports: 'All 7 sports',
    summary:
      'An in-app home for emerging, on-device tools: a daily readiness score, a private player model, cross-sport skill transfer, your performance graph, and benchmark mirrors.',
    note: 'Some are early versions — each is honest about its confidence and what it does not know yet.',
    overview: [
      'SwingVantage Labs is where emerging, on-device tools live: a daily readiness score, a private player model that learns your tendencies, cross-sport skill transfer, your performance graph, and benchmark mirrors that show where you stand. It’s a single home for the experimental edge of the product.',
      'Labs tools are honest about their stage. Each one tells you its confidence and what it doesn’t yet know, so you can explore the frontier without being misled. It’s the best place to see where SwingVantage is heading — and to get value from capable early tools before they graduate into the core app.',
    ],
    bestFor: [
      'Curious players who like trying new, on-device tools early',
      'Anyone interested in cross-sport and player-model insights',
    ],
    guide: [
      {
        title: 'Explore one tool at a time',
        body: 'Open Labs and try a single tool — like the readiness score or player model — rather than everything at once.',
      },
      {
        title: 'Read each tool’s confidence note',
        body: 'Every Labs tool states its maturity and limits. Calibrate how much to lean on it accordingly.',
      },
    ],
    limitations: [
      'Some Labs tools are early versions; they’re labelled as such and improve over time.',
    ],
    relatedSlugs: ['athlete-general-intelligence', 'readiness-recovery', 'player-arc'],
    relatedLinks: [{ label: 'Open Labs', href: '/labs' }],
  },
  {
    slug: 'ai-coach-chat',
    name: 'AI Coach Chat',
    group: 'Progress & AI Coach',
    sports: 'All 7 sports',
    summary:
      'Ask the AI coach questions about your swing, drills, or practice strategy. The AI coach uses your actual session data and active diagnosis as context.',
    note: 'Powered by a large language model. Responses are coaching suggestions, not professional instruction.',
    overview: [
      'AI Coach Chat lets you ask questions about your swing, your drills, or how to structure practice — and get answers grounded in your actual session data and active diagnosis, not generic advice. It’s like having a knowledgeable training partner who has read your whole history.',
      'Because it’s anchored to your real data, the coach can explain why your diagnosis says what it says, suggest how to adapt a drill, or help you plan a week around your priority fix. Responses are coaching suggestions powered by a large language model — useful and contextual, but not a substitute for professional instruction.',
    ],
    bestFor: [
      'Players who want to ask "why" and "what next" in plain language',
      'Anyone who wants their data explained conversationally',
    ],
    guide: [
      {
        title: 'Ask about your actual diagnosis',
        body: 'Reference your current finding — "why is my path the priority?" — so the coach answers from your data, not generalities.',
      },
      {
        title: 'Use it to adapt, not replace, the plan',
        body: 'Ask how to modify a drill for your space or gear; let it tailor the existing recommendations.',
      },
      {
        title: 'Treat answers as suggestions',
        body: 'It’s a coaching aid, not certified instruction — sanity-check anything that contradicts your own feel or a real coach.',
      },
    ],
    limitations: [
      'Powered by a large language model; responses are suggestions, not professional or medical instruction.',
      'Requires an AI provider to be configured; otherwise the deterministic diagnosis and drills still work fully without it.',
    ],
    faqs: [
      {
        question: 'Does the AI coach see my data?',
        answer:
          'It uses your session data and active diagnosis as context to give relevant answers. It’s designed to explain and adapt your existing analysis, not to invent new claims about your swing.',
      },
    ],
    relatedSlugs: ['ai-diagnostic-engine', 'fix-stack', 'personalized-drill-recommendations'],
  },
];
