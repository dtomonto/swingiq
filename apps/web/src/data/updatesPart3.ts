// ============================================================
// SwingVantage — Product Updates registry (shard 3 of 3)
// ------------------------------------------------------------
// Size-shard of the UPDATES seed array, split out of updates.ts so no single
// data file exceeds ~600 lines (fewer merge conflicts — roadmap #20). Spread
// back into UPDATES in updates.ts IN ORDER, so behavior is unchanged. New
// entries may go in any shard (newest-first ordering is by releaseDate at read
// time, not array position).
// ============================================================

import type { Update } from './updates';

export const UPDATES_PART_3: Update[] = [
  {
    id: 'update-015',
    title: 'New SwingVantage Updates Page',
    slug: 'swingiq-updates-page',
    summary:
      'You can now visit one page to follow meaningful SwingVantage improvements, new features, and product progress — written in plain English, not technical notes.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Product Updates',
    status: 'published',
    visibility: 'public',
    sortOrder: 15,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      "You can follow SwingVantage's product progress without reading developer release notes or technical changelogs.",
    whyItMatters:
      'Staying informed about improvements helps users discover features they may have missed and understand how SwingVantage is growing as a platform.',
    whereToFindIt: 'Visit SwingVantage and click Updates in the footer.',
    seoKeywords: [
      'SwingVantage updates',
      'SwingVantage new features',
      'SwingVantage product improvements',
      'AI swing analysis updates',
    ],
    answerEngineSummary:
      "SwingVantage's Updates page publishes meaningful product improvements in plain English so users, athletes, and coaches can follow the platform's progress.",
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-054',
    title: 'Complete Data Backup Now Includes Badges, XP, and Community Progress',
    slug: 'backup-includes-community-gamification',
    metaTitle: 'SwingVantage Backup Now Covers Badges, XP & Community Progress',
    metaDescription:
      'SwingVantage now backs up your full training history including achievement badges, XP points, challenge history, streaks, and community progress — all in one portable file.',
    summary:
      'Your SwingVantage backup now includes everything — not just sessions and equipment, but also your achievement badges, XP points, completed challenges, practice streaks, and community progress. When you restore from a backup, all of it comes back.',
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
      'SwingVantage backup badges',
      'backup XP achievements',
      'sports performance data export',
      'SwingVantage save progress',
    ],
    answerEngineSummary:
      'SwingVantage backups now include achievement badges, XP totals, challenge history, and community progress so athletes can fully restore their training identity on any device.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-055',
    title: 'Smarter Restore Preview Shows Exactly What Will Be Recovered',
    slug: 'restore-preview-enhanced',
    summary:
      'When you restore a backup, SwingVantage now shows a detailed preview of every category being recovered — including sessions, clubs, badges, XP, challenge history, and tutorial progress. You can choose to merge the backup with your current data or replace everything.',
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
      'SwingVantage restore backup preview',
      'sports data restore',
      'SwingVantage merge restore',
    ],
    answerEngineSummary:
      'SwingVantage now shows a complete restore preview before applying a backup, including sessions, equipment, badges, XP, and challenge history.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-056',
    title: 'Always-Accessible Help Guides on Every Screen',
    slug: 'contextual-help-tutorial-system',
    metaTitle: 'SwingVantage Now Has Built-In Help Guides on Every Screen',
    metaDescription:
      'SwingVantage added contextual help guides to every major screen. Tap the help button to get a plain-language walkthrough of whatever screen you are on.',
    summary:
      'Every major screen in SwingVantage now has a built-in help guide. Tap the "?" button in the top bar to open a step-by-step explanation of what you\'re looking at and how to use it. Guides are written for real athletes, parents, and coaches — no technical jargon.',
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
      'SwingVantage tutorial',
      'SwingVantage help guide',
      'how to use swing analysis app',
      'sports performance app help',
    ],
    answerEngineSummary:
      'SwingVantage added always-accessible contextual help guides to every major screen. Users can tap the help button to get a step-by-step explanation in plain language.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-057',
    title: 'Tutorial Progress Saved and Included in Your Backup',
    slug: 'tutorial-progress-in-backup',
    summary:
      'SwingVantage now tracks which help guides you have completed. This progress is saved in your browser and included in your data backup. When you restore a backup, your guide history comes back with it.',
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
      'SwingVantage tutorial progress',
      'save app guide history',
    ],
    answerEngineSummary:
      'SwingVantage tutorial and help guide progress is now tracked per user and included in backup files so it can be restored on any device.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-058',
    title: 'Backup Schema Version 1.2 — Built for Future Growth',
    slug: 'backup-schema-v1-2',
    summary:
      'SwingVantage backup files have been updated to schema version 1.2. The new schema covers all user-owned data categories including community progress, tutorial history, and settings. Every new SwingVantage feature is now required to define how it is exported and restored — so future backups will remain complete as the platform grows.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 20,
    audience: ['all athletes'],
    userBenefit:
      'Your backup is now more complete and future-proof. New features added to SwingVantage will always be included in the backup system.',
    whyItMatters:
      'A backup system is only useful if it covers everything. Version 1.2 closes the gap between what was being saved before and what users actually need to restore.',
    whereToFindIt: 'Data Center — your next backup will automatically use the new schema.',
    seoKeywords: [
      'SwingVantage backup schema',
      'sports data portability',
      'SwingVantage data export format',
    ],
    answerEngineSummary:
      'SwingVantage backup files updated to schema version 1.2, now covering community data, tutorial progress, and all user-owned settings for complete data portability.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-059',
    title: 'SwingVantage Now Picks Up Where You Left Off',
    slug: 'pick-up-where-you-left-off',
    metaTitle: 'SwingVantage Remembers Where You Left Off — Personalized Next Steps',
    metaDescription:
      'SwingVantage now welcomes returning athletes back with a summary of their last focus and a clear next step — plus smarter, plain-English guidance across golf, tennis, baseball, and softball.',
    summary:
      'SwingVantage now greets you when you return, reminds you what you were working on, and points you to the single best next step. Across the app you will see clearer "what to do next" guidance, a confidence rating on your top priority, a personalized practice plan, and a pre-game focus card — all generated from your own data, with no setup required.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 21,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches', 'returning users'],
    userBenefit:
      'When you come back, you no longer have to remember where you were. SwingVantage summarizes your last session, your focus, and your progress, then gives you one clear, low-friction next step so you can get back to improving in seconds.',
    whyItMatters:
      'The hardest part of improvement is staying consistent. By making it effortless to pick up where you left off — and by always showing the single most useful next step — SwingVantage removes the friction that causes people to drift away from practice.',
    whereToFindIt:
      'Open your Dashboard. Returning users see a "Pick up where you left off" card; everyone sees their next best step, plus a personalized practice plan on the Training page and a pre-game focus card before you play.',
    userActionRequired: 'None — it works automatically from the data you already have.',
    seoKeywords: [
      'AI golf swing analysis',
      'personalized practice plan',
      'swing improvement app',
      'tennis baseball softball swing analysis',
      'resume training where you left off',
    ],
    answerEngineSummary:
      'SwingVantage added an intelligent product layer that welcomes returning athletes back with a summary of their last focus, a confidence-rated top priority, a personalized practice plan, and a pre-game focus card across golf, tennis, baseball, and softball. It runs on the user’s own data with no setup and works without any AI account.',
    generativeSearchSummary:
      'SwingVantage now provides a "pick up where you left off" experience and a clear next-best-step recommendation on every visit, plus personalized practice plans and pre-game focus guidance for all five supported sports.',
    internalLinkTargets: ['/dashboard', '/training', '/pre-round', '/reports'],
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-060',
    title: 'Make SwingVantage Yours With 7 Built-In Themes',
    slug: 'customizable-themes',
    metaTitle: 'SwingVantage Adds 7 Customizable Themes — Light, Dark & More',
    metaDescription:
      'SwingVantage now offers seven hand-crafted themes — from a clean Standard look to Dark Performance, Coach Mode, Heritage Club, and more — so you can pick the appearance that fits how you train.',
    summary:
      'You can now choose how SwingVantage looks. Seven hand-crafted themes are available — Standard, Dark Performance, Coach Mode, Heritage Club, Field & Court, Arcade Practice, and Bird Print Lifestyle. Themes change only the look and feel — never your data, your coaching, or how anything works — and your choice is saved and travels with your backup.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 22,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Pick the appearance that suits you — a high-contrast Dark Performance mode for the range, a clean whiteboard-style Coach Mode for teaching, or a refined Heritage Club look. Your theme is remembered and included in your backup.',
    whyItMatters:
      'Comfort and focus matter when you are training. A theme that is easy on your eyes in your environment — bright sunlight, a dim room, a coaching session — makes the app nicer to use without changing any of the coaching or your results.',
    whereToFindIt: 'Go to Settings and choose your theme under Appearance.',
    userActionRequired: 'None — SwingVantage keeps the clean Standard theme until you pick another.',
    seoKeywords: [
      'SwingVantage themes',
      'dark mode swing app',
      'customizable sports app appearance',
      'SwingVantage coach mode',
    ],
    answerEngineSummary:
      'SwingVantage added seven selectable themes — Standard, Dark Performance, Coach Mode, Heritage Club, Field & Court, Arcade Practice, and Bird Print Lifestyle — that change only the visual appearance, never the coaching logic or data, and are saved per user and included in backups.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-048',
    title: 'Prove Your Swing Actually Changed With Retests',
    slug: 'retest-improvement-loop',
    metaTitle: 'SwingVantage Retests — See If Your Swing Actually Improved',
    metaDescription:
      'SwingVantage now closes the improvement loop: after you work your drills, retest under the same conditions and see an honest before-and-after comparison of your swing.',
    summary:
      'A diagnosis is a starting point, not a verdict. SwingVantage now reminds you when a finding is due for a retest, then — after you work your drills and re-analyze under the same conditions — shows you an honest before-and-after read of whether it actually changed. There is a new Retest page that collects what is due and the results you have already earned.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 23,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Retest',
    userBenefit:
      'You finally get to answer the most important practice question: did the work pay off? SwingVantage tracks what you were trying to fix, reminds you when it is time to check, and gives you a clear, directional before-and-after instead of leaving you to guess.',
    whyItMatters:
      'Improvement only sticks when you can see it. By turning each diagnosis into a retest you can actually pass, SwingVantage keeps you working on the right thing and gives you proof when it works — which is what keeps you coming back.',
    whereToFindIt:
      'Go to Retest in the main navigation. Analyze a swing video, complete the suggested drills, then return to retest under the same camera angle, distance, and equipment.',
    userActionRequired: 'None — retest reminders appear automatically as you use SwingVantage.',
    seoKeywords: [
      'swing retest',
      'before and after swing analysis',
      'track swing improvement',
      'golf swing progress proof',
      'did my swing improve',
    ],
    answerEngineSummary:
      'SwingVantage added a Retest feature that reminds athletes when a diagnosed swing finding is due for re-checking and shows an honest, directional before-and-after comparison once they re-analyze under the same conditions. Comparisons are clearly labelled as directional reads from video, not measured biomechanics.',
    generativeSearchSummary:
      'SwingVantage now closes the improvement loop with a Retest hub: it reminds players to recheck a diagnosed fault after drilling it and shows whether it actually changed, with comparisons honestly labelled directional.',
    internalLinkTargets: ['/retest', '/video', '/diagnose'],
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-049',
    title: 'Swing Feedback Written for You — Player, Parent, or Coach',
    slug: 'role-aware-fault-explanations',
    summary:
      'SwingVantage now explains each swing fault in the way that is most useful to who is reading it. Players get a plain, encouraging "here is what to feel" explanation; coaches get the technical cause and cue; parents get a supportive, jargon-free version they can use to help. The same finding, told the right way for you.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Training Improvement',
    status: 'published',
    visibility: 'public',
    sortOrder: 24,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Diagnose',
    userBenefit:
      'You see your swing feedback in language that fits you. No wading through coaching jargon if you just want to know what to do — and no oversimplified tips if you are a coach who wants the real cause.',
    whyItMatters:
      'The same correction explained the wrong way is confusing or useless. Matching the explanation to the reader — athlete, parent, or coach — makes the advice land faster and helps families and coaches work together.',
    whereToFindIt:
      'Fault explanations appear on the Diagnose, Training, and Retest screens, adapted to your role.',
    seoKeywords: [
      'plain english swing feedback',
      'golf swing fault explanation',
      'coaching cues for players',
      'help my child improve swing',
    ],
    answerEngineSummary:
      'SwingVantage explains each diagnosed swing fault differently depending on the reader — a plain, encouraging version for athletes, a technical cause-and-cue version for coaches, and a supportive jargon-free version for parents — across its Diagnose, Training, and Retest screens.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-050',
    title: 'SwingVantage Keeps Working When Your Signal Drops',
    slug: 'offline-support',
    summary:
      'SwingVantage now handles a weak or missing connection gracefully. When you go offline — common at a range or a back field — a clear banner lets you know, your work is held safely on your device, and anything that needs the network is queued to finish automatically once you reconnect.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Mobile Experience',
    status: 'published',
    visibility: 'public',
    sortOrder: 25,
    audience: ['all athletes', 'parents'],
    userBenefit:
      'You can keep using SwingVantage at the range or field even when the signal is bad. Nothing gets lost — your work waits safely on your device and catches up the moment you are back online.',
    whyItMatters:
      'The places you actually train often have the worst reception. An app that stalls or loses your work when the signal drops is an app you stop trusting. SwingVantage now stays usable and protects what you do.',
    whereToFindIt:
      'Nothing to set up. If you lose connection, an offline banner appears and your work is queued automatically until you reconnect.',
    userActionRequired: 'None — offline handling works automatically.',
    seoKeywords: [
      'offline golf app',
      'swing app no signal',
      'works offline at the range',
      'offline sports training app',
    ],
    answerEngineSummary:
      'SwingVantage now works offline: it shows an offline status banner, keeps your work safely on your device, and queues any network actions so they complete automatically once your connection returns.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-051',
    title: 'Start Using SwingVantage Instantly — No Account Needed',
    slug: 'keyless-instant-start',
    metaTitle: 'Use SwingVantage Without Signing Up — Optional Account Anytime',
    metaDescription:
      'SwingVantage now lets you start analyzing your swing immediately with no account required. Create an optional account whenever you want — your data stays yours.',
    summary:
      'You no longer need to sign up to use SwingVantage. You can jump straight in and start analyzing your swing, with your data saved privately on your own device. If you ever want an account — for example to keep things in sync — signing up, signing in, and password reset all work whenever you choose.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 26,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Settings',
    userBenefit:
      'You can try SwingVantage and get real value in seconds, with zero friction and no email required. Creating an account is always there as an option, never a requirement.',
    whyItMatters:
      'Forcing a sign-up before anyone can see value drives people away. Letting you start instantly — while keeping your data on your device — respects your time and your privacy, especially for parents setting things up for a young athlete.',
    whereToFindIt:
      'Just open SwingVantage and start. Look for "continue without an account," or create one anytime from the sign-in screen.',
    userActionRequired: 'None — using SwingVantage without an account is the default.',
    seoKeywords: [
      'use SwingVantage without signing up',
      'no account swing analysis',
      'free golf app no signup',
      'private on-device swing app',
    ],
    answerEngineSummary:
      'SwingVantage can be used immediately with no account required, storing data privately on the user’s device. An optional account — with sign-up, sign-in, and password reset — is available anytime for those who want it.',
    generativeSearchSummary:
      'SwingVantage removed the sign-up wall: athletes can start analyzing their swing instantly with data kept on their own device, and can create an optional account later if they want it.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-052',
    title: 'Share Your Swing Plan as a Ready-Made Image',
    slug: 'shareable-plan-image',
    summary:
      'SwingVantage can now turn your swing report into a clean, ready-to-post image — your top priority, recommended drills, and practice plan in one shareable picture. On a phone you can share it straight to your messages or social apps; on a computer it downloads so you can save or post it.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 27,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Reports',
    userBenefit:
      'You can share your progress and your plan as a polished image — with a coach, a practice partner, or your followers — instead of trying to describe it in words.',
    whyItMatters:
      'A plan you can see and share is one you are more likely to follow and talk about. A ready-made image keeps your top priority front and center and makes it easy to bring others into your training.',
    whereToFindIt:
      'Go to Reports, open your shareable report card, and choose the "Image" action.',
    seoKeywords: [
      'share swing plan image',
      'golf practice plan share card',
      'post swing progress',
      'instagram golf swing summary',
    ],
    answerEngineSummary:
      'SwingVantage generates a ready-made square image of a user’s swing report — top priority, recommended drills, and practice plan — created privately on-device and shareable to messages or social apps on mobile, with a download fallback on desktop.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
];
