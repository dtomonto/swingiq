// /design-lab/diagnose — DEV-ONLY seeded preview of the real diagnose result.
// notFound() in production + noindex. Lets the auth-gated DiagnoseContent (and
// its three glowing Overall / Face / Strike rings) be reviewed without a
// Supabase session.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DiagnosePreview } from './DiagnosePreview';

export const metadata: Metadata = {
  title: 'Design Lab · Diagnose (dev)',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function DesignLabDiagnosePage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/40 px-4 py-3">
        <p className="mx-auto max-w-4xl text-xs text-muted-foreground">
          <span className="font-semibold text-link">Design Lab · Diagnose</span> — the real{' '}
          <code className="text-link">DiagnoseContent</code> seeded with a 9-shot demo session so the engine computes
          real scores (dev-only, noindex). Restores your real local store on exit.
        </p>
      </div>
      <DiagnosePreview />
    </main>
  );
}
