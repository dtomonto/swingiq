'use client';

// ============================================================
// SwingIQ — Celebration Toast
// ------------------------------------------------------------
// The "you did it!" moment. A small, accessible card that slides in
// when a milestone is earned, then auto-dismisses. All motion is
// gated behind `motion-safe`/`motion-reduce` so users who prefer
// reduced motion get a clean fade-free appearance. Announced to
// assistive tech via role="status" + aria-live.
// ============================================================

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Celebration } from '@/lib/celebrations/earned';

const AUTO_DISMISS_MS = 6000;

export function CelebrationToast({
  celebration,
  onDismiss,
}: {
  celebration: Celebration;
  onDismiss: () => void;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-auto w-full max-w-sm rounded-2xl border border-primary/30 bg-card px-4 py-3 shadow-lg ring-1 ring-primary/10',
        'transition-all duration-500 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        'motion-reduce:translate-y-0 motion-reduce:opacity-100',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={[
            'text-3xl leading-none transition-transform duration-500 ease-out',
            shown ? 'scale-100' : 'scale-0',
            'motion-reduce:scale-100 motion-reduce:transition-none',
          ].join(' ')}
        >
          {celebration.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            🎉 Achievement unlocked
          </p>
          <p className="truncate text-sm font-bold text-foreground">{celebration.title}</p>
          <p className="text-xs leading-snug text-muted-foreground">{celebration.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss celebration"
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
