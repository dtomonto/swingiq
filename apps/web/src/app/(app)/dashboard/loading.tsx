import { Skeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';

// Route-level loading UI shown during navigation to the dashboard.
// Uses the shared skeleton primitives so the placeholder matches
// the real layout (header → intelligence block → quick actions →
// content grid) and respects the active theme.

export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" aria-busy="true">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Intelligence block */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Quick actions */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-5">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
