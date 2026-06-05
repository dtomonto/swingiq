// ============================================================
// SwingVantage — Video Studio: Provider Interface
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the "socket" every video generator plugs into. The rest of
//   the system only ever talks to a `VideoProvider` — it never knows or
//   cares whether the pixels come from Runway, Luma, HeyGen, a Remotion
//   render, an FFmpeg compose step, or the built-in zero-key mock.
//
//   To add a real provider later you implement this one interface and
//   register it (providers/registry.ts). Nothing else has to change.
//
// CONTRACT NOTES:
//   - `isConfigured()` must be honest: false unless its env keys are set.
//   - Methods never throw for "not configured" — they return ok:false with
//     a reason, so the job manager can record a clean failure.
//   - Cost is reported up front so the budget guardrail can refuse a job
//     before any spend happens.
// ============================================================

import type { JobStatus, ProviderCapability, VideoCreativeBrief } from '../types';

/** The renderable parts a provider returns for a finished (or placeholder) video. */
export interface ProviderAssetParts {
  /** Primary playable source. Undefined for a placeholder (poster-only). */
  src?: string;
  mp4Src?: string;
  webmSrc?: string;
  hlsSrc?: string;
  poster?: string;
  thumbnail?: string;
  captions: { lang: string; src: string; label: string }[];
  transcript: string;
  durationSec: number;
  /** True when no real footage was rendered (e.g. the mock provider). */
  isPlaceholder: boolean;
}

export interface ProviderGenerateResult {
  ok: boolean;
  /** The provider's own job id (used to poll / cancel / retrieve). */
  providerJobId: string;
  status: JobStatus;
  /** What this job will cost, in USD cents (0 for the mock). */
  estimatedCostCents: number;
  /** Present when the result is available synchronously (mock/template). */
  asset?: ProviderAssetParts;
  message?: string;
}

export interface ProviderJobStatus {
  status: JobStatus;
  /** 0–100 best-effort progress. */
  progress: number;
  message?: string;
}

/**
 * The single interface every video generator implements. Methods are async
 * to accommodate real network providers; the mock resolves immediately.
 */
export interface VideoProvider {
  readonly id: string;
  readonly label: string;
  readonly capabilities: ProviderCapability[];
  /** Hard per-job cost ceiling in USD cents. */
  readonly maxCostPerJobCents: number;

  /** Honest readiness check (env keys present). */
  isConfigured(): boolean;

  /** Kick off (or synchronously produce) a video from a brief. */
  generateVideo(brief: VideoCreativeBrief): Promise<ProviderGenerateResult>;

  /** Produce a voiceover track from the brief's narration. */
  generateVoiceover(
    brief: VideoCreativeBrief,
  ): Promise<{ ok: boolean; src?: string; durationSec: number; message?: string }>;

  /** Produce a WebVTT caption track. May be synchronous; returns the VTT + a src. */
  generateCaptions(brief: VideoCreativeBrief): { src: string; vtt: string };

  /** Produce a poster/thumbnail image (data URI or URL). */
  generateThumbnail(brief: VideoCreativeBrief): { poster: string; thumbnail: string };

  /** Compose discrete parts (footage + VO + captions) into a final asset. */
  composeVideo(parts: ProviderAssetParts): Promise<ProviderAssetParts>;

  /** Poll an async job. */
  checkJobStatus(providerJobId: string): Promise<ProviderJobStatus>;

  /** Fetch the finished asset parts for a completed job. */
  retrieveAsset(providerJobId: string): Promise<ProviderAssetParts | null>;

  /** Best-effort cancellation. */
  cancelJob(providerJobId: string): Promise<boolean>;
}
