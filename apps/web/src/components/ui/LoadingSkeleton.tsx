import { cn } from '@/lib/utils';

// ============================================================
// SwingIQ — Loading Skeletons
// ------------------------------------------------------------
// Shared shimmer primitives so loading states look consistent
// everywhere (route-level loading.tsx, lazy panels, hydration
// gaps) instead of each screen rolling its own `animate-pulse`.
// Token-driven (bg-muted) so they respect every theme.
// ============================================================

/** A single shimmer block. Size it with className (h-*, w-*). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
    />
  );
}

export interface LoadingSkeletonProps {
  /** Number of text lines to render. */
  lines?: number;
  className?: string;
}

/** A stack of text-line skeletons. The last line is shortened. */
export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn('space-y-2', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A card-shaped skeleton (header bar + a few body lines). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5',
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-5 w-1/3 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
