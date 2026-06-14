'use client';

// Input — the text-field primitive. Token-styled (input border/surface), with a
// keyboard-only focus ring and an aria-invalid error state that <Field> wires up.
// Replaces the ~60 raw <input> elements across the app.

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-error',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
