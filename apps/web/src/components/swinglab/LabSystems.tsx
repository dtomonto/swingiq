// ============================================================
// SwingVantage — SwingLab 2.0: Connected ecosystem view (Phase 5)
// ------------------------------------------------------------
// The "one living system" lens on the lab: a grounded cross-station
// read, the data-flow loop between stations (live vs idle from real
// signals), and each station's online/standby status. Presentational —
// receives the computed model from LabExperience.
// ============================================================

import { ArrowRight, Cpu } from 'lucide-react';
import { LAB_STATIONS, type LabStation } from '@/content/swinglab';
import type { LabSystemsModel } from '@/lib/swinglab/lab-systems';
import { STATION_ACCENTS, STATION_ICONS } from './stationVisuals';

const STATION_BY_ID: Record<string, LabStation> = Object.fromEntries(LAB_STATIONS.map((s) => [s.id, s]));

export function LabSystems({ model }: { model: LabSystemsModel }) {
  const { summary, connections, systems, onlineCount, totalSystems } = model;

  return (
    <div className="space-y-5">
      {/* Unified read */}
      <section aria-label="Lab read" className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-5">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-emerald-300" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Lab systems</h2>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300 ring-1 ring-white/15">
            {onlineCount}/{totalSystems} online
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{summary}</p>
      </section>

      {/* Data-flow loop */}
      <section aria-label="Data flow" className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">The connected loop</h3>
        <ul className="mt-3 space-y-2">
          {connections.map((c) => {
            const from = STATION_BY_ID[c.from];
            const to = STATION_BY_ID[c.to];
            if (!from || !to) return null;
            return (
              <li
                key={`${c.from}-${c.to}`}
                className={`rounded-xl border p-3 transition-colors ${
                  c.active ? 'border-emerald-400/30 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.01]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-white">
                  <span>{from.name}</span>
                  <ArrowRight size={14} aria-hidden="true" className={c.active ? 'text-emerald-300' : 'text-slate-600'} />
                  <span>{to.name}</span>
                  <span
                    className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      c.active ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30' : 'bg-white/5 text-slate-500 ring-1 ring-white/10'
                    }`}
                  >
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${c.active ? 'bg-emerald-400 motion-safe:animate-pulse' : 'bg-slate-600'}`} />
                    {c.active ? 'Live' : 'Idle'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{c.label}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-slate-500">
          Links go live as real data flows between stations — nothing here is simulated.
        </p>
      </section>

      {/* Per-station systems */}
      <section aria-label="Systems status" className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Systems</h3>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((sys) => {
            const station = STATION_BY_ID[sys.stationId];
            if (!station) return null;
            const Icon = STATION_ICONS[station.icon];
            const accent = STATION_ACCENTS[station.accent];
            return (
              <li key={sys.stationId} className={`rounded-xl border border-white/10 p-3 ${sys.online ? 'bg-white/[0.04]' : 'bg-white/[0.01] opacity-80'}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${accent.tile}`}>
                    <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-white">{station.name}</span>
                  <span className={`ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${sys.online ? 'text-emerald-300' : 'text-slate-500'}`}>
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${sys.online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    {sys.online ? 'Online' : 'Standby'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{sys.contributes}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
