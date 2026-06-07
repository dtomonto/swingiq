'use client';

// ============================================================
// SwingVantage — Athletic Journey: missing-data panel
// ------------------------------------------------------------
// Turns gaps into the most useful next inputs, ranked. Never hides
// missing data — uses it to guide the athlete forward.
// ============================================================

import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import type { MissingDataItem } from '@/lib/athletic-journey';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export function MissingDataPanel({
  sport,
  items,
  onRatingClick,
}: {
  sport: SportId;
  items: MissingDataItem[];
  onRatingClick?: () => void;
}) {
  if (!items.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 size={16} aria-hidden="true" />
        SwingVantage has a well-rounded picture of your game.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.slice(0, 5).map((item) => {
        const isRating = item.kind === 'rating';
        const handleClick = () => {
          track(ANALYTICS_EVENTS.JOURNEY_MISSING_DATA_CLICKED, { sport, prompt: item.id, kind: item.kind });
          if (isRating && onRatingClick) onRatingClick();
        };
        const inner = (
          <>
            <Sparkles size={15} className="mt-0.5 shrink-0 text-accent-secondary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{item.label}</span>
              <span className="block text-xs text-muted-foreground">{item.description}</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary shrink-0">
              {item.ctaLabel}
              <ArrowRight size={13} aria-hidden="true" />
            </span>
          </>
        );
        const className =
          'flex items-start gap-2 rounded-theme border border-border bg-card p-2.5 hover:bg-muted transition-colors w-full text-left';
        // Rating prompts open the in-page panel; others navigate.
        return (
          <li key={item.id}>
            {isRating && onRatingClick ? (
              <button type="button" onClick={handleClick} className={className}>
                {inner}
              </button>
            ) : (
              <Link href={item.href} onClick={handleClick} className={className}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
