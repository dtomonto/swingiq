// ============================================================
// SwingVantage — SwingLab 2.0: Roadmap timeline
// ------------------------------------------------------------
// Honest, phased roadmap from this concept page to the full 3D lab.
// Server component; reads phases from content/swinglab.ts. Status is
// shown plainly so we never imply a later phase already exists.
// ============================================================

import { Check } from 'lucide-react';
import { LAB_ROADMAP, type PhaseStatus } from '@/content/swinglab';

const STATUS_META: Record<PhaseStatus, { label: string; dot: string; ring: string; chip: string }> = {
  current: {
    label: 'You are here',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-400/30',
    chip: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30',
  },
  preview: {
    label: 'In preview',
    dot: 'bg-cyan-400',
    ring: 'ring-cyan-400/30',
    chip: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30',
  },
  next: {
    label: 'Up next',
    dot: 'bg-cyan-400',
    ring: 'ring-cyan-400/20',
    chip: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30',
  },
  planned: {
    label: 'Planned',
    dot: 'bg-slate-500',
    ring: 'ring-white/10',
    chip: 'bg-white/5 text-slate-400 ring-1 ring-white/10',
  },
};

export function RoadmapTimeline() {
  return (
    <ol className="relative space-y-6 border-l border-white/10 pl-6">
      {LAB_ROADMAP.map((phase) => {
        const meta = STATUS_META[phase.status];
        return (
          <li key={phase.label} className="relative">
            {/* Node */}
            <span
              aria-hidden="true"
              className={`absolute -left-[31px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ${meta.dot} ${meta.ring}`}
            >
              {phase.status === 'current' && <Check size={9} className="text-slate-950" strokeWidth={3.5} />}
            </span>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-2xs font-bold uppercase tracking-[0.16em] text-slate-500">{phase.label}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${meta.chip}`}>
                {meta.label}
              </span>
            </div>
            <h3 className="mt-1 text-base font-bold text-white">{phase.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{phase.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}
