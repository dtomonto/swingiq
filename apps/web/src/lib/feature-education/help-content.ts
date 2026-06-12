// ============================================================
// SwingVantage — Help Center: curated content + public allowlist
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The auto-generated education seed produces a thin, near-identical
//   template for every route in the app. That is fine as a fallback, but it
//   is NOT comprehensive and reads as duplicate/doorway content to search
//   engines. This module fixes that in two ways:
//
//     1. PUBLIC_HELP_SLUGS — the allowlist of slugs that are REAL, indexable
//        user features. Only these appear in the /help index, the sitemap,
//        and static generation, and only these are `index`-able. Everything
//        else (internal modules, auth/legal/marketing routes, registry noise)
//        is kept out of the indexed Help Center. Pages still resolve (so live
//        in-app "Learn more →" links never 404) but are `noindex` + unlisted.
//
//     2. CURATED_HELP — hand-authored, comprehensive, UNIQUE guides for the
//        flagship features. When a curated entry exists for a slug, it
//        overrides the generated content field-by-field, so those pages are
//        genuinely in-depth and SEO-grade. Non-curated allowlisted features
//        keep their (sanitized) generated content until a curated entry is
//        written for them.
//
//   Pure + deterministic (no I/O): safe to statically generate. Authoring is
//   grounded in what the product actually does — no fabricated metrics.
// ============================================================

import type { AssetFaq, AssetSection, AssetStep } from './types';

/** Day the curated guides were last reviewed (drives `dateModified`). */
export const HELP_CONTENT_UPDATED = '2026-06-12';

/** A hand-authored override for a help topic. All fields optional except lead. */
export interface CuratedHelpTopic {
  /** Override the auto-derived title (e.g. force "Golf Swing Analysis"). */
  title?: string;
  /** One-line plain-language lead shown in the hero + cards. */
  lead: string;
  /** Short, direct answer-engine answer (the "In short" box). */
  answer: string;
  /** SEO <title> stem (brand suffix added by buildMetadata). */
  seoTitle: string;
  /** Meta description (~150-160 chars). */
  seoDescription: string;
  /** Numbered walkthrough. */
  steps: AssetStep[];
  /** Narrative sections (rendered in order). */
  sections: AssetSection[];
  /** Frequently asked questions. */
  faqs: AssetFaq[];
  /** Slugs of related guides for internal linking (must be public slugs). */
  related?: string[];
  /** Override the in-app route the "Open in app" CTA points to. */
  primaryRoute?: string;
}

// ── Shared, honest boilerplate ────────────────────────────────
// Reused across sport guides so accuracy/privacy claims stay consistent and
// truthful (see [[project_analytics_cookies]] / security-os findings: frames
// are sent to an AI provider; we don't sell data or run ads).

const PRIVACY_SECTION: AssetSection = {
  heading: 'Your video and your privacy',
  body: [
    'Your swing is yours. To generate a report, frames from your video are sent securely to our AI analysis provider — that is what reads your body positions and motion.',
    'We do not sell your data and we do not run ads. Your sessions are tied to your private account and synced across your devices so you can pick up where you left off.',
    'You can review, export, or delete what you create from the Data center at any time.',
  ],
};

const ACCURACY_SECTION: AssetSection = {
  heading: 'How accurate is it?',
  body: [
    'Every result that comes from watching your video is a confident, well-reasoned starting point — not a lab measurement. Treat it like a sharp-eyed coach giving you their read, then confirm it on the range or court.',
    'Accuracy depends on what you give it. A clear, well-lit, side-on video of a full swing produces a far better report than a dark, cropped, or partial clip.',
    'When the analysis is unsure, it tells you so rather than inventing a number. Honesty over false precision is a core principle.',
  ],
};

const BEST_VIDEO_FAQ: AssetFaq = {
  q: 'What kind of video gives the best results?',
  a: 'Film from the side (down-the-line or face-on), in good light, with your whole body and the full swing in frame. Hold the phone steady or prop it up. A 3–10 second clip of one swing is ideal — you do not need slow motion.',
};

const FREE_FAQ: AssetFaq = {
  q: 'Is it free?',
  a: 'Yes — you can analyze a swing for free, no equipment beyond your phone required. Some advanced tools and history depth are part of a paid plan, but the core "see your one fix" experience is free to try.',
};

// ── Reusable sport-guide builder ──────────────────────────────
// Each sport's swing-analysis guide shares a proven structure; only the
// sport-specific specifics (common faults, what's measured, drills) differ.

interface SportGuideSpec {
  sport: string; // "golf"
  Sport: string; // "Golf"
  title: string; // "Golf Swing Analysis"
  route: string;
  /** The motion analyzed, e.g. "golf swing", "tennis serve and groundstrokes". */
  motion: string;
  /** 3–5 of the most-searched faults/goals this sport cares about. */
  commonIssues: string[];
  /** What the report focuses on for this sport. */
  focusAreas: string[];
  /** Sport-specific FAQs appended after the shared ones. */
  extraFaqs: AssetFaq[];
  related: string[];
  /** Optional extra keyword phrasing for the meta description. */
  searchPhrase: string;
}

function sportGuide(s: SportGuideSpec): CuratedHelpTopic {
  return {
    title: s.title,
    lead: `Upload one ${s.motion} and get an AI breakdown of what to fix first, the drills to fix it, and a way to prove it worked.`,
    answer: `${s.title} on SwingVantage turns a single phone video of your ${s.motion} into a prioritized report: your number-one fix, the drills that groove it, and a retest to confirm progress. It is built for ${s.Sport.toLowerCase()} and works free from any phone.`,
    seoTitle: `${s.title} — Free AI ${s.Sport} Swing Analyzer`,
    seoDescription: `Free AI ${s.searchPhrase}. Upload one phone video and get your top fix, targeted drills, and a retest. Built for ${s.Sport.toLowerCase()} — no sensors, no coach required.`,
    primaryRoute: s.route,
    steps: [
      { title: 'Record one swing', detail: `Film a single ${s.motion} from the side in good light, with your whole body in frame. A 3–10 second clip is perfect — slow motion is not required.` },
      { title: 'Upload it', detail: `Open ${s.route} (or the Upload screen), choose ${s.Sport}, and drop in your clip. You can also record straight from the app with on-screen framing help.` },
      { title: 'Get your report', detail: 'In moments you get a plain-language breakdown: what is working, what is costing you the most, and the single change to make first.' },
      { title: 'Start with your one fix', detail: 'The report leads with your highest-priority fix. Ignore the noise and work that one thing — it is ordered by impact for a reason.' },
      { title: 'Run the drills', detail: 'Each fix comes with drills you can do at home or before practice. Add them to your plan so they show up in Today’s Tasks.' },
      { title: 'Retest to prove it', detail: 'After a few sessions, upload a fresh swing and compare. SwingVantage shows you whether the fix actually moved — closing the loop.' },
    ],
    sections: [
      {
        heading: `What ${s.title} does`,
        body: [
          `${s.title} reads a single video of your ${s.motion} and turns it into an actionable plan. Instead of a wall of numbers, it tells you the one thing to change that will help the most right now.`,
          `It is designed around a simple promise: one fix, one plan, one retest. You are never left guessing what to work on.`,
        ],
      },
      {
        heading: `What it looks at for ${s.Sport.toLowerCase()}`,
        body: [
          `For ${s.Sport.toLowerCase()}, the analysis focuses on the things that actually change outcomes:`,
          ...s.focusAreas.map((f) => `- ${f}`),
        ],
      },
      {
        heading: 'Problems it helps with',
        body: [
          `Players most often come to ${s.title} to work on:`,
          ...s.commonIssues.map((c) => `- ${c}`),
          'If you are not sure what is wrong, that is exactly what it is for — upload a swing and let it find your biggest opportunity.',
        ],
      },
      {
        heading: 'Who it’s for',
        body: [
          `Beginners, improving amateurs, parents helping a young athlete, and coaches who want a fast second opinion. You do not need launch monitors, sensors, or any special gear — just your phone.`,
        ],
      },
      ACCURACY_SECTION,
      {
        heading: 'Get the most out of it',
        body: [
          '- Film the same angle each time so your retests are comparable.',
          '- Work one fix at a time — chasing five changes at once is the fastest way to get worse before you get better.',
          '- Retest every week or two, not every rep. Real change shows up over sessions.',
          '- Pair it with the drills and your practice plan so the work actually happens.',
        ],
      },
      PRIVACY_SECTION,
    ],
    faqs: [
      BEST_VIDEO_FAQ,
      {
        q: `Do I need special equipment to analyze my ${s.Sport.toLowerCase()} swing?`,
        a: 'No. A modern phone camera is enough. There are no sensors to wear, no launch monitor, and nothing to calibrate. Just film a clear swing and upload it.',
      },
      {
        q: 'How fast do I get my results?',
        a: 'Most reports come back within moments of uploading. You will see your top fix first, then drills and a plan underneath.',
      },
      ...s.extraFaqs,
      {
        q: 'Can it tell if I’m actually improving?',
        a: 'Yes — that is the point of the retest. Upload a new swing later and SwingVantage compares it to your earlier one so you can see whether the fix took hold, instead of guessing.',
      },
      FREE_FAQ,
      {
        q: 'Is this the same as a real coach?',
        a: 'It is a powerful complement, not a replacement. It gives you an instant, consistent read any time of day and great drills to work on; a coach adds human feel, feedback, and accountability. Many players use both.',
      },
    ],
    related: s.related,
  };
}

// ── The curated guides ────────────────────────────────────────

const SPORTS: Record<string, CuratedHelpTopic> = {
  'golf-swing-analysis': sportGuide({
    sport: 'golf',
    Sport: 'Golf',
    title: 'Golf Swing Analysis',
    route: '/golf-swing-analysis',
    motion: 'golf swing',
    searchPhrase: 'golf swing analysis from a single video',
    focusAreas: [
      'Swing path and club delivery — the over-the-top move behind most slices.',
      'Body rotation, hip turn, and sequencing through impact.',
      'Posture, setup, and balance from address to finish.',
      'Tempo and the transition from backswing to downswing.',
    ],
    commonIssues: [
      'Fixing a slice or a pull-hook',
      'Stopping fat and thin contact',
      'Adding consistency and distance',
      'Breaking 100, 90, or 80',
    ],
    extraFaqs: [
      {
        q: 'Can it help me fix my slice?',
        a: 'Yes — the slice is the most common fault it diagnoses. It looks at the over-the-top move and open clubface pattern that cause a slice and gives you the specific drills to square things up. See the Fix Your Slice guide for a deep dive.',
      },
      {
        q: 'Does golf get extra-accurate analysis?',
        a: 'Golf is our most mature sport. On top of AI vision it can use on-device motion tracking and a 3D kinematic breakdown, so golf reports go deeper than a simple video read.',
      },
    ],
    related: ['golf', 'diagnose', 'drills', 'motion-lab', 'retest'],
  }),
  'tennis-swing-analysis': sportGuide({
    sport: 'tennis',
    Sport: 'Tennis',
    title: 'Tennis Swing Analysis',
    route: '/tennis-swing-analysis',
    motion: 'tennis stroke',
    searchPhrase: 'tennis stroke and serve analysis from a single video',
    focusAreas: [
      'Serve mechanics — toss, trophy position, and racquet-drop timing.',
      'Forehand and backhand swing path and contact point.',
      'Body rotation, the kinetic chain, and weight transfer.',
      'Footwork, balance, and recovery.',
    ],
    commonIssues: [
      'Building a more reliable serve',
      'Cleaning up a one- or two-handed backhand',
      'Generating more topspin and power',
      'Fixing late or cramped contact',
    ],
    extraFaqs: [
      {
        q: 'Can I analyze my serve as well as groundstrokes?',
        a: 'Yes. Film whichever stroke you want feedback on — serve, forehand, or backhand — and choose Tennis. Film one stroke type per clip for the cleanest read.',
      },
    ],
    related: ['tennis', 'diagnose', 'drills', 'mental-performance', 'retest'],
  }),
  'baseball-swing-analysis': sportGuide({
    sport: 'baseball',
    Sport: 'Baseball',
    title: 'Baseball Swing Analysis',
    route: '/baseball-swing-analysis',
    motion: 'baseball swing',
    searchPhrase: 'baseball hitting and swing analysis from a single video',
    focusAreas: [
      'Bat path and attack angle through the zone.',
      'Hip-to-shoulder separation and rotational sequencing.',
      'Load, stride, and weight transfer.',
      'Hand path and contact point.',
    ],
    commonIssues: [
      'Stopping an uppercut or a steep, choppy bat path',
      'Adding exit velocity and power',
      'Improving timing and contact consistency',
      'Building a repeatable load and stride',
    ],
    extraFaqs: [
      {
        q: 'Will it help with exit velocity and power?',
        a: 'It focuses on the mechanics that drive exit velocity — bat path, separation, and sequencing — and points you to the drills that build them. See the exit-velocity drills guide for targeted work.',
      },
    ],
    related: ['baseball', 'softball-swing-analysis', 'diagnose', 'drills', 'retest'],
  }),
  'softball-swing-analysis': sportGuide({
    sport: 'softball',
    Sport: 'Softball',
    title: 'Softball Swing Analysis',
    route: '/softball-swing-analysis',
    motion: 'softball swing',
    searchPhrase: 'fastpitch softball swing analysis from a single video',
    focusAreas: [
      'Bat path matched to the rise/drop of fastpitch.',
      'Rotational sequencing and hip-shoulder separation.',
      'Load, stride direction, and weight transfer.',
      'Hand path and contact point.',
    ],
    commonIssues: [
      'Fixing a bat path that is too steep or too long',
      'Timing up faster pitching',
      'Adding power and exit velocity',
      'Building a consistent, repeatable swing',
    ],
    extraFaqs: [
      {
        q: 'Is fastpitch handled differently from baseball?',
        a: 'The mechanics overlap, but fastpitch has its own timing and pitch movement. Choose Softball so the read is tuned to a fastpitch swing rather than a baseball one.',
      },
    ],
    related: ['softball', 'baseball-swing-analysis', 'diagnose', 'drills', 'retest'],
  }),
  pickleball: {
    title: 'Pickleball Analysis',
    lead: 'Upload a clip of your dink, drive, or third-shot drop and get an AI read on what to fix first, plus the drills to fix it.',
    answer: 'Pickleball analysis on SwingVantage breaks down your strokes from a single phone video — dinks, drives, serves, and the all-important third-shot drop — and gives you one prioritized fix, drills, and a retest. Free from any phone.',
    seoTitle: 'Pickleball Analysis — Free AI Stroke & Technique Analyzer',
    seoDescription: 'Free AI pickleball analysis from one phone video. Get your top fix for dinks, drives, serves, and the third-shot drop, plus targeted drills and a retest.',
    primaryRoute: '/pickleball',
    steps: [
      { title: 'Record one stroke', detail: 'Film the shot you want feedback on — a dink rally, a drive, or a third-shot drop — from the side, in good light, with your whole body in frame.' },
      { title: 'Upload and choose Pickleball', detail: 'Open the Pickleball page or the Upload screen, select Pickleball, and drop in your clip.' },
      { title: 'Get your prioritized read', detail: 'You get a plain-language breakdown of contact point, paddle face, and footwork, led by the single change that will help most.' },
      { title: 'Work the drills', detail: 'Each fix comes with drills — soft-game control, reset, and footwork — that you can add to your practice plan.' },
      { title: 'Retest', detail: 'Upload a fresh clip later and compare to confirm the fix is sticking.' },
    ],
    sections: [
      {
        heading: 'What pickleball analysis does',
        body: [
          'It turns a single video of your pickleball stroke into a clear, prioritized plan — what is working, what is costing you points, and the one change to make first.',
          'It covers the soft game (dinks, resets, third-shot drops) and the power game (drives and serves), because winning pickleball needs both.',
        ],
      },
      {
        heading: 'What it looks at',
        body: [
          '- Contact point and paddle-face control on the dink and reset.',
          '- The third-shot drop arc and your transition to the kitchen line.',
          '- Drive mechanics and topspin on the faster balls.',
          '- Footwork, balance, and split-step timing.',
        ],
      },
      {
        heading: 'Problems it helps with',
        body: [
          '- Popping the ball up on dinks and resets.',
          '- An inconsistent or short third-shot drop.',
          '- Drives that sail long or float.',
          '- Getting caught out of position at the kitchen line.',
        ],
      },
      { heading: 'Who it’s for', body: ['Recreational and competitive players, parents, and coaches who want a fast, consistent second opinion — no sensors, just a phone.'] },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      BEST_VIDEO_FAQ,
      { q: 'Can I analyze my third-shot drop?', a: 'Yes — it is one of the most-requested shots. Film a few third-shot drops and choose Pickleball. See the dedicated third-shot-drop guide for focused drills.' },
      { q: 'Does it cover the dink and soft game?', a: 'Yes. The soft game is where most points are won and lost, so contact point and paddle control on dinks and resets are a core focus. See the dinking guide for more.' },
      { q: 'Do I need special equipment?', a: 'No — just your phone. No paddle sensors or special cameras required.' },
      FREE_FAQ,
    ],
    related: ['pickleball-dinking', 'pickleball-third-shot-drop', 'diagnose', 'drills', 'retest'],
  },
  padel: {
    title: 'Padel Analysis',
    lead: 'Upload a clip of your bandeja, volley, or wall play and get an AI read on what to fix first, plus the drills to fix it.',
    answer: 'Padel analysis on SwingVantage breaks down your strokes from a single phone video — the bandeja, volleys, the vibora, and wall rebounds — and gives you one prioritized fix, drills, and a retest. Free from any phone.',
    seoTitle: 'Padel Analysis — Free AI Stroke & Technique Analyzer',
    seoDescription: 'Free AI padel analysis from one phone video. Get your top fix for the bandeja, volleys, and wall play, plus targeted drills and a retest. Built for padel.',
    primaryRoute: '/padel',
    steps: [
      { title: 'Record one stroke', detail: 'Film the shot you want feedback on — a bandeja, volley, or a ball off the back glass — from the side, in good light, with your whole body in frame.' },
      { title: 'Upload and choose Padel', detail: 'Open the Padel page or the Upload screen, select Padel, and drop in your clip.' },
      { title: 'Get your prioritized read', detail: 'You get a plain-language breakdown of contact point, swing shape, and positioning, led by the single change that will help most.' },
      { title: 'Work the drills', detail: 'Each fix comes with drills for the overhead game, volleys, and reading the walls.' },
      { title: 'Retest', detail: 'Upload a fresh clip later and compare to confirm the fix is sticking.' },
    ],
    sections: [
      {
        heading: 'What padel analysis does',
        body: [
          'It turns a single video of your padel stroke into a clear, prioritized plan — what is working, what is costing you points, and the one change to make first.',
          'It understands the shots that make padel its own game: the bandeja, the vibora, volleys, and balls played off the walls.',
        ],
      },
      {
        heading: 'What it looks at',
        body: [
          '- Bandeja and overhead technique — contact point, swing shape, and control.',
          '- Volley mechanics and body positioning at the net.',
          '- Reading and handling balls off the back and side glass.',
          '- Footwork, balance, and court positioning.',
        ],
      },
      {
        heading: 'Problems it helps with',
        body: [
          '- An inconsistent bandeja that floats or sits up.',
          '- Volleys that lack control or depth.',
          '- Getting handcuffed by balls off the wall.',
          '- Poor positioning that leaves gaps for opponents.',
        ],
      },
      { heading: 'Who it’s for', body: ['Recreational and competitive padel players, parents, and coaches who want a fast, consistent second opinion — no sensors, just a phone.'] },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      BEST_VIDEO_FAQ,
      { q: 'Can it analyze my bandeja?', a: 'Yes — the bandeja is one of the most-requested padel shots. Film a few and choose Padel. See the dedicated bandeja guide for focused drills.' },
      { q: 'Does it understand wall play?', a: 'Yes. Reading and handling balls off the glass is unique to padel and is part of the read. See the wall-rebound technique guide for more.' },
      { q: 'Do I need special equipment?', a: 'No — just your phone. No racket sensors or special cameras required.' },
      FREE_FAQ,
    ],
    related: ['padel-bandeja', 'padel-wall-rebound-technique', 'diagnose', 'drills', 'retest'],
  },
};

const CORE: Record<string, CuratedHelpTopic> = {
  video: {
    title: 'Uploading & Recording a Swing',
    lead: 'Everything you need to capture or upload a great swing video — the foundation of an accurate analysis.',
    answer: 'The Upload screen (/video) is where you record or upload the swing you want analyzed. Choose your sport, add a clear side-on clip, and SwingVantage turns it into your analysis, 3D avatar, and motion breakdown — all from one upload.',
    seoTitle: 'How to Upload & Record a Swing for Analysis',
    seoDescription: 'How to record or upload a swing video for AI analysis on SwingVantage: best camera angle, lighting, and framing tips so your report is as accurate as possible.',
    primaryRoute: '/video',
    steps: [
      { title: 'Open the Upload screen', detail: 'Go to /video. You can upload an existing clip from your camera roll or record a new one on the spot.' },
      { title: 'Pick your sport', detail: 'Choose golf, tennis, baseball, softball, pickleball, or padel so the analysis is tuned to your motion.' },
      { title: 'Frame the swing', detail: 'Film from the side with your whole body and the full motion in frame. Record Assist gives you on-screen guides to line up the shot.' },
      { title: 'Capture one clean rep', detail: 'A single 3–10 second swing in good light beats a long, shaky clip. Slow motion is not required.' },
      { title: 'Upload and let it work', detail: 'One upload feeds your written analysis, your 3D Swing Avatar, and the Motion Lab breakdown — no need to upload three times.' },
    ],
    sections: [
      {
        heading: 'Why the video matters most',
        body: [
          'The single biggest factor in a good analysis is a good video. A clear, side-on clip of a full swing gives the AI everything it needs; a dark, cropped, or angled clip forces it to guess.',
          'Spend ten extra seconds on framing and you will get a dramatically better report.',
        ],
      },
      {
        heading: 'The ideal swing video',
        body: [
          '- Angle: film from the side (down-the-line or face-on), not from behind a fence or at a steep angle.',
          '- Framing: your whole body and the full swing arc should stay in frame from start to finish.',
          '- Light: bright, even light. Avoid strong backlight that turns you into a silhouette.',
          '- Steadiness: prop the phone up or have someone hold it still.',
          '- Length: one swing, roughly 3–10 seconds. You do not need slow-motion.',
        ],
      },
      {
        heading: 'One upload, three results',
        body: [
          'SwingVantage fans a single upload out across the app. From one clip you get your written Video Analysis, a 3D Swing Avatar you can rotate, and a Motion Lab kinematic breakdown — without re-uploading.',
        ],
      },
      {
        heading: 'Record Assist',
        body: [
          'Recording in the app gives you framing guides, a shake warning, and frame-by-frame review so your capture is clean the first time. It is the easiest way to get a usable swing.',
        ],
      },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      BEST_VIDEO_FAQ,
      { q: 'Can I upload a video from my camera roll?', a: 'Yes. You can upload an existing clip or record a new one in the app. Either way, choose your sport and keep the swing fully in frame.' },
      { q: 'Do I need slow-motion video?', a: 'No. Normal video is fine — the analysis handles the timing. A steady, well-lit, side-on clip matters far more than frame rate.' },
      { q: 'How long should the clip be?', a: 'About 3–10 seconds — one full swing. Longer clips are fine but trimming to a single rep gives the cleanest read.' },
      { q: 'Why does my report say the video was unclear?', a: 'Usually the swing was partly out of frame, too dark, or filmed at a steep angle. Re-film from the side in better light with your whole body visible.' },
      { q: 'What happens to my video after I upload it?', a: 'Frames are sent securely to our AI provider to generate your report. We do not sell your data or run ads, and you can delete your sessions from the Data center.' },
    ],
    related: ['record-assist', 'diagnose', 'avatar', 'motion-lab', 'free-swing-analysis'],
  },
  diagnose: {
    title: 'Your Swing Diagnosis',
    lead: 'How to read your diagnosis — it leads with the single fix that matters most, then the drills and plan to groove it.',
    answer: 'Your diagnosis is the heart of SwingVantage. It is ordered by priority: the first card is the one change that will help your swing the most. Work top-down — fix, then drills, then plan, then retest.',
    seoTitle: 'How to Read Your Swing Diagnosis',
    seoDescription: 'Understand your SwingVantage diagnosis: why it leads with one prioritized fix, how to use the drills and plan beneath it, and how to retest to prove progress.',
    primaryRoute: '/diagnose',
    steps: [
      { title: 'Start at the top', detail: 'Your diagnosis is ordered by impact. The first card is your number-one fix — the one change that will help most right now.' },
      { title: 'Read the “why”', detail: 'Each fix explains what it saw and why it matters, in plain language, so you understand the change instead of just copying it.' },
      { title: 'Do the drills', detail: 'Under your fix are drills chosen to groove exactly that change. Add them to your plan so they appear in Today’s Tasks.' },
      { title: 'Follow the plan', detail: 'The plan turns your fix into a few focused sessions instead of a vague “practice more”.' },
      { title: 'Retest', detail: 'After a few sessions, upload a new swing. SwingVantage compares it so you can see whether the fix actually moved.' },
    ],
    sections: [
      {
        heading: 'One fix first — on purpose',
        body: [
          'Most swing tools bury you in numbers. SwingVantage does the opposite: it ranks everything by impact and shows you the single most valuable change first.',
          'This is the core promise — one fix, one plan, one retest. Chasing five changes at once is the fastest way to get worse before you get better, so we put the highest-leverage fix at the top and ask you to start there.',
        ],
      },
      {
        heading: 'What’s in your diagnosis',
        body: [
          '- Your top fix, with a plain-language explanation of what it saw and why it matters.',
          '- Secondary observations, ranked beneath it so you know what is next.',
          '- Drills matched to your fix.',
          '- A short plan that turns the fix into focused practice.',
          '- A retest prompt to confirm progress.',
        ],
      },
      {
        heading: 'How to actually use it',
        body: [
          '- Resist the urge to fix everything. Work the top item until it feels natural.',
          '- Use the drills — reading a fix changes nothing; reps do.',
          '- Retest every week or two, not every rep.',
          '- Keep your camera angle consistent so retests are fair comparisons.',
        ],
      },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Why does it only show me one main fix?', a: 'Because focus is what creates change. Everything is ranked by impact and the top fix is the highest-leverage one. The others are still listed beneath it for when you are ready.' },
      { q: 'What if I disagree with the diagnosis?', a: 'It is a confident starting point, not the last word. If something feels off, re-film a clearer swing — many surprises come from a partial or angled clip — or bring it to your coach for a second read.' },
      { q: 'Where do the drills come from?', a: 'They are matched to your specific fix from the drill library, so you are working on the exact change the diagnosis identified.' },
      { q: 'How do I know if the fix worked?', a: 'Retest. Upload a new swing and SwingVantage compares it to your earlier one so you can see real movement instead of guessing.' },
      BEST_VIDEO_FAQ,
    ],
    related: ['video', 'fix', 'drills', 'retest', 'progress'],
  },
  'ai-coach': {
    title: 'AI Coach',
    lead: 'Your always-on coaching companion — ask questions about your swing, your plan, and your sport, grounded in your own results.',
    answer: 'AI Coach is a conversational coaching assistant inside SwingVantage. Ask it about your diagnosis, what drill to do, or how to handle a situation, and it answers in plain language — informed by your sport and your own swing history.',
    seoTitle: 'AI Coach — Your Always-On Swing Coaching Assistant',
    seoDescription: 'Meet AI Coach: ask questions about your swing, drills, and plan and get instant, plain-language guidance grounded in your own SwingVantage results.',
    primaryRoute: '/ai-coach',
    steps: [
      { title: 'Open AI Coach', detail: 'Go to /ai-coach. It is available any time — no appointment, no waiting.' },
      { title: 'Ask a real question', detail: 'Try “What should I work on first?”, “Give me a drill for my over-the-top move”, or “How do I warm up before a round?”.' },
      { title: 'Get a grounded answer', detail: 'Answers are written for your sport and reference your own results where relevant, so the advice fits you — not a generic tip sheet.' },
      { title: 'Turn advice into action', detail: 'Add suggested drills to your plan, or jump straight to your diagnosis or a drill from the conversation.' },
    ],
    sections: [
      {
        heading: 'What AI Coach is for',
        body: [
          'AI Coach fills the gap between sessions. When you have a question at 9pm — what to practice, how to read a result, how to approach a match — it gives you a clear, instant answer instead of leaving you to guess.',
          'It is built to be honest: it leans on your real data and your sport, and it will tell you when something is a general principle versus a read of your specific swing.',
        ],
      },
      {
        heading: 'Good things to ask',
        body: [
          '- “What is my single biggest priority right now?”',
          '- “Give me a 15-minute practice plan for this week.”',
          '- “What drill fixes a slice?”',
          '- “How should I think about nerves on the first tee / first serve?”',
          '- “Explain my diagnosis in simpler terms.”',
        ],
      },
      {
        heading: 'How it stays useful',
        body: [
          'AI Coach works best when you have analyzed at least one swing — that gives it your real context. The more you use SwingVantage, the more specific its guidance becomes.',
        ],
      },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Is AI Coach a real person?', a: 'No — it is an AI assistant. That is its strength: it is available instantly, any time, and it is consistent. For human feel and accountability, pair it with a coach.' },
      { q: 'Does it know about my swing?', a: 'Yes, where you have data. It references your sport and your own results so the advice fits you rather than being generic.' },
      { q: 'What can I ask it?', a: 'Anything about your swing, drills, your plan, your sport, or how to use SwingVantage. If it is unsure, it tells you instead of inventing an answer.' },
      { q: 'Is it free?', a: 'Core coaching questions are available to signed-in users. Some advanced usage is part of a paid plan.' },
    ],
    related: ['diagnose', 'drills', 'mental-performance', 'dashboard'],
  },
  dashboard: {
    title: 'Your Dashboard',
    lead: 'Your home base — your latest analysis, what to work on today, and your progress over time, all in one place.',
    answer: 'The dashboard is your SwingVantage home. It surfaces your most recent diagnosis, your current fix, Today’s Tasks, and your progress, so you always know the one thing to work on next.',
    seoTitle: 'Your SwingVantage Dashboard — Explained',
    seoDescription: 'A tour of your SwingVantage dashboard: your latest swing analysis, your current fix, Today’s Tasks, and progress tracking — everything you need to keep improving.',
    primaryRoute: '/dashboard',
    steps: [
      { title: 'Open your dashboard', detail: 'Go to /dashboard after signing in. It is the natural place to start each session.' },
      { title: 'Check your current fix', detail: 'Your latest diagnosis and top fix sit front and center so you always know your priority.' },
      { title: 'Do Today’s Tasks', detail: 'The dashboard turns your plan into a short, doable list for today — the drills and actions that move your fix forward.' },
      { title: 'Watch your progress', detail: 'See how your sessions and retests trend over time so improvement feels real and motivating.' },
      { title: 'Jump back in', detail: 'Upload a new swing, open AI Coach, or revisit a drill — the dashboard links you straight to the next step.' },
    ],
    sections: [
      {
        heading: 'What the dashboard shows',
        body: [
          'The dashboard is designed so you never have to wonder “what now?”. It pulls your most important information to the top: your current fix, what to do today, and whether you are trending in the right direction.',
        ],
      },
      {
        heading: 'Today’s Tasks',
        body: [
          'Today’s Tasks turns your plan into a short checklist for the day — usually a drill or two and a quick action. It is the bridge between knowing your fix and actually grooving it.',
          'Keep coming back and the tasks adapt as you progress.',
        ],
      },
      {
        heading: 'Empty state — your first visit',
        body: [
          'If you are brand new, the dashboard will guide you to your first action: analyze a swing. Once you have one analysis, it fills in with your fix, tasks, and progress.',
        ],
      },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Why is my dashboard empty?', a: 'You have not analyzed a swing yet. Upload one clip and your dashboard fills in with your fix, Today’s Tasks, and progress.' },
      { q: 'What are Today’s Tasks?', a: 'A short, daily checklist generated from your plan — the drills and actions that move your current fix forward without overwhelming you.' },
      { q: 'How does it track progress?', a: 'It uses your sessions and retests over time, so you can see whether your fixes are actually taking hold.' },
      { q: 'Can I use it on my phone?', a: 'Yes — SwingVantage is mobile-first. The dashboard is designed to work on the phone you film with.' },
    ],
    related: ['diagnose', 'training', 'progress', 'ai-coach', 'reminders'],
  },
  drills: {
    title: 'Drill Library',
    lead: 'Browse targeted drills for your fix — each with clear instructions and how it connects to your diagnosis.',
    answer: 'The Drill Library is a catalog of focused drills across every sport. Each drill opens into a full guide with instructions and the fault it targets, so you can groove the exact change your diagnosis called for.',
    seoTitle: 'Drill Library — Targeted Drills for Every Sport',
    seoDescription: 'Browse the SwingVantage Drill Library: targeted drills for golf, tennis, baseball, softball, pickleball, and padel, each tied to the swing fault it fixes.',
    primaryRoute: '/drills',
    steps: [
      { title: 'Open the Drill Library', detail: 'Go to /drills to browse drills, or open the drills attached to your diagnosis to work your specific fix.' },
      { title: 'Find your drill', detail: 'Filter by sport or by the fault you are working on. Each card tells you what the drill targets.' },
      { title: 'Open the full guide', detail: 'Tap a drill to see step-by-step instructions, what good looks like, and the fault it addresses.' },
      { title: 'Add it to your plan', detail: 'Send a drill to your plan so it shows up in Today’s Tasks and you actually do it.' },
      { title: 'Retest', detail: 'After working a drill for a while, upload a fresh swing to confirm it is moving your fix.' },
    ],
    sections: [
      {
        heading: 'What the Drill Library is',
        body: [
          'Reading a fix changes nothing — reps do. The Drill Library is where the work happens: focused, practical drills you can do at home, at the range, or on the court.',
          'Drills are matched to faults, so the drills under your diagnosis are the exact ones for your change. You can also browse the full catalog any time.',
        ],
      },
      {
        heading: 'How drills connect to your fix',
        body: [
          'When SwingVantage identifies your top fix, it pulls the drills that groove that specific change. Doing those drills — not random ones — is what turns a diagnosis into real improvement.',
        ],
      },
      {
        heading: 'Make drills stick',
        body: [
          '- Add drills to your plan so they appear in Today’s Tasks.',
          '- Work a small number of drills well rather than many badly.',
          '- Film yourself doing the drill occasionally to check your form.',
          '- Retest your full swing every week or two.',
        ],
      },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Which drill should I do?', a: 'Start with the drills attached to your diagnosis — they target your top fix. If you are browsing freely, filter by your sport and the fault you want to work on.' },
      { q: 'Do drills work for my sport?', a: 'Yes — the library spans golf, tennis, baseball, softball, pickleball, and padel, with drills specific to each.' },
      { q: 'Can I do drills at home?', a: 'Many drills need little or no space and no special equipment. Each drill guide tells you what you need.' },
      { q: 'How long until a drill works?', a: 'Give it sessions, not reps. Work a drill consistently for a week or two, then retest your swing to see the change.' },
    ],
    related: ['diagnose', 'training', 'practice', 'retest', 'progress'],
  },
  retest: {
    title: 'Retesting Your Swing',
    lead: 'Close the loop — upload a fresh swing and prove the fix actually worked, instead of guessing.',
    answer: 'Retesting is how SwingVantage proves progress. After working your fix, you upload a new swing and it compares the before and after, so improvement is something you can see — the final step in one fix, one plan, one retest.',
    seoTitle: 'How to Retest Your Swing & Prove Progress',
    seoDescription: 'Close the improvement loop on SwingVantage: retest your swing after working a fix, compare before and after, and confirm the change actually took hold.',
    primaryRoute: '/retest',
    steps: [
      { title: 'Work your fix first', detail: 'Spend a week or two on your top fix and its drills before retesting — change shows up over sessions, not reps.' },
      { title: 'Film the same way', detail: 'Use the same angle, distance, and lighting as your first swing so the comparison is fair.' },
      { title: 'Upload your retest', detail: 'Open /retest (or upload a new swing) and SwingVantage knows to compare it against your earlier baseline.' },
      { title: 'Read the comparison', detail: 'See whether your fix moved, what improved, and what to focus on next.' },
      { title: 'Set your next fix', detail: 'If the fix took hold, your next-priority change becomes the new focus. The loop continues.' },
    ],
    sections: [
      {
        heading: 'Why retesting matters',
        body: [
          'Improvement you cannot measure is just hope. Retesting turns “I think it is better” into “here is the before and after.”',
          'It is the third part of the core promise — one fix, one plan, one retest — and it is what keeps you honest and motivated.',
        ],
      },
      {
        heading: 'How to retest well',
        body: [
          '- Give the fix real time before retesting — a week or two, not a day.',
          '- Match your filming setup to the original swing so you compare like with like.',
          '- Retest one fix at a time so you know what actually changed.',
        ],
      },
      {
        heading: 'What happens after a retest',
        body: [
          'If your fix took hold, SwingVantage moves you on to your next-highest-priority change, so you are always working the most valuable thing. If it has not moved yet, it helps you adjust before moving on.',
        ],
      },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'When should I retest?', a: 'After a week or two of working your fix and its drills. Change shows up over sessions, so retesting every rep just adds noise.' },
      { q: 'How does the comparison work?', a: 'You upload a fresh swing and SwingVantage compares it to your earlier baseline, highlighting what moved so you can see real progress.' },
      { q: 'What if the fix did not work?', a: 'That is useful information. It usually means the change needs more reps or a small adjustment — SwingVantage helps you decide whether to keep going or tweak your approach.' },
      BEST_VIDEO_FAQ,
    ],
    related: ['diagnose', 'progress', 'compare', 'drills', 'video'],
  },
};

/** All curated guides, keyed by slug. */
export const CURATED_HELP: Record<string, CuratedHelpTopic> = { ...SPORTS, ...CORE };

// ── Public allowlist ──────────────────────────────────────────
// The slugs that are REAL user features and belong in the indexed Help
// Center. Everything else (internal ui-*/api-* modules, auth/legal/marketing
// routes, registry noise like agi/arc/lang/data-model) is excluded: those
// pages still resolve so live in-app links never 404, but they are noindex,
// unlisted, and kept out of the sitemap.

export const PUBLIC_HELP_SLUGS: ReadonlySet<string> = new Set<string>([
  // Sports — landing hubs + swing-analysis SEO guides + technique pages
  'golf',
  'golf-swing-analysis',
  'tennis',
  'tennis-swing-analysis',
  'baseball',
  'baseball-swing-analysis',
  'softball',
  'softball-swing-analysis',
  'pickleball',
  'pickleball-dinking',
  'pickleball-third-shot-drop',
  'padel',
  'padel-bandeja',
  'padel-wall-rebound-technique',
  'free-swing-analysis',

  // Core analysis flow
  'video',
  'diagnose',
  'fix',
  'retest',
  'compare',

  // Analysis depth
  'motion-lab',
  'avatar',
  'bodysync',
  'record-assist',

  // Coaching, training & progress
  'ai-coach',
  'dashboard',
  'drills',
  'training',
  'practice',
  'pre-round',
  'progress',
  'reports',
  'journey',
  'benchmarks',
  'milestones',
  'challenges',
  'reminders',
  'notes',

  // Mind & knowledge
  'mental',
  'mental-performance',
  'glossary',
  'equipment',

  // People & accounts
  'coaches',
  'parents',
  'teams',
  'team',
  'recruiting',
  'community',
  'profile',
  'settings',
  'data',
  'sessions',
  'library',
]);

/** True when a slug is a real, indexable public help topic. */
export function isPublicHelpSlug(slug: string): boolean {
  return PUBLIC_HELP_SLUGS.has(slug);
}
