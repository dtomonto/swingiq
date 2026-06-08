'use client';

// ============================================================
// DataTrustNote — honest, trust-building data-use copy
// ------------------------------------------------------------
// Reusable explainer placed near profile/session flows. Communicates,
// in plain English, that SwingVantage uses a user's data to improve
// THEIR experience and the product — and never sells it. Mode-agnostic
// and truthful (no misleading "local-only" claims). Links to the
// privacy controls.
// ============================================================

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { DATA_ETHICS } from '@/lib/central-intelligence';

export function DataTrustNote({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          {DATA_ETHICS.ownExperience} {DATA_ETHICS.neverSold}{' '}
          <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">Manage your data</Link>.
        </span>
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-label="How SwingVantage uses your data">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        Your data, used to help you
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        SwingVantage uses your profile, equipment, session history and practice data to personalize your
        coaching, remember your goals, track your progress, and make smarter recommendations over time.
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {Object.values(DATA_ETHICS).map((line) => (
          <li key={line} className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        <Link href="/settings" className="font-medium text-foreground underline underline-offset-2">Manage privacy &amp; your data →</Link>
      </p>
    </section>
  );
}
