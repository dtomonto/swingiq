// ============================================================
// DeterministicWhyPanel — explainable "why we think this" block
// ------------------------------------------------------------
// Renders the deterministic diagnosis engine's reasoning for an athlete:
// the likely cause, a possible alternative, the evidence behind it, anything
// worth double-checking, what would change the read, and an honest "when a
// deeper look helps" note. Collapsed by default (complex detail expands on
// demand) and presentational only — no hooks, no I/O, no AI.
//
// Honesty: this is a reported-symptom estimate, never a claim that a video was
// analyzed. The panel renders nothing for a synthesized/unmatched cause.
// ============================================================

import { Lightbulb, CheckCircle2, AlertTriangle, HelpCircle, Sparkles } from 'lucide-react';
import type { DeterministicDiagnosis } from '@/lib/intelligence/diagnose-types';

export function DeterministicWhyPanel({
  diagnosis,
  footerNote,
}: {
  diagnosis: DeterministicDiagnosis;
  /** Overrides the honest footer line (e.g. for a video-derived issue). */
  footerNote?: string;
}) {
  const d = diagnosis;
  // Only meaningful when we matched a curated cause.
  if (d.primary.generated) return null;

  const alternative = d.secondary && d.secondary.share >= 0.2 && !d.secondary.generated ? d.secondary : null;
  const supporting = d.supportingEvidence.slice(0, 3);
  const changeIt = d.whatWouldChangeIt.slice(0, 2);

  return (
    <details className="group rounded-2xl border border-border bg-card p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Lightbulb size={16} className="text-primary" aria-hidden="true" />
          Why we think this
        </span>
        <span className="text-xs font-medium text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden text-xs font-medium text-muted-foreground group-open:inline">Hide</span>
      </summary>

      <div className="mt-3 space-y-4">
        {/* Confidence reasoning */}
        <p className="text-sm text-muted-foreground">{d.confidenceReason}</p>

        {/* Supporting evidence */}
        {supporting.length > 0 && (
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-success">What points to it</p>
            <ul className="mt-1.5 space-y-1 text-sm text-foreground">
              {supporting.map((e) => (
                <li key={e} className="flex gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Possible alternative cause */}
        {alternative && (
          <p className="text-sm text-foreground">
            <span className="font-semibold">It could also be:</span> {alternative.name} — keep it in mind if the first
            fix doesn’t change the miss.
          </p>
        )}

        {/* Contradictions worth double-checking */}
        {d.contradictingEvidence.length > 0 && (
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-warning">Worth double-checking</p>
            <ul className="mt-1.5 space-y-1 text-sm text-foreground">
              {d.contradictingEvidence.slice(0, 2).map((c) => (
                <li key={c} className="flex gap-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What would change the read */}
        {changeIt.length > 0 && (
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              What would change this
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
              {changeIt.map((c) => (
                <li key={c} className="flex gap-2">
                  <HelpCircle size={15} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Honest escalation note */}
        {d.escalateToAI && d.escalationReasons.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles size={14} aria-hidden="true" /> A deeper look would help here
            </p>
            <p className="mt-1 text-xs text-primary">{d.escalationReasons[0]}.</p>
          </div>
        )}

        <p className="text-2xs text-muted-foreground">
          {footerNote ??
            'This is a deterministic estimate from your reported miss — not a video analysis. Confirm it by retesting or uploading a swing.'}
        </p>
      </div>
    </details>
  );
}
