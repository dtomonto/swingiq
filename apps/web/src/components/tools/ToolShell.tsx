'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';

interface ToolShellProps {
  title: string;
  subtitle: string;
  /** Breadcrumb trail (defaults to Home → Tools → title). */
  crumbs?: { name: string; path: string }[];
  /** Slug used for the Tools breadcrumb path. */
  slug: string;
  children: React.ReactNode;
  /** Show the "not a coach replacement" notice (default true). */
  showCoachNotice?: boolean;
}

/**
 * Shared, accessible, mobile-first layout for every free tool.
 * Provides the header, breadcrumbs, content slot, and honest
 * coach-replacement notice. Each tool supplies its own interactive
 * body and CTAs.
 */
export function ToolShell({
  title,
  subtitle,
  crumbs,
  slug,
  children,
  showCoachNotice = true,
}: ToolShellProps) {
  const trail = crumbs ?? [
    { name: 'Home', path: '/' },
    { name: 'Free Tools', path: '/tools' },
    { name: title, path: `/tools/${slug}` },
  ];

  return (
    <main className="min-h-screen bg-muted">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Breadcrumbs items={trail} className="mb-5" />

        <header className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <p className="mt-2 text-xs font-medium text-primary">Free · No account required · Private by default</p>
        </header>

        {children}

        {showCoachNotice && <NotCoachReplacementNotice className="mt-8" />}

        <nav aria-label="More free tools" className="mt-6 border-t border-border pt-5">
          <p className="mb-2 text-sm font-semibold text-foreground">More free tools</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <li><Link href="/tools/golf-slice-fixer" className="text-primary hover:underline">Golf Slice Fixer</Link></li>
            <li><Link href="/tools/swing-mistake-quiz" className="text-primary hover:underline">Swing Mistake Quiz</Link></li>
            <li><Link href="/tools/practice-plan-generator" className="text-primary hover:underline">Practice Plan Generator</Link></li>
            <li><Link href="/tools/at-home-swing-drill-generator" className="text-primary hover:underline">At-Home Drill Generator</Link></li>
          </ul>
        </nav>
      </div>
    </main>
  );
}

/** Reusable result panel used by tools after a submit. */
export function ResultPanel({ children }: { children: React.ReactNode }) {
  return (
    <section aria-live="polite" className="mt-6 space-y-4 rounded-2xl border border-primary/30 bg-card p-5 shadow-xs">
      {children}
    </section>
  );
}

/** Primary CTA used at the bottom of tool results. */
export function ToolCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block w-full rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {label}
    </Link>
  );
}
