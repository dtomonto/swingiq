'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { TutorialDrawer } from './TutorialDrawer';
import { getTutorialForRoute } from '@/lib/tutorial/content';
import { useTutorial } from '@/hooks/useTutorial';
import { cn } from '@/lib/utils';

interface ContextualHelpButtonProps {
  /** Override for the route path — defaults to current pathname */
  routeOverride?: string;
  /** Additional CSS class names for the button */
  className?: string;
  /** Visual style variant */
  variant?: 'floating' | 'inline' | 'compact';
}

/**
 * A "?" help button that opens a contextual guide for the current screen.
 * Place once in AppShell so it appears on every page automatically.
 * Also exported so individual pages can place their own.
 */
export function ContextualHelpButton({
  routeOverride,
  className,
  variant = 'compact',
}: ContextualHelpButtonProps) {
  const pathname = usePathname();
  const route = routeOverride ?? pathname;
  const tutorial = getTutorialForRoute(route);
  const { isCompleted, markCompleted, markDismissed } = useTutorial();
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleComplete = useCallback(() => {
    if (tutorial) markCompleted(tutorial);
  }, [tutorial, markCompleted]);
  const handleDismiss = useCallback(() => {
    if (tutorial) markDismissed(tutorial);
    setOpen(false);
  }, [tutorial, markDismissed]);

  if (!tutorial) return null;

  const alreadyCompleted = isCompleted(tutorial.id);

  if (variant === 'floating') {
    // ⚠️ DEPRECATED / unused: this self-positioned floating variant predates the
    // FloatingDock and hard-codes its own bottom-right `fixed` offset, which
    // would collide with the dock. Do NOT mount it standalone. If a global
    // floating help button is ever wanted again, add it as a <FloatingDock>
    // child instead (see docs/FLOATING_UTILITY_DOCK.md). Kept only for the
    // existing `inline`/`compact` variants below.
    return (
      <>
        <button
          onClick={handleOpen}
          className={cn(
            'fixed bottom-24 right-4 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center',
            'bg-card border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50',
            'transition-colors lg:bottom-6 lg:right-6',
            className,
          )}
          aria-label={`Open guide: ${tutorial.pageTitle}`}
          title={`Help — ${tutorial.pageTitle}`}
        >
          <HelpCircle size={22} />
        </button>
        {open && (
          <TutorialDrawer
            tutorial={tutorial}
            open={open}
            onClose={handleClose}
            onComplete={handleComplete}
            onDismiss={handleDismiss}
            alreadyCompleted={alreadyCompleted}
          />
        )}
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={handleOpen}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
            'text-primary bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors',
            className,
          )}
          aria-label={`Open guide: ${tutorial.pageTitle}`}
        >
          <HelpCircle size={14} aria-hidden="true" />
          Guide
        </button>
        {open && (
          <TutorialDrawer
            tutorial={tutorial}
            open={open}
            onClose={handleClose}
            onComplete={handleComplete}
            onDismiss={handleDismiss}
            alreadyCompleted={alreadyCompleted}
          />
        )}
      </>
    );
  }

  // compact — icon-only button (used in headers)
  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          'p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors',
          className,
        )}
        aria-label={`Open guide: ${tutorial.pageTitle}`}
        title="Help"
      >
        <HelpCircle size={18} />
      </button>
      {open && (
        <TutorialDrawer
          tutorial={tutorial}
          open={open}
          onClose={handleClose}
          onComplete={handleComplete}
          onDismiss={handleDismiss}
          alreadyCompleted={alreadyCompleted}
        />
      )}
    </>
  );
}
