import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

// Variants consume theme tokens so each theme restyles them automatically.
// `btn-theme-primary` paints solid `--primary` with an optional per-theme
// gradient overlay; `brightness` hovers work on both solid and gradient fills,
// and the slight active depress gives a tactile, premium feel everywhere.
//
// Exported as `buttonVariants` (the shadcn pattern) so a link or any other
// element can borrow the exact button styling without duplicating the class
// soup — pair with `asChild` below, or `className={buttonVariants({ variant })}`.
export const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 rounded-button font-medium',
    // Keyboard-only focus ring (`focus-visible`), so a mouse click stays clean
    // while keyboard/AT users always get a visible WCAG 2.4.7 indicator.
    'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-[color,background-color,filter,box-shadow,transform] duration-150',
  ),
  {
    variants: {
      variant: {
        primary:
          'btn-theme-primary text-primary-foreground shadow-sm hover:brightness-[1.08] hover:shadow-md active:translate-y-px active:brightness-95 focus-visible:ring-ring',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:translate-y-px focus-visible:ring-ring',
        ghost: 'bg-transparent text-foreground hover:bg-muted active:bg-muted/80 focus-visible:ring-ring',
        danger:
          'bg-error text-error-foreground shadow-sm hover:brightness-[1.08] hover:shadow-md active:translate-y-px focus-visible:ring-error',
        outline:
          'bg-card text-foreground border border-border hover:bg-muted hover:border-border/80 active:translate-y-px focus-visible:ring-ring',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  /**
   * Render the styling onto the child element instead of a `<button>` (Radix
   * Slot). Use for links-styled-as-buttons so a Figma "Button" maps to ONE code
   * component regardless of whether it renders an `<a>` or a `<button>`:
   *   <Button asChild><Link href="/start">Start free</Link></Button>
   * `loading` is button-only (the spinner needs a real child slot), so it is
   * ignored when `asChild` is set.
   */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, asChild = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        // A real <button> gets the disabled attr; Slot forwards remaining props
        // onto its child (an <a> can't be `disabled`, so it's simply omitted).
        {...(asChild ? {} : { disabled: disabled || loading })}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {!asChild && loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  },
);

Button.displayName = 'Button';
