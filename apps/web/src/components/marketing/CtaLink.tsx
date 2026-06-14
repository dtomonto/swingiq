import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type CtaVariant = 'solid' | 'inverse';
type CtaSize = 'md' | 'lg';

// The marketing CTA link — a link styled as the big rounded call-to-action that
// was hand-inlined across heroes, CTA bands and audience pages. `solid` is the
// green primary button; `inverse` is the dark-on-green chip used inside primary
// panels. Distinct from the in-app `Button` (this is the marketing display CTA),
// so it lives here with its own variants and maps to a Figma "CTA" component.
const variantClasses: Record<CtaVariant, string> = {
  solid: 'bg-primary text-primary-foreground shadow-theme transition-colors hover:bg-primary/90',
  inverse: 'bg-background text-foreground transition-opacity hover:opacity-90',
};

const sizeClasses: Record<CtaSize, string> = {
  md: 'px-7 py-3 text-base',
  lg: 'px-10 py-4 text-base',
};

export function CtaLink({
  href,
  children,
  variant = 'solid',
  size = 'md',
  withArrow = true,
  className,
}: {
  href: string;
  children: ReactNode;
  /** @default 'solid' */
  variant?: CtaVariant;
  /** @default 'md' */
  size?: CtaSize;
  /** Trailing arrow glyph. @default true */
  withArrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
      {withArrow && <ArrowRight size={18} aria-hidden="true" />}
    </Link>
  );
}
