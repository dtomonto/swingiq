// /design-lab/dashboard — DEV-ONLY seeded preview of the real golf dashboard.
// notFound() in production + noindex (same guard as the design-lab index), so
// it is only ever reachable in development. Lets the auth-gated DashboardContent
// (and its glowing Overall score) be reviewed without a Supabase session.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DashboardPreview } from './DashboardPreview';

export const metadata: Metadata = {
  title: 'Design Lab · Dashboard (dev)',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function DesignLabDashboardPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/40 px-4 py-3">
        <p className="mx-auto max-w-5xl text-xs text-muted-foreground">
          <span className="font-semibold text-link">Design Lab · Dashboard</span> — the real{' '}
          <code className="text-link">DashboardContent</code> seeded with demo data (dev-only, noindex). Restores
          your real local store on exit.
        </p>
      </div>
      <DashboardPreview />
    </main>
  );
}
