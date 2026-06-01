import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'critical' | 'high' | 'medium';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-error/15 text-error',
  info: 'bg-accent-secondary/15 text-accent-secondary',
  critical: 'bg-error/15 text-error ring-1 ring-error/30',
  high: 'bg-warning/20 text-warning ring-1 ring-warning/40',
  medium: 'bg-warning/12 text-warning ring-1 ring-warning/25',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
