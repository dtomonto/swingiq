'use client';

// ============================================================
// SwingVantage — Video Studio: Accessible Video Player
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The player every Video Studio placement uses. It is built to be
//   accessible and fast:
//     - Captions on by default; full transcript in a disclosure.
//     - Native, keyboard-operable controls; no autoplay with sound.
//     - Reserves its aspect-ratio box so the page never jumps (no CLS).
//     - preload="none" by default — no bytes until the user hits play.
//     - Honest placeholder: when there's no real footage yet (the mock
//       provider), it shows the branded poster + transcript instead of a
//       broken player, exactly like the tutorial "coming soon" pattern.
//   It also reports analytics (play, pause, complete, CTA, captions) both
//   to the app-wide tracker and to the durable events endpoint.
// ============================================================

import { useCallback, useMemo, useRef, useState } from 'react';
import { Play, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackVideoStudio, type VideoStudioEvent } from '@/lib/video-studio/analytics';
import type { VideoAsset, JourneyStage, AspectRatio } from '@/lib/video-studio/types';

interface VideoPlayerProps {
  asset: VideoAsset;
  placementId: string;
  page?: string;
  sport?: string;
  journeyStage?: JourneyStage;
  cta?: string;
  /** Where the CTA points; if omitted the CTA is not shown. */
  ctaHref?: string;
  className?: string;
}

const ASPECT_CLASS: Record<AspectRatio, string> = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
};

/** Fire-and-forget durable event (in addition to the client tracker). */
function recordEvent(body: Record<string, unknown>): void {
  try {
    const payload = JSON.stringify(body);
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon('/api/video-studio/events', new Blob([payload], { type: 'application/json' }));
    } else {
      void fetch('/api/video-studio/events', { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    }
  } catch {
    /* analytics must never break playback */
  }
}

export function VideoPlayer({
  asset,
  placementId,
  page,
  sport,
  journeyStage,
  cta,
  ctaHref,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const aspect = ASPECT_CLASS[asset.aspectRatio] ?? ASPECT_CLASS['16:9'];

  const sources = useMemo(() => {
    const out: { src: string; type: string }[] = [];
    if (asset.webmSrc) out.push({ src: asset.webmSrc, type: 'video/webm' });
    if (asset.mp4Src) out.push({ src: asset.mp4Src, type: 'video/mp4' });
    if (asset.hlsSrc) out.push({ src: asset.hlsSrc, type: 'application/vnd.apple.mpegurl' });
    if (out.length === 0 && asset.src) {
      out.push({ src: asset.src, type: /\.webm($|\?)/i.test(asset.src) ? 'video/webm' : 'video/mp4' });
    }
    return out;
  }, [asset]);

  const hasRealVideo = sources.length > 0 && !asset.isPlaceholder;

  const fire = useCallback(
    (event: VideoStudioEvent, extra?: { completion?: number; dropOffSec?: number }) => {
      trackVideoStudio(event, {
        assetId: asset.id,
        placement: placementId,
        page,
        sport,
        journeyStage,
        videoVersion: asset.version,
        completion: extra?.completion,
        dropOffSec: extra?.dropOffSec,
      });
      recordEvent({
        event,
        assetId: asset.id,
        placementId,
        completion: extra?.completion,
        dropOffSec: extra?.dropOffSec,
        videoVersion: asset.version,
        page,
        sport,
        journeyStage,
      });
    },
    [asset.id, asset.version, placementId, page, sport, journeyStage],
  );

  const onPlay = useCallback(() => {
    setStarted(true);
    fire('play');
  }, [fire]);

  const onPause = useCallback(() => {
    const v = videoRef.current;
    if (v && v.currentTime < v.duration - 0.5) {
      fire('pause', { completion: v.duration ? v.currentTime / v.duration : 0, dropOffSec: v.currentTime });
    }
  }, [fire]);

  const onEnded = useCallback(() => fire('complete', { completion: 1 }), [fire]);

  return (
    <figure className={cn('not-prose m-0', className)}>
      <div className={cn('relative w-full overflow-hidden rounded-theme bg-black', aspect)}>
        {hasRealVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- caption <track> added below when available
          <video
            ref={videoRef}
            poster={asset.poster}
            controls
            playsInline
            preload="none"
            className="h-full w-full"
            aria-label={asset.title}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
          >
            {sources.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
            {asset.captions.map((c, i) => (
              <track
                key={c.src}
                kind="captions"
                src={c.src}
                srcLang={c.lang}
                label={c.label}
                default={i === 0}
              />
            ))}
          </video>
        ) : (
          <PlaceholderPoster asset={asset} onReveal={() => { setStarted(true); fire('play'); }} started={started} />
        )}
      </div>

      {/* Transcript — always available (accessibility + SEO) */}
      {asset.transcript && (
        <details className="mt-2 rounded-theme border border-border bg-muted/40 px-3 py-2">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
            <FileText size={14} className="text-primary" aria-hidden="true" />
            Read the transcript
          </summary>
          <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {asset.transcript.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </details>
      )}

      {cta && ctaHref && (
        <a
          href={ctaHref}
          onClick={() => fire('cta_click')}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {cta}
        </a>
      )}
    </figure>
  );
}

/** Honest poster shown when there's no rendered footage yet. */
function PlaceholderPoster({
  asset,
  onReveal,
  started,
}: {
  asset: VideoAsset;
  onReveal: () => void;
  started: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onReveal}
      aria-label={`Preview: ${asset.title}`}
      className="group relative block h-full w-full"
    >
      {asset.poster ? (
        // The poster is a generated SVG data URI — safe and lightweight.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.poster} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-secondary" />
      )}
      <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-2xs font-semibold text-white backdrop-blur">
        <Sparkles size={11} aria-hidden="true" /> Preview
      </span>
      {!started && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-105">
            <Play size={24} className="ml-0.5 text-gray-900" aria-hidden="true" />
          </span>
        </span>
      )}
    </button>
  );
}
