'use client';

// ============================================================
// SwingVantage — Tutorial Welcome Prompt
// ------------------------------------------------------------
// A gentle, dismissible nudge toward the Tutorial Center for users
// who haven't watched anything or skipped the tour. Mounted once in
// AppShell, so it only appears on the product surface.
//
// Honest & non-naggy:
//   • "Skip" hides it for good (sets skippedTour).
//   • The corner ✕ dismisses for this session only.
//   • Watching any video makes it stop appearing on its own.
//   • It never shows on the tutorial page or the onboarding flow.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, X, ArrowRight } from 'lucide-react';
import { useTutorial } from '@/hooks/useTutorial';

const HIDDEN_ON = ['/tutorial', '/start'];

export function TutorialWelcomePrompt() {
  const pathname = usePathname();
  const { skippedTour, setSkippedTour, watchedVideos } = useTutorial();

  // Gate on mount so we don't flash before persisted state hydrates.
  const [mounted, setMounted] = useState(false);
  // Session-only dismissal (the corner ✕) — distinct from the permanent Skip.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || dismissed) return null;
  if (skippedTour) return null;
  if (watchedVideos.length > 0) return null;
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;

  return (
    <div
      role="region"
      aria-label="New here? Watch a quick tutorial"
      className="fixed bottom-24 left-4 z-30 w-[calc(100%-2rem)] max-w-xs rounded-2xl border border-primary/30 bg-card p-4 shadow-xl lg:bottom-6 lg:left-6"
    >
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss for now"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={15} />
      </button>

      <div className="flex items-center gap-2 text-primary">
        <GraduationCap size={18} aria-hidden="true" />
        <p className="text-sm font-bold">New to SwingVantage?</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Take a short, guided video tour made for players, parents, coaches, and teams. Two minutes to
        find your way around.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href="/tutorial"
          onClick={() => setDismissed(true)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary"
        >
          Watch the tour
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
        <button
          onClick={() => setSkippedTour(true)}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
