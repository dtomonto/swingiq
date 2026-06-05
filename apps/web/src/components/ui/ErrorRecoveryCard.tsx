'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// ============================================================
// SwingVantage — ErrorRecoveryCard
// ------------------------------------------------------------
// One shared, calm error state. Answers the same three questions
// as EmptyState — what happened, why it's okay, what to do next —
// and always offers a way forward (retry and/or a safe link).
// Designed to drop into a Next.js route `error.tsx` boundary, but
// usable anywhere a recoverable failure needs a friendly surface.
// Never blames the user; never exposes raw stack traces.
// ============================================================

export interface ErrorRecoveryCardProps {
  title?: string;
  message?: string;
  /** Retry handler — wire to a route error boundary's `reset()`. */
  onRetry?: () => void;
  retryLabel?: string;
  /** A safe place to go if retrying doesn't help. */
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}

export function ErrorRecoveryCard({
  title = 'Something went wrong',
  message = "This part didn't load. Your data is safe — nothing was lost. Try again, and if it keeps happening, head back and retry in a moment.",
  onRetry,
  retryLabel = 'Try again',
  homeHref,
  homeLabel = 'Back to dashboard',
  className,
}: ErrorRecoveryCardProps) {
  return (
    <Card className={cn('border-warning/30 bg-warning/10', className)}>
      <CardBody className="text-center py-8">
        <AlertTriangle
          size={36}
          className="mx-auto text-warning mb-2"
          aria-hidden="true"
        />
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              <RotateCcw size={14} />
              {retryLabel}
            </Button>
          )}
          {homeHref && (
            <Link href={homeHref}>
              <Button size="sm" variant="outline">
                {homeLabel}
              </Button>
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
