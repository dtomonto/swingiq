import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Marketing layout primitives — the auto-layout-equivalent of a Figma section
 * frame. `Section` owns the section rhythm (vertical padding), max-width, and
 * horizontal gutters that were copy-pasted as `max-w-… mx-auto px-4 py-14`
 * across ~40 marketing pages; `SectionHeading` owns the one H2 scale they all
 * shared. Keeping them here means the page rhythm + heading scale are a single
 * source of truth (and map cleanly to one Figma component each).
 */

type SectionBg = 'none' | 'card' | 'muted';
type SectionWidth = '3xl' | '4xl' | '5xl' | '6xl';

const bgClass: Record<SectionBg, string> = {
  none: '',
  card: 'bg-card',
  muted: 'bg-muted',
};

const widthClass: Record<SectionWidth, string> = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
};

export function Section({
  bg = 'none',
  width = '6xl',
  className,
  innerClassName,
  children,
}: {
  /** Optional themed section background. @default 'none' */
  bg?: SectionBg;
  /** Inner content max-width. @default '6xl' */
  width?: SectionWidth;
  /** Extra classes on the `<section>` (e.g. an id anchor or border). */
  className?: string;
  /** Extra classes on the inner max-width container. */
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(bgClass[bg], 'py-14', className)}>
      <div className={cn(widthClass[width], 'mx-auto px-4', innerClassName)}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  as: Tag = 'h2',
  align = 'start',
  className,
  children,
}: {
  /** Heading level — keep document order correct per page. @default 'h2' */
  as?: 'h1' | 'h2' | 'h3';
  /** @default 'start' */
  align?: 'start' | 'center';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn('text-2xl font-bold text-foreground', align === 'center' && 'text-center', className)}>
      {children}
    </Tag>
  );
}
