// ============================================================
// SwingIQ — Analysis Transparency Panel
// ------------------------------------------------------------
// One reusable, honest "what is this result based on?" panel to
// place under ANY generated result: a diagnosis, a practice plan,
// a video review, an AI-coach reply, an equipment note, or a
// report. It tells the user, in plain language:
//   1. what the result is based on (evidence),
//   2. whether raw video was actually analysed,
//   3. the confidence level and why,
//   4. what would raise the confidence,
//   5. that SwingIQ does not replace a qualified professional,
//   6. (optional) the single next best action.
//
// Presentational only — callers pass already-computed values, so
// the same panel reads consistently everywhere.
// ============================================================

import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentConfidence } from '@/lib/agents';
import { ConfidenceBadge } from '@/components/agents/ConfidenceBadge';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';

export interface AnalysisTransparencyProps {
  /** Plain-language bullets: what this result was derived from. */
  basedOn: string[];
  /** True only if validated video-processing/sensor logic measured the swing. */
  videoAnalyzed: boolean;
  /** Confidence level + reason (reuses the agent-layer shape). */
  confidence: AgentConfidence;
  /** What the user could do to raise confidence next. */
  whatImproves?: string[];
  /** Optional single next best action. */
  nextAction?: { label: string; href: string };
  /** Show the "not a coach replacement" notice (default true). */
  showSafetyNotice?: boolean;
  /** A short label for the kind of result, e.g. "diagnosis" or "plan". */
  resultNoun?: string;
  className?: string;
}

export function AnalysisTransparency({
  basedOn,
  videoAnalyzed,
  confidence,
  whatImproves,
  nextAction,
  showSafetyNotice = true,
  resultNoun = 'result',
  className,
}: AnalysisTransparencyProps) {
  return (
    <section
      aria-label="How this result was produced"
      className={cn('rounded-2xl border border-gray-200 bg-white p-5', className)}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-green-700" aria-hidden="true" />
        <h3 className="text-sm font-bold text-gray-900">What this {resultNoun} is based on</h3>
      </div>

      {basedOn.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
          {basedOn.map((e) => (
            <li key={e} className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
              {e}
            </li>
          ))}
        </ul>
      )}

      {/* Video honesty + confidence reason */}
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {videoAnalyzed ? (
            <>
              A swing video was processed for this {resultNoun}. Measured values are labelled as such;
              anything not measured is shown as an estimate.
            </>
          ) : (
            <>
              No swing video was analysed and no swing was measured for this {resultNoun}. It is an{' '}
              <strong>estimate</strong>
              {confidence.reason ? <> — {confidence.reason}</> : null}.
            </>
          )}
        </span>
      </p>

      {/* Confidence chip */}
      <div className="mt-3">
        <ConfidenceBadge confidence={confidence} />
      </div>

      {/* What would raise confidence */}
      {whatImproves && whatImproves.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-900">What would raise the confidence</p>
          <ul className="mt-1.5 space-y-1 text-sm text-gray-600">
            {whatImproves.map((w) => (
              <li key={w} className="flex gap-2"><span className="text-green-600">→</span>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety notice */}
      {showSafetyNotice && <NotCoachReplacementNotice className="mt-4" />}

      {/* Next best action */}
      {nextAction && (
        <Link
          href={nextAction.href}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          {nextAction.label}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
