'use client';

import { cn } from '@/lib/utils';
import type { SportId } from '@swingiq/core';
import { SPORT_DISPLAY } from '@/contexts/SportContext';
import { sportAccentVar } from './sport-accent';

export { sportAccentVar };

interface SportChipProps {
  /** @default 'golf' */
  sport?: SportId;
  /** Solid accent fill — the athlete's active sport. Soft tint when false. */
  active?: boolean;
  /** @default 'md' */
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

/**
 * Sport identity chip — emoji + name on the sport's theme-agnostic accent.
 * Solid fill when active, soft tint when selectable. The accent is applied via
 * inline style referencing the per-sport CSS variable (kept dynamic + static
 * class-free so Tailwind's purge can never drop it).
 */
export function SportChip({ sport = 'golf', active = false, size = 'md', onClick, className }: SportChipProps) {
  const display = SPORT_DISPLAY[sport];
  const v = sportAccentVar(sport);
  const clickable = typeof onClick === 'function';

  const style: React.CSSProperties = active
    ? { background: `hsl(var(${v}))`, color: `hsl(var(${v}-foreground))`, borderColor: 'transparent' }
    : { background: `hsl(var(${v}) / 0.12)`, color: 'hsl(var(--foreground))', borderColor: `hsl(var(${v}) / 0.35)` };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={clickable ? active : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        'transition-[background-color,color,border-color] duration-150',
        clickable ? 'cursor-pointer' : 'cursor-default',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]',
        className,
      )}
      style={style}
    >
      <span aria-hidden="true">{display.emoji}</span>
      {display.name}
    </button>
  );
}
