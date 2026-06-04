// ============================================================
// SwingIQ — Guide: The Journey Map
// ------------------------------------------------------------
// One clear path through the product, mirrored from the sidebar's
// "Your Journey": Today → Analyze → Practice → Progress → Share.
//
// The floating guide ("genie") uses this to show the user WHERE
// THEY ARE in the journey and what the next stop is — so the app
// always feels like a guided path, not a pile of features.
//
// Framework-agnostic (no React) so it can be unit tested and reused.
// ============================================================

export type JourneyStage = 'today' | 'analyze' | 'practice' | 'progress' | 'share';

export interface JourneyStep {
  stage: JourneyStage;
  /** Short label shown in the mini stepper. */
  label: string;
  /** The home page for this stage. */
  href: string;
}

/** The five stops, in order. Matches the sidebar journey buckets. */
export const JOURNEY_STEPS: readonly JourneyStep[] = [
  { stage: 'today', label: 'Today', href: '/dashboard' },
  { stage: 'analyze', label: 'Analyze', href: '/diagnose' },
  { stage: 'practice', label: 'Practice', href: '/training' },
  { stage: 'progress', label: 'Progress', href: '/progress' },
  { stage: 'share', label: 'Share', href: '/reports' },
] as const;

// Which route prefixes belong to which stage. Longest-prefix wins, so
// `/sessions/import` (analyze) beats `/sessions` (progress).
const STAGE_PREFIXES: ReadonlyArray<readonly [JourneyStage, string]> = [
  ['today', '/dashboard'],

  ['analyze', '/diagnose'],
  ['analyze', '/motion-lab'],
  ['analyze', '/video'],
  ['analyze', '/avatar'],
  ['analyze', '/ai-coach'],
  ['analyze', '/sessions/import'],
  ['analyze', '/sessions/log'],
  ['analyze', '/sessions/new'],

  ['practice', '/training'],
  ['practice', '/fix'],
  ['practice', '/drills'],
  ['practice', '/practice'],
  ['practice', '/pre-round'],

  ['progress', '/progress'],
  ['progress', '/arc'],
  ['progress', '/sessions'],
  ['progress', '/retest'],
  ['progress', '/milestones'],
  ['progress', '/labs'],
  ['progress', '/compare'],
  ['progress', '/benchmarks'],

  ['share', '/reports'],
];

/** True when `pathname` is the prefix itself or a child of it. */
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

/**
 * The journey stage for a route, or null for pages that sit outside the
 * core path (profile, equipment, community, settings, start, …).
 */
export function stageForPath(pathname: string): JourneyStage | null {
  let best: { stage: JourneyStage; len: number } | null = null;
  for (const [stage, prefix] of STAGE_PREFIXES) {
    if (matchesPrefix(pathname, prefix) && (!best || prefix.length > best.len)) {
      best = { stage, len: prefix.length };
    }
  }
  return best?.stage ?? null;
}

/** The 1-based position of a stage in the journey (1–5), or null. */
export function stageIndex(stage: JourneyStage | null): number | null {
  if (!stage) return null;
  const i = JOURNEY_STEPS.findIndex((s) => s.stage === stage);
  return i < 0 ? null : i + 1;
}
