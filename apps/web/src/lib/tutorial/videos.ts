// ============================================================
// SwingVantage — Video Tutorial Library
// ------------------------------------------------------------
// The catalogue behind the Tutorial Center (/tutorial): one video
// per relevant feature, tagged by who it helps most, plus curated
// "tracks" that string the right videos together for each kind of
// user (player, parent, coach, team).
//
// HONEST BY DESIGN: a video only "plays" once a real recording URL
// is set on its entry. Until then the player shows a friendly
// "coming soon" card AND the written walkthrough below it — so the
// tutorial is fully usable as step-by-step instructions today, and
// lights up automatically as recordings are added.
//
// HOW TO ADD A RECORDING:
//   1. Find the video by `id` below.
//   2. Set `videoUrl` to a YouTube, Vimeo, or direct .mp4/.webm URL.
//   3. (Optional) Set `poster` to a thumbnail image URL.
//   Nothing else to wire — the Tutorial Center picks it up.
//
// The `script` array is the spoken/written walkthrough. It doubles
// as the recording script and the text fallback, so keep each line
// short, plain-spoken, and useful on its own.
// ============================================================

import RECORDINGS from './recordings.generated.json';
// The video catalogue is size-sharded into siblings (roadmap #20) so no single
// file exceeds ~600 lines. Spread back into RAW_TUTORIAL_VIDEOS in order below.
import { RAW_VIDEOS_1 } from './videos-raw-1';
import { RAW_VIDEOS_2 } from './videos-raw-2';

/** Who a video is written for. Mirrors the onboarding USER_TYPES. */
export type TutorialAudience = 'athlete' | 'parent' | 'coach' | 'team';

/** Top-level grouping shown as sections in the full library. */
export type TutorialCategory =
  | 'getting-started'
  | 'analyze'
  | 'practice'
  | 'progress'
  | 'share'
  | 'account'
  | 'community'
  | 'data';

/**
 * Where a video sits in the first-use → repeat-use journey. Used by the
 * inline placements (homepage, upload, results …) and tagged onto every
 * analytics event so we can see which moment a tutorial helped at.
 */
export type TutorialJourneyStage =
  | 'discover' // what is this / why care (marketing, hero)
  | 'onboard' // first run, find your way around
  | 'capture' // record / upload a swing
  | 'understand' // read the AI analysis
  | 'improve' // turn analysis into practice
  | 'track' // measure progress over time
  | 'recover'; // something went wrong — get unstuck

export const JOURNEY_STAGE_ORDER: TutorialJourneyStage[] = [
  'discover',
  'onboard',
  'capture',
  'understand',
  'improve',
  'track',
  'recover',
];

export interface TutorialVideo {
  /** Stable unique id — also the key used for "watched" progress. */
  id: string;
  /** Short human title shown on the card and player. */
  title: string;
  /** One-line description of what the video covers. */
  description: string;
  /** Which users this video helps most. Use 'all' for everyone. */
  audiences: TutorialAudience[] | 'all';
  /** Section grouping in the full library. */
  category: TutorialCategory;
  /** Approx length, e.g. "2:30". Shown as a hint even before recording. */
  duration: string;
  /** In-app feature this video is about — used for the "Open this feature" link. */
  route?: string;
  /**
   * The recording. Empty/undefined => player shows "coming soon" + the
   * written walkthrough. Supports YouTube, Vimeo, or a direct video file URL.
   */
  videoUrl?: string;
  /** Optional thumbnail/poster image URL. */
  poster?: string;
  /** Plain-language walkthrough. Recording script + text fallback. */
  script: string[];

  // ── Inline placement metadata (all optional, backward-compatible) ──
  // These light up the in-context inline player (TutorialVideo.tsx). Until
  // file sources are set, placements render the honest "coming soon" card
  // plus the written script above — so they are useful today.

  /** Where this sits in the first-use → repeat-use journey. */
  journeyStage?: TutorialJourneyStage;
  /** WebM source (smaller/efficient where supported), e.g. /tutorials/sources/welcome.webm */
  webmSrc?: string;
  /** MP4/H.264 source (broad compatibility), e.g. /tutorials/sources/welcome.mp4 */
  mp4Src?: string;
  /** Mobile-optimized MP4 served via a max-width media query (saves bytes on phones). */
  mobileSrc?: string;
  /** WebVTT captions track, e.g. /tutorials/captions/welcome.vtt */
  captionsSrc?: string;
  /** List/grid thumbnail (distinct from the in-player poster). */
  thumbnail?: string;
  /** 'high' => preload metadata when on screen; otherwise preload nothing until play. */
  priority?: 'high' | 'low';
  /** Allow muted autoplay ONLY when on screen and motion is allowed. Default false. */
  autoplayAllowed?: boolean;
  /** Start muted (required for any autoplay). Default true. */
  mutedDefault?: boolean;
  /** Loop playback (short ambient clips only). Default false. */
  loop?: boolean;
  /** One-line fallback shown if the recording fails to load (before the script). */
  fallbackText?: string;
  /** ISO date (YYYY-MM-DD) the recording was first published (SEO uploadDate). */
  seoUploadDate?: string;
  /** ISO date (YYYY-MM-DD) the recording was last (re-)produced (SEO dateModified). */
  seoModifiedDate?: string;
}

/** A single `<source>` for the inline player. */
export interface InlineVideoSource {
  src: string;
  type: 'video/webm' | 'video/mp4';
  /** Optional media query — e.g. mobile-only source. */
  media?: string;
}

/** A curated, ordered tutorial for one kind of user. */
export interface TutorialTrack {
  audience: TutorialAudience;
  /** Display name, e.g. "Player". */
  label: string;
  /** One-line "this is you" description. */
  blurb: string;
  /** Emoji used on the persona chip. */
  emoji: string;
  /** Ordered video ids that make up this user's tutorial. */
  videoIds: string[];
}

// ── Audience metadata (labels + descriptions for the persona picker) ──

export const AUDIENCES: Record<TutorialAudience, { label: string; blurb: string; emoji: string }> = {
  athlete: { label: 'Player', blurb: "You're working on your own game", emoji: '🏌️' },
  parent: { label: 'Parent', blurb: "You're helping a young athlete", emoji: '👪' },
  coach: { label: 'Coach', blurb: 'You work with athletes you coach', emoji: '📋' },
  team: { label: 'Team / Program', blurb: "You're exploring SwingVantage for a group", emoji: '🏟️' },
};

// ── Category metadata (section headers in the library) ──

export const CATEGORIES: Record<TutorialCategory, { label: string; blurb: string }> = {
  'getting-started': { label: 'Getting Started', blurb: 'Set up and find your way around.' },
  analyze: { label: 'Analyze Your Swing', blurb: 'Turn a video or your data into clear feedback.' },
  practice: { label: 'Practice & Improve', blurb: 'Know what to work on, and actually do it.' },
  progress: { label: 'Track Your Progress', blurb: 'See improvement over time and prove it.' },
  share: { label: 'Share & Coach', blurb: 'Summaries for coaches, parents, and programs.' },
  account: { label: 'Profile & Equipment', blurb: 'Tell SwingVantage about you and your gear.' },
  community: { label: 'Community & Motivation', blurb: 'Streaks, badges, challenges, and groups.' },
  data: { label: 'Your Data & Settings', blurb: 'Back up your progress and make it yours.' },
};

export const CATEGORY_ORDER: TutorialCategory[] = [
  'getting-started',
  'analyze',
  'practice',
  'progress',
  'share',
  'account',
  'community',
  'data',
];

// ── The video library: one entry per relevant feature ──

const RAW_TUTORIAL_VIDEOS: TutorialVideo[] = [
  // Size-sharded (parts 1→2) but spread in the original order — equivalent to
  // the pre-split catalogue. applyRecordings() then merges generated media.
  ...RAW_VIDEOS_1,
  ...RAW_VIDEOS_2,
];

// ── Recorded media (generated) ────────────────────────────
// recordings.generated.json is written by scripts/video-studio. Any id
// listed there auto-resolves its media by convention, so adding a new
// recording never requires hand-editing entries above. Ids NOT listed
// fall back to the honest "coming soon" + written walkthrough.

function fmtDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Merge generated recordings into the catalogue by id (convention-based paths). */
function applyRecordings(list: TutorialVideo[]): TutorialVideo[] {
  const rec = RECORDINGS as Record<
    string,
    { durationSec: number; uploadDate?: string; dateModified?: string }
  >;
  return list.map((v) => {
    const r = rec[v.id];
    if (!r) return v;
    const base = `/tutorials/sources/${v.id}`;
    return {
      ...v,
      videoUrl: `${base}.mp4`,
      mp4Src: `${base}.mp4`,
      poster: `${base}-poster.jpg`,
      thumbnail: `${base}-poster.jpg`,
      // WebVTT captions are generated alongside the recording (record-batch.mjs)
      // and backfilled for older recordings — every recorded tutorial has one.
      captionsSrc: `${base}.vtt`,
      duration: fmtDuration(r.durationSec),
      seoUploadDate: r.uploadDate,
      seoModifiedDate: r.dateModified,
    };
  });
}

/** The catalogue, with generated recordings merged in. */
export const TUTORIAL_VIDEOS: TutorialVideo[] = applyRecordings(RAW_TUTORIAL_VIDEOS);

// ── Persona tracks: the right tutorial for each kind of user ──

export const TUTORIAL_TRACKS: Record<TutorialAudience, TutorialTrack> = {
  athlete: {
    audience: 'athlete',
    label: AUDIENCES.athlete.label,
    blurb: 'The full path: set up, analyze, practice with purpose, and track real improvement.',
    emoji: AUDIENCES.athlete.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'dashboard',
      'switch-sport',
      'video-analysis',
      'diagnose',
      'ai-coach',
      'training',
      'fix-stack',
      'drills',
      'progress',
      'player-arc',
      'retest',
      'community',
      'data-center',
    ],
  },
  parent: {
    audience: 'parent',
    label: AUDIENCES.parent.label,
    blurb: 'Help a young athlete the encouraging, safety-first way — and actually see progress.',
    emoji: AUDIENCES.parent.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'switch-sport',
      'dashboard',
      'fix-stack',
      'training',
      'drills',
      'parent-summary',
      'player-arc',
      'milestones',
      'community',
      'data-center',
    ],
  },
  coach: {
    audience: 'coach',
    label: AUDIENCES.coach.label,
    blurb: 'Analyze athletes, build plans, and turn sessions into shareable coaching summaries.',
    emoji: AUDIENCES.coach.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'dashboard',
      'video-analysis',
      'diagnose',
      'import-data',
      'motion-lab',
      'training',
      'drills',
      'sessions',
      'retest',
      'compare',
      'reports',
      'coach-summary',
      'data-center',
    ],
  },
  team: {
    audience: 'team',
    label: AUDIENCES.team.label,
    blurb: 'See how SwingVantage works for a group: shared reports, groups, and benchmarks.',
    emoji: AUDIENCES.team.emoji,
    videoIds: [
      'welcome',
      'start-here',
      'dashboard',
      'reports',
      'coach-summary',
      'groups',
      'benchmarks',
      'data-center',
    ],
  },
};

export const AUDIENCE_ORDER: TutorialAudience[] = ['athlete', 'parent', 'coach', 'team'];

// ── Helpers ───────────────────────────────────────────────

const VIDEO_BY_ID: Record<string, TutorialVideo> = Object.fromEntries(
  TUTORIAL_VIDEOS.map((v) => [v.id, v]),
);

/** Look up a single video by id. */
export function getVideoById(id: string): TutorialVideo | undefined {
  return VIDEO_BY_ID[id];
}

/** Resolve a track's ordered ids into full video objects (skips any unknown id). */
export function getTrackVideos(audience: TutorialAudience): TutorialVideo[] {
  return TUTORIAL_TRACKS[audience].videoIds
    .map((id) => VIDEO_BY_ID[id])
    .filter((v): v is TutorialVideo => Boolean(v));
}

/** True if a video is relevant to the given audience (or is for everyone). */
export function videoMatchesAudience(video: TutorialVideo, audience: TutorialAudience): boolean {
  return video.audiences === 'all' || video.audiences.includes(audience);
}

/** Every video, in display order, grouped by category. */
export function getVideosByCategory(): Array<{ category: TutorialCategory; videos: TutorialVideo[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    videos: TUTORIAL_VIDEOS.filter((v) => v.category === category),
  })).filter((group) => group.videos.length > 0);
}

/** Total runtime label for a list of videos, e.g. "~24 min". */
export function totalDurationLabel(videos: TutorialVideo[]): string {
  let seconds = 0;
  for (const v of videos) {
    const [m, s] = v.duration.split(':').map((n) => parseInt(n, 10));
    if (!Number.isNaN(m)) seconds += m * 60 + (Number.isNaN(s) ? 0 : s);
  }
  const mins = Math.max(1, Math.round(seconds / 60));
  return `~${mins} min`;
}

/**
 * Classify a video URL so the player knows how to render it.
 * Returns null when there is no recording yet.
 */
export function getVideoSourceKind(url?: string): 'youtube' | 'vimeo' | 'file' | null {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'file';
}

/**
 * Ordered <source> list for the inline player. Mobile-specific source is
 * listed first (behind a max-width media query), then WebM, then MP4 — the
 * browser picks the first it can play. Falls back to a direct-file `videoUrl`
 * when no explicit mp4/webm is set. Returns [] when nothing is inline-playable
 * (e.g. only a YouTube/Vimeo link, or no recording yet).
 */
export function getInlineSources(video: TutorialVideo): InlineVideoSource[] {
  const sources: InlineVideoSource[] = [];
  if (video.mobileSrc) {
    sources.push({ src: video.mobileSrc, type: 'video/mp4', media: '(max-width: 640px)' });
  }
  if (video.webmSrc) {
    sources.push({ src: video.webmSrc, type: 'video/webm' });
  }
  if (video.mp4Src) {
    sources.push({ src: video.mp4Src, type: 'video/mp4' });
  }
  // Back-compat: a direct .mp4/.webm in `videoUrl` (not YouTube/Vimeo) plays inline too.
  if (sources.length === 0 && getVideoSourceKind(video.videoUrl) === 'file') {
    const url = video.videoUrl as string;
    sources.push({ src: url, type: /\.webm($|\?)/i.test(url) ? 'video/webm' : 'video/mp4' });
  }
  return sources;
}

/** True once a video has any playable recording (inline file or YouTube/Vimeo link). */
export function hasRecording(video: TutorialVideo): boolean {
  return getInlineSources(video).length > 0 || Boolean(getVideoSourceKind(video.videoUrl));
}

/** Convert a YouTube/Vimeo URL to its embeddable form. Files pass through. */
export function toEmbedUrl(url: string): string {
  const kind = getVideoSourceKind(url);
  if (kind === 'youtube') {
    // Handle youtu.be/ID and youtube.com/watch?v=ID
    const short = url.match(/youtu\.be\/([\w-]+)/i);
    const long = url.match(/[?&]v=([\w-]+)/i);
    const embed = url.match(/youtube\.com\/embed\/([\w-]+)/i);
    const id = short?.[1] ?? long?.[1] ?? embed?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (kind === 'vimeo') {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }
  return url;
}
