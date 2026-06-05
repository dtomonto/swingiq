// ============================================================
// SwingVantage — Workflow: Contextual Help
// ------------------------------------------------------------
// Page-aware, plain-English help. Explains what a screen does,
// the next action, and common mistakes. Short by design. Keyed
// by route so any page can ask "what should I do here?".
// ============================================================

import type { ContextualHelp } from '../types';

const HELP: Record<string, Omit<ContextualHelp, 'page'>> = {
  '/dashboard': {
    whatThisScreenDoes: 'Your home base — it shows your next step, latest finding, and progress at a glance.',
    nextAction: 'Start with the highlighted “next best step” at the top.',
    commonMistakes: ['Skipping the next step and jumping between pages.', 'Forgetting to log a new session after practicing.'],
    fastestPath: 'Follow the next-step card → practice → upload a follow-up → repeat.',
  },
  '/profile': {
    whatThisScreenDoes: 'Tells SwingVantage who you are so every tip is tailored — sport, skill level, goal, and tendencies.',
    nextAction: 'Fill in your sport, skill level, and one clear goal.',
    commonMistakes: ['Leaving the goal blank — it shapes your whole plan.', 'Picking a skill level much higher than reality.'],
    fastestPath: 'Name → sport → skill level → primary goal → save.',
  },
  '/sessions/import': {
    whatThisScreenDoes: 'Brings your launch-monitor data into SwingVantage so it can analyze your swing.',
    nextAction: 'Upload a CSV from your launch monitor, or enter a few shots by hand.',
    commonMistakes: ['Importing fewer than 5 shots.', 'Mixing several clubs in one session.'],
    fastestPath: 'Pick one club → import 5+ shots → run diagnosis.',
  },
  '/video': {
    whatThisScreenDoes: 'Analyzes a video of your swing phase-by-phase and finds your top priority.',
    nextAction: 'Upload a side-on or face-on video of a few clean reps.',
    commonMistakes: ['Filming from too far away.', 'Cutting off the bat/racket or the ball.'],
    fastestPath: 'Film side-on → upload → review your primary issue → start a drill.',
  },
  '/diagnose': {
    whatThisScreenDoes: 'Compares your data to target windows and ranks your biggest opportunity.',
    nextAction: 'Run the diagnosis on your most recent session.',
    commonMistakes: ['Running it on too little data.', 'Trying to fix everything at once.'],
    fastestPath: 'Select your session → run → take the #1 finding to Training.',
  },
  '/training': {
    whatThisScreenDoes: 'Turns your finding into a short, focused practice routine.',
    nextAction: 'Start the recommended routine and check off drills as you go.',
    commonMistakes: ['Switching focus before the current one improves.', 'Skipping the re-test.'],
    fastestPath: 'Do the drills → re-test with the same setup → compare.',
  },
};

export function getContextualHelp(page: string): ContextualHelp {
  const found = HELP[page] ?? HELP['/dashboard'];
  return { page, ...found };
}

export function hasContextualHelp(page: string): boolean {
  return page in HELP;
}
