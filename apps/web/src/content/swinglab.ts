// ============================================================
// SwingVantage — SwingLab 2.0 content model
// ------------------------------------------------------------
// Single source of truth for the SwingLab 2.0 vision: the future
// first-person performance lab where every SwingVantage tool becomes
// part of one connected training environment.
//
// This file is intentionally PURE DATA (no React, no icons) so the
// same model can power the current landing page AND any future
// interactive lab map or first-person 3D build. Components resolve
// icons/accents from the string keys below.
//
// HONESTY RULE: SwingLab 2.0 (the immersive environment) is in
// development. The *tools* that will power each station are largely
// available today — each station records its real, live destination
// in `liveHref`. We never imply the 3D lab is live now.
// ============================================================

/** Visual accent key — resolved to concrete classes in StationCard. */
export type StationAccent =
  | 'emerald'
  | 'cyan'
  | 'violet'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'teal'
  | 'indigo'
  | 'lime'
  | 'orange';

/** Icon key — resolved to a lucide icon in StationCard. */
export type StationIcon =
  | 'atrium'
  | 'motion'
  | 'coach'
  | 'profile'
  | 'training'
  | 'film'
  | 'equipment'
  | 'recruiting'
  | 'recovery'
  | 'academy';

export interface LabStation {
  /** Stable id (also used as the in-page anchor / future room id). */
  id: string;
  /** Display name of the future lab space. */
  name: string;
  /**
   * One-line system role from the product model — what this space *is*
   * inside the connected lab (e.g. "The diagnostic engine").
   */
  systemRole: string;
  /** What the space does, in one or two plain sentences. */
  blurb: string;
  /** What users will eventually be able to do here (future functions). */
  functions: string[];
  /** Existing SwingVantage features this station unifies. */
  connects: string[];
  icon: StationIcon;
  accent: StationAccent;
  /**
   * The real, available-today destination that powers this station, when
   * one exists. The immersive station is planned; the tool is live now.
   */
  liveHref?: string;
  /** Short label for the live link, e.g. "Open swing analysis". */
  liveLabel?: string;
}

/**
 * The ten future spaces of SwingLab 2.0, in walk-through order.
 * Order doubles as the lab "floor plan" used by the LabMap.
 */
export const LAB_STATIONS: LabStation[] = [
  {
    id: 'entry-atrium',
    name: 'Entry Atrium',
    systemRole: 'The interface',
    blurb:
      'The first space you step into. It greets you by sport, surfaces your recent activity, and points you to the single most useful next move.',
    functions: [
      'Resume your last session',
      'Choose or switch sport',
      'See your AI-recommended next action',
      'Jump straight to the right station',
    ],
    connects: ['Dashboard', 'Next Best Action', 'Sport selector', 'First-Swing Journey'],
    icon: 'atrium',
    accent: 'emerald',
    liveHref: '/dashboard',
    liveLabel: 'Open your dashboard',
  },
  {
    id: 'motion-capture-studio',
    name: 'Motion Capture Studio',
    systemRole: 'The diagnostic engine',
    blurb:
      'Where a swing becomes data. Upload or record a clip and see your motion broken into phases, with the one fault that matters most clearly called out.',
    functions: [
      'Upload or record a swing',
      'Phase-by-phase breakdown',
      'A rotatable 3D motion model',
      'Compare against earlier swings',
    ],
    connects: ['Swing video analysis', 'Motion Lab (3D)', 'AI visual analysis', 'Launch-monitor import'],
    icon: 'motion',
    accent: 'cyan',
    liveHref: '/video',
    liveLabel: 'Analyze a swing',
  },
  {
    id: 'ai-coach-console',
    name: 'AI Coach Console',
    systemRole: 'The brain',
    blurb:
      'The coaching intelligence at the center of the lab. Ask questions in plain language and get fixes grounded in your own data — not generic tips.',
    functions: [
      'Ask the AI coach anything',
      'Get personalized swing fixes',
      'Generate a practice plan on demand',
      'See your highest-impact weakness',
    ],
    connects: ['AI Coach', 'Athlete General Intelligence', 'Fix Stack', 'Next Best Action'],
    icon: 'coach',
    accent: 'violet',
    liveHref: '/ai-coach',
    liveLabel: 'Talk to the AI coach',
  },
  {
    id: 'player-profile-wall',
    name: 'Player Profile Wall',
    systemRole: 'The memory',
    blurb:
      'A living portrait of you as an athlete. Your sport, level, strengths, goals, and the story of your progress — all in one place the rest of the lab reads from.',
    functions: [
      'Sport profile and skill level',
      'Strengths, weaknesses, and goals',
      'Injury-aware considerations',
      'Your progress timeline',
    ],
    connects: ['Player profile', 'Athletic Journey', 'Progress & milestones', 'Player Arc'],
    icon: 'profile',
    accent: 'sky',
    liveHref: '/profile',
    liveLabel: 'View your profile',
  },
  {
    id: 'training-plan-lab',
    name: 'Training Plan Lab',
    systemRole: 'The prescription',
    blurb:
      'Where analysis turns into a plan you can actually run. Drills matched to your fault, your level, and the gear you have — sequenced into a week you can follow.',
    functions: [
      'Daily and weekly plans',
      'Drills matched to your fault',
      'Beginner-to-advanced progression',
      'Practice tracking',
    ],
    connects: ['Training routines', 'DrillMatch', 'Drill library', 'Practice scheduler', 'Pre-round warm-up'],
    icon: 'training',
    accent: 'amber',
    liveHref: '/training',
    liveLabel: 'Build a training plan',
  },
  {
    id: 'film-room',
    name: 'Film Room',
    systemRole: 'The proof',
    blurb:
      'A media wall for your game film. Review clips, line up before-and-after, and watch short walkthroughs that show you exactly what to look for.',
    functions: [
      'Your swing history',
      'Side-by-side before/after',
      'Tagged clips and lesson packs',
      'AI-generated tutorials',
    ],
    connects: ['Video Library', 'Swing comparison', 'Retest proof', 'Video Studio'],
    icon: 'film',
    accent: 'rose',
    liveHref: '/library',
    liveLabel: 'Open the film library',
  },
  {
    id: 'equipment-bay',
    name: 'Equipment Bay',
    systemRole: 'The optimization layer',
    blurb:
      'Where your gear gets dialed in. Fit and gapping logic that reads your swing profile so your equipment stops holding you back.',
    functions: [
      'Club, bat, and paddle mapping',
      'Loft gapping and fit checks',
      'String and tension guidance',
      'Gear matched to your swing profile',
    ],
    connects: ['Equipment diagnostics', 'Golf bag manager', 'Loft gapping', 'Racket & paddle setup'],
    icon: 'equipment',
    accent: 'teal',
    liveHref: '/equipment',
    liveLabel: 'Open the equipment bay',
  },
  {
    id: 'recruiting-studio',
    name: 'Recruiting Studio',
    systemRole: 'The external showcase',
    blurb:
      'Where your work becomes something you can share. Build a verified, coach-ready profile and highlight reel — honest by design, with every claim sourced.',
    functions: [
      'Verified player showcase profile',
      'Highlight reel builder',
      'Shareable coach-view link',
      'Downloadable recruiting packet',
    ],
    connects: ['Recruiting profile', 'Highlight reels', 'Coach outreach', 'Public player page'],
    icon: 'recruiting',
    accent: 'indigo',
    liveHref: '/recruiting',
    liveLabel: 'Open the recruiting studio',
  },
  {
    id: 'recovery-readiness-dock',
    name: 'Recovery & Readiness Dock',
    systemRole: 'The human-performance layer',
    blurb:
      'Where the rest of your body enters the picture. A daily readiness read that scales how hard to train today and flags when to back off.',
    functions: [
      'Daily readiness score',
      'Training-load monitoring',
      'Recovery and mobility prep',
      'Injury-aware training adjustments',
    ],
    connects: ['BodySync', 'Readiness scoring', 'Health-aware coaching', 'Wearable connectors'],
    icon: 'recovery',
    accent: 'lime',
    liveHref: '/bodysync',
    liveLabel: 'Open BodySync',
  },
  {
    id: 'learning-academy-wing',
    name: 'Learning Academy Wing',
    systemRole: 'The onboarding engine',
    blurb:
      'A guided wing for learning the lab itself. Short, role-specific walkthroughs and courses so players, parents, and coaches each learn what matters to them.',
    functions: [
      'Feature tutorials',
      'Sport-specific courses',
      'Player, parent, and coach tracks',
      '“How to use this tool” guides',
    ],
    connects: ['Tutorial Center', 'Video Library', 'Guided onboarding', 'Help system'],
    icon: 'academy',
    accent: 'orange',
    liveHref: '/tutorial',
    liveLabel: 'Open the tutorial center',
  },
];

/** How the future lab experience will flow, end to end. */
export interface LabFlowStep {
  title: string;
  detail: string;
}

export const LAB_FLOW: LabFlowStep[] = [
  { title: 'Enter the lab', detail: 'Step in and the Atrium greets you with your sport and your next best move.' },
  { title: 'Choose your sport', detail: 'Golf, tennis, pickleball, padel, baseball, or softball — the lab reshapes around it.' },
  { title: 'Capture your swing', detail: 'Upload or record a clip in the Motion Capture Studio.' },
  { title: 'Let the AI read it', detail: 'Mechanics, movement, and patterns become a clear, ranked diagnosis.' },
  { title: 'Visit the right station', detail: 'The lab routes you to the space that fixes what matters most.' },
  { title: 'Get your plan', detail: 'Walk out with drills, a practice schedule, and proof to retest against.' },
  { title: 'Return as your command center', detail: 'Come back and the lab remembers everything — your personal performance HQ.' },
];

/** Why SwingLab 2.0 matters — the user and product value. */
export interface ValueProp {
  title: string;
  detail: string;
}

export const LAB_VALUE: ValueProp[] = [
  {
    title: 'One place, not ten tabs',
    detail: 'Scattered tools, dashboards, and pages become a single connected environment you actually want to walk into.',
  },
  {
    title: 'Always know your next move',
    detail: 'The lab turns “what do I even work on?” into a clear, guided path — every visit points to the highest-impact next step.',
  },
  {
    title: 'Analysis becomes action',
    detail: 'A diagnosis doesn’t sit in a report. It hands you off to the exact station — drills, plan, gear — that does something about it.',
  },
  {
    title: 'Training that sticks',
    detail: 'A space you return to builds habit. Progress, proof, and milestones make improvement visible and motivating.',
  },
  {
    title: 'A genuinely different product',
    detail: 'Most AI tools hand you a verdict and walk away. SwingLab 2.0 is a guided performance environment — not another analyzer.',
  },
  {
    title: 'Built for seven sports',
    detail: 'The lab is sport-agnostic at the top level, with dedicated zones, metrics, and coaching for each sport you play.',
  },
];

export type PhaseStatus = 'current' | 'preview' | 'next' | 'planned';

export interface RoadmapPhase {
  label: string;       // "Phase 1"
  name: string;        // "Concept Lab"
  status: PhaseStatus;
  detail: string;
}

export const LAB_ROADMAP: RoadmapPhase[] = [
  {
    label: 'Phase 1',
    name: 'Concept Lab',
    status: 'current',
    detail: 'This page. The vision, the station model, and the framework that organizes every SwingVantage tool into one environment.',
  },
  {
    label: 'Phase 2',
    name: 'Interactive Lab Map',
    status: 'preview',
    detail: 'In preview: a clickable isometric floor plan that recommends your next station and shows what each one is doing for you.',
  },
  {
    label: 'Phase 3',
    name: 'Guided Lab Experience',
    status: 'preview',
    detail: 'In preview: a guided path that reads your sport, swings, and profile and walks you through the loop — the lab leads, you follow.',
  },
  {
    label: 'Phase 4',
    name: 'First-Person Lab',
    status: 'preview',
    detail: 'In preview: a first-person “walk the lab” mode, room by room. A full walk-around 3D world is the next upgrade.',
  },
  {
    label: 'Phase 5',
    name: 'Connected Performance Ecosystem',
    status: 'preview',
    detail: 'In preview: a Systems view that shows the live data flow between stations — video, coaching, training, equipment and more as one system.',
  },
];

/** Sports the lab is designed around (top-level sport-agnostic, per-sport zones). */
export const LAB_SPORTS = [
  'Golf',
  'Tennis',
  'Pickleball',
  'Padel',
  'Baseball',
  'Slow-Pitch Softball',
  'Fast-Pitch Softball',
] as const;

/** Centralized copy so the page and future surfaces stay consistent. */
export const SWINGLAB_COPY = {
  name: 'SwingLab 2.0',
  status: 'In Development',
  phaseTag: 'Phase 1 · Concept Lab',
  heroTitle: 'Step inside the future of swing training',
  heroSubtitle:
    'SwingLab 2.0 is the next evolution of SwingVantage: an immersive first-person performance lab where swing analysis, AI coaching, training plans, film review, equipment, and player development come together in one connected environment.',
  conceptLead:
    'Instead of jumping between disconnected tools, SwingLab 2.0 is being designed as a virtual sports performance facility. Each area of the lab is one part of the athlete journey — analyze, understand, train, review, and progress — and they finally talk to each other.',
  metaTitle: 'SwingLab 2.0 — The Future First-Person Performance Lab',
  metaDescription:
    'SwingLab 2.0 is an immersive first-person performance lab in development at SwingVantage — where swing analysis, AI coaching, training plans, film review, equipment, recruiting, and recovery become one connected environment across golf, tennis, pickleball, padel, baseball, and softball.',
} as const;
