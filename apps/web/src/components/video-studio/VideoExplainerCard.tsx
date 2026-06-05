'use client';

// ============================================================
// SwingVantage — Video Studio: VideoExplainerCard
// ------------------------------------------------------------
// A compact, titled card around a SmartVideoSlot — for empty states,
// sidebars, and dashboard cards. The title/blurb chrome only appears when
// a video is actually published to the placement (the slot renders nothing
// otherwise), so it's safe to drop anywhere.
// ============================================================

import { SmartVideoSlot } from './SmartVideoSlot';

interface VideoExplainerCardProps {
  placement: string;
  title: string;
  blurb?: string;
  page?: string;
  sport?: string;
  ctaHref?: string;
  className?: string;
}

export function VideoExplainerCard({
  placement,
  title,
  blurb,
  page,
  sport,
  ctaHref,
  className,
}: VideoExplainerCardProps) {
  return (
    <SmartVideoSlot
      placement={placement}
      page={page}
      sport={sport}
      ctaHref={ctaHref}
      className={['rounded-theme border border-border bg-card p-3', className].filter(Boolean).join(' ')}
      header={
        <div className="mb-2">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {blurb && <p className="text-xs text-muted-foreground">{blurb}</p>}
        </div>
      }
    />
  );
}
