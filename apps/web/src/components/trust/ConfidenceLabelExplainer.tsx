import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// SwingVantage — Confidence Label Explainer
//
// Explains, in plain language, the honest confidence tiers used
// across the product so a label like "heuristic estimate" or
// "illustrative example" is never mysterious. Keeps the disclaimer
// confident and welcoming (per owner standard) rather than scary.
// Collapsible so it adds trust without taking much space.
// See docs/FIVE_PERSONA_MASTER_PLAN.md §9.
// ============================================================

const TIERS = [
  {
    label: 'Illustrative example',
    body: 'Sample data, not your swing — used on demos and the sample reports so you can see the format before you start.',
  },
  {
    label: 'Heuristic estimate',
    body: 'A smart, data-backed read from limited input (a self-report or a single video). It is honest about being an estimate, and it sharpens every time you add a swing.',
  },
  {
    label: 'Measured',
    body: 'Values actually computed from your swing video or imported launch/sensor data are labelled as measured — not estimated.',
  },
];

export function ConfidenceLabelExplainer({ className }: { className?: string }) {
  return (
    <details className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
        <Info size={16} className="text-primary" aria-hidden="true" />
        What do the confidence labels mean?
      </summary>
      <div className="mt-3 space-y-3">
        {TIERS.map((t) => (
          <div key={t.label}>
            <p className="text-sm font-semibold text-foreground">{t.label}</p>
            <p className="text-sm text-muted-foreground">{t.body}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          We always show you which one you are looking at, and never present an estimate as a measurement.
        </p>
      </div>
    </details>
  );
}
