// ============================================================
// SwingVantage — Video Library: public surface + aggregator
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Combines the two video sources into ONE library:
//     1. Feature Walkthroughs — read (not duplicated) from the Tutorial
//        Center catalogue (lib/tutorial/videos.ts).
//     2. Training & Instruction — the growing catalogue in training-videos.ts.
//   Plus the search/filter/group helpers the hub UI uses.
//
//   It only READS the tutorial catalogue, so the two systems never collide.
// ============================================================

import {
  TUTORIAL_VIDEOS,
  hasRecording as tutorialHasRecording,
  getVideoSourceKind,
} from '@/lib/tutorial/videos';
import { getTrainingItems } from './training-videos';
import {
  type LibraryItem,
  type LibraryCategory,
  type LibrarySport,
  LIBRARY_CATEGORIES,
  LIBRARY_CATEGORY_ORDER,
} from './types';

export * from './types';
export { TRAINING_VIDEOS } from './training-videos';

/** Parse an "m:ss" label to seconds (best-effort). */
function labelToSeconds(label: string): number | undefined {
  const m = label.match(/^(\d+):(\d{1,2})$/);
  if (!m) return undefined;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Map the Tutorial Center catalogue into LibraryItems (feature walkthroughs). */
function featureWalkthroughs(): LibraryItem[] {
  return TUTORIAL_VIDEOS.map((v) => {
    const recorded = tutorialHasRecording(v);
    const isFile = getVideoSourceKind(v.videoUrl) === 'file';
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      group: 'walkthroughs',
      category: 'feature-walkthroughs',
      sport: 'all',
      durationLabel: v.duration,
      durationSec: labelToSeconds(v.duration),
      mp4Src: v.mp4Src ?? (isFile ? v.videoUrl : undefined),
      webmSrc: v.webmSrc,
      poster: v.poster,
      captionsSrc: v.captionsSrc,
      embedUrl: !isFile ? v.videoUrl : undefined,
      script: v.script,
      route: v.route,
      hasRecording: recorded,
      source: 'tutorial',
      // Feature walkthroughs are already public on /learn — keep them listed.
      public: true,
      tags: [v.category, ...v.title.toLowerCase().split(/\s+/)],
    };
  });
}

/** Every library item: feature walkthroughs first, then training. */
export function getLibraryItems(): LibraryItem[] {
  return [...featureWalkthroughs(), ...getTrainingItems()];
}

/**
 * Items exposed on the PUBLIC /learn pages + sitemaps. The in-app /library
 * always shows everything (getLibraryItems); this filter lets new training
 * videos land in the app immediately but roll out to search gradually
 * (flip a seed's `public` to true to publish its /learn page).
 */
export function getLearnItems(items: LibraryItem[] = getLibraryItems()): LibraryItem[] {
  return items.filter((i) => i.public);
}

export interface LibrarySection {
  category: LibraryCategory;
  label: string;
  blurb: string;
  icon: string;
  group: LibraryItem['group'];
  items: LibraryItem[];
}

/** Items grouped into sections in display order (empty sections kept so the
 *  hub shows a "coming soon" home for categories you'll fill later). */
export function getLibrarySections(items: LibraryItem[] = getLibraryItems()): LibrarySection[] {
  return LIBRARY_CATEGORY_ORDER.map((category) => {
    const meta = LIBRARY_CATEGORIES.find((c) => c.id === category)!;
    return {
      category,
      label: meta.label,
      blurb: meta.blurb,
      icon: meta.icon,
      group: meta.group,
      items: items.filter((i) => i.category === category),
    };
  });
}

export interface LibraryFilter {
  query?: string;
  category?: LibraryCategory | 'all';
  sport?: LibrarySport;
  /** Only items that have a real recording. */
  recordedOnly?: boolean;
}

/** Filter + search across the library. Text matches title/description/tags. */
export function searchLibrary(items: LibraryItem[], filter: LibraryFilter): LibraryItem[] {
  const q = filter.query?.trim().toLowerCase();
  return items.filter((i) => {
    if (filter.category && filter.category !== 'all' && i.category !== filter.category) return false;
    if (filter.sport && filter.sport !== 'all' && i.sport !== 'all' && i.sport !== filter.sport) return false;
    if (filter.recordedOnly && !i.hasRecording) return false;
    if (q) {
      const hay = `${i.title} ${i.description} ${i.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export interface LibraryStats {
  total: number;
  recorded: number;
  walkthroughs: number;
  training: number;
}

export function getLibraryStats(items: LibraryItem[] = getLibraryItems()): LibraryStats {
  return {
    total: items.length,
    recorded: items.filter((i) => i.hasRecording).length,
    walkthroughs: items.filter((i) => i.group === 'walkthroughs').length,
    training: items.filter((i) => i.group === 'training').length,
  };
}
