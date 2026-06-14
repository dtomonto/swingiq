import Link from 'next/link';
import {
  Target,
  ShieldQuestion,
  Users,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { getSampleReport } from '@/content/sampleReports';
import { PrivacyAssuranceBlock, NotCoachReplacementNotice } from '@/components/trust';
import { ConfidenceLabelExplainer } from '@/components/trust/ConfidenceLabelExplainer';

// ============================================================
// SwingVantage — Sport Proof Block
//
// Reusable "proof, not just claims" section for sport hubs and the
// homepage. Derives from the sample-report config (single source of
// truth) so the worked example, evidence, limits, and coach/parent
// summary never drift from the full sample report.
//
// Renders: example diagnosis → what we use → what we can't know →
// how you'll measure progress → coach/parent summary → confidence
// explainer + privacy/coach-pairing reassurance, with a link to the
// full sample report. Server component (no client state).
// See docs/FIVE_PERSONA_MASTER_PLAN.md §9.
// ============================================================

export function SportProofBlock({
  reportSlug,
  heading = 'Proof, not just claims',
}: {
  /** A sample-report slug: golf | baseball | slow-pitch | fast-pitch | softball */
  reportSlug: string;
  heading?: string;
}) {
  const r = getSampleReport(reportSlug);
  if (!r) return null;

  return (
    <section className="bg-muted py-14">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-2xl font-bold text-foreground text-center mb-3">{heading}</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Here&apos;s a worked {r.sportLabel} example on sample data — the same shape your real
          report takes. We show the evidence, the confidence, and what we honestly can&apos;t know.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Example diagnosis */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:col-span-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-primary">Example diagnosis</p>
            <p className="mt-1 font-semibold text-foreground">{r.issueDetected}</p>
            <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Top fix:</span> {r.highestPriorityFix}</p>
          </div>

          {/* What we use */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Target size={16} className="text-primary" aria-hidden="true" /> What SwingVantage uses
            </h3>
            <ul className="mt-2 space-y-1.5">
              {r.evidenceUsed.map((e) => (
                <li key={e} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What we can't know */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldQuestion size={16} className="text-warning" aria-hidden="true" /> What it can&apos;t know
            </h3>
            <ul className="mt-2 space-y-1.5">
              {r.whatWeCannotKnow.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-warning" aria-hidden="true">–</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Retest / progress */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <RotateCcw size={16} className="text-primary" aria-hidden="true" /> How you&apos;ll measure progress
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.retestInstructions}</p>
          </div>

          {/* Coach / parent summary */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Users size={16} className="text-primary" aria-hidden="true" /> Coach{r.parentSummary ? ' & parent' : ''} summary
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.coachSummary}</p>
            {r.parentSummary && <p className="mt-2 text-sm text-muted-foreground">{r.parentSummary}</p>}
          </div>
        </div>

        {/* Confidence + trust reassurance */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ConfidenceLabelExplainer />
          <NotCoachReplacementNotice />
        </div>
        <div className="mt-4">
          <PrivacyAssuranceBlock />
        </div>

        {/* Link to the full worked example */}
        <p className="mt-8 text-center">
          <Link
            href={`/sample-report/${r.slug}`}
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            See the full {r.sportLabel} sample report
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </div>
    </section>
  );
}
