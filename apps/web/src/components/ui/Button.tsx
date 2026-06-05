import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

// Variants consume theme tokens so each theme restyles them automatically.
// `btn-theme-primary` paints solid `--primary` with an optional per-theme
// gradient overlay; `brightness` hovers work on both solid and gradient fills,
// and the slight active depress gives a tactile, premium feel everywhere.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'btn-theme-primary text-primary-foreground shadow-sm hover:brightness-[1.08] hover:shadow-md active:translate-y-px active:brightness-95 focus:ring-ring',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:translate-y-px focus:ring-ring',
  ghost: 'bg-transparent text-foreground hover:bg-muted active:bg-muted/80 focus:ring-ring',
  danger:
    'bg-error text-error-foreground shadow-sm hover:brightness-[1.08] hover:shadow-md active:translate-y-px focus:ring-error',
  outline:
    'bg-card text-foreground border border-border hover:bg-muted hover:border-border/80 active:translate-y-px focus:ring-ring',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
          'focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-[color,background-color,filter,box-shadow,transform] duration-150',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
