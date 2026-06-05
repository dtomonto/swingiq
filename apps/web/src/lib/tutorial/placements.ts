// ============================================================
// SwingVantage — Tutorial Video Placement Registry
// ------------------------------------------------------------
// The single source of truth for WHERE each tutorial video appears
// in the product, what CTA copy to use, and how it should behave.
// Components render a placement with:
//
//     <TutorialVideo placement="home-hero" />
//
// which looks the video up here and in the manifest (videos.ts).
// Keeping placements here (not scattered through JSX) means the
// "tutorial video map" is reviewable in one file and trivially
// extensible — add an entry, drop the component in, done.
// ============================================================

import { getVideoById, type TutorialVideo, type TutorialJourneyStage } from './videos';

/** How the placement is shown. */
export type PlacementDisplay =
  | 'inline' // full 16:9 player block (hero, upload, results lead)
  | 'card'; // compact thumbnail + title + CTA (empty/error states, sidebars)

/** What makes it appear / play. We never force playback. */
export type PlacementTrigger =
  | 'click-to-play' // poster-first, user taps play (default, recommended)
  | 'muted-autoplay'; // muted, in-view only, motion-allowed (ambient hero loops)

export interface TutorialPlacement {
  /** Stable placement id, e.g. 'home-hero'. Used in analytics + <TutorialVideo placement>. */
  id: string;
  /** Which manifest video (by id) this placement shows. */
  videoId: string;
  /** Strong, action-oriented CTA microcopy. */
  cta: string;
  /** Short helper line under the CTA / on the card. */
  blurb?: string;
  /** Route or surface this lives on, for analytics + docs. */
  page: string;
  /** Human description of the exact location (docs only). */
  location: string;
  display: PlacementDisplay;
  trigger: PlacementTrigger;
  journeyStage: TutorialJourneyStage;
  /** Captions are required for accuracy/accessibility at this moment. */
  captionsRequired: boolean;
}

export const TUTORIAL_PLACEMENTS: TutorialPlacement[] = [
  {
    id: 'home-hero',
    videoId: 'welcome',
    cta: 'See how it works',
    blurb: 'A 60-second look at turning a swing video into your top fix.',
    page: '/',
    location: 'Marketing homepage, directly under the hero CTAs',
    display: 'inline',
    trigger: 'click-to-play',
    journeyStage: 'discover',
    captionsRequired: true,
  },
  {
    id: 'upload-record',
    videoId: 'video-analysis',
    cta: 'Watch how to record your swing',
    blurb: 'Camera angle, framing, and lighting that get a confident read.',
    page: '/video',
    location: 'Swing analyzer upload step, beside the recording guide',
    display: 'inline',
    trigger: 'click-to-play',
    journeyStage: 'capture',
    captionsRequired: true,
  },
  {
    id: 'results-read',
    videoId: 'diagnose',
    cta: 'See how to read your analysis',
    blurb: 'What the scores, confidence, and next steps actually mean.',
    page: '/video',
    location: 'Swing analyzer results, above the transparency panel',
    display: 'card',
    trigger: 'click-to-play',
    journeyStage: 'understand',
    captionsRequired: true,
  },
  {
    id: 'dashboard-tour',
    videoId: 'dashboard',
    cta: 'Take the 2-minute tour',
    blurb: 'Find your focus, recent sessions, and what to do next.',
    page: '/dashboard',
    location: 'Dashboard, first-run helper card',
    display: 'card',
    trigger: 'click-to-play',
    journeyStage: 'onboard',
    captionsRequired: false,
  },
  {
    id: 'drills-howto',
    videoId: 'drills',
    cta: 'Learn how to practice with purpose',
    blurb: 'Turn your top fix into a focused, doable plan.',
    page: '/drills',
    location: 'Drill library empty state',
    display: 'card',
    trigger: 'click-to-play',
    journeyStage: 'improve',
    captionsRequired: false,
  },
  {
    id: 'progress-howto',
    videoId: 'progress',
    cta: 'See how progress tracking works',
    blurb: 'Trends, comparisons, and streaks that prove improvement.',
    page: '/progress',
    location: 'Progress page empty / first-visit state',
    display: 'card',
    trigger: 'click-to-play',
    journeyStage: 'track',
    captionsRequired: false,
  },
  {
    id: 'upload-error-help',
    videoId: 'video-analysis',
    cta: 'Fix common upload issues',
    blurb: 'Angle, file size, and lighting problems — and how to solve them.',
    page: '/video',
    location: 'Upload error state',
    display: 'card',
    trigger: 'click-to-play',
    journeyStage: 'recover',
    captionsRequired: false,
  },
];

const PLACEMENT_BY_ID: Record<string, TutorialPlacement> = Object.fromEntries(
  TUTORIAL_PLACEMENTS.map((p) => [p.id, p]),
);

/** Look up a placement by id. */
export function getPlacement(id: string): TutorialPlacement | undefined {
  return PLACEMENT_BY_ID[id];
}

/** Resolve a placement to its placement + video together (both required to render). */
export function resolvePlacement(
  id: string,
): { placement: TutorialPlacement; video: TutorialVideo } | undefined {
  const placement = PLACEMENT_BY_ID[id];
  if (!placement) return undefined;
  const video = getVideoById(placement.videoId);
  if (!video) return undefined;
  return { placement, video };
}
