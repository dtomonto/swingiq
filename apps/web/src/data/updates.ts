// ── Update Types ──────────────────────────────────────────────────────────

export type UpdateStatus =
  | 'published'
  | 'draft'
  | 'hidden'
  | 'planned'
  | 'in_progress'
  | 'beta'
  | 'coming_soon';

export type UpdateCategory =
  | 'New Feature'
  | 'Training Improvement'
  | 'Equipment'
  | 'Data & Insights'
  | 'Multi-Sport Expansion'
  | 'Golf Training'
  | 'Tennis Training'
  | 'Baseball Training'
  | 'Softball Training'
  | 'Video & Swing Comparison'
  | 'Progress Tracking'
  | 'Account & Data'
  | 'Mobile Experience'
  | 'Website'
  | 'SEO & Discoverability'
  | 'Security & Privacy'
  | 'Product Updates';

export type UpdateSport =
  | 'All Sports'
  | 'Golf'
  | 'Tennis'
  | 'Baseball'
  | 'Slow Pitch Softball'
  | 'Fast Pitch Softball';

export type UpdateVisibility = 'public' | 'private' | 'internal';

export interface Update {
  id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  summary: string;
  releaseDate: string;
  displayDate: string;
  category: UpdateCategory;
  status: UpdateStatus;
  audience?: string[];
  sport?: UpdateSport;
  relatedFeature?: string;
  userBenefit: string;
  whyItMatters: string;
  whereToFindIt?: string;
  userActionRequired?: string;
  seoKeywords?: string[];
  answerEngineSummary?: string;
  generativeSearchSummary?: string;
  internalLinkTargets?: string[];
  visibility: UpdateVisibility;
  sortOrder: number;
  isFeatured?: boolean;
  isMajorMilestone?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Auto-generated entries (populated by scripts/generate-updates.mjs) ───
import autoUpdatesJson from './auto-updates.json';
const AUTO_UPDATES = autoUpdatesJson as unknown as Update[];

// ── Visibility logic ──────────────────────────────────────────────────────

export function isPublicUpdate(update: Update): boolean {
  if (update.visibility === 'private' || update.visibility === 'internal') return false;
  if (update.status === 'draft' || update.status === 'hidden') return false;
  if (update.status === 'published') return true;
  // beta, planned, in_progress, coming_soon require explicit public visibility
  return update.visibility === 'public';
}

function allUpdates(): Update[] {
  return [...UPDATES, ...AUTO_UPDATES];
}

export function getPublicUpdates(): Update[] {
  return allUpdates().filter(isPublicUpdate).sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
  );
}

export function getFeaturedUpdate(): Update | undefined {
  const pub = getPublicUpdates();
  return pub.find((u) => u.isFeatured) ?? pub[0];
}

export function getMilestones(): Update[] {
  return allUpdates().filter((u) => isPublicUpdate(u) && u.isMajorMilestone).sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
  );
}

// ── Plain-English update template ────────────────────────────────────────
//
// Use this as your starting point when writing a new update.
// See docs/HOW_TO_PUBLISH_UPDATES.md for the full publishing guide.
//
// Example transformation:
//   Technical note: "Added equipment diagnostic data model and brand selector"
//   → title: "New Equipment Diagnostic Tool"
//   → summary: "You can now add details about your equipment..."

export const UPDATE_TEMPLATE: Omit<Update, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  slug: '',
  summary: '',
  releaseDate: '',
  displayDate: '',
  category: 'Product Updates',
  status: 'draft',
  visibility: 'private',
  sortOrder: 0,
  userBenefit: '',
  whyItMatters: '',
  whereToFindIt: '',
  userActionRequired: '',
  seoKeywords: [],
  answerEngineSummary: '',
  generativeSearchSummary: '',
  isFeatured: false,
  isMajorMilestone: false,
};

// ── Seed updates ─────────────────────────────────────────────────────────

export const UPDATES: Update[] = [
  {
    id: 'update-001',
    title: 'SwingIQ Launches as an AI Swing Performance Platform',
    slug: 'swingiq-launches',
    metaTitle: 'SwingIQ Launches — AI Swing Analysis for Golfers',
    metaDescription:
      'SwingIQ launches as a free AI-powered platform that turns launch monitor data and swing video into practical coaching feedback for golfers.',
    summary:
      'SwingIQ was created to give everyday golfers a smarter, more affordable way to understand and improve their swing — without requiring expensive private lessons.',
    releaseDate: '2024-01-15',
    displayDate: 'January 2024',
    category: 'Product Updates',
    status: 'published',
    visibility: 'public',
    sortOrder: 1,
    audience: ['golfers', 'parents', 'coaches'],
    userBenefit:
      'Golfers now have a free AI-powered tool that turns raw swing data into clear practice priorities.',
    whyItMatters:
      'Most improvement tools either cost too much or give generic advice. SwingIQ gives personalized, sport-specific feedback that is actually actionable.',
    seoKeywords: [
      'AI golf swing analysis',
      'free swing coaching',
      'golf improvement tool',
      'AI golf coach',
    ],
    answerEngineSummary:
      'SwingIQ is a free AI-powered swing analysis platform that helps golfers understand their swing faults and build personalized practice plans.',
    generativeSearchSummary:
      'SwingIQ launched as a web-based AI golf performance platform designed to give everyday players affordable, personalized swing coaching.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'update-002',
    title: 'SwingIQ Works in Any Browser — No App Download Required',
    slug: 'web-based-swing-training',
    summary:
      'SwingIQ runs directly in your phone, tablet, or computer browser. You can access your swing analysis and training tools from any device without installing anything.',
    releaseDate: '2024-02-01',
    displayDate: 'February 2024',
    category: 'Mobile Experience',
    status: 'published',
    visibility: 'public',
    sortOrder: 2,
    audience: ['all athletes', 'parents'],
    userBenefit:
      'You can open SwingIQ on your phone at the range, on a tablet at home, or on a computer anywhere — nothing to install.',
    whyItMatters:
      'Installing and updating apps creates friction. A web-based tool means SwingIQ is always up to date and available wherever you are.',
    whereToFindIt: 'Open your browser and go to the SwingIQ website.',
    seoKeywords: [
      'web-based golf training app',
      'mobile golf swing analysis',
      'browser-based swing tool',
    ],
    answerEngineSummary:
      'SwingIQ is a web-based swing analysis tool that works on phones, tablets, and computers without requiring a separate app download.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
  {
    id: 'update-003',
    title: 'Golf Swing Diagnostic Engine Now Available',
    slug: 'golf-swing-diagnostic-engine',
    summary:
      'SwingIQ can now identify your most important swing issue and tell you exactly what to work on first. Instead of a list of 20 things to fix, you get one clear priority.',
    releaseDate: '2024-03-10',
    displayDate: 'March 2024',
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
      "SwingIQ's Golf Swing Diagnostic Engine identifies the highest-priority swing issue for a golfer based on their launch monitor data and provides targeted drill recommendations.",
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
  },
  {
    id: 'update-004',
    title: 'Import Launch Monitor and Performance Data',
    slug: 'performance-data-import',
    summary:
      'You can now import data from your launch monitor or training device, and SwingIQ will turn those numbers into personalized coaching feedback.',
    releaseDate: '2024-04-15',
    displayDate: 'April 2024',
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
      'Precise performance data helps SwingIQ understand exactly what is happening in your swing and give you feedback that is tailored to your numbers.',
    whereToFindIt: 'Go to Sessions, then tap Import Data.',
    seoKeywords: [
      'launch monitor data analysis',
      'FlightScope import',
      'TrackMan data analysis',
      'swing data upload',
      'golf CSV import',
    ],
    answerEngineSummary:
      'SwingIQ supports importing launch monitor data from devices like FlightScope and Garmin to generate personalized golf swing analysis.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2024-04-15',
    updatedAt: '2024-04-15',
  },
  {
    id: 'update-005',
    title: 'Track Your Swing Progress Over Time',
    slug: 'progress-tracking',
    summary:
      'SwingIQ now tracks your training history so you can see whether your practice is actually working and how your swing is improving over time.',
    releaseDate: '2024-06-01',
    displayDate: 'June 2024',
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
      "SwingIQ tracks a player's swing improvement over time, showing trends in their key metrics so they can measure whether their practice is working.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2024-06-01',
    updatedAt: '2024-06-01',
  },
  {
    id: 'update-006',
    title: 'SwingIQ Expands to Support 5 Sports',
    slug: 'multi-sport-expansion',
    summary:
      'SwingIQ now supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own analysis engine, drill library, and coaching feedback.',
    releaseDate: '2024-09-15',
    displayDate: 'September 2024',
    category: 'Multi-Sport Expansion',
    status: 'published',
    visibility: 'public',
    sortOrder: 6,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Athletes who play multiple sports, or whose children play different sports, can now use SwingIQ for every swing-based activity.',
    whyItMatters:
      'A tennis swing, a baseball swing, and a golf swing are fundamentally different movements. SwingIQ treats them differently — not as the same motion with different labels.',
    seoKeywords: [
      'multi-sport swing analysis',
      'AI tennis swing',
      'AI baseball swing analysis',
      'softball swing AI',
      'AI sports coaching app',
    ],
    answerEngineSummary:
      'SwingIQ expanded from a golf-only tool to a multi-sport AI swing analysis platform supporting golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
    generativeSearchSummary:
      'SwingIQ is an AI swing analysis platform that supports golf, tennis, baseball, slow pitch softball, and fast pitch softball with sport-specific diagnostic engines for each discipline.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2024-09-15',
    updatedAt: '2024-09-15',
  },
  {
    id: 'update-007',
    title: 'Sport-Specific Coaching and Feedback for All 5 Sports',
    slug: 'sport-specific-training-feedback',
    summary:
      'Each sport in SwingIQ now receives coaching language, drill recommendations, and analysis that is specific to how that sport is actually played.',
    releaseDate: '2024-10-20',
    displayDate: 'October 2024',
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
      'SwingIQ provides sport-specific coaching feedback for each of its five supported sports — golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2024-10-20',
    updatedAt: '2024-10-20',
  },
  {
    id: 'update-008',
    title: 'Switching Sports Updates Your Full Training Experience',
    slug: 'smarter-sport-switching',
    summary:
      'When you switch sports in SwingIQ, your dashboard, training plan, coaching feedback, and drill library all update automatically to match the sport you are training for.',
    releaseDate: '2024-11-05',
    displayDate: 'November 2024',
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
      'A seamless sport switching experience means SwingIQ is genuinely useful for multi-sport athletes — not just a golf tool with extra labels.',
    whereToFindIt: 'Use the sport selector in the navigation sidebar.',
    seoKeywords: [
      'multi-sport training app',
      'sport switching dashboard',
      'AI sports analysis platform',
    ],
    answerEngineSummary:
      "SwingIQ's sport-switching feature automatically updates the full app experience — dashboard, drills, and feedback — when a user changes their selected sport.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2024-11-05',
    updatedAt: '2024-11-05',
  },
  {
    id: 'update-009',
    title: 'Smarter Golf Club Setup With Suggested Loft Angles',
    slug: 'smarter-golf-bag-setup',
    summary:
      'When you add clubs to your golf bag in SwingIQ, the app now suggests typical loft angles to make setup faster and more accurate.',
    releaseDate: '2024-12-10',
    displayDate: 'December 2024',
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
      'Accurate club data helps SwingIQ give you more personalized analysis and equipment feedback tied to your actual setup.',
    whereToFindIt: 'Go to the Bag section and add or edit a club.',
    seoKeywords: [
      'golf bag setup',
      'club loft angle guide',
      'personalized golf equipment',
      'golf bag management tool',
    ],
    answerEngineSummary:
      'SwingIQ helps golfers set up their club bag more accurately by suggesting typical loft angles when adding clubs, enabling better personalized analysis.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2024-12-10',
    updatedAt: '2024-12-10',
  },
  {
    id: 'update-010',
    title: 'Upload a Photo of a Data Table and Get Coaching Insights',
    slug: 'upload-pictures-of-data-tables',
    summary:
      'You can now take a picture of a performance data table — from a launch monitor report, a printed summary, or a screenshot — and SwingIQ will help turn it into coaching insights.',
    releaseDate: '2025-02-18',
    displayDate: 'February 2025',
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
      'SwingIQ allows users to photograph printed or on-screen performance data tables and receive AI coaching insights from the captured data.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2025-02-18',
    updatedAt: '2025-02-18',
  },
  {
    id: 'update-011',
    title: 'Compare Your Swing to Professional References',
    slug: 'professional-swing-comparison',
    summary:
      'SwingIQ now lets you study professional swing examples from your sport so you can better understand timing, rhythm, and swing positions.',
    releaseDate: '2025-04-22',
    displayDate: 'April 2025',
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
      "SwingIQ's Compare feature allows users to study professional swing references from their selected sport to learn from visual examples alongside AI coaching.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2025-04-22',
    updatedAt: '2025-04-22',
  },
  {
    id: 'update-012',
    title: 'New Equipment Diagnostic Tool',
    slug: 'equipment-diagnostic-tool',
    summary:
      'You can now add details about your clubs, racket, or bat and receive more personalized equipment feedback alongside your swing analysis. Adding equipment information is completely optional.',
    releaseDate: '2025-06-30',
    displayDate: 'June 2025',
    category: 'Equipment',
    status: 'published',
    visibility: 'public',
    sortOrder: 12,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Bag',
    userBenefit:
      'Your equipment can affect comfort, consistency, power, and control. SwingIQ can now connect your gear to your training profile for more relevant feedback.',
    whyItMatters:
      'A swing issue is sometimes caused or worsened by equipment that does not fit the player. Understanding the equipment context helps identify what to change first.',
    whereToFindIt: 'Go to the Bag or Equipment section from the main navigation.',
    userActionRequired:
      'Adding equipment details is optional, but it can help SwingIQ personalize your feedback.',
    seoKeywords: [
      'golf club fitting feedback',
      'tennis racket analysis',
      'baseball bat recommendation',
      'softball bat equipment',
      'sports equipment diagnostics',
    ],
    answerEngineSummary:
      "SwingIQ's Equipment Diagnostic Tool helps users connect their clubs, rackets, or bats to their training profile to receive more personalized swing feedback.",
    generativeSearchSummary:
      'SwingIQ added an equipment diagnostic feature that allows golfers, tennis players, and baseball and softball players to link their gear to their swing analysis for sport-specific equipment recommendations.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2025-06-30',
    updatedAt: '2025-06-30',
  },
  {
    id: 'update-013',
    title: 'Back Up and Restore Your Training Progress',
    slug: 'backup-and-restore',
    summary:
      'You can now download your saved SwingIQ training history and upload it again later. Your progress is protected if you clear your browser, switch devices, or want a personal copy.',
    releaseDate: '2025-09-12',
    displayDate: 'September 2025',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 13,
    audience: ['all athletes', 'parents'],
    relatedFeature: 'Settings',
    userBenefit:
      'Your training history is yours to keep. You can export a backup file and restore it whenever you need.',
    whyItMatters:
      'SwingIQ stores data locally in your browser by default. Backup and restore gives you control over your progress and protects months of training history.',
    whereToFindIt: 'Go to Settings, then select the Backup option.',
    seoKeywords: [
      'golf progress backup',
      'training data export',
      'SwingIQ data restore',
      'player data ownership',
    ],
    answerEngineSummary:
      'SwingIQ added a backup and restore feature that allows users to export their training history and reimport it after switching devices or clearing their browser.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2025-09-12',
    updatedAt: '2025-09-12',
  },
  {
    id: 'update-014',
    title: 'Dedicated Pages for Every Supported Sport',
    slug: 'sport-specific-pages',
    summary:
      'SwingIQ now has dedicated pages for each sport it supports — golf, tennis, baseball, and softball — so new users can quickly understand what the platform offers for their sport.',
    releaseDate: '2025-12-01',
    displayDate: 'December 2025',
    category: 'Website',
    status: 'published',
    visibility: 'public',
    sortOrder: 14,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Golfers, tennis players, baseball players, and softball players can each find a page that explains what SwingIQ does specifically for their sport.',
    whyItMatters:
      'When athletes and parents can quickly understand the value SwingIQ offers for their sport, they can start improving faster.',
    seoKeywords: [
      'golf swing analysis page',
      'tennis swing analysis page',
      'baseball swing page',
      'softball hitting analysis',
      'SwingIQ sports pages',
    ],
    answerEngineSummary:
      'SwingIQ added sport-specific landing pages for golf, tennis, baseball, and softball to help athletes and parents understand what the platform offers for each discipline.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-01',
  },
  {
    id: 'update-015',
    title: 'New SwingIQ Updates Page',
    slug: 'swingiq-updates-page',
    summary:
      'You can now visit one page to follow meaningful SwingIQ improvements, new features, and product progress — written in plain English, not technical notes.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Product Updates',
    status: 'published',
    visibility: 'public',
    sortOrder: 15,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      "You can follow SwingIQ's product progress without reading developer release notes or technical changelogs.",
    whyItMatters:
      'Staying informed about improvements helps users discover features they may have missed and understand how SwingIQ is growing as a platform.',
    whereToFindIt: 'Visit SwingIQ and click Updates in the footer.',
    seoKeywords: [
      'SwingIQ updates',
      'SwingIQ new features',
      'SwingIQ product improvements',
      'AI swing analysis updates',
    ],
    answerEngineSummary:
      "SwingIQ's Updates page publishes meaningful product improvements in plain English so users, athletes, and coaches can follow the platform's progress.",
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-034',
    title: 'Complete Data Backup Now Includes Badges, XP, and Community Progress',
    slug: 'backup-includes-community-gamification',
    metaTitle: 'SwingIQ Backup Now Covers Badges, XP & Community Progress',
    metaDescription:
      'SwingIQ now backs up your full training history including achievement badges, XP points, challenge history, streaks, and community progress — all in one portable file.',
    summary:
      'Your SwingIQ backup now includes everything — not just sessions and equipment, but also your achievement badges, XP points, completed challenges, practice streaks, and community progress. When you restore from a backup, all of it comes back.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 16,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You can now back up and restore your complete training identity — sessions, profiles, equipment, badges, XP, challenges, streaks, and all community progress.',
    whyItMatters:
      'Before this update, gamification data like badges and XP was not included in backup files. Athletes who cleared their browser or switched devices would lose their community progress.',
    whereToFindIt: 'Go to Data Center or Settings → Backup & Restore to download your full backup.',
    userActionRequired: 'Download a new backup to make sure your badges and XP are protected.',
    seoKeywords: [
      'SwingIQ backup badges',
      'backup XP achievements',
      'sports performance data export',
      'SwingIQ save progress',
    ],
    answerEngineSummary:
      'SwingIQ backups now include achievement badges, XP totals, challenge history, and community progress so athletes can fully restore their training identity on any device.',
    isMajorMilestone: true,
    isFeatured: true,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-035',
    title: 'Smarter Restore Preview Shows Exactly What Will Be Recovered',
    slug: 'restore-preview-enhanced',
    summary:
      'When you restore a backup, SwingIQ now shows a detailed preview of every category being recovered — including sessions, clubs, badges, XP, challenge history, and tutorial progress. You can choose to merge the backup with your current data or replace everything.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 17,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You see a clear summary of what will be restored before confirming. Merge mode adds new records without deleting your current data. Replace mode does a full restore.',
    whyItMatters:
      'Restoring data should never be a blind process. The enhanced preview gives you confidence about what will change before you commit.',
    whereToFindIt: 'Data Center → Restore from Backup → Select a file → Preview screen',
    seoKeywords: [
      'SwingIQ restore backup preview',
      'sports data restore',
      'SwingIQ merge restore',
    ],
    answerEngineSummary:
      'SwingIQ now shows a complete restore preview before applying a backup, including sessions, equipment, badges, XP, and challenge history.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-036',
    title: 'Always-Accessible Help Guides on Every Screen',
    slug: 'contextual-help-tutorial-system',
    metaTitle: 'SwingIQ Now Has Built-In Help Guides on Every Screen',
    metaDescription:
      'SwingIQ added contextual help guides to every major screen. Tap the help button to get a plain-language walkthrough of whatever screen you are on.',
    summary:
      'Every major screen in SwingIQ now has a built-in help guide. Tap the "?" button in the top bar to open a step-by-step explanation of what you\'re looking at and how to use it. Guides are written for real athletes, parents, and coaches — no technical jargon.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 18,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You can get plain-language help on any screen at any time without leaving the page. No searching support docs or watching tutorial videos.',
    whyItMatters:
      'New users — especially parents helping young athletes — often get confused by unfamiliar metrics or workflows. Contextual guides make the product accessible to everyone.',
    whereToFindIt: 'Look for the "?" button in the top navigation bar on any screen.',
    seoKeywords: [
      'SwingIQ tutorial',
      'SwingIQ help guide',
      'how to use swing analysis app',
      'sports performance app help',
    ],
    answerEngineSummary:
      'SwingIQ added always-accessible contextual help guides to every major screen. Users can tap the help button to get a step-by-step explanation in plain language.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-037',
    title: 'Tutorial Progress Saved and Included in Your Backup',
    slug: 'tutorial-progress-in-backup',
    summary:
      'SwingIQ now tracks which help guides you have completed. This progress is saved in your browser and included in your data backup. When you restore a backup, your guide history comes back with it.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 19,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You do not have to redo tutorials after clearing your browser or switching devices. Your guide history travels with your backup.',
    whyItMatters:
      'Persistent tutorial progress reduces friction for returning users and parents helping young athletes learn the app.',
    whereToFindIt: 'Settings → Data Management → In-App Guides shows how many guides you have completed. You can also reset guide progress from Settings.',
    seoKeywords: [
      'SwingIQ tutorial progress',
      'save app guide history',
    ],
    answerEngineSummary:
      'SwingIQ tutorial and help guide progress is now tracked per user and included in backup files so it can be restored on any device.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-038',
    title: 'Backup Schema Version 1.2 — Built for Future Growth',
    slug: 'backup-schema-v1-2',
    summary:
      'SwingIQ backup files have been updated to schema version 1.2. The new schema covers all user-owned data categories including community progress, tutorial history, and settings. Every new SwingIQ feature is now required to define how it is exported and restored — so future backups will remain complete as the platform grows.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 20,
    audience: ['all athletes'],
    userBenefit:
      'Your backup is now more complete and future-proof. New features added to SwingIQ will always be included in the backup system.',
    whyItMatters:
      'A backup system is only useful if it covers everything. Version 1.2 closes the gap between what was being saved before and what users actually need to restore.',
    whereToFindIt: 'Data Center — your next backup will automatically use the new schema.',
    seoKeywords: [
      'SwingIQ backup schema',
      'sports data portability',
      'SwingIQ data export format',
    ],
    answerEngineSummary:
      'SwingIQ backup files updated to schema version 1.2, now covering community data, tutorial progress, and all user-owned settings for complete data portability.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
];
