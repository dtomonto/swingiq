import Link from 'next/link';
import { FixCard } from '@/components/ui/FixCard';
import { DrillCard } from '@/components/ui/DrillCard';
import { Button } from '@/components/ui/Button';

interface DiagnosisFixSheetProps {
  /** The one priority fix (top diagnosis name, or the next-action sentence). */
  fix: string;
  /** Why it matters / what to do next — one short paragraph. */
  whatToDoNext: string;
  /** Top-diagnosis confidence (0–100); null when there's too little data. */
  confidencePct: number | null;
  /** Honest "based on …" note shown next to the confidence chip. */
  confidenceNote?: string;
  /** First moves for the plan (drill step descriptions). */
  drills?: string[];
  /** Retest success criteria. */
  retestCriteria?: string;
  /** Retest shot count. */
  retestShots?: number;
  className?: string;
}

function confidenceLabel(pct: number | null): string {
  if (pct == null) return 'Confidence: limited data';
  if (pct >= 70) return `High confidence · ${pct}%`;
  if (pct >= 40) return `Moderate confidence · ${pct}%`;
  return `Lower confidence · ${pct}%`;
}

/**
 * Design V2 report hero — "the report is paper". Renders the single priority
 * fix as a FixCard on the light document surface (sunlight-proof in every
 * theme), the first plan moves as DrillCards on that paper, and a gradient
 * retest CTA (SwingVantage chrome, not paper). Presentational only: it takes
 * data the diagnosis page already computes; no engine/plumbing changes.
 *
 * Honesty is preserved by construction — FixCard always carries a confidence
 * label, and the page's full AnalysisTransparency panel still renders below.
 */
export function DiagnosisFixSheet({
  fix,
  whatToDoNext,
  confidencePct,
  confidenceNote,
  drills = [],
  retestCriteria,
  retestShots,
  className,
}: DiagnosisFixSheetProps) {
  return (
    <section className={className} aria-label="Your priority fix">
      <FixCard
        eyebrow="Primary fix identified"
        fix={fix}
        why={whatToDoNext}
        confidence={confidenceLabel(confidencePct)}
        confidenceNote={confidenceNote}
      />

      {drills.length > 0 && (
        <div className="mt-4 rounded-2xl bg-document p-5 shadow-theme-lg">
          {/* On paper: use the document accent, never the theme `--link` (which
              can be a light accent that fails on the light sheet). */}
          <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.06em] text-document-accent">
            Your first moves
          </p>
          <div className="space-y-2">
            {drills.map((step, i) => (
              <DrillCard key={i} n={i + 1} name={step} onPaper />
            ))}
          </div>
        </div>
      )}

      {retestCriteria && (
        <div className="btn-theme-primary mt-4 rounded-2xl p-5 text-primary-foreground shadow-theme">
          <p className="text-sm font-semibold text-primary-foreground/85">Retest to confirm the fix</p>
          <p className="mt-0.5 text-sm">
            {retestCriteria}
            {retestShots ? ` · ${retestShots} shots` : ''}
          </p>
          <Link href="/sessions/import" className="mt-3 inline-block">
            <Button variant="secondary" size="sm">
              Log your retest
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
