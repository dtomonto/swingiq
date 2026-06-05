'use client';

import { useEffect } from 'react';
import { ErrorRecoveryCard } from '@/components/ui/ErrorRecoveryCard';

// Route-level error boundary for the dashboard. Catches render
// errors in the segment and shows the shared, calm recovery card
// with a working retry (Next.js `reset()`), instead of a blank
// screen. Logs to the console for diagnostics — never to the user.

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard] render error:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ErrorRecoveryCard
        title="We couldn't load your dashboard"
        message="Something hiccuped while building this page. Your swings and data are safe — nothing was lost. Try again, and it usually clears right up."
        onRetry={reset}
        homeHref="/"
        homeLabel="Back to home"
      />
    </div>
  );
}
