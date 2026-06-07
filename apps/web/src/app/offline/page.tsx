import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * Offline fallback. Served by the service worker (public/sw.js) when a
 * navigation fails because the device is offline. Kept dependency-light and
 * public (see middleware PUBLIC_PATHS) so the worker can precache it
 * regardless of auth state.
 */
export const metadata: Metadata = {
  title: 'Offline — SwingVantage',
  robots: 'noindex, nofollow',
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-golf-fairway">
        <span className="text-2xl font-black text-white">SV</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">You&apos;re offline</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          SwingVantage couldn&apos;t reach the network. Anything you&apos;ve saved is safe on this
          device — reconnect to load new pages and sync your progress.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="tap-target rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </Link>
    </main>
  );
}
