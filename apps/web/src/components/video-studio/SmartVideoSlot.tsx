'use client';

// ============================================================
// SwingVantage — Video Studio: SmartVideoSlot
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Drop <SmartVideoSlot placement="results-read" /> anywhere and it does
//   the right thing: it asks the server what (if anything) is published to
//   that placement, and only then renders a player. Until a video is
//   published there, it renders your `fallback` (or nothing) — so adding
//   slots to pages is 100% safe and invisible by default.
//
//   Performance: it lazy-loads the player only when the slot scrolls into
//   view (IntersectionObserver), defers the network call until then, and
//   reserves no space when empty (no layout shift). It fires a single
//   impression event when a real video is shown.
// ============================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { trackVideoStudio } from '@/lib/video-studio/analytics';
import type { ResolvedPlacement } from '@/lib/video-studio/placements';

const VideoPlayer = dynamic(() => import('./VideoPlayer').then((m) => m.VideoPlayer), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse rounded-theme bg-muted" aria-hidden="true" />,
});

interface SmartVideoSlotProps {
  /** Placement id (e.g. 'results-read'). */
  placement: string;
  page?: string;
  sport?: string;
  /** Optional server-resolved placement to skip the client fetch (no CLS). */
  initial?: ResolvedPlacement;
  /** Rendered when there's no published video for this placement. */
  fallback?: ReactNode;
  /** Rendered ABOVE the player, only when a video actually resolves. */
  header?: ReactNode;
  /** Where the placement CTA points, if you want a link under the player. */
  ctaHref?: string;
  className?: string;
}

export function SmartVideoSlot({
  placement,
  page,
  sport,
  initial,
  fallback = null,
  header,
  ctaHref,
  className,
}: SmartVideoSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(Boolean(initial));
  const [resolved, setResolved] = useState<ResolvedPlacement | null>(initial ?? null);
  const [loaded, setLoaded] = useState(Boolean(initial));
  const impressionFired = useRef(false);

  // Defer everything until the slot is near the viewport.
  useEffect(() => {
    if (initial || visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [initial, visible]);

  // Fetch the resolution when visible (unless provided by the server).
  useEffect(() => {
    if (!visible || loaded) return;
    let cancelled = false;
    const params = new URLSearchParams({ placement });
    if (sport) params.set('sport', sport);
    fetch(`/api/video-studio/serve?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ResolvedPlacement | null) => {
        if (!cancelled) setResolved(data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [visible, loaded, placement, sport]);

  // One impression per mount when a real video is shown.
  useEffect(() => {
    if (resolved?.asset && !impressionFired.current) {
      impressionFired.current = true;
      trackVideoStudio('impression', {
        assetId: resolved.asset.id,
        placement,
        page,
        sport,
        journeyStage: resolved.placement.journeyStage,
        videoVersion: resolved.asset.version,
      });
    }
  }, [resolved, placement, page, sport]);

  // Empty / not-yet-published → render the fallback (default: nothing).
  if (!resolved?.asset) {
    return <div ref={ref}>{loaded || initial ? fallback : null}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {header}
      <VideoPlayer
        asset={resolved.asset}
        placementId={placement}
        page={page ?? resolved.placement.page}
        sport={sport}
        journeyStage={resolved.placement.journeyStage}
        cta={resolved.placement.cta}
        ctaHref={ctaHref}
      />
    </div>
  );
}
