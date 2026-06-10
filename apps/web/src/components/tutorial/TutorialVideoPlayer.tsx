'use client';

// ============================================================
// SwingVantage — Tutorial Video Player (modal)
// ------------------------------------------------------------
// Plays one tutorial video at a time, with prev/next so a track
// or filtered list feels like a playlist. When a video has no
// recording yet, it shows a friendly "coming soon" panel — and in
// every case it shows the written walkthrough underneath, so the
// tutorial is useful as text right now.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  PlayCircle,
  ArrowRight,
  Clapperboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type TutorialVideo,
  getVideoSourceKind,
  toEmbedUrl,
} from '@/lib/tutorial/videos';

interface TutorialVideoPlayerProps {
  /** The ordered list this video belongs to (track or filtered library). */
  playlist: TutorialVideo[];
  /** Index of the currently shown video within `playlist`. */
  index: number;
  watched: boolean;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
  onToggleWatched: (video: TutorialVideo) => void;
}

export function TutorialVideoPlayer({
  playlist,
  index,
  watched,
  onClose,
  onNavigate,
  onToggleWatched,
}: TutorialVideoPlayerProps) {
  const video = playlist[index];
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasPrev = index > 0;
  const hasNext = index < playlist.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(index - 1);
  }, [hasPrev, index, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(index + 1);
  }, [hasNext, index, onNavigate]);

  // Focus the close button when the modal opens / video changes.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [index]);

  // Keyboard: Esc closes, arrows move through the playlist.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  // Lock background scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!video) return null;

  const sourceKind = getVideoSourceKind(video.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop — click to close (hidden from assistive tech) */}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial: ${video.title}`}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Video {index + 1} of {playlist.length} · {video.duration}
            </p>
            <h2 className="truncate text-lg font-bold text-foreground">{video.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close tutorial"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Video / coming-soon area */}
          <div className="aspect-video w-full bg-black">
            {sourceKind === 'file' && video.videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                key={video.id}
                src={video.videoUrl}
                poster={video.poster}
                controls
                autoPlay
                className="h-full w-full"
              />
            ) : sourceKind ? (
              <iframe
                key={video.id}
                src={toEmbedUrl(video.videoUrl as string)}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <ComingSoon title={video.title} />
            )}
          </div>

          <div className="space-y-5 px-5 py-5">
            <p className="text-sm text-muted-foreground">{video.description}</p>

            {/* Written walkthrough — always present, useful even before a recording exists */}
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Clapperboard size={15} className="text-primary" aria-hidden="true" />
                Step-by-step
              </h3>
              <ol className="space-y-2.5">
                {video.script.map((line, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Open the actual feature */}
            {video.route && (
              <Link
                href={video.route}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Open this feature
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        {/* Footer: watched toggle + prev/next */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <button
            onClick={() => onToggleWatched(video)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              watched
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-pressed={watched}
          >
            {watched ? <CheckCircle size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            {watched ? 'Watched' : 'Mark as watched'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous video"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next video"
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary px-6 text-center">
      <PlayCircle size={44} className="text-primary/70" aria-hidden="true" />
      <p className="text-sm font-semibold text-foreground">Video coming soon</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        We&apos;re recording the “{title}” walkthrough. In the meantime, the step-by-step guide below
        covers everything you need.
      </p>
    </div>
  );
}
