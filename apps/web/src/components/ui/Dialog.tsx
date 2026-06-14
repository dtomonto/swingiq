'use client';

// Dialog — the SwingVantage modal primitive, built on @radix-ui/react-dialog
// (already a dependency). Radix gives us focus-trap, ESC-to-close, scroll-lock,
// `aria-modal`, and return-focus for free — so feature code never hand-rolls
// modal accessibility again. Styling is 100% token-driven (popover/modal
// surfaces, themed radius + elevation), so a Dialog restyles per theme like
// every other surface.
//
// Usage:
//   <Dialog open={open} onOpenChange={setOpen}>
//     <DialogContent>
//       <DialogHeader>
//         <DialogTitle>Title</DialogTitle>            // required for a11y
//         <DialogDescription>Body copy</DialogDescription>
//       </DialogHeader>
//       <DialogFooter>…actions…</DialogFooter>
//     </DialogContent>
//   </Dialog>

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Scrim uses the theme-independent overlay token at 60% — never a raw
      // color. Underscores are Tailwind v4's spaces, so this emits a valid
      // `hsl(0 0% 0% / 0.6)`.
      'fixed inset-0 z-50 bg-[hsl(var(--surface-scrim)_/_0.6)] backdrop-blur-sm',
      'data-[state=open]:animate-fade-in',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Hide the default top-right close affordance (e.g. a required choice). */
  hideClose?: boolean;
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4',
        'rounded-theme border border-border bg-popover p-5 text-popover-foreground shadow-theme-lg',
        'focus:outline-hidden data-[state=open]:animate-slide-up',
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          aria-label="Close"
          className={cn(
            'absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:pointer-events-none',
          )}
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pr-6', className)} {...props} />;
}
DialogHeader.displayName = 'DialogHeader';

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-base font-semibold text-foreground', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';
