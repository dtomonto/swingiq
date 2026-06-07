'use client';

// ============================================================
// SwingVantage — Sport Page Engagement beacon
//
// Fires SPORT_PAGE_ENGAGED once per mount when a visitor shows real
// interest in a sport hub — whichever comes first: 20s dwell or 50%
// scroll depth. Renders nothing; drop it into a sport hub page.
//
// Standardized props per docs/FIVE_PERSONA_MASTER_PLAN.md §15:
// { sport, persona }. `track()` no-ops until an analytics provider
// is configured, so this is inert until then.
// ============================================================

import { useEffect, useRef } from 'react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

interface SportPageEngagementProps {
  /** Engine sport id (or 'softball' for the chooser hub). */
  sport: string;
  /** Persona/intent segment for this hub, when unambiguous. */
  persona?: string;
  /** Dwell threshold before counting as engaged. */
  dwellMs?: number;
  /** Scroll-depth fraction (0–1) before counting as engaged. */
  scrollThreshold?: number;
}

export function SportPageEngagement({
  sport,
  persona,
  dwellMs = 20_000,
  scrollThreshold = 0.5,
}: SportPageEngagementProps) {
  const fired = useRef(false);

  useEffect(() => {
    let timer: number | undefined;

    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      track(ANALYTICS_EVENTS.SPORT_PAGE_ENGAGED, {
        sport,
        ...(persona ? { persona } : {}),
      });
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };

    const onScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= scrollThreshold) {
        fire();
      }
    };

    timer = window.setTimeout(fire, dwellMs);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [sport, persona, dwellMs, scrollThreshold]);

  return null;
}
