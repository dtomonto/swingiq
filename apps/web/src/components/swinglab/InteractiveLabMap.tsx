'use client';

// ============================================================
// SwingVantage — SwingLab 2.0: Interactive Lab Map (Phase 2)
// ------------------------------------------------------------
// A clickable, isometric "facility" map. Stations are real <button>s
// positioned on an iso floor; selecting one opens the detail drawer.
// A suggested-journey path connects the core flow. Optional
// personalization highlights the recommended next station and shows
// per-station status chips — all from real state (preview when absent).
//
// Design choices for the locked "isometric" direction:
//   • The decorative floor plane is CSS-transformed for depth; the
//     station markers stay UPRIGHT and readable (diorama style).
//   • Markers are genuine buttons → full keyboard + screen-reader
//     support (progressive enhancement, not a picture).
//   • A stacked grid fallback renders on small screens where an iso
//     map is unusable.
//   • All motion is motion-safe: → respects prefers-reduced-motion.
//
// No WebGL / 3D engine — that's Phase 4. This is the foundation it
// will build on (same station ids + floor coordinates).
// ============================================================

import { useCallback, useRef, useState } from 'react';
import { LAB_STATIONS, type LabStation } from '@/content/swinglab';
import { PREVIEW_PERSONALIZATION, type LabPersonalization } from '@/lib/swinglab/types';
import { STATION_ACCENTS, STATION_ICONS } from './stationVisuals';
import { STATUS_CHIP } from './labStatusStyles';
import { RECOMMENDED_PATH, STATION_LAYOUT } from './labLayout';
import { LabStationPanel } from './LabStationPanel';

const STATION_BY_ID: Record<string, LabStation> = Object.fromEntries(
  LAB_STATIONS.map((s) => [s.id, s]),
);

// Iso floor grid drawn with CSS gradients (no image to load).
const FLOOR_GRID: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)',
  backgroundSize: '7.5% 7.5%',
  transform: 'translate(-50%, -50%) perspective(900px) rotateX(58deg) rotateZ(45deg)',
  WebkitMaskImage: 'radial-gradient(ellipse at center, #000 55%, transparent 78%)',
  maskImage: 'radial-gradient(ellipse at center, #000 55%, transparent 78%)',
};

export function InteractiveLabMap({
  personalization = PREVIEW_PERSONALIZATION,
}: {
  personalization?: LabPersonalization;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const { recommendedStationId, statusById } = personalization;

  const close = useCallback(() => {
    const id = selectedId;
    setSelectedId(null);
    // Return focus to the triggering marker (accessibility).
    if (id) requestAnimationFrame(() => markerRefs.current[id]?.focus());
  }, [selectedId]);

  // Suggested-journey polyline points in the 0–100 viewBox space.
  const pathPoints = RECOMMENDED_PATH.map((id) => {
    const p = STATION_LAYOUT[id];
    return p ? `${p.left},${p.top}` : '';
  })
    .filter(Boolean)
    .join(' ');

  const selected = selectedId ? STATION_BY_ID[selectedId] ?? null : null;

  return (
    <div>
      <p className="sr-only">
        Interactive map of the SwingLab stations. Select a station to read what it does and open its tool.
      </p>

      {/* ─── Isometric stage (sm and up) ─── */}
      <div
        role="group"
        aria-label="SwingLab interactive floor plan"
        className="relative hidden aspect-[16/11] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 sm:block"
      >
        {/* Floor + ambient glows (decorative) */}
        <div aria-hidden="true" className="absolute left-1/2 top-[56%] h-[150%] w-[150%]" style={FLOOR_GRID} />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Suggested-journey path */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="labPathGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(52,211,153)" />
              <stop offset="100%" stopColor="rgb(34,211,238)" />
            </linearGradient>
          </defs>
          <polyline
            points={pathPoints}
            fill="none"
            stroke="url(#labPathGradient)"
            strokeWidth="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1.4 1.6"
            opacity="0.7"
            className="motion-safe:animate-pulse"
          />
        </svg>

        {/* Station markers */}
        {LAB_STATIONS.map((s) => {
          const pos = STATION_LAYOUT[s.id];
          if (!pos) return null;
          const Icon = STATION_ICONS[s.icon];
          const accent = STATION_ACCENTS[s.accent];
          const status = statusById[s.id];
          const isRecommended = recommendedStationId === s.id;
          const chip = status && status.kind !== 'neutral' ? STATUS_CHIP[status.kind] : null;
          return (
            <button
              key={s.id}
              ref={(el) => {
                markerRefs.current[s.id] = el;
              }}
              type="button"
              onClick={() => setSelectedId(s.id)}
              aria-haspopup="dialog"
              aria-label={`${s.name} — ${s.systemRole}${isRecommended ? ', recommended next step' : status && status.label ? `, ${status.label}` : ''}. Open details.`}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus:outline-none"
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              {/* pedestal shadow */}
              <span aria-hidden="true" className="absolute top-9 h-2 w-10 rounded-[100%] bg-black/50 blur-[2px]" />
              {/* recommended pulse */}
              {isRecommended && (
                <span aria-hidden="true" className="absolute top-0 h-12 w-12 rounded-2xl ring-2 ring-emerald-400/70 motion-safe:animate-ping" />
              )}
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ring-1 ${accent.tile} transition-transform duration-150 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-white`}
              >
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="mt-1.5 max-w-[7.5rem] text-center text-[11px] font-semibold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                {s.name}
              </span>
              {(isRecommended || chip) && (
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    isRecommended ? STATUS_CHIP.recommended.className : chip!.className
                  }`}
                >
                  <span aria-hidden="true" className={`h-1 w-1 rounded-full ${isRecommended ? STATUS_CHIP.recommended.dot : chip!.dot}`} />
                  {isRecommended ? 'Start here' : status!.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] text-slate-400">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          Suggested journey
        </div>
      </div>

      {/* ─── Stacked fallback (mobile) ─── */}
      <ul className="grid grid-cols-2 gap-3 sm:hidden">
        {LAB_STATIONS.map((s) => {
          const Icon = STATION_ICONS[s.icon];
          const accent = STATION_ACCENTS[s.accent];
          const status = statusById[s.id];
          const isRecommended = recommendedStationId === s.id;
          const chip = status && status.kind !== 'neutral' ? STATUS_CHIP[status.kind] : null;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelectedId(s.id)}
                aria-haspopup="dialog"
                aria-label={`${s.name} — ${s.systemRole}${isRecommended ? ', recommended next step' : status && status.label ? `, ${status.label}` : ''}. Open details.`}
                className={`flex h-full w-full flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${accent.hoverBorder}`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${accent.tile}`}>
                  <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold leading-tight text-white">{s.name}</span>
                {(isRecommended || chip) ? (
                  <span className={`inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isRecommended ? STATUS_CHIP.recommended.className : chip!.className}`}>
                    {isRecommended ? 'Start here' : status!.label}
                  </span>
                ) : (
                  <span className={`text-[11px] font-medium ${accent.text}`}>{s.systemRole}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <LabStationPanel station={selected} status={selected ? statusById[selected.id] : undefined} onClose={close} />
    </div>
  );
}
