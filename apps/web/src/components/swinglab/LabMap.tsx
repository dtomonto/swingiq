// ============================================================
// SwingVantage — SwingLab 2.0: Lab Map (blueprint floor plan)
// ------------------------------------------------------------
// A lightweight, high-performance visual representation of the future
// lab: a "choose your station" floor plan on a blueprint grid. Pure
// CSS (no WebGL / 3D engine yet) so it stays fast and accessible.
// Each zone anchors down to its full StationCard. This is the
// foundation the Phase-2 interactive map and Phase-4 3D mode build on.
// ============================================================

import { LAB_STATIONS } from '@/content/swinglab';
import { STATION_ACCENTS, STATION_ICONS } from './stationVisuals';

// Subtle blueprint grid — drawn with CSS gradients, no images to load.
const BLUEPRINT_BG: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)',
  backgroundSize: '34px 34px',
};

export function LabMap() {
  return (
    <nav
      aria-label="SwingLab 2.0 floor plan"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-5 sm:p-7"
    >
      {/* Blueprint grid + ambient glows (decorative) */}
      <div aria-hidden="true" className="absolute inset-0" style={BLUEPRINT_BG} />
      <div aria-hidden="true" className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative">
        {/* Map header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Lab floor plan</p>
            <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">Choose a station to explore</h3>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-slate-400">
            A preview of how the lab is laid out. Tap a zone to jump to what it does — the immersive walkthrough is in development.
          </p>
        </div>

        {/* Station zones */}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {LAB_STATIONS.map((station, i) => {
            const Icon = STATION_ICONS[station.icon];
            const accent = STATION_ACCENTS[station.accent];
            return (
              <li key={station.id}>
                <a
                  href={`#${station.id}`}
                  className={`group flex h-full flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] ${accent.hoverBorder} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
                >
                  <span className="flex items-center justify-between">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${accent.tile}`}>
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span aria-hidden="true" className="font-mono text-3xs text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                  </span>
                  <span className="text-sm font-semibold leading-tight text-white">{station.name}</span>
                  <span className={`text-2xs font-medium ${accent.text}`}>{station.systemRole}</span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* The connective idea, stated plainly */}
        <p className="relative mt-5 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
          Every station reads from <span className="font-semibold text-slate-200">your profile</span> and connects through{' '}
          <span className="font-semibold text-slate-200">the AI coach</span> — one memory, one brain, one environment.
        </p>
      </div>
    </nav>
  );
}
