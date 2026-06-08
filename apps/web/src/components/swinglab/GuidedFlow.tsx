// ============================================================
// SwingVantage — SwingLab 2.0: Guided Flow (Phase 3)
// ------------------------------------------------------------
// "The lab leads, you follow." Renders the user's guided improvement
// loop as an ordered stepper: done steps from real evidence, the current
// step highlighted with a CTA into the tool, upcoming steps dimmed.
// Presentational — receives the computed path from LabExperience.
// ============================================================

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { LAB_STATIONS } from '@/content/swinglab';
import type { GuidedStep } from '@/lib/swinglab/labState';

const STATION_BY_ID = Object.fromEntries(LAB_STATIONS.map((s) => [s.id, s]));

export function GuidedFlow({ steps }: { steps: GuidedStep[] }) {
  if (steps.length === 0) return null;

  const currentIndex = steps.findIndex((s) => s.status === 'current');
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const allDone = currentIndex === -1;

  return (
    <section aria-label="Your guided path" className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Your guided path</h2>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            {doneCount}/{steps.length} done
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {allDone ? 'Loop complete — capture a fresh swing to keep improving.' : 'The lab leads — follow the highlighted step.'}
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const station = STATION_BY_ID[step.stationId];
          if (!station) return null;
          const isCurrent = step.status === 'current';
          const isDone = step.status === 'done';

          const containerCls = isCurrent
            ? 'border-emerald-400/40 bg-emerald-500/[0.08]'
            : isDone
              ? 'border-white/10 bg-white/[0.03]'
              : 'border-white/10 bg-white/[0.01] opacity-70';

          const inner = (
            <>
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                      : isCurrent
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {isDone ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                <span className="text-xs font-semibold text-slate-300">{station.name}</span>
              </span>
              <span className={`mt-2 block text-sm font-semibold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>{step.title}</span>
              {isCurrent && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                  Start here <ArrowRight size={13} aria-hidden="true" />
                </span>
              )}
              {isDone && <span className="mt-2 inline-block text-[11px] font-medium text-emerald-300/80">Done</span>}
            </>
          );

          // Current + done steps link to the live tool; upcoming are inert previews.
          return (
            <li key={step.stationId}>
              {station.liveHref && (isCurrent || isDone) ? (
                <Link
                  href={station.liveHref}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex h-full flex-col rounded-xl border p-3 transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${containerCls}`}
                >
                  {inner}
                </Link>
              ) : (
                <div className={`flex h-full flex-col rounded-xl border p-3 ${containerCls}`}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
