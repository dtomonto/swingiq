// ============================================================
// SwingVantage — Batch video config
// One entry per tutorial id: narration (spoken track) + scenes
// (what to show on screen). Narration mirrors the written
// walkthrough in lib/tutorial/videos.ts so voice and on-screen
// step-by-step stay in sync. Scenes are best-effort: interactions
// use tryClick so a missed selector never breaks the recording.
// ============================================================

export const GROUPS = {
  'getting-started': ['start-here', 'dashboard', 'switch-sport', 'navigation'],
  core: ['diagnose', 'progress', 'sessions', 'compare', 'drills', 'training', 'fix-stack', 'ai-coach'],
  analyze: ['video-analysis', 'motion-lab', 'avatar', 'import-data', 'import-image', 'practice-schedule', 'pre-round'],
  'progress-share': ['player-arc', 'retest', 'milestones', 'labs', 'benchmarks', 'reports', 'coach-summary', 'parent-summary'],
  'account-community': ['profile', 'equipment', 'community', 'badges', 'challenges', 'leaderboard', 'groups', 'data-center', 'settings'],
};

// Shared "tour a page" scene: settle, slow-scroll down to reveal content,
// pause, then ease back to the top. ~22s to roughly match a 4-line narration.
async function tourPage(h, route) {
  await h.go(route);
  await h.dwell(2400);
  await h.gentleScroll(6500, 0.55);
  await h.dwell(2000);
  await h.gentleScroll(5500, 0.95);
  await h.dwell(1800);
  await h.scrollTop(1600);
  await h.dwell(1200);
}

export const VIDEO_CONFIG = {
  'start-here': {
    narration: [
      'Open Start Here from the menu. Pick every sport you play — you can switch between them anytime.',
      'Tell us who this is for: a player, a parent helping a young athlete, a coach, or a team. This tailors the tone and safety reminders.',
      'Choose how to begin: answer a couple of questions, upload a video, or import data. The quiz is the fastest route to a first result.',
      'You will get a top thing to work on, a confidence level, three beginner-safe drills, and a seven-day plan.',
      'Used SwingVantage before? Use Skip setup to jump straight to your dashboard.',
    ].join(' '),
    async scenes(h) {
      await h.go('/start');
      await h.dwell(2600);
      await h.clickText('Golf'); await h.dwell(700);
      await h.clickText('Tennis'); await h.dwell(1400);
      await h.tryClick(h.page.getByRole('button', { name: /Continue/i })); await h.dwell(2600);
      await h.gentleScroll(3500, 0.5); await h.dwell(1500);
      await h.tryClick(h.page.getByRole('button', { name: /Continue/i })); await h.dwell(2600);
      await h.gentleScroll(3000, 0.5); await h.dwell(2000);
    },
  },

  dashboard: {
    narration: [
      'The dashboard is Today. Everything here is filtered to your active sport.',
      'Up top you will see your recommended next action — the single best thing to do right now.',
      'Below that: recent sessions, how your key metrics are trending, and your streak and achievements.',
      'Tap any card to dive deeper. The dashboard is always your home base — the SwingVantage logo brings you back here.',
    ].join(' '),
    async scenes(h) {
      await h.go('/dashboard');
      await h.dwell(3200);
      await h.gentleScroll(7000, 0.9);
      await h.dwell(1800);
      await h.scrollTop(1400);
      await h.dwell(1500);
    },
  },

  'switch-sport': {
    narration: [
      'SwingVantage supports golf, tennis, baseball, slow-pitch and fast-pitch softball.',
      'Use the sport switcher near the bottom of the side menu to change your active sport.',
      'Each sport keeps its own profile, sessions, drills, and progress — nothing gets mixed together.',
      'Switching sport instantly re-tailors the whole app: labels, metrics, drills, and coaching all follow the sport you choose.',
    ].join(' '),
    async scenes(h) {
      await h.go('/dashboard');
      await h.dwell(2600);
      // Open the active-sport switcher in the sidebar and dwell on the
      // sport list + "kept per sport" explanation (a fresh guest has only
      // one sport active, so we showcase the switcher rather than swap).
      await h.tryClick(h.page.getByRole('button', { name: /Golf/i }).last()); await h.dwell(4500);
      await h.gentleScroll(3500, 0.55); await h.dwell(2500);
      await h.scrollTop(1200);
      await h.tryClick(h.page.getByRole('button', { name: /Golf/i }).last()); await h.dwell(3500);
    },
  },

  navigation: {
    narration: [
      'The side menu follows one path: Today, Analyze, Practice, Progress, then Share and Coach.',
      'Analyze, Practice, and Progress each expand to reveal more tools — tap the arrow to open a section.',
      'On a phone, tap the menu icon to open the same navigation.',
      'The question-mark Guide button on each screen explains exactly what you are looking at, in plain language.',
      'And the Tutorials link in the menu brings you right back here anytime.',
    ].join(' '),
    async scenes(h) {
      await h.go('/dashboard');
      await h.dwell(2600);
      await h.clickText('Analyze'); await h.dwell(2600);
      await h.clickText('Practice'); await h.dwell(2600);
      await h.clickText('Progress'); await h.dwell(2600);
      await h.tryClick(h.page.getByRole('link', { name: /Tutorials/i }).first()); await h.dwell(2600);
      await h.gentleScroll(3000, 0.5); await h.dwell(2000);
    },
  },

  // ── Core (data-rich; seeded sessions) ─────────────────────
  diagnose: {
    narration: [
      'Pick a session and SwingVantage finds the most significant patterns in your shots.',
      'Each issue gets a severity and a confidence score, so you know what to fix first.',
      'Your swing score rates the session consistency. It is built to track trends, not to define your ability.',
      'From here, jump straight to the recommended drills that target what the analysis found.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/diagnose'),
  },
  progress: {
    narration: [
      'Progress charts each key metric over time — carry, swing score, contact, and more.',
      'An upward trend on a positive metric means it is working. Flat or down tells you where to look.',
      'The metrics shown match your active sport, so you always see what matters for your game.',
      'Charts get more reliable with more sessions — five or more in a category shows a real trend.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/progress'),
  },
  sessions: {
    narration: [
      'Every session you log or import lives here, newest first.',
      'Open one to see shot-by-shot data, the issues found, the swing score, and recommended drills.',
      'Add a new session by logging it manually or importing from a launch monitor.',
      'Your session history powers everything: progress, streaks, challenges, and benchmarks.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/sessions'),
  },
  compare: {
    narration: [
      'Compare your metrics to benchmark data, or two of your own sessions side by side.',
      'Session-to-session comparison is perfect for checking whether a change actually helped.',
      'Benchmarks give context — where you stand and what good looks like at your level.',
      'Use it to settle the question: did that adjustment move the numbers, or just feel different?',
    ].join(' '),
    scenes: (h) => tourPage(h, '/compare'),
  },
  drills: {
    narration: [
      'Filter drills by your sport, skill level, and the issue you want to fix.',
      'Drills are grouped by what they target — path, face, timing, contact, and more.',
      'Start with the ones marked high-priority for your current diagnosis.',
      'Doing drills in a focused sequence beats doing random ones — quality over quantity.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/drills'),
  },
  training: {
    narration: [
      'Your plan highlights the highest-priority issue first, so practice time goes where it counts.',
      'Each focus area has specific drills. Work through them in order — they build on each other.',
      'Check off drills as you go. SwingVantage tracks your consistency and suggests when to retest.',
      'Practicing on consecutive days builds your streak, which earns XP and badges.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/training'),
  },
  'fix-stack': {
    narration: [
      'Today’s Fix gives you one clear thing to work on right now — no overwhelm.',
      'It is drawn from your most recent analysis and stacked in priority order.',
      'Do the fix, mark it done, and the next one moves up. Small steps, stacked daily, add up fast.',
      'Perfect for busy days or younger athletes who do best with a single focus.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/fix'),
  },
  'ai-coach': {
    narration: [
      'Ask the AI Coach any question, like why is my carry inconsistent, or what should I work on next.',
      'When you have sessions saved, the AI Coach can reference your actual data for more specific answers.',
      'It is great for explaining a metric, a drill, or a diagnosis in plain language.',
      'One limit to know: it does not watch your swing live. For that, use Video Analysis or Motion Lab.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/ai-coach'),
  },

  // ── Analyze + Practice ────────────────────────────────────
  'video-analysis': {
    narration: [
      'Film from a steady position — down-the-line or face-on. Keep the whole body in frame.',
      'Upload the clip on the Video Analysis screen. SwingVantage breaks the swing into phases and looks for common faults in each.',
      'Every finding comes with a plain-language explanation and how strongly we believe it — shown as a confidence level.',
      'Visual conclusions are labeled as estimates, not measurements. Use them as a smart starting point, not the final word.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/video'),
  },
  'motion-lab': {
    narration: [
      'Motion Lab estimates your body motion in 3D, right in the browser, from a normal video.',
      'Record or upload a swing and SwingVantage tracks key body points through the movement.',
      'Use it to see rotation, sequence, and timing that are hard to judge with the naked eye.',
      'Like all visual analysis, it is an estimate — great for spotting patterns and comparing before and after.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/motion-lab'),
  },
  avatar: {
    narration: [
      'The Swing Avatar turns your motion into a simple 3D figure you can orbit and replay.',
      'Stripping away the background makes positions and sequence much easier to see.',
      'Scrub through the phases to check positions at takeaway, top, and impact.',
      'It is a visualization aid — pair it with Diagnose or Video Analysis for the what-to-fix part.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/avatar'),
  },
  'import-data': {
    narration: [
      'Export a CSV from your launch monitor and drop it onto the import screen.',
      'SwingVantage reads the columns and maps them to the right metrics — carry, ball speed, launch, spin, and more.',
      'Review the preview to make sure everything mapped correctly, then save it as a session.',
      'Imported sessions feed your diagnosis, progress charts, and benchmarks — the more data, the sharper the picture.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/sessions/import'),
  },
  'import-image': {
    narration: [
      'Take a clear, well-lit photo of the data table on your launch monitor screen.',
      'Upload it and SwingVantage reads the numbers from the image automatically.',
      'Always check the extracted values for accuracy and fix any misreads before saving.',
      'It is the fastest way to capture a session when you cannot export a file.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/sessions/import/image'),
  },
  'practice-schedule': {
    narration: [
      'Tell SwingVantage how many days a week you practice and how long sessions run.',
      'You will get a day-by-day plan, each with a single clear focus.',
      'Sticking to the focus for each session is what drives real change.',
      'Adjust anytime — the schedule flexes around your week, not the other way around.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/practice'),
  },
  'pre-round': {
    narration: [
      'Before a round or game, get a quick warm-up tuned to your current focus.',
      'It activates the movements you have been practicing so they show up when it counts.',
      'It also surfaces early if your timing or contact is off, before the first shot matters.',
      'A few focused minutes here beats a generic warm-up every time.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/pre-round'),
  },

  // ── Progress + Share ──────────────────────────────────────
  'player-arc': {
    narration: [
      'Player Arc stitches your sessions into a narrative of how far you have come.',
      'It highlights breakthroughs, plateaus, and what changed around them.',
      'It is a motivating way to look back — especially for young athletes and the parents cheering them on.',
      'The more you practice and retest, the richer your arc becomes.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/arc'),
  },
  retest: {
    narration: [
      'A retest repeats an earlier check so you can compare apples to apples.',
      'SwingVantage shows the before and after side by side, with what moved.',
      'It is the honest way to know whether a swing change helped — not just felt good.',
      'Set a retest reminder so you actually circle back at the right time.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/retest'),
  },
  milestones: {
    narration: [
      'Milestones celebrate real progress — your tenth session, a seven-day streak, a new personal best.',
      'They are awarded automatically as you train, no setup needed.',
      'They are a great motivator for kids and a simple way for parents to see effort paying off.',
      'All milestones are saved in your backup, so your history is safe.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/milestones'),
  },
  labs: {
    narration: [
      'Labs is where new, forward-looking features live — readiness scores, a private player model, skill transfer, and benchmark mirrors.',
      'Some are early first versions, and each is honest about what it does and does not yet know.',
      'They build on your Player Arc and practice history.',
      'Explore them to get a peek at where your SwingVantage is heading.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/labs'),
  },
  benchmarks: {
    narration: [
      'Benchmarks show typical numbers by skill level and sport.',
      'They turn your data into context — not just my carry is two-thirty, but how that compares.',
      'Use them to set realistic targets for the next few weeks.',
      'Pair benchmarks with your progress charts to aim at the right next step.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/benchmarks'),
  },
  reports: {
    narration: [
      'Select one or more sessions and generate a report with metrics, issues, trends, and drills.',
      'Download it as a PDF or copy a summary to send to a coach.',
      'It gives whoever helps you the full context of what you have been working on.',
      'Reports are a simple bridge between solo practice and real coaching.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/reports'),
  },
  'coach-summary': {
    narration: [
      'As a coach, use reports to build a clear summary for each athlete you work with.',
      'Each summary captures the priorities, the data behind them, and the recommended drills.',
      'Share it before or after a lesson so everyone is on the same page.',
      'It is a lightweight way to keep a whole group moving in the same direction.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/reports'),
  },
  'parent-summary': {
    narration: [
      'SwingVantage is built for parent-guided youth practice — encouraging and safety-first.',
      'Your dashboard and Player Arc give a simple read on effort and progress, no jargon required.',
      'Focus on the streak and the single Today’s Fix — consistency matters more than intensity for young athletes.',
      'Generate a report to share with a coach, or just to celebrate how far your athlete has come.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/dashboard'),
  },

  // ── Account + Community + Data ────────────────────────────
  profile: {
    narration: [
      'Your profile tunes every recommendation to you — the more you add, the better the fit.',
      'For golf: handicap, scoring average, typical miss, and skill level.',
      'For tennis, baseball, and softball: position, swing side, level, and gear.',
      'A beginner needs different feedback than an advanced player — your profile is how SwingVantage knows the difference.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/profile'),
  },
  equipment: {
    narration: [
      'Add the gear you actually use — clubs, a bat, or a racket and string setup.',
      'For golf, lofts and carry distances let SwingVantage spot gapping issues between clubs.',
      'For bats and rackets, the specs help tailor advice to your equipment.',
      'It all saves to your backup, so you only enter it once.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/equipment'),
  },
  community: {
    narration: [
      'Community turns real training into momentum: experience points for sessions, streaks for showing up, badges for progress.',
      'Everything is tied to genuine effort — there are no shortcuts that skip the work.',
      'Your profile is private by default, and you choose what, if anything, to share.',
      'Youth athletes get extra privacy protections automatically.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/community'),
  },
  badges: {
    narration: [
      'Badges are earned automatically when you hit a goal — first session, week-long streak, a personal best.',
      'They are grouped by theme: consistency, improvement, sport mastery, even data protection.',
      'Locked badges show a progress bar so you can see what to chase next.',
      'They are a fun nudge to keep the good habits going.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/community/badges'),
  },
  challenges: {
    narration: [
      'Challenges are short goals powered by your real sessions — like five sessions in seven days.',
      'Tap Join and your sessions start counting automatically.',
      'Finishing earns experience points and often a badge.',
      'They are a great way to add a little structure and fun to a practice week.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/community/challenges'),
  },
  leaderboard: {
    narration: [
      'Rankings reward improvement and consistency, so beginners and pros can compete fairly.',
      'Your real name is never shown unless you choose to — you appear anonymous by default.',
      'You can opt out of leaderboards entirely in privacy settings.',
      'Youth athletes are never ranked against adults.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/community/leaderboard'),
  },
  groups: {
    narration: [
      'Join a group to train alongside athletes who share your sport.',
      'Public groups you can join instantly; private ones need an invite.',
      'Many groups run their own challenges with exclusive badges.',
      'For coaches and programs, groups are a simple home base for a roster.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/community/groups'),
  },
  'data-center': {
    narration: [
      'SwingVantage saves your data on your device and syncs it to your account, so your progress is safe across devices.',
      'Tap Download Backup to save a complete copy: sessions, profiles, equipment, progress, and badges.',
      'You can password-protect the file. Keep that password safe — without it, an encrypted backup cannot be recovered.',
      'To restore, upload the file and preview what comes back. Use Merge to add without deleting, or Replace for a full reset.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/data'),
  },
  settings: {
    narration: [
      'Switch between twenty languages — the whole app updates instantly.',
      'Choose yards and feet or meters for every distance.',
      'Pick a coaching style: detailed, concise, encouraging, or balanced.',
      'Set privacy controls for what, if anything, the community can see. Your preferences travel in your backup.',
    ].join(' '),
    scenes: (h) => tourPage(h, '/settings'),
  },
};
