import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * Honest framing for the public /demo: this is a real, fully-featured sample
 * report — the same surfaces a registered athlete gets — built from sample
 * data, free, no account required. Never presented as a real person's result.
 */
export function DemoSampleBanner() {
  return (
    <div className="border-b border-border bg-primary/5">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-foreground">
          <Sparkles size={14} className="shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong>Live sample report</strong> — exactly what registered athletes see, built from
            sample data. Free, no account needed.
          </span>
        </p>
        <Link
          href="/start"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Analyze your own swing
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
