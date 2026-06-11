import { cn } from '@/lib/utils';
import { ShieldCheck, type LucideIcon } from 'lucide-react';

interface TrustBadgeProps {
  children: React.ReactNode;
  /** Leading icon. @default ShieldCheck */
  icon?: LucideIcon;
  /** Visual weight. @default 'neutral' */
  variant?: 'neutral' | 'verified';
  className?: string;
}

/**
 * Small trust-signal chip for the privacy-forward surfaces (e.g.
 * "No ads, no data sales", "Keyless by default", "Pairs with a coach").
 *
 * App-original — there is no design-system reference component for this yet,
 * so it is kept intentionally minimal and fully token-based so it adopts any
 * theme. Copy stays honest: only claim what is true (see the project's
 * never-fabricate / privacy-forward rules).
 */
export function TrustBadge({ children, icon: Icon = ShieldCheck, variant = 'neutral', className }: TrustBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        variant === 'verified'
          ? 'border-success/30 bg-success/10 text-success-text'
          : 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon size={14} aria-hidden="true" className="shrink-0" />
      {children}
    </span>
  );
}
