// DecisionCard — one decision in the Decision Center: a priority score, the
// type, an interpreted "our read", honest meta chips and a CTA back to the
// tool that handles it. Server-safe. The priority is derived transparently
// from severity + volume of the underlying action (never invented).

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export type DecisionBand = 'critical' | 'warning' | 'watch' | 'routine';

const BAND: Record<DecisionBand, { score: string; border: string; bar: string }> = {
  critical: { score: 'text-error-text', border: 'border-error/35', bar: 'bg-error' },
  warning: { score: 'text-warning-text', border: 'border-border', bar: 'bg-warning' },
  watch: { score: 'text-link', border: 'border-border', bar: 'bg-chart-1' },
  routine: { score: 'text-success-text', border: 'border-border', bar: 'bg-success' },
};

export interface DecisionCardProps {
  /** 0–100 priority. */
  score: number;
  band: DecisionBand;
  /** Source / type label, e.g. "PublishingOS". */
  type: string;
  title: string;
  /** Interpreted one-liner — what it is and why it matters. */
  read?: string;
  /** Honest meta chips (severity, count, …). */
  meta?: string[];
  href: string;
  cta: string;
}

export function DecisionCard({ score, band, type, title, read, meta, href, cta }: DecisionCardProps) {
  const b = BAND[band];
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-theme ${b.border}`}>
      <div className="flex gap-4">
        {/* Priority block */}
        <div className="w-14 shrink-0 text-center">
          <p className={`font-mono text-2xl font-bold tabular-nums ${b.score}`} aria-label={`priority ${score} of 100`}>
            {score}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">priority</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
              {type}
            </span>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          {read && (
            <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">Our read:</span> {read}
            </p>
          )}
          {meta && meta.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {meta.map((m) => (
                <span key={m} className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex shrink-0 items-center">
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/[0.06] px-3 py-1.5 text-sm font-medium text-link hover:border-primary/50"
          >
            {cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
