'use client';

// ============================================================
// SwingVantage — Inline Tutorial Video (in-context coaching)
// ------------------------------------------------------------
// The reusable, poster-first player you drop anywhere a user might
// get stuck: homepage hero, the upload screen, the results page.
//
// Design rules it enforces for you:
//   • Poster-first — NO video bytes load until the user taps play.
//   • IntersectionObserver — impression + preload work waits until
//     the card is actually on screen.
//   • No surprise autoplay or sound. Click-to-play is the default;
//     muted-autoplay is opt-in and respects prefers-reduced-motion.
//   • No layout shift — the media sits in a fixed aspect-ratio box.
//   • Honest fallback — if there's no recording yet (or it fails to
//     load), it shows the written walkthrough, so it's useful today.
//   • Accessible — real <button>, ARIA labels, .vtt captions,
//     playsInline for mobile, keyboard-operable.
//
// Usage:
//   <TutorialVideo placement="home-hero" />
//   <TutorialVideo videoId="welcome" display="card" page="/dashboard" />
// ============================================================

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PlayCircle, GraduationCap, ArrowRight, ListChecks, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getVideoById,
  getInlineSources,
  hasRecording,
  getVideoSourceKind,
  toEmbedUrl,
  type TutorialVideo as TutorialVideoData,
  type TutorialJourneyStage,
} from '@/lib/tutorial/videos';
import { resolvePlacement, type PlacementDisplay, type PlacementTrigger } from '@/lib/tutorial/placements';
import { trackTutorialVideo } from '@/lib/tutorial/analytics';

/** Read the OS reduced-motion preference at call time (client-only). */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

interface TutorialVideoProps {
  /** Placement id from the registry (preferred — carries copy + behavior). */
  placement?: string;
  /** Or render a manifest video directly by id. */
  videoId?: string;
  /** Layout override. Defaults to the placement's display, else 'inline'. */
  display?: PlacementDisplay;
  /** Trigger override. Defaults to the placement's trigger, else 'click-to-play'. */
  trigger?: PlacementTrigger;
  /** CTA microcopy override. */
  cta?: string;
  /** Helper line override. */
  blurb?: string;
  /** Route/page for analytics. Defaults to the placement's page. */
  page?: string;
  /** Active sport for analytics, when known. */
  sport?: string;
  className?: string;
}

export function TutorialVideo({
  placement: placementId,
  videoId,
  display: displayProp,
  trigger: triggerProp,
  cta: ctaProp,
  blurb: blurbProp,
  page: pageProp,
  sport,
  className,
}: TutorialVideoProps) {
  // ── Resolve the video + placement metadata ──
  const resolved = placementId ? resolvePlacement(placementId) : undefined;
  const video: TutorialVideoData | undefined = resolved?.video ?? (videoId ? getVideoById(videoId) : undefined);
  const placement = resolved?.placement;

  const display: PlacementDisplay = displayProp ?? placement?.display ?? 'inline';
  const trigger: PlacementTrigger = triggerProp ?? placement?.trigger ?? 'click-to-play';
  const cta = ctaProp ?? placement?.cta ?? 'Watch the tutorial';
  const blurb = blurbProp ?? placement?.blurb ?? video?.description;
  const page = pageProp ?? placement?.page;
  const journeyStage: TutorialJourneyStage | undefined = placement?.journeyStage ?? video?.journeyStage;
  const placementKey = placement?.id ?? `video:${video?.id ?? 'unknown'}`;

  const sources = useMemo(() => (video ? getInlineSources(video) : []), [video]);
  const embedUrl = useMemo(() => {
    if (!video?.videoUrl) return null;
    const kind = getVideoSourceKind(video.videoUrl);
    return kind === 'youtube' || kind === 'vimeo' ? toEmbedUrl(video.videoUrl) : null;
  }, [video]);
  const playable = video ? hasRecording(video) : false;

  // ── Local state ──
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const impressionFired = useRef(false);
  const completeFired = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [errored, setErrored] = useState(false);
  const stepsId = useId();

  const fire = useCallback(
    (event: Parameters<typeof trackTutorialVideo>[0], extra?: Record<string, string | number | boolean | null>) => {
      if (!video) return;
      trackTutorialVideo(event, {
        videoId: video.id,
        placement: placementKey,
        page,
        sport,
        journeyStage,
        extra,
      });
    },
    [video, placementKey, page, sport, journeyStage],
  );

  // First time the card scrolls into view: fire a single impression, and — only
  // for opt-in muted-autoplay placements with motion allowed — start it. The
  // decision lives in the (async) observer callback, so no surprise autoplay and
  // no synchronous setState in the effect body.
  useEffect(() => {
    const el = containerRef.current;
    const onFirstView = () => {
      if (!impressionFired.current) {
        impressionFired.current = true;
        fire('impression');
      }
      if (trigger === 'muted-autoplay' && sources.length > 0 && !prefersReducedMotion()) {
        setPlaying(true);
      }
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      onFirstView();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onFirstView();
            io.disconnect();
          }
        }
      },
      { rootMargin: '200px', threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fire, trigger, sources.length]);

  // When a real <video> mounts, try to play it (user-initiated gesture or muted ambient).
  useEffect(() => {
    if (playing && sources.length > 0 && videoElRef.current) {
      const el = videoElRef.current;
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {/* controls are visible; user can tap */});
    }
  }, [playing, sources.length]);

  if (!video) return null;

  const startPlayback = () => {
    if (playable) {
      setErrored(false);
      setPlaying(true);
      fire('play', { method: 'click' });
    } else {
      // No recording yet — reveal the written walkthrough instead of a dead button.
      setShowSteps(true);
      fire('cta_clicked', { reason: 'coming_soon' });
    }
  };

  const mutedAmbient = trigger === 'muted-autoplay';
  const preload = video.priority === 'high' ? 'metadata' : 'none';
  const isCard = display === 'card';

  // ── Media area ──────────────────────────────────────────────
  const media = (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl bg-black',
        // aspect-ratio box prevents layout shift while nothing has loaded yet
        'aspect-video',
      )}
    >
      {playing && sources.length > 0 ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- caption <track> added below only when a .vtt exists
        <video
          ref={videoElRef}
          className="h-full w-full"
          controls={!mutedAmbient}
          playsInline
          muted={mutedAmbient || video.mutedDefault}
          loop={mutedAmbient || video.loop}
          poster={video.poster}
          preload={preload}
          onPlay={() => fire('play', { method: 'media' })}
          onPause={() => fire('pause')}
          onEnded={() => {
            if (!completeFired.current) {
              completeFired.current = true;
              fire('complete');
            }
          }}
          onError={() => {
            setErrored(true);
            setPlaying(false);
            setShowSteps(true);
            fire('error', { reason: 'media_error' });
          }}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} media={s.media} />
          ))}
          {video.captionsSrc && (
            <track kind="captions" src={video.captionsSrc} srcLang="en" label="English" default />
          )}
        </video>
      ) : playing && embedUrl ? (
        <iframe
          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
          title={video.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        // Poster-first cover with a play button. No bytes until tapped.
        <button
          type="button"
          onClick={startPlayback}
          aria-label={`${playable ? 'Play' : 'Open'} tutorial: ${video.title}`}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {video.poster ? (
            // Plain <img>: degrades gracefully if the poster file isn't there yet.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.poster}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background"
            />
          )}
          <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-card/90 shadow-lg ring-1 ring-black/5 transition-transform group-hover:scale-105">
            <PlayCircle size={36} className="text-primary" aria-hidden="true" />
          </span>
          <span className="relative z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {playable ? video.duration : 'Walkthrough'}
          </span>
        </button>
      )}
    </div>
  );

  // ── Written walkthrough (fallback + honest "coming soon") ───
  const steps = (showSteps || (!playable && errored)) && (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
        <ListChecks size={15} className="text-primary" aria-hidden="true" />
        {errored ? 'Here are the steps' : playable ? 'Step-by-step' : 'Video coming soon — here are the steps'}
      </h4>
      {video.fallbackText && <p className="mb-2 text-xs text-muted-foreground">{video.fallbackText}</p>}
      <ol className="space-y-2">
        {video.script.slice(0, isCard ? 4 : 6).map((line, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-foreground">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary"
            >
              {i + 1}
            </span>
            <span className="leading-relaxed">{line}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  // ── Footer links: full guide + open the feature ────────────
  const footer = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
      <Link
        href="/tutorial"
        onClick={() => fire('cta_clicked', { target: 'tutorial_center' })}
        className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
      >
        <GraduationCap size={15} aria-hidden="true" />
        Watch the full guide
      </Link>
      {video.route && (
        <Link
          href={video.route}
          onClick={() => fire('cta_clicked', { target: 'open_feature' })}
          className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
        >
          Open this feature
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );

  // ── Layout ─────────────────────────────────────────────────
  return (
    <section
      ref={containerRef}
      aria-label={`Tutorial: ${video.title}`}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5',
        isCard && 'sm:p-4',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-4', isCard && 'sm:flex-row sm:items-center')}>
        <div className={cn('w-full', isCard && 'sm:max-w-[16rem] sm:shrink-0')}>{media}</div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Film size={15} aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">Quick tutorial</span>
          </div>
          <h3 className="text-base font-bold text-foreground">{video.title}</h3>
          {blurb && <p className="text-sm text-muted-foreground">{blurb}</p>}
          {!playing && (
            <button
              type="button"
              onClick={startPlayback}
              aria-expanded={!playable ? showSteps : undefined}
              aria-controls={!playable ? stepsId : undefined}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <PlayCircle size={16} aria-hidden="true" />
              {cta}
            </button>
          )}
          {!isCard && footer}
        </div>
      </div>

      {(steps || (isCard && footer)) && (
        <div id={stepsId} className="mt-4 space-y-3">
          {steps}
          {isCard && footer}
        </div>
      )}
    </section>
  );
}
