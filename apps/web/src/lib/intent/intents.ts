// ============================================================
// SwingVantage — Improve Intents (the low-cognition front door)
// ------------------------------------------------------------
// The plan (§5.1) wants the app entry to ask ONE simple question —
// "What do you want to improve today?" — and route straight into the existing
// flow, instead of fanning out every feature at once. These are the canonical,
// sport-agnostic destinations (the analyzer at /video dispatches by the active
// sport, so a single href covers all 7 sports). Kept here as plain data so the
// routes live in one auditable, testable place.
// ============================================================

export type ImproveIntentId = 'analyze' | 'import' | 'progress';

export interface ImproveIntent {
  id: ImproveIntentId;
  label: string;
  /** One welcoming line on what happens next. */
  description: string;
  /** Internal route. /video dispatches to the right sport analyzer. */
  href: string;
  /** Icon key resolved by the picker (keeps this module React-free). */
  icon: 'video' | 'upload' | 'trending';
}

export const IMPROVE_INTENTS: ImproveIntent[] = [
  {
    id: 'analyze',
    label: 'Analyze a swing',
    description: 'Upload or record — get your #1 fix',
    href: '/video',
    icon: 'video',
  },
  {
    id: 'import',
    label: 'Import session data',
    description: 'A launch-monitor CSV or a photo of the screen',
    href: '/sessions/import',
    icon: 'upload',
  },
  {
    id: 'progress',
    label: 'See my progress',
    description: 'Your trend, retests, and what changed',
    href: '/progress',
    icon: 'trending',
  },
];
