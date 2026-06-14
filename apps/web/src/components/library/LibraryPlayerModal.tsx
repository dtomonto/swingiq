'use client';

// ============================================================
// SwingVantage — Video Library: Player Modal
// ------------------------------------------------------------
// Accessible dialog that plays a library video. Esc closes, focus moves to
// the close button on open, background scroll is locked, backdrop click
// closes. Captions when available; the written walkthrough is ALWAYS shown
// as a transcript, so a video with no recording yet is still useful.
// Analytics piggyback on the app-wide tracker.
// ============================================================

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, FileText, ArrowRight, Clapperboard } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { toEmbedUrl } from '@/lib/tutorial/videos';
import type { LibraryItem } from '@/lib/library/types';

export function LibraryPlayerModal({ item, onClose }: { item: LibraryItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    track(ANALYTICS_EVENTS.TUTORIAL_VIDEO_PLAY, { video_id: item.id, placement: 'library', source: item.source });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [item.id, item.source, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wide text-primary">{item.durationLabel}</p>
            <h2 className="truncate text-lg font-bold text-foreground">{item.title}</h2>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close video"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="aspect-video w-full bg-black">
            {item.mp4Src ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption -- caption track added when available
              <video
                key={item.id}
                poster={item.poster}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="h-full w-full"
                aria-label={item.title}
              >
                {item.webmSrc && <source src={item.webmSrc} type="video/webm" />}
                <source src={item.mp4Src} type="video/mp4" />
                {item.captionsSrc && (
                  <track kind="captions" src={item.captionsSrc} srcLang="en" label="English" default />
                )}
              </video>
            ) : item.embedUrl ? (
              <iframe
                key={item.id}
                src={toEmbedUrl(item.embedUrl)}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <ComingSoon title={item.title} />
            )}
          </div>

          <div className="space-y-5 px-5 py-5">
            <p className="text-sm text-muted-foreground">{item.description}</p>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <FileText size={15} className="text-primary" aria-hidden="true" />
                {item.mp4Src ? 'Transcript' : 'Step-by-step'}
              </h3>
              <ol className="space-y-2.5">
                {item.script.map((line, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xs font-bold text-primary"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ol>
            </div>

            {item.route && (
              <Link
                href={item.route}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Open this feature
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary px-6 text-center">
      <Clapperboard size={42} className="text-primary/70" aria-hidden="true" />
      <p className="text-sm font-semibold text-foreground">Recording coming soon</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        We&apos;re filming the “{title}” walkthrough. The full step-by-step is below and is ready to use right now.
      </p>
    </div>
  );
}
