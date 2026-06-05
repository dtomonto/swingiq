// ============================================================
// SwingVantage — Video Studio: Analytics
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Two things live here.
//
//   1) trackVideoStudio() — fires a video event (impression, play,
//      complete, CTA click, caption toggle, …) through the app-wide,
//      provider-agnostic track() (GA4 / Plausible / PostHog / console
//      fallback), stamped with consistent metadata so every event is
//      comparable.
//
//   2) aggregateEvents() — a PURE function that rolls a batch of recorded
//      events into one VideoPerformanceMetric (the input the performance
//      scorer and the reassessment engine read). No provider, no network,
//      fully testable.
// ============================================================

import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { VideoEventInput, VideoPerformanceMetric, JourneyStage } from './types';

export type VideoStudioEvent = VideoEventInput['event'];

const EVENT_MAP: Record<VideoStudioEvent, (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]> = {
  impression: ANALYTICS_EVENTS.VIDEO_STUDIO_IMPRESSION,
  play: ANALYTICS_EVENTS.VIDEO_STUDIO_PLAY,
  pause: ANALYTICS_EVENTS.VIDEO_STUDIO_PAUSE,
  complete: ANALYTICS_EVENTS.VIDEO_STUDIO_COMPLETE,
  cta_click: ANALYTICS_EVENTS.VIDEO_STUDIO_CTA_CLICK,
  mute: ANALYTICS_EVENTS.VIDEO_STUDIO_MUTE,
  unmute: ANALYTICS_EVENTS.VIDEO_STUDIO_UNMUTE,
  caption_toggle: ANALYTICS_EVENTS.VIDEO_STUDIO_CAPTION_TOGGLE,
  replay: ANALYTICS_EVENTS.VIDEO_STUDIO_REPLAY,
  error: ANALYTICS_EVENTS.VIDEO_STUDIO_ERROR,
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/** Coarse device class from viewport width (client-only; 'desktop' on server). */
export function deviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export interface VideoStudioContext {
  assetId?: string;
  placement: string;
  page?: string;
  sport?: string;
  journeyStage?: JourneyStage;
  videoVersion?: number;
  completion?: number;
  dropOffSec?: number;
  extra?: Record<string, string | number | boolean | null>;
}

/** Fire one Video Studio analytics event with consistent metadata. */
export function trackVideoStudio(event: VideoStudioEvent, ctx: VideoStudioContext): void {
  track(EVENT_MAP[event], {
    asset_id: ctx.assetId ?? null,
    placement: ctx.placement,
    page: ctx.page ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
    sport: ctx.sport ?? null,
    journey_stage: ctx.journeyStage ?? null,
    video_version: ctx.videoVersion ?? null,
    completion: ctx.completion ?? null,
    drop_off_sec: ctx.dropOffSec ?? null,
    device_type: deviceType(),
    ...ctx.extra,
  });
}

// ── Aggregation (pure) ────────────────────────────────────────

/** A recorded event row (what the events API persists). */
export interface RecordedEvent {
  event: VideoStudioEvent;
  completion?: number;
  dropOffSec?: number;
  at: string;
}

/** Median of a numeric list (0 for empty). */
function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Roll a batch of recorded events into one VideoPerformanceMetric for a
 * given asset+placement window. Pure and deterministic.
 */
export function aggregateEvents(
  events: RecordedEvent[],
  opts: { assetId: string; placementId: string; windowStart: string; windowEnd: string },
): VideoPerformanceMetric {
  const count = (e: VideoStudioEvent) => events.filter((x) => x.event === e).length;

  const completions = count('complete');
  const plays = count('play');
  const completionFractions = events
    .filter((e) => e.event === 'complete' || e.event === 'pause')
    .map((e) => (typeof e.completion === 'number' ? e.completion : e.event === 'complete' ? 1 : 0));
  const dropOffs = events
    .filter((e) => typeof e.dropOffSec === 'number')
    .map((e) => e.dropOffSec as number);

  const avgCompletion =
    completionFractions.length > 0
      ? completionFractions.reduce((a, b) => a + b, 0) / completionFractions.length
      : completions > 0 && plays > 0
        ? completions / plays
        : 0;

  // Express the median drop-off as a fraction of the longest observed drop-off
  // (best-effort without the asset duration to hand).
  const maxDrop = Math.max(1, ...dropOffs);
  const dropOffPoint = dropOffs.length > 0 ? median(dropOffs) / maxDrop : 0;

  return {
    id: `metric_${opts.assetId}_${opts.placementId}`,
    assetId: opts.assetId,
    placementId: opts.placementId,
    windowStart: opts.windowStart,
    windowEnd: opts.windowEnd,
    impressions: count('impression'),
    plays,
    pauses: count('pause'),
    completions,
    avgCompletion: Math.max(0, Math.min(1, avgCompletion)),
    ctaClicks: count('cta_click'),
    replays: count('replay'),
    muteToggles: count('mute') + count('unmute'),
    captionToggles: count('caption_toggle'),
    dropOffPoint: Math.max(0, Math.min(1, dropOffPoint)),
    downstreamConversions: 0, // joined from funnel analytics elsewhere
  };
}
