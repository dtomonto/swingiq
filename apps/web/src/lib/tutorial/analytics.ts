// ============================================================
// SwingVantage — Tutorial Video Analytics
// ------------------------------------------------------------
// A thin wrapper over the app-wide track() that stamps every
// tutorial-video event with consistent metadata:
//   { video_id, placement, page, sport, user_journey_stage, device_type }
//
// It is provider-agnostic (GA4 / Plausible / PostHog / console) via
// lib/analytics.ts — nothing here throws if no provider is configured.
// ============================================================

import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { TutorialJourneyStage } from './videos';

export type TutorialVideoEvent =
  | 'impression'
  | 'play'
  | 'pause'
  | 'complete'
  | 'error'
  | 'dismissed'
  | 'cta_clicked';

const EVENT_MAP: Record<TutorialVideoEvent, (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]> = {
  impression: ANALYTICS_EVENTS.TUTORIAL_VIDEO_IMPRESSION,
  play: ANALYTICS_EVENTS.TUTORIAL_VIDEO_PLAY,
  pause: ANALYTICS_EVENTS.TUTORIAL_VIDEO_PAUSE,
  complete: ANALYTICS_EVENTS.TUTORIAL_VIDEO_COMPLETE,
  error: ANALYTICS_EVENTS.TUTORIAL_VIDEO_ERROR,
  dismissed: ANALYTICS_EVENTS.TUTORIAL_VIDEO_DISMISSED,
  cta_clicked: ANALYTICS_EVENTS.TUTORIAL_VIDEO_CTA_CLICKED,
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/** Coarse device class from viewport width (client-only; 'desktop' on the server). */
export function deviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export interface TutorialVideoContext {
  videoId: string;
  /** Placement id from the registry, e.g. 'home-hero'. */
  placement: string;
  /** Route/page the placement is on, e.g. '/video'. */
  page?: string;
  /** Active sport, when known. */
  sport?: string;
  journeyStage?: TutorialJourneyStage;
  /** Extra event-specific fields (e.g. { reason } on error). */
  extra?: Record<string, string | number | boolean | null>;
}

/** Fire one tutorial-video analytics event with consistent metadata. */
export function trackTutorialVideo(event: TutorialVideoEvent, ctx: TutorialVideoContext): void {
  track(EVENT_MAP[event], {
    video_id: ctx.videoId,
    placement: ctx.placement,
    page: ctx.page ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
    sport: ctx.sport ?? null,
    user_journey_stage: ctx.journeyStage ?? null,
    device_type: deviceType(),
    ...ctx.extra,
  });
}
