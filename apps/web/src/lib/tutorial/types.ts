// ============================================================
// SwingIQ — Contextual Tutorial Types
// Defines the shape of tutorial content, progress tracking,
// and the registry that maps routes to help content.
// ============================================================

export interface TutorialStep {
  title: string;
  body: string;
  /** Optional: which UI element to visually highlight (CSS selector or element ID) */
  highlightSelector?: string;
}

export interface TutorialContent {
  /** Unique ID — also used as the key for progress tracking */
  id: string;
  /** Human-readable page name (shown in the panel header) */
  pageTitle: string;
  /** Short intro paragraph shown at the top of the panel */
  intro: string;
  /** Ordered step-by-step guide for this screen */
  steps: TutorialStep[];
  /**
   * Optional sport-specific variant.
   * If provided, this tutorial only appears when the active sport matches.
   * Use 'all' for sport-agnostic screens.
   */
  sport?: 'golf' | 'tennis' | 'baseball' | 'softball_slow' | 'softball_fast' | 'all';
}

/**
 * Progress state stored in the user's app settings.
 * Tracks which tutorials have been viewed and dismissed.
 */
export interface TutorialProgress {
  /** IDs of tutorials the user has fully completed (step-by-step walk-through) */
  completed: string[];
  /** IDs of tutorials the user has explicitly dismissed without completing */
  dismissed: string[];
  /** ISO timestamps for when each tutorial was last opened */
  lastViewedAt: Record<string, string>;
}

export const DEFAULT_TUTORIAL_PROGRESS: TutorialProgress = {
  completed: [],
  dismissed: [],
  lastViewedAt: {},
};
