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
};

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
};
