// ============================================================
// SwingVantage — Contextual Tutorial Content Registry
//
// Every major page should have an entry here.
// Content is written for real athletes, parents, and coaches.
// Avoid technical jargon — explain what the screen does and
// why it matters to the user.
//
// HOW TO ADD A NEW PAGE TUTORIAL:
//   1. Create a TutorialContent object with a unique `id`.
//   2. The `id` should match the route path (e.g. '/dashboard').
//   3. Write 2–6 short steps explaining the screen.
//   4. Add the object to TUTORIAL_REGISTRY.
// ============================================================

import type { TutorialContent } from './types';

export const TUTORIAL_REGISTRY: Record<string, TutorialContent> = {

  // ── Homepage ──────────────────────────────────────────────
  '/': {
    id: '/',
    pageTitle: 'Welcome to SwingVantage',
    intro: 'SwingVantage is your personal sports performance system. Whether you play golf, tennis, baseball, or softball, SwingVantage helps you understand your technique, track your progress, and improve over time.',
    steps: [
      {
        title: 'Choose your sport',
        body: 'SwingVantage supports Golf, Tennis, Baseball, Slow Pitch Softball, and Fast Pitch Softball. You can switch sports at any time — your data for each sport is kept separate.',
      },
      {
        title: 'Analyze your swing',
        body: 'Upload a video or enter your launch monitor data. SwingVantage\'s AI engine identifies what\'s happening in your swing and explains what to work on.',
      },
      {
        title: 'Track your progress over time',
        body: 'Every session you complete builds your performance history. SwingVantage uses this history to track trends, earn achievements, and give you better recommendations as you improve.',
      },
      {
        title: 'Protect your progress',
        body: 'Your data is saved in your browser. Download a backup from the Data Center so your training history is safe and can be restored on any device.',
      },
    ],
  },

  // ── Dashboard ─────────────────────────────────────────────
  '/dashboard': {
    id: '/dashboard',
    pageTitle: 'Your Dashboard',
    intro: 'Your dashboard shows a summary of your current sport, recent sessions, progress metrics, and what to work on next.',
    steps: [
      {
        title: 'Active sport context',
        body: 'Everything on the dashboard is filtered to your currently active sport. Use the sport selector to switch between Golf, Tennis, Baseball, or Softball — your data for each sport stays separate.',
      },
      {
        title: 'Recent sessions',
        body: 'Your most recent practice sessions appear here. Each session shows your swing score, date, and any key findings from that session.',
      },
      {
        title: 'Progress overview',
        body: 'The progress widgets show how your key metrics are trending. Green means improving, amber means flat, and red means you may need to focus there.',
      },
      {
        title: 'Recommended next action',
        body: 'SwingVantage suggests your next best action — whether that\'s completing a session, running diagnostics, or continuing a drill routine.',
      },
      {
        title: 'Gamification status',
        body: 'Your current streak, XP, and active challenges are shown on the dashboard. Complete sessions to earn badges and move up the leaderboard.',
      },
    ],
  },

  // ── Profile ───────────────────────────────────────────────
  '/profile': {
    id: '/profile',
    pageTitle: 'Your Player Profile',
    intro: 'Your profile tells SwingVantage about you as an athlete. The more you fill in, the better your coaching recommendations become.',
    steps: [
      {
        title: 'Golf profile',
        body: 'For golf, enter your handicap, scoring average, what you tend to miss, and your skill level. This helps SwingVantage focus its feedback on what matters most for your game.',
      },
      {
        title: 'Non-golf profiles',
        body: 'For Tennis, Baseball, and Softball, fill in your position, swing side, competition level, and equipment details. Each sport has its own profile so your data stays organized.',
      },
      {
        title: 'Why this matters',
        body: 'SwingVantage uses your profile to personalize every recommendation, drill, and diagnostic. A beginner golfer needs different feedback than an advanced player.',
      },
      {
        title: 'Your profile is included in backups',
        body: 'All your profile data is included when you download a backup from the Data Center. You can restore it later on any device.',
      },
    ],
  },

  // ── Equipment / Bag ───────────────────────────────────────
  '/bag': {
    id: '/bag',
    pageTitle: 'Your Equipment Bag',
    intro: 'This is where you manage the clubs, bats, or rackets you use. Adding your equipment helps SwingVantage give more specific recommendations.',
    steps: [
      {
        title: 'Adding clubs (golf)',
        body: 'Enter each club in your bag — driver, irons, wedges, and putter. Include the loft, shaft flex, and typical carry distance if you know them. SwingVantage uses this information to analyze your gapping and equipment fit.',
      },
      {
        title: 'Why loft matters',
        body: 'Loft determines how high the ball flies and how much distance gap exists between clubs. SwingVantage can detect if your lofts are out of order or causing distance gaps.',
      },
      {
        title: 'Bats and rackets',
        body: 'For baseball and softball, add your bat details — length, weight, barrel size, and certification. For tennis, add your racket model and string setup.',
      },
      {
        title: 'Equipment is included in your backup',
        body: 'All your equipment records are saved in your SwingVantage backup. If you switch devices or clear your browser, you can restore your full equipment profile.',
      },
    ],
  },

  // ── Sessions ──────────────────────────────────────────────
  '/sessions': {
    id: '/sessions',
    pageTitle: 'Your Practice Sessions',
    intro: 'All your recorded practice sessions are listed here. Each session contains your shot data, swing scores, and AI analysis results.',
    steps: [
      {
        title: 'What a session contains',
        body: 'Each session includes the date, sport, equipment used, shot data, and any swing analysis or diagnostics from that day\'s practice.',
      },
      {
        title: 'Viewing a session',
        body: 'Tap any session to see a full breakdown — shot-by-shot data, identified issues, swing score, and recommended drills.',
      },
      {
        title: 'Adding a new session',
        body: 'Use the "Log Session" option to enter data from a launch monitor or manual session. You can also upload a CSV from a compatible launch monitor.',
      },
      {
        title: 'Session history powers your progress',
        body: 'The more sessions you record, the better SwingVantage can track your improvement over time. Your history also feeds your streaks, badges, and challenges.',
      },
    ],
  },

  // ── Log Session ───────────────────────────────────────────
  '/sessions/log': {
    id: '/sessions/log',
    pageTitle: 'Log a Practice Session',
    intro: 'Record your practice session data here. You can enter shots from a launch monitor or log a manual session with notes.',
    steps: [
      {
        title: 'Select your sport and equipment',
        body: 'Start by choosing the sport and the club or bat you used in this session. This helps SwingVantage apply sport-specific analysis.',
      },
      {
        title: 'Entering shot data',
        body: 'Enter key metrics like carry distance, ball speed, launch angle, and spin rate for each shot. Not all fields are required — enter what you have.',
      },
      {
        title: 'Session notes',
        body: 'Add a note about how you felt, what you were working on, or any observations from the range. These notes help you see patterns over time.',
      },
      {
        title: 'Save and analyze',
        body: 'After saving, SwingVantage will analyze your session data. Head to the Diagnose screen to get a full swing breakdown and recommended drill plan.',
      },
    ],
  },

  // ── Import Data ───────────────────────────────────────────
  '/sessions/import': {
    id: '/sessions/import',
    pageTitle: 'Import Session Data',
    intro: 'Upload session data from a launch monitor or compatible tracking device. SwingVantage supports CSV and JSON formats.',
    steps: [
      {
        title: 'Supported data formats',
        body: 'SwingVantage can import data from FlightScope, Trackman, Foresight, SkyTrak, and other launch monitors that export CSV files. You can also upload a SwingVantage session JSON file.',
      },
      {
        title: 'Drag and drop or browse',
        body: 'Drop your file onto the upload area or tap "Browse" to select it. SwingVantage will read the file and map the columns to the correct metrics.',
      },
      {
        title: 'Reviewing parsed data',
        body: 'After import, you\'ll see a preview of your data. Check that the columns mapped correctly, then confirm to save the session.',
      },
      {
        title: 'Image upload (OCR)',
        body: 'You can also take a screenshot of a launch monitor table and upload it as an image. SwingVantage will use optical character recognition (OCR) to read the numbers from the image.',
      },
    ],
  },

  // ── Import Image (OCR) ────────────────────────────────────
  '/sessions/import/image': {
    id: '/sessions/import/image',
    pageTitle: 'Upload a Data Screenshot',
    intro: 'Take a photo or screenshot of your launch monitor screen and upload it here. SwingVantage will read the numbers from the image and import them as session data.',
    steps: [
      {
        title: 'What to photograph',
        body: 'Take a clear photo of the data table on your launch monitor — the screen that shows metrics like carry distance, ball speed, launch angle, and spin rate.',
      },
      {
        title: 'Image quality tips',
        body: 'Use good lighting and keep the camera steady. Avoid glare or shadows on the screen. The text must be readable for the import to work.',
      },
      {
        title: 'Reviewing the results',
        body: 'After upload, SwingVantage will show you the extracted numbers. Review them for accuracy and correct any errors before saving.',
      },
    ],
  },

  // ── Diagnose ──────────────────────────────────────────────
  '/diagnose': {
    id: '/diagnose',
    pageTitle: 'Swing Diagnostics',
    intro: 'The Diagnose screen analyzes your session data and identifies the key issues affecting your swing. It explains what is happening and why, in plain language.',
    steps: [
      {
        title: 'Select a session to analyze',
        body: 'Choose the session you want to analyze. SwingVantage will look at your shot patterns and identify the most significant issues.',
      },
      {
        title: 'Understanding issues',
        body: 'Each identified issue is listed with a severity level (Critical, High, Medium, Low) and a confidence score. Critical issues have the biggest impact on your performance.',
      },
      {
        title: 'What the scores mean',
        body: 'Your swing score is an overall rating of your session quality. A higher score means more consistent, efficient shots. It is meant to track trends, not define your ability.',
      },
      {
        title: 'Recommended drills',
        body: 'Based on your diagnosed issues, SwingVantage recommends specific drills. These are targeted to fix what the analysis found — not generic exercises.',
      },
      {
        title: 'Tracking improvement over time',
        body: 'Every time you run diagnostics on a new session, SwingVantage compares your results to previous sessions. This shows whether your key issues are improving.',
      },
    ],
  },

  // ── Training ──────────────────────────────────────────────
  '/training': {
    id: '/training',
    pageTitle: 'Training Plan',
    intro: 'Your personalized training plan is built from your diagnostic results. It shows you exactly what to work on and in what order.',
    steps: [
      {
        title: 'Your current focus area',
        body: 'The training plan highlights the highest-priority issue from your most recent diagnosis. This is what you should work on first.',
      },
      {
        title: 'Drill routines',
        body: 'Each focus area has a set of specific drills. Follow the steps in order — each drill builds on the previous one.',
      },
      {
        title: 'Tracking drill completion',
        body: 'Check off each drill as you complete it. SwingVantage tracks your drill history so it can measure consistency and suggest when to retest.',
      },
      {
        title: 'Streaks and consistency',
        body: 'Your practice streak is built by completing training sessions on consecutive days. Maintaining a streak earns XP and progress toward badges.',
      },
    ],
  },

  // ── Drills ────────────────────────────────────────────────
  '/drills': {
    id: '/drills',
    pageTitle: 'Drill Library',
    intro: 'Browse all available drills by sport, category, and skill level. Drills are organized by the issue they address.',
    steps: [
      {
        title: 'Finding the right drill',
        body: 'Use the filters to find drills for your sport, skill level, and the specific issue you want to fix. Start with drills labeled as "high priority" for your current diagnosis.',
      },
      {
        title: 'How drills are organized',
        body: 'Drills are grouped by the swing issue they address — for example, club path, face angle, attack angle, timing, or contact point. Completing drills in a sequence is more effective than doing them randomly.',
      },
    ],
  },

  // ── Video Analysis ────────────────────────────────────────
  '/golf-swing-analysis': {
    id: '/golf-swing-analysis',
    pageTitle: 'Golf Swing Analysis with Motion Lab',
    intro: 'Upload a video of your golf swing and SwingVantage will analyze your technique, identify issues, and compare your positions to key checkpoints.',
    steps: [
      {
        title: 'Recording a good swing video',
        body: 'Film from a stable position directly down-the-line (behind you, pointing at the target) or face-on (in front of you). Keep the whole body in frame and avoid backlit backgrounds.',
      },
      {
        title: 'What gets analyzed',
        body: 'SwingVantage identifies key swing phases (address, takeaway, top of backswing, downswing, impact, follow-through) and checks for common faults in each phase.',
      },
      {
        title: 'Understanding your results',
        body: 'Each identified issue includes a severity rating and a plain-language explanation. The overall swing score rates your session.',
      },
      {
        title: 'Video analysis is included in backups',
        body: 'Your video analysis results (scores, issues, notes) are included in your SwingVantage backup. The video file itself is not included — only the analysis results.',
      },
    ],
  },

  '/tennis-swing-analysis': {
    id: '/tennis-swing-analysis',
    pageTitle: 'Tennis Swing Analysis',
    intro: 'Upload a video of your tennis stroke and SwingVantage will analyze your technique across serve, forehand, backhand, and footwork.',
    steps: [
      {
        title: 'Recording your stroke',
        body: 'Film from a stable position that shows your full body and racket path. A face-on or slight angle view works best for most strokes.',
      },
      {
        title: 'Stroke types',
        body: 'Choose the stroke type before uploading — serve, forehand, backhand, or volley. This helps SwingVantage apply the right checkpoints.',
      },
      {
        title: 'What gets analyzed',
        body: 'SwingVantage identifies issues in your preparation, swing path, contact point, and follow-through. It also checks your footwork and balance.',
      },
    ],
  },

  '/baseball-swing-analysis': {
    id: '/baseball-swing-analysis',
    pageTitle: 'Baseball Swing Analysis',
    intro: 'Upload a video of your baseball swing and SwingVantage will analyze your bat path, contact point, hip rotation, and timing.',
    steps: [
      {
        title: 'Recording your swing',
        body: 'Film from directly behind the pitcher (face-on view) or from the side. Make sure your full swing path is visible.',
      },
      {
        title: 'What gets analyzed',
        body: 'SwingVantage checks your load, stride, hip rotation, hand path, contact point, and extension. It identifies timing faults and mechanics issues.',
      },
    ],
  },

  '/softball-swing-analysis': {
    id: '/softball-swing-analysis',
    pageTitle: 'Softball Swing Analysis',
    intro: 'Upload a video of your softball swing and SwingVantage will analyze your mechanics for both slow pitch and fast pitch.',
    steps: [
      {
        title: 'Slow pitch vs. fast pitch',
        body: 'SwingVantage applies different analysis criteria depending on your softball type. Make sure your sport profile is set to the correct format before uploading.',
      },
      {
        title: 'What gets analyzed',
        body: 'SwingVantage checks your load, stride timing, hip-to-shoulder separation, bat path, and contact zone. Different issues matter more for slow pitch vs. fast pitch.',
      },
    ],
  },

  // ── Progress ──────────────────────────────────────────────
  '/progress': {
    id: '/progress',
    pageTitle: 'Your Progress',
    intro: 'Track how your key metrics are changing over time. Progress is calculated across all your saved sessions.',
    steps: [
      {
        title: 'Reading the charts',
        body: 'Each chart shows a metric over time — such as carry distance, swing score, or face-to-path. An upward trend in positive metrics means you\'re improving.',
      },
      {
        title: 'Sport-specific metrics',
        body: 'The metrics shown depend on your active sport. Golf metrics (carry, spin rate, smash factor) are different from baseball metrics (exit velocity, launch angle) and tennis metrics.',
      },
      {
        title: 'Why session volume matters',
        body: 'Progress charts become more meaningful with more sessions. Five or more sessions in a category shows reliable trends. Early charts may show variation rather than true trends.',
      },
    ],
  },

  // ── Milestones ────────────────────────────────────────────
  '/milestones': {
    id: '/milestones',
    pageTitle: 'Your Milestones',
    intro: 'Milestones mark important achievements in your training journey — from your first session to reaching 100 practice days.',
    steps: [
      {
        title: 'What counts as a milestone',
        body: 'Milestones are automatically awarded when you reach specific goals — completing your 10th session, maintaining a 7-day streak, or earning your first badge.',
      },
      {
        title: 'Milestones and backups',
        body: 'All earned milestones are saved in your SwingVantage backup. If you clear your browser or switch devices, you can restore your milestone history.',
      },
    ],
  },

  // ── Compare ───────────────────────────────────────────────
  '/compare': {
    id: '/compare',
    pageTitle: 'Compare & References',
    intro: 'Compare your swing metrics against professional benchmarks or your own previous sessions.',
    steps: [
      {
        title: 'Comparing to benchmarks',
        body: 'SwingVantage includes benchmark data from professional players and published sport science. Compare your carry distance, spin rate, and other metrics to see where you stand.',
      },
      {
        title: 'Session-to-session comparison',
        body: 'Select two of your own sessions to compare them side by side. This is useful for checking whether a swing change improved or hurt your numbers.',
      },
    ],
  },

  // ── AI Coach ──────────────────────────────────────────────
  '/ai-coach': {
    id: '/ai-coach',
    pageTitle: 'AI Coach',
    intro: 'Your AI Coach can answer questions about your swing, explain diagnostic results, suggest practice priorities, and help you understand any metric in plain language.',
    steps: [
      {
        title: 'Asking questions',
        body: 'Type any question about your swing, your sport, or your training. For example: "Why is my carry distance inconsistent?" or "What should I work on next?"',
      },
      {
        title: 'Context-aware responses',
        body: 'When you have sessions saved, the AI Coach can reference your actual data to give more specific answers. The more sessions you have, the more personalized the coaching.',
      },
      {
        title: 'What the AI Coach cannot do',
        body: 'The AI Coach does not watch your live swing. It works from the session data and video analyses you have already saved. For real-time feedback, use Motion Lab.',
      },
    ],
  },

  // ── Reports ───────────────────────────────────────────────
  '/reports': {
    id: '/reports',
    pageTitle: 'Session Reports',
    intro: 'Generate detailed reports for your practice sessions. Share with a coach or keep as a record of your training history.',
    steps: [
      {
        title: 'Generating a report',
        body: 'Select one or more sessions and choose "Generate Report." The report includes your key metrics, identified issues, trends, and drill recommendations.',
      },
      {
        title: 'Sharing with a coach',
        body: 'Download the report as a PDF or copy the summary to share with your coach. This gives your coach context about what you\'ve been working on.',
      },
    ],
  },

  // ── Practice Schedule ─────────────────────────────────────
  '/practice': {
    id: '/practice',
    pageTitle: 'Practice Schedule',
    intro: 'Plan your upcoming practice sessions based on your current training focus and available time.',
    steps: [
      {
        title: 'Building a schedule',
        body: 'Tell SwingVantage how many days per week you practice and how long your sessions are. SwingVantage will suggest what to work on each day based on your current diagnostic priorities.',
      },
      {
        title: 'Following the schedule',
        body: 'Each scheduled session has a specific focus — for example, "wedge distance control" or "driver path consistency." Try to stick to the focus to maximize progress.',
      },
    ],
  },

  // ── Pre-Round ─────────────────────────────────────────────
  '/pre-round': {
    id: '/pre-round',
    pageTitle: 'Pre-Round Warm-Up',
    intro: 'Get a customized warm-up routine before your round or game, based on what you\'ve been working on in practice.',
    steps: [
      {
        title: 'Why warm-up matters',
        body: 'A targeted warm-up activates the movements you\'ve been training. It also helps you identify if your timing or contact is off before the round starts.',
      },
      {
        title: 'Customized to your focus',
        body: 'Your warm-up routine is based on your current swing priorities. If you\'ve been working on driver path, your warm-up will include drills that reinforce that pattern.',
      },
    ],
  },

  // ── Community Hub ─────────────────────────────────────────
  '/community': {
    id: '/community',
    pageTitle: 'SwingVantage Community',
    intro: 'The Community turns your training data into achievements, challenges, streaks, and leaderboards. It is designed to keep you accountable and motivated.',
    steps: [
      {
        title: 'What is XP?',
        body: 'XP (experience points) is earned by completing sessions, maintaining streaks, finishing challenges, protecting your data with backups, and reaching milestones. XP tracks your overall engagement and effort.',
      },
      {
        title: 'Badges and achievements',
        body: 'Badges are earned by reaching specific goals — like completing 10 sessions, maintaining a 7-day streak, or improving a key metric. Each badge is tied to real athletic progress.',
      },
      {
        title: 'Challenges',
        body: 'Challenges are short-term goals powered by your real session data — for example, "complete 5 sessions this week" or "improve carry consistency by 10%." Join challenges to earn extra XP and badges.',
      },
      {
        title: 'Privacy',
        body: 'By default, your profile is private. You choose what is visible to others. You can opt out of leaderboards entirely at any time. Youth athletes have extra privacy protections.',
      },
      {
        title: 'Protecting your community progress',
        body: 'Your XP, badges, challenges, and streaks are all included in your SwingVantage backup. Export a backup regularly so your community progress is safe.',
      },
    ],
  },

  // ── Badges ────────────────────────────────────────────────
  '/community/badges': {
    id: '/community/badges',
    pageTitle: 'Badges & Achievements',
    intro: 'Badges mark meaningful athletic achievements. Every badge you earn is tied to real progress in your training.',
    steps: [
      {
        title: 'How to earn badges',
        body: 'Badges are earned automatically when you reach the required goal. For example, completing your first session earns the "First Steps" badge. Maintaining a 7-day streak earns the "Week Warrior" badge.',
      },
      {
        title: 'Badge categories',
        body: 'Badges are organized by category — Consistency, Improvement, Personal Bests, Sport Mastery, Data Protection, and more. Each category represents a different aspect of athletic development.',
      },
      {
        title: 'Data Protection badges',
        body: 'A special category of badges rewards you for regularly protecting your training data. Backing up your SwingVantage data is treated as part of being a serious athlete.',
      },
      {
        title: 'Locked badges',
        body: 'Locked badges show what\'s still possible. They include a progress bar showing how close you are to earning them. Use this as a guide for what to focus on next.',
      },
    ],
  },

  // ── Challenges ────────────────────────────────────────────
  '/community/challenges': {
    id: '/community/challenges',
    pageTitle: 'Challenges',
    intro: 'Challenges are short-term goals powered by your real session data. Join a challenge and complete sessions during the challenge period to earn rewards.',
    steps: [
      {
        title: 'How challenges work',
        body: 'Each challenge has specific rules — for example, "Complete 5 sessions in 7 days" or "Log a session with a swing score above 75." Your actual session data is used to track progress.',
      },
      {
        title: 'Joining a challenge',
        body: 'Tap "Join Challenge" to start. Once you\'ve joined, your sessions will count toward the challenge goal. Progress updates automatically as you log sessions.',
      },
      {
        title: 'Challenge rewards',
        body: 'Completing a challenge earns you XP points and often a specific badge. Some challenges also unlock advanced training content.',
      },
      {
        title: 'Protecting challenge progress',
        body: 'Your challenge history and progress are included in your SwingVantage backup. Export a backup after completing challenges to make sure your progress is saved.',
      },
    ],
  },

  // ── Leaderboard ───────────────────────────────────────────
  '/community/leaderboard': {
    id: '/community/leaderboard',
    pageTitle: 'Leaderboard',
    intro: 'The leaderboard ranks athletes by improvement and consistency — not just raw scores. This means beginners and advanced players can compete fairly.',
    steps: [
      {
        title: 'How rankings work',
        body: 'Rankings are based on improvement percentage, session consistency, challenge points, and data discipline (how regularly you back up your data) — not just raw performance numbers.',
      },
      {
        title: 'Privacy controls',
        body: 'Your real name is never shown on public leaderboards unless you choose to display it. By default you appear as an anonymous athlete. You can opt out of leaderboards entirely in your privacy settings.',
      },
      {
        title: 'Youth athlete protection',
        body: 'If your profile is marked as a youth athlete, extra privacy protections apply. Youth athletes are not ranked against adult athletes.',
      },
    ],
  },

  // ── Groups ────────────────────────────────────────────────
  '/community/groups': {
    id: '/community/groups',
    pageTitle: 'Groups & Clubs',
    intro: 'Join a group to train alongside athletes who share your sport and goals. Groups have their own challenges, leaderboards, and activity feeds.',
    steps: [
      {
        title: 'Finding a group',
        body: 'Browse groups by sport. You can join public groups immediately. Private and invite-only groups require an invitation from a current member.',
      },
      {
        title: 'Group challenges',
        body: 'Many groups run sport-specific challenges that are only available to group members. These challenges often have higher XP rewards and exclusive badges.',
      },
    ],
  },

  // ── Data Center ───────────────────────────────────────────
  '/data': {
    id: '/data',
    pageTitle: 'Data Center',
    intro: 'The Data Center is where you download backups of your SwingVantage data, restore from a previous backup, or clear your data if needed.',
    steps: [
      {
        title: 'Why backing up matters',
        body: 'SwingVantage saves your data in your browser. If you clear your browser history, switch devices, or update your browser, your data could be lost. A backup file keeps your progress safe.',
      },
      {
        title: 'Downloading a backup',
        body: 'Tap "Download Backup" to save a complete copy of your SwingVantage data to your device. Keep this file somewhere safe — like cloud storage or a backup folder.',
      },
      {
        title: 'What the backup includes',
        body: 'Your backup includes all sessions, shot data, equipment profiles, sport profiles, video analysis results, training progress, badges, XP, challenge history, and app settings.',
      },
      {
        title: 'Encrypting your backup',
        body: 'You can add password protection to your backup file. Encrypted backups are more secure, but if you forget your password, the data cannot be recovered. Keep your password somewhere safe.',
      },
      {
        title: 'Restoring from backup',
        body: 'To restore your data, tap "Select Backup File" under Restore from Backup. Choose your backup file and SwingVantage will show you a preview of what will be restored before you confirm.',
      },
      {
        title: 'Merge vs. Replace',
        body: '"Merge" adds new records from the backup to your existing data without deleting anything. "Replace" clears your current data and restores everything from the backup. Use Merge unless you want a full reset.',
      },
    ],
  },

  // ── Settings ──────────────────────────────────────────────
  '/settings': {
    id: '/settings',
    pageTitle: 'Settings',
    intro: 'Customize how SwingVantage works for you — including language, units, coaching style, and privacy controls.',
    steps: [
      {
        title: 'Language',
        body: 'SwingVantage supports 20 languages. Changing the language updates all text throughout the app. Your language preference is saved and included in your backup.',
      },
      {
        title: 'Measurement units',
        body: 'Choose between yards/feet and meters for distance measurements. This affects how distances are shown across sessions, equipment, and progress charts.',
      },
      {
        title: 'Coaching style',
        body: 'Choose how SwingVantage delivers feedback — Detailed (full technical explanations), Concise (short and direct), Encouragement (motivational tone), or Balanced.',
      },
      {
        title: 'Privacy controls',
        body: 'Control what community members can see about your profile, activity, and performance. You can set everything to private, or share selectively with followers.',
      },
      {
        title: 'Backup & Restore',
        body: 'The Backup & Restore section links to the Data Center where you can download or restore your SwingVantage data.',
      },
    ],
  },

  // ── Settings Backup ───────────────────────────────────────
  '/settings/backup': {
    id: '/settings/backup',
    pageTitle: 'Backup & Restore',
    intro: 'Download a complete backup of your SwingVantage data, or restore from a previous backup file.',
    steps: [
      {
        title: 'Downloading a backup',
        body: 'Tap "Download Backup" to save a file with all your sessions, profiles, equipment, and settings. Keep this file safe — you can use it to restore your progress later.',
      },
      {
        title: 'Restoring from backup',
        body: 'Upload a backup file to restore your data. You\'ll see a preview of what will be restored before confirming. This is how you transfer progress to a new device.',
      },
      {
        title: 'Merge vs. Replace',
        body: '"Merge" adds new records from the backup without removing your current data. "Replace" wipes your current data and restores the backup completely.',
      },
    ],
  },

  // ── Tutorial Center ───────────────────────────────────────
  '/tutorial': {
    id: '/tutorial',
    pageTitle: 'Tutorials',
    intro: 'The Tutorial Center is a collection of short videos — one for every feature — plus a guided path tailored to who you are: player, parent, coach, or team.',
    steps: [
      {
        title: 'Pick who you are',
        body: 'Choose Player, Parent, Coach, or Team. Your track is an ordered tutorial with just the videos that matter most for you. You can switch anytime.',
      },
      {
        title: 'Follow your track or browse freely',
        body: 'Press "Start tutorial" to go through your track top to bottom, or scroll down to "Browse every feature" and watch any single video on its own.',
      },
      {
        title: 'Watched progress is saved',
        body: 'Mark videos as watched and SwingVantage remembers — your track shows how far along you are. Progress is included in your backup like everything else.',
      },
      {
        title: 'Videos and written steps',
        body: 'Each video has a written step-by-step guide underneath. Those steps work even before a recording is added, so you can learn right now.',
      },
      {
        title: 'Skip anytime',
        body: 'Prefer to explore on your own? Use "Skip the tutorial" at the top. We will stop nudging you, and you can always come back from the Tutorials link in the menu.',
      },
    ],
  },
};

/**
 * Look up tutorial content for a given route path.
 * Falls back to the closest parent route if an exact match is not found.
 */
export function getTutorialForRoute(pathname: string): TutorialContent | null {
  if (TUTORIAL_REGISTRY[pathname]) return TUTORIAL_REGISTRY[pathname];
  // Try progressively shorter paths
  const parts = pathname.split('/').filter(Boolean);
  while (parts.length > 0) {
    parts.pop();
    const key = '/' + parts.join('/');
    if (TUTORIAL_REGISTRY[key]) return TUTORIAL_REGISTRY[key];
  }
  return TUTORIAL_REGISTRY['/'] ?? null;
}
