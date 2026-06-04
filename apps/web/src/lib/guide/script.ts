// ============================================================
// SwingIQ — Guide: Per-Page Script ("where to stand")
// ------------------------------------------------------------
// Turns the current route into a short, friendly script for the
// floating guide ("genie"): a title, 1–3 plain-English lines about
// what to do here, and an optional tip.
//
// It reuses the existing knowledge so there is ONE source of truth:
//   1. Hand-written overrides for the high-traffic journey pages
//      (warm, encouraging voice — this is what the genie "says").
//   2. The agent layer's contextual help (what the screen does +
//      the next action + the fastest path).
//   3. The contextual tutorial registry (page title + intro).
//   4. A safe generic fallback.
//
// Framework-agnostic (no React) so it can be unit tested and reused.
// ============================================================

import {
  getContextualHelp,
  hasContextualHelp,
} from '@/lib/agents/workflows/contextual-help';
import { getTutorialForRoute } from '@/lib/tutorial/content';
import { stageForPath, type JourneyStage } from './journey';

export interface GuideScript {
  /** Where this page sits in the Today → Share journey (null = off-path). */
  stage: JourneyStage | null;
  /** Friendly bubble title. */
  title: string;
  /** 1–3 short plain-English lines: what to do / where to stand here. */
  lines: string[];
  /** Optional one-liner tip (filming, data, etc.). */
  tip?: string;
  /** True when this page offers the live on-screen "stand here" overlay. */
  hasSetupOverlay?: boolean;
}

type Override = Omit<GuideScript, 'stage'>;

// Hand-written, on-brand copy for the pages that matter most. Longest
// matching key wins, so `/equipment/golf` beats `/equipment`.
const GUIDE_OVERRIDES: Record<string, Override> = {
  '/dashboard': {
    title: "Welcome — here's where to start",
    lines: [
      'This is your home base. Begin with the highlighted next step below.',
      'Everything is filtered to your active sport — switch sports any time from the sidebar.',
    ],
    tip: 'Brand new? Tap “Start Here” in the sidebar for a 2-minute setup.',
  },
  '/start': {
    title: "Let's get you set up",
    lines: [
      'Answer a couple of quick questions for a first focus in about 2 minutes.',
      'No video or data needed yet — you can add those later for a deeper read.',
    ],
  },
  '/diagnose': {
    title: 'Find your #1 thing to work on',
    lines: [
      'Pick your most recent session, then run the diagnosis.',
      'Take the top finding straight to Practice — fix one thing at a time.',
    ],
    tip: 'More data = more confident results. 5+ shots from one club works best.',
  },
  '/video': {
    title: 'Where to stand & how to film',
    lines: [
      'Upload a short, clean clip — one good rep beats a long video.',
      'Film side-on or face-on, and keep your whole body and equipment in frame.',
    ],
    tip: 'Want a live framing guide? Use Motion Lab (3D) to record in-app with an on-screen outline.',
  },
  '/motion-lab': {
    title: 'Stand inside the outline',
    lines: [
      'Choose Record or Upload. If you record, an on-screen box shows exactly where to stand.',
      'Keep your whole body and equipment inside the frame from start to finish.',
    ],
    tip: 'Steady the camera (prop your phone or use a tripod) and use even lighting.',
    hasSetupOverlay: true,
  },
  '/avatar': {
    title: 'Your 3D swing avatar',
    lines: [
      'See your motion as a 3D figure you can rotate and scrub.',
      'Works best after you’ve recorded or uploaded a swing.',
    ],
  },
  '/ai-coach': {
    title: 'Ask anything',
    lines: [
      'Type any question about your swing, a metric, or what to do next.',
      'It answers from the sessions you’ve saved — it doesn’t watch you live.',
    ],
  },
  '/sessions/import': {
    title: 'Bring in your data',
    lines: [
      'Upload a CSV from your launch monitor, or type in a few shots by hand.',
      'One club with 5+ shots gives the cleanest first read.',
    ],
  },
  '/training': {
    title: 'Your focused practice plan',
    lines: [
      'Start the recommended routine and check off drills as you go.',
      'Stick with one focus until it improves — then re-test to confirm.',
    ],
  },
  '/fix': {
    title: 'Your Fix Stack',
    lines: [
      'Your fixes are stacked in priority order. Work the top one first.',
      'Each fix links straight to the drills that address it.',
    ],
  },
  '/drills': {
    title: 'The drill library',
    lines: [
      'Browse drills by your sport and the issue you’re fixing.',
      'Start with the ones marked high-priority for your current focus.',
    ],
  },
  '/practice': {
    title: 'Plan your week',
    lines: [
      'Tell SwingIQ your days and time; it suggests what to work on each day.',
      'Each session gets one clear focus.',
    ],
  },
  '/pre-round': {
    title: 'Warm up with purpose',
    lines: [
      'A short warm-up built around what you’ve been practicing.',
      'It primes your timing before you play.',
    ],
  },
  '/progress': {
    title: 'See your trend',
    lines: [
      'These charts track your key metrics over time.',
      'Log a few sessions (5+) before reading too much in — early on it’s noisy.',
    ],
  },
  '/arc': {
    title: 'Your player arc',
    lines: [
      'The longer story: where you started and where you’re heading.',
      'It fills in as you log more sessions and re-tests.',
    ],
  },
  '/retest': {
    title: 'Re-test to prove it stuck',
    lines: [
      'Re-record or re-enter using the same setup you used before.',
      'Matching the original conditions keeps the before/after honest.',
    ],
  },
  '/milestones': {
    title: 'Your milestones',
    lines: [
      'These mark real moments — first session, streaks, personal bests.',
      'They’re saved in your backup.',
    ],
  },
  '/labs': {
    title: 'SwingIQ Labs',
    lines: [
      'Experimental views: readiness, player model, skill transfer, and more.',
      'They sharpen as you add sessions — treat them as directional.',
    ],
  },
  '/benchmarks': {
    title: 'How you compare',
    lines: [
      'Stack your numbers against benchmarks for context.',
      'Use it to spot your biggest opportunity, not to chase one number.',
    ],
  },
  '/compare': {
    title: 'Compare side by side',
    lines: [
      'Put two of your sessions (or a reference) next to each other.',
      'Handy for checking whether a change actually helped.',
    ],
  },
  '/reports': {
    title: 'Share with a coach',
    lines: [
      'Bundle a session into a clean report to share or print.',
      'Great for getting a real coach’s eyes on your work.',
    ],
  },
  '/profile': {
    title: 'Tell SwingIQ about you',
    lines: [
      'Set your sport, skill level, and one clear goal — it shapes every tip.',
      'The more you fill in, the more tailored your coaching gets.',
    ],
  },
  '/equipment': {
    title: 'Your gear',
    lines: [
      'Add the bat, racquet, or clubs you use.',
      'Knowing your gear lets SwingIQ spot gaps and fit issues.',
    ],
  },
  '/equipment/golf': {
    title: 'Your bag',
    lines: [
      'Add each club with its loft and typical carry if you know them.',
      'SwingIQ uses this to check your gapping and equipment fit.',
    ],
  },
  '/community': {
    title: 'Stay motivated',
    lines: [
      'Streaks, badges, and challenges are powered by your real practice.',
      'It’s private by default — you choose what’s shared.',
    ],
  },
  '/data': {
    title: 'Protect your progress',
    lines: [
      'Your data lives in this browser. Download a backup so it’s safe.',
      'You can restore it on any device from that backup file.',
    ],
    tip: 'No account needed — your backup file is your save file.',
  },
  '/settings': {
    title: 'Make it yours',
    lines: [
      'Set your language, units, and coaching tone here.',
      'Your privacy controls live here too.',
    ],
  },
};

/** Longest-prefix match over the override table (exact match wins). */
function matchOverride(pathname: string): Override | null {
  let best: { ov: Override; len: number } | null = null;
  for (const key of Object.keys(GUIDE_OVERRIDES)) {
    const isMatch = pathname === key || pathname.startsWith(key + '/');
    if (isMatch && (!best || key.length > best.len)) {
      best = { ov: GUIDE_OVERRIDES[key]!, len: key.length };
    }
  }
  return best?.ov ?? null;
}

/**
 * Build the guide script for a route. Always returns something usable.
 */
export function getGuideScript(pathname: string): GuideScript {
  const stage = stageForPath(pathname);

  const override = matchOverride(pathname);
  if (override) return { stage, ...override };

  // Fall back to the agent layer's contextual help (has an explicit next action).
  if (hasContextualHelp(pathname)) {
    const help = getContextualHelp(pathname);
    const tutorial = getTutorialForRoute(pathname);
    return {
      stage,
      title: tutorial?.pageTitle ?? 'Here’s where to start',
      lines: [help.whatThisScreenDoes, help.nextAction].filter(Boolean),
      tip: help.fastestPath ? `Fastest path: ${help.fastestPath}` : undefined,
    };
  }

  // Fall back to the contextual tutorial registry (prefix-aware itself).
  const tutorial = getTutorialForRoute(pathname);
  if (tutorial) {
    const lines = [tutorial.intro, tutorial.steps[0]?.body].filter(Boolean) as string[];
    return { stage, title: tutorial.pageTitle, lines: lines.slice(0, 2) };
  }

  // Last resort.
  return {
    stage,
    title: 'Your guide',
    lines: [
      'Not sure where to go next? Follow the highlighted next step on your dashboard.',
      'You can reopen this guide any time from the corner.',
    ],
  };
}
