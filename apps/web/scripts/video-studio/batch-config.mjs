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
};

// Shared "tour a page" scene: settle, slow-scroll down to reveal content,
// pause, then ease back to the top. ~26s to roughly match a 4-line narration.
async function tourPage(h, route) {
  await h.go(route);
  await h.dwell(3000);
  await h.gentleScroll(9000, 0.55);
  await h.dwell(2500);
  await h.gentleScroll(7000, 0.95);
  await h.dwell(2500);
  await h.scrollTop(2000);
  await h.dwell(1800);
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
};
