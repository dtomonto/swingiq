import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

type CardTint = 'none' | 'primary' | 'warning' | 'success' | 'error' | 'muted';

interface CardRootProps extends CardProps {
  /** Soft status-tint surface (issue / success / info panels). @default 'none' */
  tint?: CardTint;
  /** Use the theme's elevated shadow instead of the resting card shadow. */
  elevated?: boolean;
  /** Add the theme's accent glow ring (neon on dark themes, soft ring on light). */
  glow?: boolean;
}

// Tints layer a faint status wash + matching border over the card surface.
// They consume theme tokens, so each theme restyles them automatically.
const tintClasses: Record<CardTint, string> = {
  none: '',
  primary: 'bg-primary/10 border-primary/30',
  warning: 'bg-warning/10 border-warning/30',
  success: 'bg-success/10 border-success/30',
  error: 'bg-error/10 border-error/30',
  muted: 'bg-muted border-transparent',
};

export function Card({
  className,
  children,
  tint = 'none',
  elevated = false,
  glow = false,
  style,
  ...props
}: CardRootProps) {
  // Compose the box-shadow only when a non-default elevation/glow is requested
  // so the common path stays on the `shadow-theme` utility (byte-identical to
  // before). Glow layers ON TOP of the surface shadow, matching the design ref.
  const composedShadow =
    elevated || glow
      ? [elevated ? 'var(--shadow-elevated)' : 'var(--shadow-card)', glow ? 'var(--glow)' : null]
          .filter(Boolean)
          .join(', ')
      : undefined;
  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-theme border border-border',
        !composedShadow && 'shadow-theme',
        tintClasses[tint],
        className,
      )}
      style={composedShadow ? { boxShadow: composedShadow, ...style } : style}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-border', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cn('text-base font-semibold text-card-foreground', className)} {...props}>
      {children}
    </h3>
  );
}

type EyebrowColor = 'link' | 'muted' | 'warning' | 'success';

const eyebrowColor: Record<EyebrowColor, string> = {
  link: 'text-link',
  muted: 'text-muted-foreground',
  warning: 'text-warning-text',
  success: 'text-success-text',
};

interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** @default 'link' */
  color?: EyebrowColor;
  children: React.ReactNode;
}

/** Tiny uppercase, wide-tracked label above headings / atop report panels. */
export function Eyebrow({ className, children, color = 'link', ...props }: EyebrowProps) {
  return (
    <p
      className={cn('text-[11px] font-semibold uppercase tracking-[0.06em]', eyebrowColor[color], className)}
      {...props}
    >
      {children}
    </p>
  );
}
