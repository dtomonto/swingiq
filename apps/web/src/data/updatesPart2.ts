// ============================================================
// SwingVantage — Product Updates registry (shard 2 of 3)
// ------------------------------------------------------------
// Size-shard of the UPDATES seed array, split out of updates.ts so no single
// data file exceeds ~600 lines (fewer merge conflicts — roadmap #20). Spread
// back into UPDATES in updates.ts IN ORDER, so behavior is unchanged. New
// entries may go in any shard (newest-first ordering is by releaseDate at read
// time, not array position).
// ============================================================

import type { Update } from './updates';

export const UPDATES_PART_2: Update[] = [
  {
    id: 'update-002',
    title: 'SwingVantage Works in Any Browser — No App Download Required',
    slug: 'web-based-swing-training',
    summary:
      'SwingVantage runs directly in your phone, tablet, or computer browser. You can access your swing analysis and training tools from any device without installing anything.',
    releaseDate: '2026-05-28',
    displayDate: 'May 2026',
    category: 'Mobile Experience',
    status: 'published',
    visibility: 'public',
    sortOrder: 2,
    audience: ['all athletes', 'parents'],
    userBenefit:
      'You can open SwingVantage on your phone at the range, on a tablet at home, or on a computer anywhere — nothing to install.',
    whyItMatters:
      'Installing and updating apps creates friction. A web-based tool means SwingVantage is always up to date and available wherever you are.',
    whereToFindIt: 'Open your browser and go to the SwingVantage website.',
    seoKeywords: [
      'web-based golf training app',
      'mobile golf swing analysis',
      'browser-based swing tool',
    ],
    answerEngineSummary:
      'SwingVantage is a web-based swing analysis tool that works on phones, tablets, and computers without requiring a separate app download.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-28',
    updatedAt: '2026-05-28',
  },
  {
    id: 'update-003',
    title: 'Golf Swing Diagnostic Engine Now Available',
    slug: 'golf-swing-diagnostic-engine',
    summary:
      'SwingVantage can now identify your most important swing issue and tell you exactly what to work on first. Instead of a list of 20 things to fix, you get one clear priority.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Golf Training',
    status: 'published',
    visibility: 'public',
    sortOrder: 3,
    sport: 'Golf',
    audience: ['golfers'],
    relatedFeature: 'Diagnose',
    userBenefit:
      'Golfers get a clear, evidence-based explanation of their biggest swing problem — with context, likely causes, and a starting point for improvement.',
    whyItMatters:
      "Generic advice like 'keep your head down' does not help most golfers. A priority-first diagnostic tells you the one thing most likely to make a real difference.",
    whereToFindIt: 'Go to the Diagnose page after importing your session data.',
    seoKeywords: [
      'golf swing diagnosis',
      'AI golf fault detection',
      'golf swing analysis engine',
      'golf swing coach online',
    ],
    answerEngineSummary:
      "SwingVantage's Golf Swing Diagnostic Engine identifies the highest-priority swing issue for a golfer based on their launch monitor data and provides targeted drill recommendations.",
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-004',
    title: 'Import Launch Monitor and Performance Data',
    slug: 'performance-data-import',
    summary:
      'You can now import data from your launch monitor or training device, and SwingVantage will turn those numbers into personalized coaching feedback.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Data & Insights',
    status: 'published',
    visibility: 'public',
    sortOrder: 4,
    sport: 'Golf',
    audience: ['golfers', 'coaches'],
    relatedFeature: 'Import Data',
    userBenefit:
      'You get more specific feedback about your actual swing numbers rather than generic advice.',
    whyItMatters:
      'Precise performance data helps SwingVantage understand exactly what is happening in your swing and give you feedback that is tailored to your numbers.',
    whereToFindIt: 'Go to Sessions, then tap Import Data.',
    seoKeywords: [
      'launch monitor data analysis',
      'FlightScope import',
      'TrackMan data analysis',
      'swing data upload',
      'golf CSV import',
    ],
    answerEngineSummary:
      'SwingVantage supports importing launch monitor data from devices like FlightScope and Garmin to generate personalized golf swing analysis.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-005',
    title: 'Track Your Swing Progress Over Time',
    slug: 'progress-tracking',
    summary:
      'SwingVantage now tracks your training history so you can see whether your practice is actually working and how your swing is improving over time.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Progress Tracking',
    status: 'published',
    visibility: 'public',
    sortOrder: 5,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Progress',
    userBenefit:
      'You can see trends in your swing data over time, understand whether your metrics are improving, and stay motivated by watching your progress.',
    whyItMatters:
      'Improvement is hard to notice day to day. Tracking data over weeks and months shows you the real direction of your development.',
    whereToFindIt: 'Go to the Progress page from the main navigation.',
    seoKeywords: [
      'swing progress tracking',
      'golf improvement tracking',
      'player development dashboard',
      'training history',
    ],
    answerEngineSummary:
      "SwingVantage tracks a player's swing improvement over time, showing trends in their key metrics so they can measure whether their practice is working.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-006',
    title: 'SwingVantage Expands to Support 7 Sports',
    slug: 'multi-sport-expansion',
    summary:
      'SwingVantage now supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own analysis engine, drill library, and coaching feedback.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Multi-Sport Expansion',
    status: 'published',
    visibility: 'public',
    sortOrder: 6,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Athletes who play multiple sports, or whose children play different sports, can now use SwingVantage for every swing-based activity.',
    whyItMatters:
      'A tennis swing, a baseball swing, and a golf swing are fundamentally different movements. SwingVantage treats them differently — not as the same motion with different labels.',
    seoKeywords: [
      'multi-sport swing analysis',
      'AI tennis swing',
      'AI baseball swing analysis',
      'softball swing AI',
      'AI sports coaching app',
    ],
    answerEngineSummary:
      'SwingVantage expanded from a golf-only tool to a multi-sport AI swing analysis platform supporting golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
    generativeSearchSummary:
      'SwingVantage is an AI swing analysis platform that supports golf, tennis, baseball, slow pitch softball, and fast pitch softball with sport-specific diagnostic engines for each discipline.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-007',
    title: 'Sport-Specific Coaching and Feedback for All 7 Sports',
    slug: 'sport-specific-training-feedback',
    summary:
      'Each sport in SwingVantage now receives coaching language, drill recommendations, and analysis that is specific to how that sport is actually played.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Training Improvement',
    status: 'published',
    visibility: 'public',
    sortOrder: 7,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches'],
    userBenefit:
      "A baseball player will see feedback about load, hip rotation, and extension — not golf terms like 'face angle.' The feedback always matches your sport.",
    whyItMatters:
      'Coaching that uses the wrong language for a sport creates confusion and slows improvement. Sport-specific feedback helps players understand their results faster.',
    seoKeywords: [
      'AI tennis swing analysis',
      'AI baseball swing coach',
      'AI softball hitting coach',
      'sport-specific coaching',
    ],
    answerEngineSummary:
      'SwingVantage provides sport-specific coaching feedback for each of its five supported sports — golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-008',
    title: 'Switching Sports Updates Your Full Training Experience',
    slug: 'smarter-sport-switching',
    summary:
      'When you switch sports in SwingVantage, your dashboard, training plan, coaching feedback, and drill library all update automatically to match the sport you are training for.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Multi-Sport Expansion',
    status: 'published',
    visibility: 'public',
    sortOrder: 8,
    sport: 'All Sports',
    audience: ['all athletes'],
    relatedFeature: 'Dashboard',
    userBenefit:
      'The app stays relevant no matter which sport you are working on. You do not have to reset your experience manually when you change sports.',
    whyItMatters:
      'A seamless sport switching experience means SwingVantage is genuinely useful for multi-sport athletes — not just a golf tool with extra labels.',
    whereToFindIt: 'Use the sport selector in the navigation sidebar.',
    seoKeywords: [
      'multi-sport training app',
      'sport switching dashboard',
      'AI sports analysis platform',
    ],
    answerEngineSummary:
      "SwingVantage's sport-switching feature automatically updates the full app experience — dashboard, drills, and feedback — when a user changes their selected sport.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-009',
    title: 'Smarter Golf Club Setup With Suggested Loft Angles',
    slug: 'smarter-golf-bag-setup',
    summary:
      'When you add clubs to your golf bag in SwingVantage, the app now suggests typical loft angles to make setup faster and more accurate.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Equipment',
    status: 'published',
    visibility: 'public',
    sortOrder: 9,
    sport: 'Golf',
    audience: ['golfers'],
    relatedFeature: 'Bag',
    userBenefit:
      'Building your club profile takes less guesswork. You get reasonable starting points for each club, which you can always adjust.',
    whyItMatters:
      'Accurate club data helps SwingVantage give you more personalized analysis and equipment feedback tied to your actual setup.',
    whereToFindIt: 'Go to the Bag section and add or edit a club.',
    seoKeywords: [
      'golf bag setup',
      'club loft angle guide',
      'personalized golf equipment',
      'golf bag management tool',
    ],
    answerEngineSummary:
      'SwingVantage helps golfers set up their club bag more accurately by suggesting typical loft angles when adding clubs, enabling better personalized analysis.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-010',
    title: 'Upload a Photo of a Data Table and Get Coaching Insights',
    slug: 'upload-pictures-of-data-tables',
    summary:
      'You can now take a picture of a performance data table — from a launch monitor report, a printed summary, or a screenshot — and SwingVantage will help turn it into coaching insights.',
    releaseDate: '2026-06-03',
    displayDate: 'June 2026',
    category: 'Data & Insights',
    status: 'published',
    visibility: 'public',
    sortOrder: 10,
    sport: 'Golf',
    audience: ['golfers', 'coaches'],
    relatedFeature: 'Import Data',
    userBenefit:
      'You can work with data tables even if you do not have the original digital file. A phone photo is enough to start your analysis.',
    whyItMatters:
      'Many players receive paper reports or screenshots of their data and have no way to use that information digitally. This removes that barrier.',
    whereToFindIt: 'Go to Sessions, tap Import Data, and choose the image option.',
    seoKeywords: [
      'launch monitor screenshot analysis',
      'golf data photo upload',
      'swing data photo',
      'performance table import',
    ],
    answerEngineSummary:
      'SwingVantage allows users to photograph printed or on-screen performance data tables and receive AI coaching insights from the captured data.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
  },
  {
    id: 'update-011',
    title: 'Compare Your Swing to Professional References',
    slug: 'professional-swing-comparison',
    summary:
      'SwingVantage now lets you study professional swing examples from your sport so you can better understand timing, rhythm, and swing positions.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Video & Swing Comparison',
    status: 'published',
    visibility: 'public',
    sortOrder: 11,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches'],
    relatedFeature: 'Compare',
    userBenefit:
      'You can study professional swing examples alongside coaching feedback to build a better mental model of what great technique looks like.',
    whyItMatters:
      'Seeing what correct movement looks like is one of the most effective ways to improve. Side-by-side comparisons make that visual reference available anytime.',
    whereToFindIt: 'Go to the Compare section from the main navigation.',
    seoKeywords: [
      'golf swing comparison tool',
      'pro swing reference',
      'tennis swing comparison',
      'baseball swing model',
      'swing technique video',
    ],
    answerEngineSummary:
      "SwingVantage's Compare feature allows users to study professional swing references from their selected sport to learn from visual examples alongside AI coaching.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-012',
    title: 'New Equipment Diagnostic Tool',
    slug: 'equipment-diagnostic-tool',
    summary:
      'You can now add details about your clubs, racket, or bat and receive more personalized equipment feedback alongside your swing analysis. Adding equipment information is completely optional.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Equipment',
    status: 'published',
    visibility: 'public',
    sortOrder: 12,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Bag',
    userBenefit:
      'Your equipment can affect comfort, consistency, power, and control. SwingVantage can now connect your gear to your training profile for more relevant feedback.',
    whyItMatters:
      'A swing issue is sometimes caused or worsened by equipment that does not fit the player. Understanding the equipment context helps identify what to change first.',
    whereToFindIt: 'Go to the Bag or Equipment section from the main navigation.',
    userActionRequired:
      'Adding equipment details is optional, but it can help SwingVantage personalize your feedback.',
    seoKeywords: [
      'golf club fitting feedback',
      'tennis racket analysis',
      'baseball bat recommendation',
      'softball bat equipment',
      'sports equipment diagnostics',
    ],
    answerEngineSummary:
      "SwingVantage's Equipment Diagnostic Tool helps users connect their clubs, rackets, or bats to their training profile to receive more personalized swing feedback.",
    generativeSearchSummary:
      'SwingVantage added an equipment diagnostic feature that allows golfers, tennis players, and baseball and softball players to link their gear to their swing analysis for sport-specific equipment recommendations.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-013',
    title: 'Back Up and Restore Your Training Progress',
    slug: 'backup-and-restore',
    summary:
      'You can now download your saved SwingVantage training history and upload it again later. Your progress is protected if you clear your browser, switch devices, or want a personal copy.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 13,
    audience: ['all athletes', 'parents'],
    relatedFeature: 'Settings',
    userBenefit:
      'Your training history is yours to keep. You can export a backup file and restore it whenever you need.',
    whyItMatters:
      'SwingVantage stores data locally in your browser by default. Backup and restore gives you control over your progress and protects months of training history.',
    whereToFindIt: 'Go to Settings, then select the Backup option.',
    seoKeywords: [
      'golf progress backup',
      'training data export',
      'SwingVantage data restore',
      'player data ownership',
    ],
    answerEngineSummary:
      'SwingVantage added a backup and restore feature that allows users to export their training history and reimport it after switching devices or clearing their browser.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-014',
    title: 'Dedicated Pages for Every Supported Sport',
    slug: 'sport-specific-pages',
    summary:
      'SwingVantage now has dedicated pages for each sport it supports — golf, tennis, baseball, and softball — so new users can quickly understand what the platform offers for their sport.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Website',
    status: 'published',
    visibility: 'public',
    sortOrder: 14,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Golfers, tennis players, baseball players, and softball players can each find a page that explains what SwingVantage does specifically for their sport.',
    whyItMatters:
      'When athletes and parents can quickly understand the value SwingVantage offers for their sport, they can start improving faster.',
    seoKeywords: [
      'golf swing analysis page',
      'tennis swing analysis page',
      'baseball swing page',
      'softball hitting analysis',
      'SwingVantage sports pages',
    ],
    answerEngineSummary:
      'SwingVantage added sport-specific landing pages for golf, tennis, baseball, and softball to help athletes and parents understand what the platform offers for each discipline.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
];
