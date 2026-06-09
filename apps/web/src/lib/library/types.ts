// ============================================================
// SwingVantage — Video Library: Types
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The Video Library is the one place to browse every video: the quick
//   "feature walkthroughs" (reused from the Tutorial Center) PLUS deeper
//   "training & instruction" videos you add over time (drills, launch-
//   monitor deep-dives, coach/parent guides, pro film study).
//
//   This file defines the shared shape every library card speaks
//   (`LibraryItem`) and the category system the hub is organized by. The
//   aggregator (index.ts) maps both sources into this one shape so the UI
//   stays simple.
// ============================================================

/** Top-level grouping shown as the two main rails in the hub. */
export type LibraryGroup = 'walkthroughs' | 'training';

/**
 * Library categories. `feature-walkthroughs` is the whole Tutorial Center
 * set; the rest are the training tracks you'll grow over time.
 */
export type LibraryCategory =
  | 'feature-walkthroughs'
  | 'feature-deepdive'
  | 'drills-technique'
  | 'launch-monitor-data'
  | 'coach-parent'
  | 'pro-film-study';

export type LibrarySport =
  | 'all'
  | 'golf'
  | 'tennis'
  | 'pickleball'
  | 'padel'
  | 'baseball'
  | 'softball_slow'
  | 'softball_fast';

export interface LibraryCategoryMeta {
  id: LibraryCategory;
  group: LibraryGroup;
  label: string;
  blurb: string;
  /** lucide-react icon name resolved in the UI. */
  icon: string;
}

/** The single shape every card/player in the library renders from. */
export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  group: LibraryGroup;
  category: LibraryCategory;
  sport: LibrarySport;
  /** Display label like "2:30". */
  durationLabel: string;
  durationSec?: number;
  /** Playable file (mp4). Undefined => honest "coming soon" + transcript. */
  mp4Src?: string;
  webmSrc?: string;
  poster?: string;
  /** WebVTT captions track, when available. */
  captionsSrc?: string;
  /** YouTube/Vimeo URL alternative to a file source. */
  embedUrl?: string;
  /** Narration / written walkthrough — doubles as transcript + fallback. */
  script: string[];
  /** In-app route this video is about ("Open this feature"). */
  route?: string;
  /** True once a real recording exists. */
  hasRecording: boolean;
  /** Where the item came from. */
  source: 'tutorial' | 'training';
  /**
   * Listed on the PUBLIC /learn pages + sitemaps (the SEO/AEO/GEO surface).
   * The in-app /library shows every item regardless; this only gates public
   * exposure, so new training videos can be rolled out gradually.
   */
  public: boolean;
  /** Free-text tags for search. */
  tags: string[];
}

/** Category metadata + display order for the hub. */
export const LIBRARY_CATEGORIES: LibraryCategoryMeta[] = [
  {
    id: 'feature-walkthroughs',
    group: 'walkthroughs',
    label: 'Feature Walkthroughs',
    blurb: 'A short, guided video for every feature in SwingVantage.',
    icon: 'PlayCircle',
  },
  {
    id: 'feature-deepdive',
    group: 'training',
    label: 'Feature Deep-Dives',
    blurb: 'Go deeper on the features that reward a closer look.',
    icon: 'Layers',
  },
  {
    id: 'launch-monitor-data',
    group: 'training',
    label: 'Launch Monitor & Data',
    blurb: 'Get the most from your numbers — import, read, and act on them.',
    icon: 'Gauge',
  },
  {
    id: 'drills-technique',
    group: 'training',
    label: 'Drills & Technique',
    blurb: 'Instructional drill demos and technique breakdowns by sport.',
    icon: 'Dumbbell',
  },
  {
    id: 'coach-parent',
    group: 'training',
    label: 'Coaching & Parent Guides',
    blurb: 'Coach with SwingVantage and guide young athletes with confidence.',
    icon: 'Users',
  },
  {
    id: 'pro-film-study',
    group: 'training',
    label: 'Pro Swing & Film Study',
    blurb: 'Breakdowns and film-study sessions to train your eye.',
    icon: 'Clapperboard',
  },
];

export const LIBRARY_CATEGORY_ORDER: LibraryCategory[] = LIBRARY_CATEGORIES.map((c) => c.id);

export const SPORT_LABELS: Record<LibrarySport, string> = {
  all: 'All sports',
  golf: 'Golf',
  tennis: 'Tennis',
  pickleball: 'Pickleball',
  padel: 'Padel',
  baseball: 'Baseball',
  softball_slow: 'Softball (slow-pitch)',
  softball_fast: 'Softball (fast-pitch)',
};

export function getCategoryMeta(id: LibraryCategory): LibraryCategoryMeta | undefined {
  return LIBRARY_CATEGORIES.find((c) => c.id === id);
}
