// ============================================================
// SwingVantage — Video Tutorial Library
// ------------------------------------------------------------
// The catalogue behind the Tutorial Center (/tutorial): one video
// per relevant feature, tagged by who it helps most, plus curated
// "tracks" that string the right videos together for each kind of
// user (player, parent, coach, team).
//
// HONEST BY DESIGN: a video only "plays" once a real recording URL
// is set on its entry. Until then the player shows a friendly
// "coming soon" card AND the written walkthrough below it — so the
// tutorial is fully usable as step-by-step instructions today, and
// lights up automatically as recordings are added.
//
// HOW TO ADD A RECORDING:
//   1. Find the video by `id` below.
//   2. Set `videoUrl` to a YouTube, Vimeo, or direct .mp4/.webm URL.
//   3. (Optional) Set `poster` to a thumbnail image URL.
//   Nothing else to wire — the Tutorial Center picks it up.
//
// The `script` array is the spoken/written walkthrough. It doubles
// as the recording script and the text fallback, so keep each line
// short, plain-spoken, and useful on its own.
// ============================================================

/** Who a video is written for. Mirrors the onboarding USER_TYPES. */
export type TutorialAudience = 'athlete' | 'parent' | 'coach' | 'team';

/** Top-level grouping shown as sections in the full library. */
export type TutorialCategory =
  | 'getting-started'
  | 'analyze'
  | 'practice'
  | 'progress'
  | 'share'
  | 'account'
  | 'community'
  | 'data';

/**
 * Where a video sits in the first-use → repeat-use journey. Used by the
 * inline placements (homepage, upload, results …) and tagged onto every
 * analytics event so we can see which moment a tutorial helped at.
 */
export type TutorialJourneyStage =
  | 'discover' // what is this / why care (marketing, hero)
  | 'onboard' // first run, find your way around
  | 'capture' // record / upload a swing
  | 'understand' // read the AI analysis
  | 'improve' // turn analysis into practice
  | 'track' // measure progress over time
  | 'recover'; // something went wrong — get unstuck

export const JOURNEY_STAGE_ORDER: TutorialJourneyStage[] = [
  'discover',
  'onboard',
  'capture',
  'understand',
  'improve',
  'track',
  'recover',
];

export interface TutorialVideo {
  /** Stable unique id — also the key used for "watched" progress. */
  id: string;
  /** Short human title shown on the card and player. */
  title: string;
  /** One-line description of what the video covers. */
  description: string;
  /** Which users this video helps most. Use 'all' for everyone. */
  audiences: TutorialAudience[] | 'all';
  /** Section grouping in the full library. */
  category: TutorialCategory;
  /** Approx length, e.g. "2:30". Shown as a hint even before recording. */
  duration: string;
  /** In-app feature this video is about — used for the "Open this feature" link. */
  route?: string;
  /**
   * The recording. Empty/undefined => player shows "coming soon" + the
   * written walkthrough. Supports YouTube, Vimeo, or a direct video file URL.
   */
  videoUrl?: string;
  /** Optional thumbnail/poster image URL. */
  poster?: string;
  /** Plain-language walkthrough. Recording script + text fallback. */
  script: string[];

  // ── Inline placement metadata (all optional, backward-compatible) ──
  // These light up the in-context inline player (TutorialVideo.tsx). Until
  // file sources are set, placements render the honest "coming soon" card
  // plus the written script above — so they are useful today.

  /** Where this sits in the first-use → repeat-use journey. */
  journeyStage?: TutorialJourneyStage;
  /** WebM source (smaller/efficient where supported), e.g. /tutorials/sources/welcome.webm */
  webmSrc?: string;
  /** MP4/H.264 source (broad compatibility), e.g. /tutorials/sources/welcome.mp4 */
  mp4Src?: string;
  /** Mobile-optimized MP4 served via a max-width media query (saves bytes on phones). */
  mobileSrc?: string;
  /** WebVTT captions track, e.g. /tutorials/captions/welcome.vtt */
  captionsSrc?: string;
  /** List/grid thumbnail (distinct from the in-player poster). */
  thumbnail?: string;
  /** 'high' => preload metadata when on screen; otherwise preload nothing until play. */
  priority?: 'high' | 'low';
  /** Allow muted autoplay ONLY when on screen and motion is allowed. Default false. */
  autoplayAllowed?: boolean;
  /** Start muted (required for any autoplay). Default true. */
  mutedDefault?: boolean;
  /** Loop playback (short ambient clips only). Default false. */
  loop?: boolean;
  /** One-line fallback shown if the recording fails to load (before the script). */
  fallbackText?: string;
}

/** A single `<source>` for the inline player. */
export interface InlineVideoSource {
  src: string;
  type: 'video/webm' | 'video/mp4';
  /** Optional media query — e.g. mobile-only source. */
  media?: string;
}

/** A curated, ordered tutorial for one kind of user. */
export interface TutorialTrack {
  audience: TutorialAudience;
  /** Display name, e.g. "Player". */
  label: string;
  /** One-line "this is you" description. */
  blurb: string;
  /** Emoji used on the persona chip. */
  emoji: string;
  /** Ordered video ids that make up this user's tutorial. */
  videoIds: string[];
}

// ── Audience metadata (labels + descriptions for the persona picker) ──

export const AUDIENCES: Record<TutorialAudience, { label: string; blurb: string; emoji: string }> = {
  athlete: { label: 'Player', blurb: "You're working on your own game", emoji: '🏌️' },
  parent: { label: 'Parent', blurb: "You're helping a young athlete", emoji: '👪' },
  coach: { label: 'Coach', blurb: 'You work with athletes you coach', emoji: '📋' },
  team: { label: 'Team / Program', blurb: "You're exploring SwingVantage for a group", emoji: '🏟️' },
};

// ── Category metadata (section headers in the library) ──

export const CATEGORIES: Record<TutorialCategory, { label: string; blurb: string }> = {
  'getting-started': { label: 'Getting Started', blurb: 'Set up and find your way around.' },
  analyze: { label: 'Analyze Your Swing', blurb: 'Turn a video or your data into clear feedback.' },
  practice: { label: 'Practice & Improve', blurb: 'Know what to work on, and actually do it.' },
  progress: { label: 'Track Your Progress', blurb: 'See improvement over time and prove it.' },
  share: { label: 'Share & Coach', blurb: 'Summaries for coaches, parents, and programs.' },
  account: { label: 'Profile & Equipment', blurb: 'Tell SwingVantage about you and your gear.' },
  community: { label: 'Community & Motivation', blurb: 'Streaks, badges, challenges, and groups.' },
  data: { label: 'Your Data & Settings', blurb: 'Back up your progress and make it yours.' },
};

export const CATEGORY_ORDER: TutorialCategory[] = [
  'getting-started',
  'analyze',
  'practice',
  'progress',
  'share',
  'account',
  'community',
  'data',
];

// ── The video library: one entry per relevant feature ──

export const TUTORIAL_VIDEOS: TutorialVideo[] = [
  // ── Getting Started ───────────────────────────────────────
  {
    id: 'welcome',
    title: 'Welcome to SwingVantage',
    description: 'A 2-minute tour of what SwingVantage is and how it helps you improve.',
    audiences: 'all',
    category: 'getting-started',
    duration: '2:00',
    route: '/dashboard',
    journeyStage: 'discover',
    priority: 'high',
    fallbackText: 'Here’s the 60-second version of how SwingVantage works.',
    script: [
      'SwingVantage is your personal performance system for golf, tennis, baseball, and softball.',
      'The idea is simple: analyze your swing, learn what to work on, practice it, and watch yourself improve over time.',
      'Everything is private and stored on your device — no account required to get started.',
      'This tutorial is organized by who you are. Pick Player, Parent, Coach, or Team and we’ll show you the right path.',
      'You can skip the tutorial anytime and come back to it from the menu whenever you like.',
    ],
  },
  {
    id: 'start-here',
    title: 'Set up in 2 minutes (Start Here)',
    description: 'Answer a few quick questions and get your first personalized result.',
    audiences: 'all',
    category: 'getting-started',
    duration: '2:30',
    route: '/start',
    script: [
      'Open “Start Here” from the menu. Pick every sport you play — you can switch between them anytime.',
      'Tell us who this is for: a player, a parent helping a young athlete, a coach, or a team. This tailors the tone and safety reminders.',
      'Choose how to begin: answer a couple of questions, upload a video, or import data. The quiz is the fastest route to a first result.',
      'You’ll get a top thing to work on, a confidence level, three beginner-safe drills, and a 7-day plan.',
      'Used SwingVantage before? Use “Skip setup” to jump straight to your dashboard.',
    ],
  },
  {
    id: 'dashboard',
    title: 'Your Today dashboard',
    description: 'Where your day starts: your focus, recent sessions, and what to do next.',
    audiences: 'all',
    category: 'getting-started',
    duration: '2:00',
    route: '/dashboard',
    journeyStage: 'onboard',
    fallbackText: 'A quick tour of your Today dashboard and where everything lives.',
    script: [
      'The dashboard is “Today.” Everything here is filtered to your active sport.',
      'Up top you’ll see your recommended next action — the single best thing to do right now.',
      'Below that: recent sessions, how your key metrics are trending, and your streak and achievements.',
      'Tap any card to dive deeper. The dashboard is always your home base — the SwingVantage logo brings you back here.',
    ],
  },
  {
    id: 'switch-sport',
    title: 'Pick or switch your sport',
    description: 'Keep separate data for every sport you play and switch in one tap.',
    audiences: 'all',
    category: 'getting-started',
    duration: '1:30',
    route: '/dashboard',
    script: [
      'SwingVantage supports golf, tennis, baseball, slow-pitch and fast-pitch softball.',
      'Use the sport switcher near the bottom of the side menu to change your active sport.',
      'Each sport keeps its own profile, sessions, drills, and progress — nothing gets mixed together.',
      'Switching sport instantly re-tailors the whole app: labels, metrics, drills, and coaching all follow the sport you choose.',
    ],
  },
  {
    id: 'navigation',
    title: 'Finding your way around',
    description: 'A quick map of the menu so you never feel lost.',
    audiences: 'all',
    category: 'getting-started',
    duration: '1:30',
    route: '/dashboard',
    script: [
      'The side menu follows one path: Today → Analyze → Practice → Progress → Share & Coach.',
      'Analyze, Practice, and Progress each expand to reveal more tools — tap the arrow to open a section.',
      'On a phone, tap the menu icon (or “More”) to open the same navigation.',
      'The “?” Guide button on each screen explains exactly what you’re looking at, in plain language.',
      'And the Tutorials link in the menu brings you right back here anytime.',
    ],
  },

  // ── Analyze Your Swing ────────────────────────────────────
  {
    id: 'video-analysis',
    title: 'Upload & analyze a swing video',
    description: 'Film a swing, upload it, and get clear, AI-assisted feedback.',
    audiences: 'all',
    category: 'analyze',
    duration: '3:30',
    route: '/video',
    journeyStage: 'capture',
    priority: 'high',
    fallbackText: 'How to film and upload a swing the AI can read confidently.',
    script: [
      'Film from a steady position — down-the-line (behind you, toward the target) or face-on. Keep the whole body in frame.',
      'Upload the clip on the Video Analysis screen. SwingVantage breaks the swing into phases and looks for common faults in each.',
      'Every finding comes with a plain-language explanation and how strongly we believe it — shown as a confidence level.',
      'Visual conclusions are labeled as estimates, not measurements. Use them as a smart starting point, not the final word.',
      'Your results are saved so you can compare future swings against this one.',
    ],
  },
  {
    id: 'diagnose',
    title: 'Diagnose your swing',
    description: 'Turn session data into the key issues holding you back — ranked.',
    audiences: ['athlete', 'coach'],
    category: 'analyze',
    duration: '3:00',
    route: '/diagnose',
    journeyStage: 'understand',
    fallbackText: 'How to read your AI analysis: scores, issues, and what to do next.',
    script: [
      'Pick a session and SwingVantage finds the most significant patterns in your shots.',
      'Each issue gets a severity (Critical, High, Medium, Low) and a confidence score, so you know what to fix first.',
      'Your swing score rates the session’s consistency. It’s built to track trends, not to define your ability.',
      'From here, jump straight to the recommended drills that target what the analysis found.',
    ],
  },
  {
    id: 'motion-lab',
    title: 'Motion Lab: 3D analysis',
    description: 'Browser-side 3D motion capture from your camera — no extra hardware.',
    audiences: ['athlete', 'coach'],
    category: 'analyze',
    duration: '3:00',
    route: '/motion-lab',
    script: [
      'Motion Lab estimates your body’s motion in 3D, right in the browser, from a normal video.',
      'Record or upload a swing and SwingVantage tracks key body points through the movement.',
      'Use it to see rotation, sequence, and timing that are hard to judge with the naked eye.',
      'Like all visual analysis, it’s an estimate — great for spotting patterns and comparing before/after.',
    ],
  },
  {
    id: 'avatar',
    title: 'Your 3D Swing Avatar',
    description: 'See your swing as a clean 3D model you can rotate and replay.',
    audiences: ['athlete'],
    category: 'analyze',
    duration: '2:00',
    route: '/avatar',
    script: [
      'The Swing Avatar turns your motion into a simple 3D figure you can orbit and replay.',
      'Stripping away the background makes positions and sequence much easier to see.',
      'Scrub through the phases to check positions at takeaway, top, and impact.',
      'It’s a visualization aid — pair it with Diagnose or Video Analysis for the “what to fix” part.',
    ],
  },
  {
    id: 'ai-coach',
    title: 'Ask the AI Coach',
    description: 'Ask anything about your swing, your data, or what to do next.',
    audiences: 'all',
    category: 'analyze',
    duration: '2:30',
    route: '/ai-coach',
    script: [
      'Type any question — “Why is my carry inconsistent?” or “What should I work on next?”',
      'When you have sessions saved, the AI Coach can reference your actual data for more specific answers.',
      'It’s great for explaining a metric, a drill, or a diagnosis in plain language.',
      'One limit to know: it doesn’t watch your swing live. For that, use Video Analysis or Motion Lab.',
    ],
  },
  {
    id: 'import-data',
    title: 'Import launch-monitor data',
    description: 'Bring in CSV data from FlightScope, Trackman, SkyTrak, and more.',
    audiences: ['athlete', 'coach'],
    category: 'analyze',
    duration: '3:00',
    route: '/sessions/import',
    script: [
      'Export a CSV from your launch monitor and drop it onto the import screen.',
      'SwingVantage reads the columns and maps them to the right metrics — carry, ball speed, launch, spin, and more.',
      'Review the preview to make sure everything mapped correctly, then save it as a session.',
      'Imported sessions feed your diagnosis, progress charts, and benchmarks — the more data, the sharper the picture.',
    ],
  },
  {
    id: 'import-image',
    title: 'Snap a photo of your numbers',
    description: 'No CSV? Photograph the launch-monitor screen and let SwingVantage read it.',
    audiences: ['athlete', 'coach'],
    category: 'analyze',
    duration: '2:00',
    route: '/sessions/import/image',
    script: [
      'Take a clear, well-lit photo of the data table on your launch monitor screen.',
      'Upload it and SwingVantage reads the numbers from the image automatically.',
      'Always check the extracted values for accuracy and fix any misreads before saving.',
      'It’s the fastest way to capture a session when you can’t export a file.',
    ],
  },

  // ── Practice & Improve ────────────────────────────────────
  {
    id: 'training',
    title: 'Your training plan',
    description: 'A focused plan built from your diagnosis — what to work on, in order.',
    audiences: ['athlete', 'parent', 'coach'],
    category: 'practice',
    duration: '2:30',
    route: '/training',
    script: [
      'Your plan highlights the highest-priority issue first, so practice time goes where it counts.',
      'Each focus area has specific drills. Work through them in order — they build on each other.',
      'Check off drills as you go. SwingVantage tracks your consistency and suggests when to retest.',
      'Practicing on consecutive days builds your streak, which earns XP and badges.',
    ],
  },
  {
    id: 'fix-stack',
    title: 'Today’s Fix',
    description: 'The one thing to work on today — a tiny, doable next step.',
    audiences: ['athlete', 'parent'],
    category: 'practice',
    duration: '2:00',
    route: '/fix',
    script: [
      'The Fix Stack gives you one clear thing to work on right now — no overwhelm.',
      'It’s drawn from your most recent analysis and stacked in priority order.',
      'Do the fix, mark it done, and the next one moves up. Small steps, stacked daily, add up fast.',
      'Perfect for busy days or younger athletes who do best with a single focus.',
    ],
  },
  {
    id: 'drills',
    title: 'The Drill Library',
    description: 'Browse drills by sport, skill level, and the exact issue they fix.',
    audiences: ['athlete', 'parent', 'coach'],
    category: 'practice',
    duration: '2:00',
    route: '/drills',
    journeyStage: 'improve',
    fallbackText: 'Turn your top fix into a focused, doable practice plan.',
    script: [
      'Filter drills by your sport, skill level, and the issue you want to fix.',
      'Drills are grouped by what they target — path, face, timing, contact, and more.',
      'Start with the ones marked high-priority for your current diagnosis.',
      'Doing drills in a focused sequence beats doing random ones — quality over quantity.',
    ],
  },
  {
    id: 'practice-schedule',
    title: 'Build a practice schedule',
    description: 'Turn your focus areas into a realistic weekly plan.',
    audiences: ['athlete', 'parent', 'coach'],
    category: 'practice',
    duration: '2:00',
    route: '/practice',
    script: [
      'Tell SwingVantage how many days a week you practice and how long sessions run.',
      'You’ll get a day-by-day plan, each with a single clear focus.',
      'Sticking to the focus for each session is what drives real change.',
      'Adjust anytime — the schedule flexes around your week, not the other way around.',
    ],
  },
  {
    id: 'pre-round',
    title: 'Warm up before you play',
    description: 'A targeted warm-up based on what you’ve been training.',
    audiences: ['athlete'],
    category: 'practice',
    duration: '1:30',
    route: '/pre-round',
    script: [
      'Before a round or game, get a quick warm-up tuned to your current focus.',
      'It activates the movements you’ve been practicing so they show up when it counts.',
      'It also surfaces early if your timing or contact is off, before the first shot matters.',
      'A few focused minutes here beats a generic warm-up every time.',
    ],
  },

  // ── Track Your Progress ───────────────────────────────────
  {
    id: 'progress',
    title: 'Track your progress',
    description: 'See your key metrics trend over time across all your sessions.',
    audiences: 'all',
    category: 'progress',
    duration: '2:30',
    route: '/progress',
    journeyStage: 'track',
    fallbackText: 'How progress tracking works: trends, comparisons, and streaks.',
    script: [
      'Progress charts each key metric over time — carry, swing score, contact, and more.',
      'An upward trend on a positive metric means it’s working. Flat or down tells you where to look.',
      'The metrics shown match your active sport, so you always see what matters for your game.',
      'Charts get more reliable with more sessions — five or more in a category shows a real trend.',
    ],
  },
  {
    id: 'player-arc',
    title: 'Your Player Arc story',
    description: 'Your improvement told as a story, not just charts.',
    audiences: ['athlete', 'parent'],
    category: 'progress',
    duration: '2:00',
    route: '/arc',
    script: [
      'Player Arc stitches your sessions into a narrative of how far you’ve come.',
      'It highlights breakthroughs, plateaus, and what changed around them.',
      'It’s a motivating way to look back — especially for young athletes and the parents cheering them on.',
      'The more you practice and retest, the richer your arc becomes.',
    ],
  },
  {
    id: 'sessions',
    title: 'Your session history',
    description: 'Every practice session, with its data, findings, and scores.',
    audiences: ['athlete', 'coach'],
    category: 'progress',
    duration: '2:00',
    route: '/sessions',
    script: [
      'Every session you log or import lives here, newest first.',
      'Open one to see shot-by-shot data, the issues found, the swing score, and recommended drills.',
      'Add a new session by logging it manually or importing from a launch monitor.',
      'Your session history powers everything: progress, streaks, challenges, and benchmarks.',
    ],
  },
  {
    id: 'retest',
    title: 'Retest to measure improvement',
    description: 'Re-run the same check later to prove a change actually worked.',
    audiences: ['athlete', 'coach'],
    category: 'progress',
    duration: '2:00',
    route: '/retest',
    script: [
      'A retest repeats an earlier check so you can compare apples to apples.',
      'SwingVantage shows the before and after side by side, with what moved.',
      'It’s the honest way to know whether a swing change helped — not just felt good.',
      'Set a retest reminder so you actually circle back at the right time.',
    ],
  },
  {
    id: 'milestones',
    title: 'Milestones & achievements',
    description: 'Markers for the moments that matter in your journey.',
    audiences: ['athlete', 'parent'],
    category: 'progress',
    duration: '1:30',
    route: '/milestones',
    script: [
      'Milestones celebrate real progress — your 10th session, a 7-day streak, a new personal best.',
      'They’re awarded automatically as you train, no setup needed.',
      'They’re a great motivator for kids and a simple way for parents to see effort paying off.',
      'All milestones are saved in your backup, so your history is safe.',
    ],
  },
  {
    id: 'labs',
    title: 'SwingVantage Labs',
    description: 'Early foundations: readiness, a private player model, and more.',
    audiences: ['athlete'],
    category: 'progress',
    duration: '2:00',
    route: '/labs',
    script: [
      'Labs is where new, forward-looking features live — readiness scores, a private player model, skill transfer, and benchmark mirrors.',
      'Some are early v1s, and each is honest about what it does and doesn’t yet know.',
      'They build on your Player Arc and practice history.',
      'Explore them to get a peek at where your SwingVantage is heading.',
    ],
  },
  {
    id: 'compare',
    title: 'Compare & references',
    description: 'Stack your numbers against benchmarks or your own past self.',
    audiences: ['athlete', 'coach'],
    category: 'progress',
    duration: '2:00',
    route: '/compare',
    script: [
      'Compare your metrics to benchmark data, or two of your own sessions side by side.',
      'Session-to-session comparison is perfect for checking whether a change actually helped.',
      'Benchmarks give context — where you stand and what “good” looks like at your level.',
      'Use it to settle the question: did that adjustment move the numbers, or just feel different?',
    ],
  },
  {
    id: 'benchmarks',
    title: 'Benchmarks: how you stack up',
    description: 'Reference numbers by level so you know what to aim for.',
    audiences: ['athlete', 'coach', 'team'],
    category: 'progress',
    duration: '2:00',
    route: '/benchmarks',
    script: [
      'Benchmarks show typical numbers by skill level and sport.',
      'They turn your data into context — not just “my carry is 230,” but how that compares.',
      'Use them to set realistic targets for the next few weeks.',
      'Pair benchmarks with your progress charts to aim at the right next step.',
    ],
  },

  // ── Share & Coach ─────────────────────────────────────────
  {
    id: 'reports',
    title: 'Share & coach reports',
    description: 'Turn sessions into a clean report to share with a coach.',
    audiences: ['athlete', 'coach', 'parent', 'team'],
    category: 'share',
    duration: '2:30',
    route: '/reports',
    script: [
      'Select one or more sessions and generate a report with metrics, issues, trends, and drills.',
      'Download it as a PDF or copy a summary to send to a coach.',
      'It gives whoever helps you the full context of what you’ve been working on.',
      'Reports are a simple bridge between solo practice and real coaching.',
    ],
  },
  {
    id: 'coach-summary',
    title: 'Coaching multiple athletes',
    description: 'For coaches: build per-athlete summaries and track a roster.',
    audiences: ['coach', 'team'],
    category: 'share',
    duration: '2:30',
    route: '/reports',
    script: [
      'As a coach, use reports to build a clear summary for each athlete you work with.',
      'Each summary captures the priorities, the data behind them, and the recommended drills.',
      'Share it before or after a lesson so everyone’s on the same page.',
      'It’s a lightweight way to keep a whole group moving in the same direction.',
    ],
  },
  {
    id: 'parent-summary',
    title: 'A parent’s weekly summary',
    description: 'For parents: a simple read on effort, progress, and what’s next.',
    audiences: ['parent'],
    category: 'share',
    duration: '2:00',
    route: '/dashboard',
    script: [
      'SwingVantage is built for parent-guided youth practice — encouraging and safety-first.',
      'Your dashboard and Player Arc give a simple read on effort and progress, no jargon required.',
      'Focus on the streak and the single “Today’s Fix” — consistency matters more than intensity for young athletes.',
      'Generate a report to share with a coach, or just to celebrate how far your athlete has come.',
    ],
  },

  // ── Profile & Equipment ───────────────────────────────────
  {
    id: 'profile',
    title: 'Your player profile',
    description: 'Tell SwingVantage about you so coaching fits your game.',
    audiences: 'all',
    category: 'account',
    duration: '2:00',
    route: '/profile',
    script: [
      'Your profile tunes every recommendation to you — the more you add, the better the fit.',
      'For golf: handicap, scoring average, typical miss, and skill level.',
      'For tennis, baseball, and softball: position, swing side, level, and gear.',
      'A beginner needs different feedback than an advanced player — your profile is how SwingVantage knows the difference.',
    ],
  },
  {
    id: 'equipment',
    title: 'Your equipment',
    description: 'Add clubs, bats, or rackets for more specific advice.',
    audiences: ['athlete', 'parent'],
    category: 'account',
    duration: '2:00',
    route: '/equipment',
    script: [
      'Add the gear you actually use — clubs, a bat, or a racket and string setup.',
      'For golf, lofts and carry distances let SwingVantage spot gapping issues between clubs.',
      'For bats and rackets, the specs help tailor advice to your equipment.',
      'It all saves to your backup, so you only enter it once.',
    ],
  },

  // ── Community & Motivation ────────────────────────────────
  {
    id: 'community',
    title: 'Community, XP & streaks',
    description: 'Stay motivated with experience points, streaks, and milestones.',
    audiences: ['athlete', 'parent'],
    category: 'community',
    duration: '2:30',
    route: '/community',
    script: [
      'Community turns real training into momentum: XP for sessions, streaks for showing up, badges for progress.',
      'Everything is tied to genuine effort — there are no shortcuts that skip the work.',
      'Your profile is private by default, and you choose what, if anything, to share.',
      'Youth athletes get extra privacy protections automatically.',
    ],
  },
  {
    id: 'badges',
    title: 'Badges & achievements',
    description: 'Earn badges for real milestones — and see what’s next.',
    audiences: ['athlete', 'parent'],
    category: 'community',
    duration: '1:30',
    route: '/community/badges',
    script: [
      'Badges are earned automatically when you hit a goal — first session, week-long streak, a personal best.',
      'They’re grouped by theme: consistency, improvement, sport mastery, even data protection.',
      'Locked badges show a progress bar so you can see what to chase next.',
      'They’re a fun nudge to keep the good habits going.',
    ],
  },
  {
    id: 'challenges',
    title: 'Join a challenge',
    description: 'Short, data-backed goals that keep practice interesting.',
    audiences: ['athlete', 'parent'],
    category: 'community',
    duration: '1:30',
    route: '/community/challenges',
    script: [
      'Challenges are short goals powered by your real sessions — like “5 sessions in 7 days.”',
      'Tap Join and your sessions start counting automatically.',
      'Finishing earns XP and often a badge.',
      'They’re a great way to add a little structure and fun to a practice week.',
    ],
  },
  {
    id: 'leaderboard',
    title: 'Leaderboards — fair & private',
    description: 'Ranked by improvement and consistency, not raw talent.',
    audiences: ['athlete', 'parent'],
    category: 'community',
    duration: '1:30',
    route: '/community/leaderboard',
    script: [
      'Rankings reward improvement and consistency, so beginners and pros can compete fairly.',
      'Your real name is never shown unless you choose to — you appear anonymous by default.',
      'You can opt out of leaderboards entirely in privacy settings.',
      'Youth athletes are never ranked against adults.',
    ],
  },
  {
    id: 'groups',
    title: 'Groups & clubs',
    description: 'Train alongside others who share your sport and goals.',
    audiences: ['team', 'coach'],
    category: 'community',
    duration: '2:00',
    route: '/community/groups',
    script: [
      'Join a group to train alongside athletes who share your sport.',
      'Public groups you can join instantly; private ones need an invite.',
      'Many groups run their own challenges with exclusive badges.',
      'For coaches and programs, groups are a simple home base for a roster.',
    ],
  },

  // ── Your Data & Settings ──────────────────────────────────
  {
    id: 'data-center',
    title: 'Back up & protect your data',
    description: 'Keep your progress safe and move it between devices.',
    audiences: 'all',
    category: 'data',
    duration: '2:30',
    route: '/data',
    script: [
      'SwingVantage saves your data in your browser — so a backup keeps it safe if you switch devices or clear history.',
      'Tap Download Backup to save a complete copy: sessions, profiles, equipment, progress, and badges.',
      'You can password-protect the file. Keep that password safe — without it, an encrypted backup can’t be recovered.',
      'To restore, upload the file and preview what comes back. Use Merge to add without deleting, or Replace for a full reset.',
    ],
  },
  {
    id: 'settings',
    title: 'Settings: language, units & tone',
    description: 'Make SwingVantage yours — language, units, coaching style, privacy.',
    audiences: 'all',
    category: 'data',
    duration: '2:00',
    route: '/settings',
    script: [
      'Switch between 20 languages — the whole app updates instantly.',
      'Choose yards/feet or meters for every distance.',
      'Pick a coaching style: detailed, concise, encouraging, or balanced.',
      'Set privacy controls for what (if anything) the community can see. Your preferences travel in your backup.',
    ],
  },
];

// ── Persona tracks: the right tutorial for each kind of user ──

export const TUTORIAL_TRACKS: Record<TutorialAudience, TutorialTrack> = {
  athlete: {
    audience: 'athlete',
    label: AUDIENCES.athlete.label,
    blurb: 'The full path: set up, analyze, practice with purpose, and track real improvement.',
    emoji: AUDIENCES.athlete.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'dashboard',
      'switch-sport',
      'video-analysis',
      'diagnose',
      'ai-coach',
      'training',
      'fix-stack',
      'drills',
      'progress',
      'player-arc',
      'retest',
      'community',
      'data-center',
    ],
  },
  parent: {
    audience: 'parent',
    label: AUDIENCES.parent.label,
    blurb: 'Help a young athlete the encouraging, safety-first way — and actually see progress.',
    emoji: AUDIENCES.parent.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'switch-sport',
      'dashboard',
      'fix-stack',
      'training',
      'drills',
      'parent-summary',
      'player-arc',
      'milestones',
      'community',
      'data-center',
    ],
  },
  coach: {
    audience: 'coach',
    label: AUDIENCES.coach.label,
    blurb: 'Analyze athletes, build plans, and turn sessions into shareable coaching summaries.',
    emoji: AUDIENCES.coach.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'dashboard',
      'video-analysis',
      'diagnose',
      'import-data',
      'motion-lab',
      'training',
      'drills',
      'sessions',
      'retest',
      'compare',
      'reports',
      'coach-summary',
      'data-center',
    ],
  },
  team: {
    audience: 'team',
    label: AUDIENCES.team.label,
    blurb: 'See how SwingVantage works for a group: shared reports, groups, and benchmarks.',
    emoji: AUDIENCES.team.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'dashboard',
      'reports',
      'coach-summary',
      'groups',
      'benchmarks',
      'data-center',
    ],
  },
};

export const AUDIENCE_ORDER: TutorialAudience[] = ['athlete', 'parent', 'coach', 'team'];

// ── Helpers ───────────────────────────────────────────────

const VIDEO_BY_ID: Record<string, TutorialVideo> = Object.fromEntries(
  TUTORIAL_VIDEOS.map((v) => [v.id, v]),
);

/** Look up a single video by id. */
export function getVideoById(id: string): TutorialVideo | undefined {
  return VIDEO_BY_ID[id];
}

/** Resolve a track's ordered ids into full video objects (skips any unknown id). */
export function getTrackVideos(audience: TutorialAudience): TutorialVideo[] {
  return TUTORIAL_TRACKS[audience].videoIds
    .map((id) => VIDEO_BY_ID[id])
    .filter((v): v is TutorialVideo => Boolean(v));
}

/** True if a video is relevant to the given audience (or is for everyone). */
export function videoMatchesAudience(video: TutorialVideo, audience: TutorialAudience): boolean {
  return video.audiences === 'all' || video.audiences.includes(audience);
}

/** Every video, in display order, grouped by category. */
export function getVideosByCategory(): Array<{ category: TutorialCategory; videos: TutorialVideo[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    videos: TUTORIAL_VIDEOS.filter((v) => v.category === category),
  })).filter((group) => group.videos.length > 0);
}

/** Total runtime label for a list of videos, e.g. "~24 min". */
export function totalDurationLabel(videos: TutorialVideo[]): string {
  let seconds = 0;
  for (const v of videos) {
    const [m, s] = v.duration.split(':').map((n) => parseInt(n, 10));
    if (!Number.isNaN(m)) seconds += m * 60 + (Number.isNaN(s) ? 0 : s);
  }
  const mins = Math.max(1, Math.round(seconds / 60));
  return `~${mins} min`;
}

/**
 * Classify a video URL so the player knows how to render it.
 * Returns null when there is no recording yet.
 */
export function getVideoSourceKind(url?: string): 'youtube' | 'vimeo' | 'file' | null {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'file';
}

/**
 * Ordered <source> list for the inline player. Mobile-specific source is
 * listed first (behind a max-width media query), then WebM, then MP4 — the
 * browser picks the first it can play. Falls back to a direct-file `videoUrl`
 * when no explicit mp4/webm is set. Returns [] when nothing is inline-playable
 * (e.g. only a YouTube/Vimeo link, or no recording yet).
 */
export function getInlineSources(video: TutorialVideo): InlineVideoSource[] {
  const sources: InlineVideoSource[] = [];
  if (video.mobileSrc) {
    sources.push({ src: video.mobileSrc, type: 'video/mp4', media: '(max-width: 640px)' });
  }
  if (video.webmSrc) {
    sources.push({ src: video.webmSrc, type: 'video/webm' });
  }
  if (video.mp4Src) {
    sources.push({ src: video.mp4Src, type: 'video/mp4' });
  }
  // Back-compat: a direct .mp4/.webm in `videoUrl` (not YouTube/Vimeo) plays inline too.
  if (sources.length === 0 && getVideoSourceKind(video.videoUrl) === 'file') {
    const url = video.videoUrl as string;
    sources.push({ src: url, type: /\.webm($|\?)/i.test(url) ? 'video/webm' : 'video/mp4' });
  }
  return sources;
}

/** True once a video has any playable recording (inline file or YouTube/Vimeo link). */
export function hasRecording(video: TutorialVideo): boolean {
  return getInlineSources(video).length > 0 || Boolean(getVideoSourceKind(video.videoUrl));
}

/** Convert a YouTube/Vimeo URL to its embeddable form. Files pass through. */
export function toEmbedUrl(url: string): string {
  const kind = getVideoSourceKind(url);
  if (kind === 'youtube') {
    // Handle youtu.be/ID and youtube.com/watch?v=ID
    const short = url.match(/youtu\.be\/([\w-]+)/i);
    const long = url.match(/[?&]v=([\w-]+)/i);
    const embed = url.match(/youtube\.com\/embed\/([\w-]+)/i);
    const id = short?.[1] ?? long?.[1] ?? embed?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (kind === 'vimeo') {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }
  return url;
}
