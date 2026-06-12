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
      { q: 'Can it tell if I’m improving?', a: 'Yes — retest. Upload a fresh clip later and SwingVantage compares it to your earlier one so you can see whether the fix took hold, instead of guessing.' },
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
      { q: 'Can it tell if I’m improving?', a: 'Yes — retest. Upload a fresh clip later and SwingVantage compares it to your earlier one so you can see whether the fix took hold, instead of guessing.' },
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

// ── Sport hubs ────────────────────────────────────────────────
// The /<sport> landing pages: a home for that sport's free tools, technique
// articles, and swing analysis. Lighter than the swing-analysis guide; they
// orient and route into it.

interface SportHubSpec {
  Sport: string;
  sport: string;
  route: string;
  analysisSlug: string;
  topics: string[];
  related: string[];
  extraFaqs?: AssetFaq[];
}

function sportHub(s: SportHubSpec): CuratedHelpTopic {
  return {
    title: s.Sport,
    lead: `Your home for ${s.Sport.toLowerCase()} on SwingVantage — free swing analysis, targeted drills, and technique guides in one place.`,
    answer: `The ${s.Sport} hub brings together everything SwingVantage offers for ${s.Sport.toLowerCase()}: upload a swing for an instant AI breakdown, work targeted drills, and read technique guides — all free from your phone.`,
    seoTitle: `${s.Sport} — AI Swing Analysis, Drills & Technique`,
    seoDescription: `Improve your ${s.Sport.toLowerCase()} with SwingVantage: free AI swing analysis, targeted drills, and technique guides. Upload one phone video to get your top fix.`,
    primaryRoute: s.route,
    steps: [
      { title: `Open the ${s.Sport} hub`, detail: `Go to ${s.route} to see ${s.Sport.toLowerCase()} analysis, drills, and guides in one place.` },
      { title: 'Analyze a swing', detail: `Upload a single ${s.sport} clip to get a prioritized AI breakdown — your number-one fix first.` },
      { title: 'Pick a focus', detail: `Browse the technique guides and drills for the area you want to work on.` },
      { title: 'Build it into practice', detail: 'Add drills to your plan so they show up in Today’s Tasks, then retest to confirm progress.' },
    ],
    sections: [
      {
        heading: `What you’ll find here`,
        body: [
          `The ${s.Sport} hub is the front door to everything ${s.Sport.toLowerCase()} on SwingVantage — analysis, drills, and plain-language technique guides, all built around one promise: one fix, one plan, one retest.`,
        ],
      },
      {
        heading: 'Popular topics',
        body: [`Players come here to work on:`, ...s.topics.map((t) => `- ${t}`)],
      },
      { heading: 'Who it’s for', body: [`${s.Sport} players of every level, plus parents and coaches who want a fast, consistent second opinion — no sensors, just a phone.`] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: `Is ${s.Sport} analysis free?`, a: `Yes — you can analyze a ${s.sport} swing for free from your phone. Some advanced tools and history depth are part of a paid plan.` },
      { q: `What can SwingVantage do for ${s.Sport.toLowerCase()}?`, a: `Break down your swing from one video, give you targeted drills, track your progress, and let you retest to prove improvement.` },
      ...(s.extraFaqs ?? []),
      FREE_FAQ,
    ],
    related: s.related,
  };
}

const SPORT_HUBS: Record<string, CuratedHelpTopic> = {
  golf: sportHub({
    Sport: 'Golf',
    sport: 'golf',
    route: '/golf',
    analysisSlug: 'golf-swing-analysis',
    topics: ['Fixing a slice', 'Breaking 100, 90, or 80', 'Iron consistency and crisp contact', 'Wedge distance control'],
    related: ['golf-swing-analysis', 'diagnose', 'drills', 'pre-round', 'motion-lab'],
    extraFaqs: [
      { q: 'Can it help me fix my slice?', a: 'Yes — the slice is the most common fault it diagnoses. Upload a swing and it gives you the over-the-top fix and the drills to square the face.' },
    ],
  }),
  tennis: sportHub({
    Sport: 'Tennis',
    sport: 'tennis',
    route: '/tennis',
    analysisSlug: 'tennis-swing-analysis',
    topics: ['A more reliable serve', 'One- and two-handed backhands', 'Generating topspin and power', 'Footwork and recovery'],
    related: ['tennis-swing-analysis', 'diagnose', 'drills', 'mental-performance', 'retest'],
  }),
  baseball: sportHub({
    Sport: 'Baseball',
    sport: 'baseball',
    route: '/baseball',
    analysisSlug: 'baseball-swing-analysis',
    topics: ['Bat path and attack angle', 'Exit velocity and power', 'Timing and contact consistency', 'A repeatable load and stride'],
    related: ['baseball-swing-analysis', 'softball', 'diagnose', 'drills', 'retest'],
  }),
  softball: sportHub({
    Sport: 'Softball',
    sport: 'softball',
    route: '/softball',
    analysisSlug: 'softball-swing-analysis',
    topics: ['Bat path for fastpitch', 'Timing up faster pitching', 'Adding power and exit velocity', 'A consistent, repeatable swing'],
    related: ['softball-swing-analysis', 'baseball', 'diagnose', 'drills', 'retest'],
  }),
};

// ── Technique deep-dives (sport-specific shots) ───────────────

interface TechniqueSpec {
  title: string;
  route: string;
  Sport: string;
  shot: string;
  lead: string;
  answer: string;
  seoTitle: string;
  seoDescription: string;
  keys: string[];
  mistakes: string[];
  drills: string[];
  related: string[];
}

function technique(s: TechniqueSpec): CuratedHelpTopic {
  return {
    title: s.title,
    lead: s.lead,
    answer: s.answer,
    seoTitle: s.seoTitle,
    seoDescription: s.seoDescription,
    primaryRoute: s.route,
    steps: [
      { title: 'Film the shot', detail: `Record a few reps of your ${s.shot} from the side, in good light, with your whole body in frame.` },
      { title: `Choose ${s.Sport}`, detail: `Upload your clip and select ${s.Sport} so the read is tuned to your game.` },
      { title: 'Get your fix', detail: 'You get a prioritized breakdown led by the single change that will help most.' },
      { title: 'Drill it', detail: 'Work the matched drills, add them to your plan, then retest.' },
    ],
    sections: [
      { heading: `What makes a good ${s.shot}`, body: [`The ${s.shot} comes down to a few things that matter most:`, ...s.keys.map((k) => `- ${k}`)] },
      { heading: 'Common mistakes', body: s.mistakes.map((m) => `- ${m}`) },
      { heading: 'Drills that help', body: s.drills.map((d) => `- ${d}`) },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      BEST_VIDEO_FAQ,
      { q: `How do I improve my ${s.shot}?`, a: `Film it, get your prioritized fix, and work the matched drills — then retest to confirm the change is sticking. Small, consistent reps beat big one-off changes.` },
      { q: 'Do I need special equipment?', a: 'No — just your phone. No sensors or special cameras required.' },
      FREE_FAQ,
    ],
    related: s.related,
  };
}

const TECHNIQUE: Record<string, CuratedHelpTopic> = {
  'pickleball-dinking': technique({
    title: 'Pickleball Dinking',
    route: '/pickleball-dinking',
    Sport: 'Pickleball',
    shot: 'dink',
    lead: 'Master the soft game — get an AI read on your dink and the drills to keep the ball low and controlled.',
    answer: 'Dinking is where most pickleball points are won and lost. SwingVantage analyzes your dink from one video — contact point, paddle face, and control — and gives you the single fix and drills to stop popping the ball up.',
    seoTitle: 'Pickleball Dinking — Technique & Drills',
    seoDescription: 'Improve your pickleball dink with a free AI analysis: fix your contact point and paddle face, stop popping the ball up, and get targeted soft-game drills.',
    keys: ['A relaxed grip and quiet paddle face', 'Contact out in front, below the net is fine if it clears', 'Soft hands that absorb pace instead of adding it', 'Patience — out-dink, do not over-attack'],
    mistakes: ['Popping the ball up by lifting with the wrist', 'Gripping too tight and adding pace', 'Reaching instead of moving your feet', 'Attacking a ball that is too low'],
    drills: ['Cross-court dink rallies for control', 'Targets in the kitchen to groove placement', 'Soft-hands wall drills to feel the absorb'],
    related: ['pickleball', 'pickleball-third-shot-drop', 'drills', 'diagnose'],
  }),
  'pickleball-third-shot-drop': technique({
    title: 'Pickleball Third-Shot Drop',
    route: '/pickleball-third-shot-drop',
    Sport: 'Pickleball',
    shot: 'third-shot drop',
    lead: 'The shot that gets you to the kitchen — get an AI read on your third-shot drop arc and the drills to land it soft.',
    answer: 'The third-shot drop is the hardest, most important shot in pickleball. SwingVantage analyzes yours from one video and gives you the single fix and drills to make it consistent so you can get to the net.',
    seoTitle: 'Pickleball Third-Shot Drop — Technique & Drills',
    seoDescription: 'Make your pickleball third-shot drop consistent with a free AI analysis: fix your arc and contact, land it soft in the kitchen, and get targeted drills.',
    keys: ['A low-to-high lifting motion, not a flat drive', 'A soft, arcing trajectory that lands in the kitchen', 'A stable base and unhurried tempo', 'Letting the ball drop to a comfortable contact height'],
    mistakes: ['Driving the ball instead of lifting it', 'Rushing forward before the shot lands', 'Too much pace, so it sails long', 'Tense hands that flatten the arc'],
    drills: ['Drop-and-drop reps from the baseline', 'Arc targets over the net into the kitchen', 'Shadow the low-to-high path without a ball'],
    related: ['pickleball', 'pickleball-dinking', 'drills', 'diagnose'],
  }),
  'padel-bandeja': technique({
    title: 'Padel Bandeja',
    route: '/padel-bandeja',
    Sport: 'Padel',
    shot: 'bandeja',
    lead: 'The defensive overhead that keeps you at the net — get an AI read on your bandeja and the drills to control it.',
    answer: 'The bandeja is the signature padel overhead — a controlled, defensive smash that keeps you at the net. SwingVantage analyzes yours from one video and gives you the single fix and drills to make it reliable.',
    seoTitle: 'Padel Bandeja — Technique & Drills',
    seoDescription: 'Master the padel bandeja with a free AI analysis: fix your contact point and swing shape, keep control and position at the net, and get targeted drills.',
    keys: ['Contact out in front and slightly to the side', 'A continental grip and a controlled, sliced swing', 'Body turned sideways, weight moving forward', 'Placement and spin over raw power'],
    mistakes: ['Hitting it flat and hard like a smash', 'Contact too far behind the head', 'Standing square instead of sideways', 'Going for a winner when control is the goal'],
    drills: ['Shadow swings to groove the sideways turn', 'Feed-and-bandeja reps to a deep target', 'Slice-control drills to feel the spin'],
    related: ['padel', 'padel-wall-rebound-technique', 'drills', 'diagnose'],
  }),
  'padel-wall-rebound-technique': technique({
    title: 'Padel Wall Play',
    route: '/padel-wall-rebound-technique',
    Sport: 'Padel',
    shot: 'ball off the wall',
    lead: 'Turn the glass into your friend — get an AI read on how you play balls off the back and side walls.',
    answer: 'Reading balls off the glass is unique to padel and separates good players from great ones. SwingVantage analyzes how you handle wall rebounds from one video and gives you the single fix and drills to stay calm and in control.',
    seoTitle: 'Padel Wall Play — Reading Rebounds & Drills',
    seoDescription: 'Handle padel balls off the back and side glass with a free AI analysis: fix your positioning and timing on wall rebounds and get targeted drills.',
    keys: ['Reading the bounce early and giving the ball space', 'Moving with the ball, not reaching back for it', 'Letting it come off the glass to a comfortable height', 'Patience — reset rather than force a winner'],
    mistakes: ['Standing too close and getting handcuffed', 'Taking the ball before it comes off the wall', 'Panicking and over-hitting the rebound', 'Poor footwork that leaves you off balance'],
    drills: ['Back-glass feed-and-reset reps', 'Side-wall reading drills', 'Footwork patterns to create space from the glass'],
    related: ['padel', 'padel-bandeja', 'drills', 'diagnose'],
  }),
};

// ── Analysis depth & capture ──────────────────────────────────

const ANALYSIS: Record<string, CuratedHelpTopic> = {
  'free-swing-analysis': {
    title: 'Free Swing Analysis',
    lead: 'Analyze your swing for free — no equipment, no sign-up barrier, just your phone and one clip.',
    answer: 'Free Swing Analysis is the no-cost way to try SwingVantage. Upload a single phone video of any sport and get a real AI breakdown — your top fix, drills, and a plan — without sensors, a launch monitor, or a coach.',
    seoTitle: 'Free Swing Analysis — AI Swing Analyzer, No Sensors',
    seoDescription: 'Analyze your golf, tennis, baseball, softball, pickleball, or padel swing free with AI. Upload one phone video and get your top fix, drills, and a plan.',
    primaryRoute: '/free-swing-analysis',
    steps: [
      { title: 'Record one swing', detail: 'Film a single rep from the side, in good light, with your whole body in frame.' },
      { title: 'Upload it free', detail: 'Choose your sport and drop in your clip — no special gear and no cost to try.' },
      { title: 'Get your fix', detail: 'In moments you get a prioritized breakdown led by the one change that helps most.' },
      { title: 'Keep improving', detail: 'Work the drills, then retest to prove the fix worked.' },
    ],
    sections: [
      { heading: 'What “free” gets you', body: ['A real, full AI analysis of one swing — not a watered-down teaser. You see your top fix, drills, and a plan. Some advanced tools and deeper history are part of a paid plan, but the core experience is genuinely free to try.'] },
      { heading: 'Why no equipment', body: ['SwingVantage reads your swing from ordinary phone video using AI vision. There is nothing to wear, nothing to calibrate, and no launch monitor required.'] },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      BEST_VIDEO_FAQ,
      { q: 'Do I have to pay to see my results?', a: 'No — your core analysis, top fix, and drills are free to view. Paid plans add advanced tools and deeper history.' },
      { q: 'Which sports are supported?', a: 'Golf, tennis, baseball, softball, pickleball, and padel.' },
      { q: 'Is it really just my phone?', a: 'Yes. A clear, side-on clip from any modern phone is all you need.' },
    ],
    related: ['video', 'diagnose', 'drills', 'golf-swing-analysis'],
  },
  fix: {
    title: 'Your One Fix',
    lead: 'The single most valuable change for your swing right now — what it is, why it matters, and how to work it.',
    answer: 'Your “one fix” is the highest-impact change SwingVantage found in your swing. Everything is ranked by impact and this is the top of the list — focus here first, work the drills, and retest before moving on.',
    seoTitle: 'Your One Fix — Focus on the Change That Matters Most',
    seoDescription: 'Understand your SwingVantage one fix: the single highest-impact change in your swing, why focusing on one thing works, and how to groove it with drills.',
    primaryRoute: '/fix',
    steps: [
      { title: 'Read your fix', detail: 'Your fix explains what it saw and why it is your biggest opportunity, in plain language.' },
      { title: 'Understand the why', detail: 'Knowing why the change matters helps you own it instead of copying a tip.' },
      { title: 'Work the drills', detail: 'Do the matched drills that groove exactly this change.' },
      { title: 'Retest', detail: 'After a week or two, upload a fresh swing to confirm the fix is moving.' },
    ],
    sections: [
      { heading: 'Why just one fix', body: ['Chasing five changes at once is the fastest way to get worse before you get better. SwingVantage ranks everything by impact and asks you to start with the single most valuable change — that focus is what creates real improvement.'] },
      { heading: 'From fix to results', body: ['A fix only helps if you work it. Send its drills to your plan so they appear in Today’s Tasks, then retest to see the change. Once it takes hold, your next-priority fix becomes the new focus.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Why only one fix at a time?', a: 'Because focus creates change. The others are ranked beneath it for when you are ready, but you will improve fastest by grooving one thing first.' },
      { q: 'How do I know my fix worked?', a: 'Retest. Upload a new swing and SwingVantage compares it to your earlier one so you can see real movement.' },
      { q: 'Can I see my other issues?', a: 'Yes — your full diagnosis lists everything in priority order beneath your top fix.' },
    ],
    related: ['diagnose', 'drills', 'retest', 'progress'],
  },
  compare: {
    title: 'Compare Swings',
    lead: 'Put two swings side by side — yours then vs. now, or your swing next to a model — to see exactly what changed.',
    answer: 'Compare lets you view two swings side by side and in sync, so differences jump out. Use it to see your before-and-after on a fix, or to line your swing up against a reference.',
    seoTitle: 'Compare Swings Side by Side',
    seoDescription: 'Compare two swings side by side on SwingVantage: your before-and-after on a fix or your swing next to a model, synced so the differences are obvious.',
    primaryRoute: '/compare',
    steps: [
      { title: 'Open Compare', detail: 'Go to /compare and pick the two swings you want to view together.' },
      { title: 'Sync them up', detail: 'Line the swings up at the same moment so you are comparing like with like.' },
      { title: 'Spot the difference', detail: 'Watch them together to see exactly what changed in your positions and motion.' },
      { title: 'Act on it', detail: 'Take what you learn back to your fix and drills, then retest again.' },
    ],
    sections: [
      { heading: 'What Compare is for', body: ['Seeing two swings together makes change obvious in a way a single clip cannot. It is the visual partner to your retest — proof you can actually watch.'] },
      { heading: 'Ways to use it', body: ['- Your swing before a fix vs. after, to confirm progress.', '- Your swing next to a model move you are working toward.', '- Two of your own swings to check consistency.'] },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What can I compare?', a: 'Two of your own swings (e.g. before and after a fix), or your swing against a reference, viewed side by side and in sync.' },
      { q: 'How does this help me improve?', a: 'It turns “I think it changed” into something you can see, which makes the fix concrete and motivating.' },
      BEST_VIDEO_FAQ,
    ],
    related: ['retest', 'progress', 'diagnose', 'motion-lab'],
  },
  'motion-lab': {
    title: 'Motion Lab',
    lead: 'Go deeper than video — a 3D, frame-by-frame kinematic breakdown of how your body actually moves through the swing.',
    answer: 'Motion Lab turns your swing into a 3D kinematic model from on-device pose tracking, so you can examine rotation, sequencing, and body positions frame by frame — the analytical deep end of SwingVantage.',
    seoTitle: 'Motion Lab — 3D Kinematic Swing Analysis',
    seoDescription: 'Go beyond video with SwingVantage Motion Lab: a 3D, frame-by-frame kinematic breakdown of your swing’s rotation, sequencing, and body positions.',
    primaryRoute: '/motion-lab',
    steps: [
      { title: 'Open Motion Lab', detail: 'Go to /motion-lab — your uploaded swing feeds it automatically, no re-upload.' },
      { title: 'Step through the motion', detail: 'Scrub frame by frame to see your body positions at each phase of the swing.' },
      { title: 'Read the kinematics', detail: 'Examine rotation, sequencing, and how your body parts move in relation to each other.' },
      { title: 'Tie it to your fix', detail: 'Use what you see to reinforce your top fix and the drills that groove it.' },
    ],
    sections: [
      { heading: 'What Motion Lab adds', body: ['Where your written analysis tells you the one thing to fix, Motion Lab lets you see the mechanics behind it in 3D. Pose tracking maps your body and builds a kinematic model you can rotate and step through.'] },
      { heading: 'Who it’s for', body: ['Players, parents, and coaches who want the detail behind the diagnosis. You do not need it to improve — your one fix is enough — but it is there when you want to dig in.'] },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Do I need to upload again for Motion Lab?', a: 'No. One upload feeds your written analysis, your 3D avatar, and Motion Lab together.' },
      { q: 'Is this a real measurement?', a: 'It is a model built from pose tracking — a sharp, detailed read, but still an estimate from video rather than a lab capture. Use it to understand mechanics, not as a certified number.' },
      { q: 'Do I need Motion Lab to improve?', a: 'No — your one fix and drills are enough. Motion Lab is for when you want to understand the mechanics in depth.' },
    ],
    related: ['avatar', 'diagnose', 'compare', 'video'],
  },
  avatar: {
    title: '3D Swing Avatar',
    lead: 'See your swing as a 3D skeleton you can rotate — built automatically from your uploaded video.',
    answer: 'The 3D Swing Avatar renders your swing as a rotatable 3D skeleton from on-device pose tracking. It is created automatically from your upload, so you can view your motion from any angle.',
    seoTitle: '3D Swing Avatar — See Your Swing in 3D',
    seoDescription: 'View your swing as a rotatable 3D avatar on SwingVantage, built automatically from your uploaded video so you can see your motion from any angle.',
    primaryRoute: '/avatar',
    steps: [
      { title: 'Open your avatar', detail: 'Go to /avatar — it is generated from your uploaded swing automatically.' },
      { title: 'Rotate and explore', detail: 'Spin the 3D skeleton to view your swing from angles your camera never caught.' },
      { title: 'Compare angles', detail: 'See positions face-on, down-the-line, or overhead to understand your motion.' },
      { title: 'Connect it to your fix', detail: 'Use the angles to reinforce the change your diagnosis identified.' },
    ],
    sections: [
      { heading: 'What the avatar shows', body: ['Your phone films from one angle; the 3D avatar lets you view your swing from any angle by reconstructing your body positions in 3D from pose tracking.'] },
      { heading: 'One upload, many views', body: ['You do not record anything extra — the avatar is built from the same clip that powers your analysis and Motion Lab.'] },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'How is the 3D avatar made?', a: 'From pose tracking on your uploaded video — SwingVantage estimates your body positions and renders them as a 3D skeleton.' },
      { q: 'Do I need a special camera?', a: 'No — a normal phone video is enough. A clear, side-on clip gives the best reconstruction.' },
      { q: 'Is it exactly accurate?', a: 'It is a faithful estimate from video, not a motion-capture suit. Great for understanding angles, not a certified measurement.' },
    ],
    related: ['motion-lab', 'video', 'diagnose'],
  },
  bodysync: {
    title: 'BodySync',
    lead: 'Connect what your body feels to what your swing does — sync your motion so changes transfer from drill to swing.',
    answer: 'BodySync helps you link the feel of a movement to the mechanics SwingVantage sees, so the changes you groove in drills actually show up in your full swing.',
    seoTitle: 'BodySync — Connect Feel to Real Swing Mechanics',
    seoDescription: 'BodySync on SwingVantage helps you link the feel of a movement to your real swing mechanics, so drill changes transfer into your full swing.',
    primaryRoute: '/bodysync',
    steps: [
      { title: 'Open BodySync', detail: 'Go to /bodysync to work on connecting movement and feel.' },
      { title: 'Focus on the target motion', detail: 'Work the specific body movement tied to your current fix.' },
      { title: 'Build the feel', detail: 'Repeat until the movement feels natural, not forced.' },
      { title: 'Transfer it', detail: 'Take the feel into your full swing, then retest to confirm it carried over.' },
    ],
    sections: [
      { heading: 'Why feel matters', body: ['Most swing changes fail because a drill feel never transfers to the real swing. BodySync is about bridging that gap — connecting the movement you practice to the mechanics that show up on video.'] },
      { heading: 'How to use it', body: ['- Pair BodySync work with your current fix, not random movements.', '- Go slow first, then add speed.', '- Retest your full swing to confirm the change transferred.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What is BodySync for?', a: 'Helping the changes you feel in a drill actually show up in your full swing, instead of disappearing under speed.' },
      { q: 'Do I need it?', a: 'It is an aid, not a requirement. Your one fix and drills are the core; BodySync helps the change stick.' },
    ],
    related: ['drills', 'diagnose', 'motion-lab', 'retest'],
  },
  'record-assist': {
    title: 'Record Assist',
    lead: 'Capture a clean swing the first time — on-screen framing, a shake warning, and frame-by-frame review.',
    answer: 'Record Assist is the in-app recorder that helps you film a usable swing: it guides your framing, warns when the phone is shaky, and lets you review frame by frame before you analyze.',
    seoTitle: 'Record Assist — Film a Clean Swing Every Time',
    seoDescription: 'Use Record Assist on SwingVantage to capture a clean swing video: on-screen framing guides, a shake warning, and frame-by-frame review before analysis.',
    primaryRoute: '/record-assist',
    steps: [
      { title: 'Open Record Assist', detail: 'Go to /record-assist (or record from the Upload screen) to film in the app.' },
      { title: 'Frame with the guides', detail: 'Line your body up inside the on-screen guides so the full swing stays in frame.' },
      { title: 'Hold steady', detail: 'A shake warning tells you if the phone is moving too much — prop it up for best results.' },
      { title: 'Review and analyze', detail: 'Step through frame by frame to check the capture, then send it straight to analysis.' },
    ],
    sections: [
      { heading: 'Why it exists', body: ['The single biggest factor in a good analysis is a good video. Record Assist removes the guesswork from filming so your very first capture is clean and usable.'] },
      { heading: 'What it helps with', body: ['- Framing your whole body and the full swing.', '- Steadiness, via a shake warning.', '- Checking the capture frame by frame before you commit.'] },
      ACCURACY_SECTION,
      PRIVACY_SECTION,
    ],
    faqs: [
      BEST_VIDEO_FAQ,
      { q: 'Do I have to record in the app?', a: 'No — you can upload an existing clip too. Record Assist just makes capturing a clean swing easier.' },
      { q: 'Why does it warn about shaking?', a: 'A shaky clip makes the analysis work harder and can lower accuracy. Propping the phone up fixes it.' },
    ],
    related: ['video', 'diagnose', 'avatar'],
  },
};

// ── Training, progress & motivation ───────────────────────────

const TRAINING: Record<string, CuratedHelpTopic> = {
  training: {
    title: 'Training & Today’s Tasks',
    lead: 'Turn your fix into a plan you actually follow — a short, daily set of tasks that move your swing forward.',
    answer: 'Training turns your diagnosis into action. It builds a focused plan around your top fix and surfaces it as Today’s Tasks — a short daily checklist — so practice is purposeful instead of vague.',
    seoTitle: 'Training & Today’s Tasks — Practice With Purpose',
    seoDescription: 'Turn your SwingVantage fix into a plan: Training builds focused practice around your top fix and surfaces Today’s Tasks so every session moves you forward.',
    primaryRoute: '/training',
    steps: [
      { title: 'Open Training', detail: 'Go to /training to see your plan built around your current fix.' },
      { title: 'Do Today’s Tasks', detail: 'Work the short daily checklist — usually a drill or two and a quick action.' },
      { title: 'Keep the streak', detail: 'Come back regularly; the plan adapts as you progress.' },
      { title: 'Retest', detail: 'After consistent work, upload a fresh swing to confirm the fix is moving.' },
    ],
    sections: [
      { heading: 'From diagnosis to habit', body: ['Knowing your fix is not the same as fixing it. Training bridges the gap by turning your fix and drills into a doable daily plan so the work actually happens.'] },
      { heading: 'Your first plan', body: ['If you are brand new, Training starts from a true empty state and fills in once you have a diagnosis — no fake sample routine to confuse you.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What are Today’s Tasks?', a: 'A short daily checklist generated from your plan — the drills and actions that move your current fix forward.' },
      { q: 'Why is my training empty?', a: 'You have not analyzed a swing yet. Once you have a diagnosis, your plan and Today’s Tasks fill in.' },
      { q: 'How much should I do?', a: 'A little, consistently. A focused 10–20 minutes beats an occasional marathon.' },
    ],
    related: ['diagnose', 'drills', 'practice', 'progress', 'reminders'],
  },
  practice: {
    title: 'Practice',
    lead: 'Make your practice count — structured sessions built around the fix you are working on.',
    answer: 'Practice gives your sessions structure: instead of hitting balls aimlessly, you work the drills tied to your fix in a focused, repeatable way that actually transfers to your swing.',
    seoTitle: 'Practice — Structured Sessions That Transfer',
    seoDescription: 'Make practice count with SwingVantage: structured sessions built around your current fix and drills, so the work transfers into your real swing.',
    primaryRoute: '/practice',
    steps: [
      { title: 'Open Practice', detail: 'Go to /practice to start a focused session around your current fix.' },
      { title: 'Work your drills', detail: 'Run the drills matched to your fix with intent, not on autopilot.' },
      { title: 'Track the session', detail: 'Log what you did so it feeds your progress over time.' },
      { title: 'Retest', detail: 'Periodically upload a fresh swing to confirm the work is paying off.' },
    ],
    sections: [
      { heading: 'Quality over quantity', body: ['Mindless reps build mindless swings. Practice keeps your sessions focused on the one change that matters, with the drills that groove it.'] },
      { heading: 'Make it transfer', body: ['- Work one fix at a time.', '- Go slow before fast.', '- Film yourself occasionally to check form.', '- Retest every week or two.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'How is Practice different from Training?', a: 'Training is your overall plan and Today’s Tasks; Practice is the focused session where you do the work.' },
      { q: 'How often should I practice?', a: 'Consistency beats volume — short, regular, focused sessions transfer best.' },
    ],
    related: ['training', 'drills', 'diagnose', 'progress'],
  },
  'pre-round': {
    title: 'Pre-Round Warm-Up',
    lead: 'Show up ready — a quick, focused routine to warm up your body and your swing before you play.',
    answer: 'Pre-Round gives you a short warm-up routine to prime your body and groove your current feel before a round or match, so you start sharp instead of finding it on the first few holes.',
    seoTitle: 'Pre-Round Warm-Up — Start Your Round Ready',
    seoDescription: 'Warm up the right way with SwingVantage Pre-Round: a quick, focused routine to prime your body and your swing feel before you play.',
    primaryRoute: '/pre-round',
    steps: [
      { title: 'Open Pre-Round', detail: 'Go to /pre-round before you play for a quick warm-up routine.' },
      { title: 'Loosen up', detail: 'Move through the mobility and rhythm work to wake your body up.' },
      { title: 'Groove your feel', detail: 'Reinforce the simple swing thought tied to your current fix — one thought, not five.' },
      { title: 'Go play', detail: 'Trust the warm-up and let the round be about playing, not fixing.' },
    ],
    sections: [
      { heading: 'Why warm up with intent', body: ['Most players waste their warm-up grinding on mechanics. Pre-Round keeps it simple: loosen the body, settle the rhythm, and carry one clear thought into play.'] },
      { heading: 'Keep it simple on game day', body: ['Game day is for trusting, not tinkering. Save real changes for practice; on the day, warm up and let your one thought do the work.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Is this only for golf?', a: 'The idea applies to any sport: prime your body, settle your rhythm, and carry one simple thought into play.' },
      { q: 'How long does it take?', a: 'Short by design — enough to feel ready without tiring you out.' },
    ],
    related: ['training', 'mental-performance', 'diagnose'],
  },
  progress: {
    title: 'Progress Tracking',
    lead: 'See your improvement over time — sessions, retests, and trends that prove the work is paying off.',
    answer: 'Progress shows your improvement over time by pulling together your sessions and retests, so you can see real trends instead of guessing whether you are getting better.',
    seoTitle: 'Progress Tracking — See Your Improvement Over Time',
    seoDescription: 'Track your improvement on SwingVantage: Progress pulls together your sessions and retests so you can see real trends and confirm the work is paying off.',
    primaryRoute: '/progress',
    steps: [
      { title: 'Open Progress', detail: 'Go to /progress to see your trends over time.' },
      { title: 'Review your retests', detail: 'See how your swing has changed across your retests, not just one snapshot.' },
      { title: 'Spot the trend', detail: 'Look for the direction of travel — steady improvement matters more than any single session.' },
      { title: 'Adjust your focus', detail: 'If something has stalled, revisit your fix or drills; if it has improved, move to your next priority.' },
    ],
    sections: [
      { heading: 'Why track progress', body: ['Improvement you cannot see is hard to stick with. Progress makes the trend visible so the work feels worth it and you know what is actually moving.'] },
      { heading: 'Trends over snapshots', body: ['One swing is noisy; a trend is signal. Progress focuses on the direction of travel across sessions and retests, not a single good or bad day.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'How does Progress measure improvement?', a: 'It uses your sessions and retests over time, so you can see whether your fixes are taking hold.' },
      { q: 'Why is my progress empty?', a: 'You need at least one analysis — and ideally a retest — before there is a trend to show.' },
      { q: 'How often should I retest?', a: 'Every week or two. Real change shows up over sessions, not single reps.' },
    ],
    related: ['retest', 'diagnose', 'compare', 'reports'],
  },
  reports: {
    title: 'Your Reports',
    lead: 'Every analysis you have run, saved and easy to revisit — your full swing history in one place.',
    answer: 'Reports is your archive of every swing analysis you have run. Revisit a past diagnosis, compare it to a newer one, or pick up a fix you started — all tied to your private account.',
    seoTitle: 'Your Reports — Saved Swing Analyses & History',
    seoDescription: 'Find every swing analysis you have run on SwingVantage in Reports: revisit past diagnoses, compare them to newer swings, and pick up where you left off.',
    primaryRoute: '/reports',
    steps: [
      { title: 'Open Reports', detail: 'Go to /reports to see every analysis you have run.' },
      { title: 'Reopen a report', detail: 'Tap any past analysis to revisit its fix, drills, and notes.' },
      { title: 'Compare over time', detail: 'Line an old report up against a newer one to see what changed.' },
      { title: 'Manage your data', detail: 'Export or delete reports any time from the Data center.' },
    ],
    sections: [
      { heading: 'Your swing history', body: ['Every analysis is saved so your improvement has a paper trail. Reports is where you revisit past diagnoses and see how far you have come.'] },
      { heading: 'Tied to your account', body: ['Your reports are private to your account and synced across devices, so they are there whether you are on your phone at the range or a laptop at home.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Where do my past analyses go?', a: 'They are saved in Reports, tied to your private account and synced across your devices.' },
      { q: 'Can I delete a report?', a: 'Yes — you can export or delete your reports any time from the Data center.' },
    ],
    related: ['diagnose', 'progress', 'compare', 'data'],
  },
  journey: {
    title: 'Your Journey',
    lead: 'The story of your improvement — milestones, retests, and progress laid out as a timeline.',
    answer: 'Journey lays out your improvement as a timeline — the swings you analyzed, the fixes you worked, the milestones you hit — so your progress feels like a story you are writing, not a number.',
    seoTitle: 'Your Journey — Your Improvement Timeline',
    seoDescription: 'See your improvement as a story on SwingVantage: Journey lays out your analyses, fixes, retests, and milestones as a motivating timeline.',
    primaryRoute: '/journey',
    steps: [
      { title: 'Open Journey', detail: 'Go to /journey to see your improvement timeline.' },
      { title: 'Scroll your story', detail: 'See the analyses, fixes, and milestones that mark your progress.' },
      { title: 'Celebrate the wins', detail: 'Notice how far you have come — momentum is motivating.' },
      { title: 'Keep adding to it', detail: 'Every new analysis and retest writes the next chapter.' },
    ],
    sections: [
      { heading: 'Why a journey', body: ['Improvement is rarely a straight line, and a single score hides the story. Journey shows the whole arc so you can see the trend and stay motivated.'] },
      { heading: 'What fills it in', body: ['Your analyses, retests, fixes worked, and milestones earned all appear on the timeline as you keep using SwingVantage.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What shows up on my Journey?', a: 'Your analyses, fixes, retests, and milestones, laid out over time.' },
      { q: 'How do I add to it?', a: 'Keep analyzing and retesting — each one adds to the timeline.' },
    ],
    related: ['progress', 'milestones', 'reports', 'diagnose'],
  },
  benchmarks: {
    title: 'Benchmarks',
    lead: 'See how your swing stacks up against meaningful reference points — context for where you are and where to aim.',
    answer: 'Benchmarks give your numbers context by comparing them to meaningful reference points, so a result is not just a value but a sense of where you stand and what to aim for next.',
    seoTitle: 'Benchmarks — Put Your Swing in Context',
    seoDescription: 'Understand where your swing stands with SwingVantage Benchmarks: compare your results to meaningful reference points so you know what to aim for next.',
    primaryRoute: '/benchmarks',
    steps: [
      { title: 'Open Benchmarks', detail: 'Go to /benchmarks to see your results in context.' },
      { title: 'Find your reference', detail: 'Compare against the reference points relevant to your level and sport.' },
      { title: 'Set a target', detail: 'Use the gap to pick a realistic next goal.' },
      { title: 'Work toward it', detail: 'Tie the target back to your fix and drills, then retest.' },
    ],
    sections: [
      { heading: 'Why context matters', body: ['A number on its own means little. Benchmarks turn it into a sense of where you stand and a realistic target to chase.'] },
      { heading: 'Honest references', body: ['Benchmarks are labeled for what they are. SwingVantage never invents a comparison — where data is limited, it tells you rather than faking precision.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What do Benchmarks compare against?', a: 'Meaningful reference points for your sport and level, so your results have context.' },
      { q: 'Are the comparisons exact?', a: 'They are honest reference points, clearly labeled — guidance to aim at, not a certified ranking.' },
    ],
    related: ['progress', 'diagnose', 'milestones'],
  },
  milestones: {
    title: 'Milestones',
    lead: 'Earn meaningful, verifiable milestones as you improve — markers of real progress, not vanity badges.',
    answer: 'Milestones mark real, verifiable progress on your improvement journey. They celebrate genuine achievements — a fix grooved, a retest improved, a streak kept — so motivation is tied to actual results.',
    seoTitle: 'Milestones — Mark Your Real Progress',
    seoDescription: 'Earn meaningful, verifiable milestones on SwingVantage as you improve — markers of real progress like grooving a fix or improving a retest.',
    primaryRoute: '/milestones',
    steps: [
      { title: 'Open Milestones', detail: 'Go to /milestones to see what you have earned and what is next.' },
      { title: 'See what counts', detail: 'Each milestone is tied to a real, verifiable achievement.' },
      { title: 'Chase the next one', detail: 'Use upcoming milestones as motivation for your next session.' },
      { title: 'Keep going', detail: 'Milestones add up as you analyze, work fixes, and retest.' },
    ],
    sections: [
      { heading: 'Real, not vanity', body: ['SwingVantage milestones are tied to genuine progress, not arbitrary points. They mark things that actually reflect improvement, so they mean something.'] },
      { heading: 'Motivation that lasts', body: ['Seeing the next milestone within reach is a simple, powerful nudge to put in one more focused session.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What earns a milestone?', a: 'Real, verifiable achievements on your journey — like grooving a fix, improving a retest, or keeping a streak.' },
      { q: 'Are milestones just badges?', a: 'No — they are tied to genuine progress, not vanity points.' },
    ],
    related: ['journey', 'progress', 'challenges'],
  },
  challenges: {
    title: 'Challenges',
    lead: 'Stay consistent with structured challenges — like a 30-day program that keeps you showing up.',
    answer: 'Challenges give your improvement structure and momentum — time-boxed programs (like a 30-day challenge) that keep you practicing consistently and make progress a habit.',
    seoTitle: 'Challenges — Stay Consistent & Build the Habit',
    seoDescription: 'Build a practice habit with SwingVantage Challenges: structured, time-boxed programs like a 30-day challenge that keep you showing up and improving.',
    primaryRoute: '/challenges',
    steps: [
      { title: 'Open Challenges', detail: 'Go to /challenges to find a program that fits your goal.' },
      { title: 'Join one', detail: 'Pick a challenge — like a 30-day program — and commit to it.' },
      { title: 'Show up daily', detail: 'Do the day’s task; consistency is the whole point.' },
      { title: 'Finish and retest', detail: 'Complete the challenge, then retest to see how far you came.' },
    ],
    sections: [
      { heading: 'Why challenges work', body: ['Motivation fades; structure lasts. A challenge gives you a clear daily action and an end date, which is exactly what builds a habit.'] },
      { heading: 'Consistency beats intensity', body: ['A challenge is not about heroic sessions — it is about showing up regularly, which is what actually changes a swing.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What kinds of challenges are there?', a: 'Structured, time-boxed programs — for example a 30-day challenge — designed to keep you consistent.' },
      { q: 'Do I need to finish in order?', a: 'Challenges are built to be followed day by day, but the real goal is consistency, not perfection.' },
    ],
    related: ['training', 'milestones', 'reminders', 'community'],
  },
  reminders: {
    title: 'Reminders',
    lead: 'Never lose momentum — gentle reminders to practice, retest, and keep your improvement on track.',
    answer: 'Reminders keep your improvement from stalling by nudging you at the right time — to do today’s practice, to retest a fix, or to come back after a break — so consistency takes care of itself.',
    seoTitle: 'Reminders — Keep Your Practice on Track',
    seoDescription: 'Stay consistent with SwingVantage Reminders: gentle nudges to practice, retest, and keep your improvement on track so you never lose momentum.',
    primaryRoute: '/reminders',
    steps: [
      { title: 'Open Reminders', detail: 'Go to /reminders to set up the nudges that fit your routine.' },
      { title: 'Pick your cadence', detail: 'Choose when and how often you want to be reminded.' },
      { title: 'Act on the nudge', detail: 'When a reminder lands, do the short task it points you to.' },
      { title: 'Adjust as needed', detail: 'Tune the frequency so it helps without nagging.' },
    ],
    sections: [
      { heading: 'Why reminders help', body: ['The hardest part of improving is showing up. A well-timed nudge turns intention into action and keeps your streak alive.'] },
      { heading: 'Helpful, not noisy', body: ['Reminders are meant to support, not pester — set a cadence that keeps you on track without becoming background noise.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What will reminders nudge me to do?', a: 'Practice today’s tasks, retest a fix, or come back after a break — the things that keep momentum.' },
      { q: 'Can I change how often I get them?', a: 'Yes — tune the cadence so reminders help rather than nag.' },
    ],
    related: ['training', 'challenges', 'settings'],
  },
  notes: {
    title: 'Notes',
    lead: 'Keep your own swing thoughts, feels, and reminders in one place, tied to your sessions.',
    answer: 'Notes is your personal swing journal — jot down feels that worked, reminders for next time, or what your coach said, all kept with your sessions so you can find them again.',
    seoTitle: 'Notes — Your Personal Swing Journal',
    seoDescription: 'Keep your swing thoughts in one place with SwingVantage Notes: record the feels that worked, reminders, and coach feedback alongside your sessions.',
    primaryRoute: '/notes',
    steps: [
      { title: 'Open Notes', detail: 'Go to /notes to capture a thought any time.' },
      { title: 'Write the feel', detail: 'Note what worked — the swing thought, the feel, the cue.' },
      { title: 'Tie it to a session', detail: 'Keep notes with the swing or session they relate to so they have context.' },
      { title: 'Revisit before you play', detail: 'Skim your notes to carry the right thought into practice or a round.' },
    ],
    sections: [
      { heading: 'Why keep notes', body: ['The feel that fixed your swing on Tuesday is easy to forget by Saturday. Notes keeps your best cues and reminders where you can find them.'] },
      { heading: 'Make them useful', body: ['- Keep notes short and specific.', '- Capture feels, not just mechanics.', '- Revisit them before you practice or play.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What should I put in Notes?', a: 'Swing thoughts and feels that worked, reminders for next time, or feedback from a coach.' },
      { q: 'Are my notes private?', a: 'Yes — they are tied to your private account and synced across your devices.' },
    ],
    related: ['diagnose', 'reports', 'mental'],
  },
};

// ── Mind & knowledge ──────────────────────────────────────────

const MIND: Record<string, CuratedHelpTopic> = {
  mental: {
    title: 'Mental Journal',
    lead: 'Train the mental side — a journal to process rounds, nerves, and confidence so your head helps your game.',
    answer: 'The Mental Journal is where you work on the inner game: reflect on a round or match, process nerves, and build confidence, so your mind becomes an asset instead of an obstacle.',
    seoTitle: 'Mental Journal — Train the Inner Game',
    seoDescription: 'Train the mental side of your sport with the SwingVantage Mental Journal: reflect on rounds, process nerves, and build confidence so your head helps your game.',
    primaryRoute: '/mental/journal',
    steps: [
      { title: 'Open the Mental Journal', detail: 'Go to /mental/journal to reflect after a round, match, or practice.' },
      { title: 'Write it out', detail: 'Capture what happened, how you felt, and what you noticed about your mindset.' },
      { title: 'Find the pattern', detail: 'Over time, see what triggers nerves or confidence so you can prepare for it.' },
      { title: 'Carry the lesson', detail: 'Take what you learn into your next pre-round routine and your play.' },
    ],
    sections: [
      { heading: 'Why the mental game', body: ['Technique gets you to the shot; your mind decides what you do with it. Journaling builds self-awareness and resilience that show up under pressure.'] },
      { heading: 'How to use it', body: ['- Write soon after you play, while it is fresh.', '- Be honest about feelings, not just outcomes.', '- Look for patterns over weeks, not days.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What do I write about?', a: 'How you felt and thought during a round or match — nerves, confidence, focus — not just your scores.' },
      { q: 'Is this private?', a: 'Yes — your journal is tied to your private account and synced across devices.' },
    ],
    related: ['mental-performance', 'pre-round', 'notes'],
  },
  'mental-performance': {
    title: 'Mental Performance',
    lead: 'Sport-and-situation-specific mental coaching — handle first-tee nerves, big points, and pressure moments.',
    answer: 'Mental Performance gives you targeted guidance for the moments that matter — first-tee nerves, a big point, closing out a match — tailored to your sport and the situation, so you perform when it counts.',
    seoTitle: 'Mental Performance — Coaching for Pressure Moments',
    seoDescription: 'Handle pressure with SwingVantage Mental Performance: sport- and situation-specific mental coaching for first-tee nerves, big points, and closing moments.',
    primaryRoute: '/mental-performance',
    steps: [
      { title: 'Open Mental Performance', detail: 'Go to /mental-performance and pick your sport and the situation you want help with.' },
      { title: 'Get targeted guidance', detail: 'Receive practical mental tools tuned to that exact moment, not generic advice.' },
      { title: 'Practice the routine', detail: 'Rehearse the routine so it is automatic when the pressure is real.' },
      { title: 'Reflect afterward', detail: 'Use the Mental Journal to process how it went and refine your approach.' },
    ],
    sections: [
      { heading: 'Why situation-specific', body: ['First-tee nerves are not the same as closing out a match. Mental Performance meets you in the exact moment with tools that fit it.'] },
      { heading: 'Build a pressure routine', body: ['The players who handle pressure best rely on a routine, not willpower. This helps you build one you can trust.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What situations does it cover?', a: 'Pressure moments specific to your sport — first-tee nerves, big points, closing out, recovering from a mistake, and more.' },
      { q: 'Is this a replacement for a sports psychologist?', a: 'No — it is practical mental-skills guidance you can use any time. For deeper work, a qualified professional adds personal support.' },
    ],
    related: ['mental', 'pre-round', 'ai-coach'],
  },
  glossary: {
    title: 'Glossary',
    lead: 'Plain-language definitions for the swing, sport, and analysis terms you will see across SwingVantage.',
    answer: 'The Glossary explains the terms used across SwingVantage and your sport in plain language, so a word in your diagnosis never leaves you guessing.',
    seoTitle: 'Glossary — Swing & Analysis Terms Explained',
    seoDescription: 'Look up swing, sport, and analysis terms in plain language with the SwingVantage Glossary, so nothing in your diagnosis leaves you guessing.',
    primaryRoute: '/glossary',
    steps: [
      { title: 'Open the Glossary', detail: 'Go to /glossary to look up any term.' },
      { title: 'Find your term', detail: 'Search or browse for the word you saw in your diagnosis or drills.' },
      { title: 'Read the plain-language definition', detail: 'Get a clear explanation without jargon.' },
      { title: 'Go deeper', detail: 'Follow links to related guides when you want more than a definition.' },
    ],
    sections: [
      { heading: 'Why a glossary', body: ['Good coaching is clear coaching. The Glossary makes sure the language in your diagnosis and drills is something you actually understand.'] },
      { heading: 'Built for every sport', body: ['It covers swing and analysis terms across golf, tennis, baseball, softball, pickleball, and padel.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What does the Glossary cover?', a: 'Swing, sport, and analysis terms used across SwingVantage, explained in plain language.' },
      { q: 'Where do I see these terms?', a: 'In your diagnosis, drills, and reports — the Glossary is there whenever a word is unfamiliar.' },
    ],
    related: ['diagnose', 'training', 'equipment'],
  },
  equipment: {
    title: 'Equipment',
    lead: 'Honest, practical guidance on the gear that actually matters — and what you can safely ignore.',
    answer: 'Equipment gives you practical, honest guidance on the gear for your sport — what actually helps your game, what is optional, and how to spend wisely instead of chasing marketing.',
    seoTitle: 'Equipment — Honest Gear Guidance',
    seoDescription: 'Get honest, practical equipment guidance on SwingVantage: what gear actually matters for your sport, what is optional, and how to spend wisely.',
    primaryRoute: '/equipment',
    steps: [
      { title: 'Open Equipment', detail: 'Go to /equipment for guidance relevant to your sport.' },
      { title: 'Focus on what matters', detail: 'See which gear actually affects your game versus what is nice-to-have.' },
      { title: 'Match gear to your level', detail: 'Pick equipment that fits where you are, not where the marketing says you should be.' },
      { title: 'Get back to the swing', detail: 'Remember: gear helps at the margins; your swing is the main event.' },
    ],
    sections: [
      { heading: 'Gear that helps vs. hype', body: ['The right equipment can help, but most improvement comes from your swing, not your wallet. Equipment guidance keeps the focus honest.'] },
      { heading: 'Spend wisely', body: ['- Prioritize fit and basics over the latest model.', '- Match gear to your level and goals.', '- Do not let equipment become an excuse to skip practice.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Will better equipment fix my swing?', a: 'Rarely. Gear helps at the margins; the biggest gains come from working your fix. Equipment guidance helps you spend where it counts.' },
      { q: 'Is the advice tied to brands?', a: 'The focus is honest, practical guidance on what matters for your game, not pushing specific products.' },
    ],
    related: ['diagnose', 'glossary', 'golf'],
  },
};

// ── People & accounts ─────────────────────────────────────────

const ACCOUNTS: Record<string, CuratedHelpTopic> = {
  coaches: {
    title: 'SwingVantage for Coaches',
    lead: 'Give every athlete consistent, on-demand analysis and drills — a force multiplier for your coaching.',
    answer: 'For coaches, SwingVantage is a force multiplier: athletes get instant, consistent AI analysis and matched drills between sessions, so your in-person time goes further and your feedback is reinforced.',
    seoTitle: 'SwingVantage for Coaches — Scale Your Coaching',
    seoDescription: 'Coaches use SwingVantage to give every athlete consistent, on-demand AI swing analysis and drills between sessions — making in-person coaching time count.',
    primaryRoute: '/coaches',
    steps: [
      { title: 'Open the Coaches page', detail: 'Go to /coaches to see how SwingVantage fits your coaching.' },
      { title: 'Get athletes analyzing', detail: 'Have your athletes upload swings so they arrive to sessions already informed.' },
      { title: 'Reinforce between sessions', detail: 'Use the matched drills and reports so your feedback sticks when you are not there.' },
      { title: 'Track progress', detail: 'Lean on retests and progress to keep athletes accountable.' },
    ],
    sections: [
      { heading: 'A second set of eyes', body: ['SwingVantage gives your athletes a consistent, instant read any time — reinforcing your message and keeping them working between sessions instead of forgetting it.'] },
      { heading: 'It complements you, not replaces you', body: ['The AI handles consistency and reps; you bring the human feel, accountability, and relationship. Together they beat either alone.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Does this replace coaching?', a: 'No — it amplifies it. Athletes get consistent analysis and drills between sessions so your in-person time goes further.' },
      { q: 'How do my athletes use it?', a: 'They upload swings, get a prioritized fix and drills, and retest — and you reinforce it in person.' },
    ],
    related: ['teams', 'parents', 'recruiting', 'diagnose'],
  },
  parents: {
    title: 'SwingVantage for Parents',
    lead: 'Support your young athlete with honest, encouraging feedback — without needing to be the expert.',
    answer: 'For parents, SwingVantage makes it easy to support a young athlete: clear, encouraging, honest analysis and drills you can do together, with privacy-first handling of your child’s data.',
    seoTitle: 'SwingVantage for Parents — Support Your Young Athlete',
    seoDescription: 'Parents use SwingVantage to support a young athlete with honest, encouraging AI swing feedback and drills — no expertise required, privacy-first.',
    primaryRoute: '/parents',
    steps: [
      { title: 'Open the Parents page', detail: 'Go to /parents to see how to support your athlete.' },
      { title: 'Film a swing together', detail: 'Capture a clear clip — it can be a fun, low-pressure activity.' },
      { title: 'Read it together', detail: 'Focus on the one fix and the encouraging, plain-language explanation.' },
      { title: 'Practice the drills', detail: 'Do the matched drills together and retest to celebrate progress.' },
    ],
    sections: [
      { heading: 'You don’t need to be the expert', body: ['SwingVantage gives you the coaching knowledge so you can focus on support and encouragement. The one-fix-first approach keeps it simple and positive.'] },
      { heading: 'Privacy for young athletes', body: ['Your child’s data is handled privately, tied to your account, never sold, and removable from the Data center. Guardian consent flows are built in where appropriate.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Do I need to know the sport?', a: 'No. SwingVantage explains the one fix in plain language and gives you drills to do together — you bring the encouragement.' },
      { q: 'Is my child’s data safe?', a: 'Yes — it is private to your account, never sold, and you can delete it any time from the Data center.' },
    ],
    related: ['coaches', 'diagnose', 'drills', 'data'],
  },
  teams: {
    title: 'SwingVantage for Teams',
    lead: 'Bring consistent analysis and progress tracking to a whole roster — every athlete improving on the same system.',
    answer: 'For teams and programs, SwingVantage brings every athlete onto one consistent system of analysis, drills, and progress tracking — so coaches can scale their attention and athletes improve together.',
    seoTitle: 'SwingVantage for Teams — One System for Your Roster',
    seoDescription: 'Teams and programs use SwingVantage to give every athlete consistent AI analysis, drills, and progress tracking on one system, so coaching scales.',
    primaryRoute: '/teams',
    steps: [
      { title: 'Open the Teams page', detail: 'Go to /teams to see how SwingVantage fits a roster.' },
      { title: 'Onboard your athletes', detail: 'Get everyone analyzing swings on the same consistent system.' },
      { title: 'Standardize the work', detail: 'Use matched drills and plans so the whole roster trains with purpose.' },
      { title: 'Track the program', detail: 'Lean on progress and retests to see who is improving and where to focus.' },
    ],
    sections: [
      { heading: 'Consistency at scale', body: ['One coach cannot give every athlete daily feedback. SwingVantage makes consistent analysis available to the whole roster, so your attention goes where it is needed most.'] },
      { heading: 'Everyone on the same page', body: ['Shared language, shared drills, and shared progress tracking make a program easier to run and easier for athletes to buy into.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'How does this help a team?', a: 'Every athlete gets consistent analysis and drills, and coaches get progress tracking across the roster — so coaching scales.' },
      { q: 'Is it the same as the coaches tools?', a: 'It builds on them for a whole roster rather than individual athletes. See the Coaches guide for the one-on-one view.' },
    ],
    related: ['team', 'coaches', 'recruiting', 'community'],
  },
  team: {
    title: 'Your Team',
    lead: 'Your team space on SwingVantage — roster, shared progress, and the tools to train together.',
    answer: 'The Team area is your team’s home on SwingVantage: see your roster, shared progress, and the tools that let athletes and coaches train on one consistent system.',
    seoTitle: 'Your Team on SwingVantage',
    seoDescription: 'Manage your team on SwingVantage: roster, shared progress, and tools for athletes and coaches to train together on one consistent system.',
    primaryRoute: '/team',
    steps: [
      { title: 'Open your Team', detail: 'Go to /team to see your roster and shared progress.' },
      { title: 'Check in on athletes', detail: 'See who is analyzing, working their fix, and retesting.' },
      { title: 'Keep everyone aligned', detail: 'Use shared drills and plans so the team trains with one approach.' },
      { title: 'Celebrate progress', detail: 'Surface wins and milestones to keep the group motivated.' },
    ],
    sections: [
      { heading: 'Your team’s home base', body: ['The Team area keeps your roster and shared progress in one place, so coaches and athletes are always on the same page.'] },
      { heading: 'Train together', body: ['Shared language, drills, and progress make team practice more focused and accountability easier.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What’s in the Team area?', a: 'Your roster, shared progress, and tools for training together on one system.' },
      { q: 'How is this different from Teams?', a: 'The Teams page explains the program offering; your Team is your actual team space inside SwingVantage.' },
    ],
    related: ['teams', 'coaches', 'community', 'progress'],
  },
  recruiting: {
    title: 'Recruiting',
    lead: 'Help athletes get seen — turn analysis and progress into shareable evidence for the next level.',
    answer: 'Recruiting helps athletes present their game with evidence — progress, analysis, and shareable highlights — so the work they put in is visible to coaches and programs at the next level.',
    seoTitle: 'Recruiting — Help Athletes Get Seen',
    seoDescription: 'SwingVantage Recruiting helps athletes turn their analysis and progress into shareable evidence for the next level, so the work they put in gets seen.',
    primaryRoute: '/recruiting',
    steps: [
      { title: 'Open Recruiting', detail: 'Go to /recruiting to see how to present your game.' },
      { title: 'Build your evidence', detail: 'Use your analyses and progress to show genuine, tracked improvement.' },
      { title: 'Share with the right people', detail: 'Turn it into something you can share with coaches and programs.' },
      { title: 'Keep improving', detail: 'The best recruiting story is real progress — keep analyzing and retesting.' },
    ],
    sections: [
      { heading: 'Show the work, not just the highlight', body: ['Recruiters value trajectory. Progress and analysis turn your improvement into evidence, not just a highlight reel.'] },
      { heading: 'Honest by design', body: ['Everything is grounded in your real sessions. SwingVantage never fabricates numbers — your story stands on genuine data.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'How does Recruiting help me get seen?', a: 'It turns your real analysis and tracked progress into shareable evidence of improvement for coaches and programs.' },
      { q: 'Is the data real?', a: 'Yes — it is grounded in your actual sessions. SwingVantage never invents metrics.' },
    ],
    related: ['progress', 'coaches', 'teams', 'reports'],
  },
  community: {
    title: 'Community',
    lead: 'Stay motivated with others on the same journey — badges, shared milestones, and encouragement.',
    answer: 'Community connects you with others working to improve, with badges and shared milestones that make the journey more motivating and less solitary.',
    seoTitle: 'Community — Improve Alongside Others',
    seoDescription: 'Stay motivated with the SwingVantage Community: earn badges, share milestones, and improve alongside others on the same journey.',
    primaryRoute: '/community',
    steps: [
      { title: 'Open Community', detail: 'Go to /community to see badges and shared milestones.' },
      { title: 'Earn your badges', detail: 'Pick up badges as you analyze, work fixes, and keep streaks.' },
      { title: 'Share milestones', detail: 'Celebrate progress with others on the same path.' },
      { title: 'Stay consistent', detail: 'Use the encouragement to keep showing up.' },
    ],
    sections: [
      { heading: 'Why community helps', body: ['Improving alongside others is more motivating than going it alone. Badges and shared milestones add encouragement and a sense of momentum.'] },
      { heading: 'Real progress, celebrated', body: ['Community recognition is tied to genuine effort and milestones, so it actually means something.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What’s in the Community?', a: 'Badges, shared milestones, and encouragement from others on the same improvement journey.' },
      { q: 'Do I have to share anything?', a: 'You control what you share. Your sessions stay private to your account unless you choose otherwise.' },
    ],
    related: ['milestones', 'challenges', 'journey'],
  },
  profile: {
    title: 'Your Profile',
    lead: 'Your sport, your goals, and your details — the settings that make your analysis and plan fit you.',
    answer: 'Your Profile holds your sport, goals, and details so SwingVantage can tailor your analysis, drills, and plan to you. Keeping it current keeps your experience accurate.',
    seoTitle: 'Your Profile — Personalize Your Experience',
    seoDescription: 'Set up your SwingVantage profile — your sport, goals, and details — so your analysis, drills, and plan are tailored to you.',
    primaryRoute: '/profile',
    steps: [
      { title: 'Open your Profile', detail: 'Go to /profile to set your sport, goals, and details.' },
      { title: 'Set your sport', detail: 'Choose your primary sport so analysis is tuned to your game.' },
      { title: 'Add your goals', detail: 'Tell SwingVantage what you are working toward so guidance fits.' },
      { title: 'Keep it current', detail: 'Update it as your game and goals evolve.' },
    ],
    sections: [
      { heading: 'Why your profile matters', body: ['Your profile is how SwingVantage tailors your experience — the more accurate it is, the more your analysis, drills, and plan fit you.'] },
      { heading: 'Yours to control', body: ['Your details are private to your account and editable any time, with full data control in the Data center.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Why set up a profile?', a: 'So your analysis, drills, and plan are tailored to your sport and goals.' },
      { q: 'Can I change my sport later?', a: 'Yes — update your profile any time as your focus changes.' },
    ],
    related: ['settings', 'data', 'dashboard'],
  },
  settings: {
    title: 'Settings',
    lead: 'Control your account, notifications, privacy, and preferences — SwingVantage your way.',
    answer: 'Settings is where you control your account, notifications, privacy, and preferences, so SwingVantage works the way you want it to.',
    seoTitle: 'Settings — Control Your Account & Preferences',
    seoDescription: 'Manage your SwingVantage account, notifications, privacy, and preferences in Settings, so the app works exactly the way you want.',
    primaryRoute: '/settings',
    steps: [
      { title: 'Open Settings', detail: 'Go to /settings to manage your account and preferences.' },
      { title: 'Tune notifications', detail: 'Choose what you hear about and how often, including reminders.' },
      { title: 'Check privacy', detail: 'Review your privacy and data preferences.' },
      { title: 'Set preferences', detail: 'Adjust the app to suit how you like to work.' },
    ],
    sections: [
      { heading: 'Make it yours', body: ['Settings puts you in control — notifications, privacy, and preferences are all yours to adjust.'] },
      { heading: 'Privacy front and center', body: ['Manage your data and privacy choices here, with full export and delete available in the Data center.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What can I change in Settings?', a: 'Your account, notifications, privacy preferences, and how the app behaves.' },
      { q: 'Where do I manage my data?', a: 'In the Data center, where you can export or delete your information.' },
    ],
    related: ['profile', 'data', 'reminders'],
  },
  data: {
    title: 'Your Data',
    lead: 'Full control of your information — view, export, or delete everything you have created, any time.',
    answer: 'The Data center gives you full control of your information: see what SwingVantage holds, export it, or delete it. Your data is private to your account, never sold, and never used for ads.',
    seoTitle: 'Your Data — View, Export & Delete Anytime',
    seoDescription: 'Take control of your information in the SwingVantage Data center: view, export, or delete everything you have created. Private, never sold, no ads.',
    primaryRoute: '/data',
    steps: [
      { title: 'Open the Data center', detail: 'Go to /data to see and manage your information.' },
      { title: 'Review what’s there', detail: 'See the sessions, reports, and details tied to your account.' },
      { title: 'Export if you want', detail: 'Download your data whenever you need a copy.' },
      { title: 'Delete on your terms', detail: 'Remove sessions or your data entirely — your choice, any time.' },
    ],
    sections: [
      { heading: 'Your data, your control', body: ['Everything you create is tied to your private account. The Data center lets you view, export, or delete it whenever you want.'] },
      { heading: 'Private by principle', body: ['We do not sell your data and we do not run ads. Frames from your swings are sent securely to our AI provider to generate your report — and nothing more.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'Can I delete my data?', a: 'Yes — you can delete sessions or your data entirely from the Data center, any time.' },
      { q: 'Do you sell my data?', a: 'No. We do not sell your data and we do not run ads.' },
      { q: 'What happens to my swing videos?', a: 'Frames are sent securely to our AI provider to generate your report. You can remove your sessions whenever you like.' },
    ],
    related: ['settings', 'profile', 'reports'],
  },
  sessions: {
    title: 'Sessions & Importing',
    lead: 'Every swing you analyze is a session — and you can bring in past data, including from images.',
    answer: 'Sessions are the record of each swing you analyze. You can also import past data — including from images — so your history and progress reflect more than just what you film today.',
    seoTitle: 'Sessions & Importing Your Data',
    seoDescription: 'Understand sessions on SwingVantage and import past data — including from images — so your history and progress reflect your full picture.',
    primaryRoute: '/sessions',
    steps: [
      { title: 'Open Sessions', detail: 'Go to /sessions to see your analyzed swings and import options.' },
      { title: 'Review your history', detail: 'Each session holds the analysis, fix, and notes for that swing.' },
      { title: 'Import past data', detail: 'Bring in earlier data, including from images, to enrich your history.' },
      { title: 'Track progress', detail: 'A fuller history means more meaningful progress and benchmarks.' },
    ],
    sections: [
      { heading: 'What a session is', body: ['Every time you analyze a swing, it becomes a session — a saved record of the analysis, your fix, and any notes, tied to your account.'] },
      { heading: 'Bring in your history', body: ['Importing past data — including from images — lets your progress and benchmarks reflect your full journey, not just today.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What counts as a session?', a: 'Each swing you analyze becomes a session with its analysis, fix, and notes saved to your account.' },
      { q: 'Can I import old data?', a: 'Yes — you can import past data, including from images, to enrich your history and progress.' },
    ],
    related: ['reports', 'progress', 'data', 'video'],
  },
  library: {
    title: 'Video Library',
    lead: 'A library of tutorials and walkthroughs — watch how to use SwingVantage and how to groove your fixes.',
    answer: 'The Video Library is a collection of tutorials and walkthroughs: how to use SwingVantage, how to film a great swing, and how to work the drills behind your fixes.',
    seoTitle: 'Video Library — Tutorials & Walkthroughs',
    seoDescription: 'Browse the SwingVantage Video Library: tutorials and walkthroughs on using the app, filming a great swing, and grooving the drills behind your fixes.',
    primaryRoute: '/library',
    steps: [
      { title: 'Open the Library', detail: 'Go to /library to browse tutorials and walkthroughs.' },
      { title: 'Find what you need', detail: 'Look for how-to videos on the feature or drill you are working on.' },
      { title: 'Watch and apply', detail: 'See the technique in motion, then try it yourself.' },
      { title: 'Pair it with your fix', detail: 'Use videos to reinforce the drills behind your current fix.' },
    ],
    sections: [
      { heading: 'See it in motion', body: ['Some things are easier to watch than to read. The Video Library shows you how to use SwingVantage and how to groove your fixes, step by step.'] },
      { heading: 'Tutorials that match your work', body: ['Browse walkthroughs tied to features and drills so the video you watch supports what you are actually working on.'] },
      PRIVACY_SECTION,
    ],
    faqs: [
      { q: 'What’s in the Video Library?', a: 'Tutorials and walkthroughs on using SwingVantage, filming a great swing, and working the drills behind your fixes.' },
      { q: 'Is it the same as Learn?', a: 'The Library is video walkthroughs; the Learn area and Help Center add written guides and concepts.' },
    ],
    related: ['drills', 'video', 'diagnose'],
  },
};

/** All curated guides, keyed by slug. */
export const CURATED_HELP: Record<string, CuratedHelpTopic> = {
  ...SPORTS,
  ...CORE,
  ...SPORT_HUBS,
  ...TECHNIQUE,
  ...ANALYSIS,
  ...TRAINING,
  ...MIND,
  ...ACCOUNTS,
};

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
