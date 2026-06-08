'use client';

// ============================================================
// SwingVantage — SwingLab 2.0: CSS first-person walk (fallback)
// ------------------------------------------------------------
// The dependency-free first-person walk: you stand in a perspective
// room facing one station's kiosk and step station to station with
// Prev/Next, arrow keys, or the dot rail.
//
// This is now the GRACEFUL FALLBACK for the true-WebGL walk (WebGLLab):
// it renders whenever WebGL is unavailable or the visitor prefers
// reduced motion, and as the instant placeholder while the 3D chunk
// loads. CSS 3D transforms only — no WebGL — so it always works.
// Accessible: real headings + live region, keyboard nav, focus rings,
// and all motion gated behind motion-safe (prefers-reduced-motion).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LAB_STATIONS } from '@/content/swinglab';
import { PREVIEW_PERSONALIZATION, type LabPersonalization } from '@/lib/swinglab/types';
import { STATION_ACCENTS } from './stationVisuals';
import { StationKiosk, StationRail, useArrowKeyNav } from './walkParts';

// Decorative perspective floor grid (CSS only).
const FLOOR: React.CSSProperties = {
  transform: 'rotateX(72deg)',
  backgroundImage:
    'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)',
  backgroundSize: '6% 14%',
  WebkitMaskImage: 'linear-gradient(to top, #000 5%, transparent 85%)',
  maskImage: 'linear-gradient(to top, #000 5%, transparent 85%)',
};

export function FirstPersonLab({
  personalization = PREVIEW_PERSONALIZATION,
}: {
  personalization?: LabPersonalization;
}) {
  const [index, setIndex] = useState(0);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const total = LAB_STATIONS.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + total) % total),
    [total],
  );

  useArrowKeyNav(go);

  const station = LAB_STATIONS[index];
  const accent = STATION_ACCENTS[station.accent];

  // Announce station changes to screen readers.
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = `Station ${index + 1} of ${total}: ${station.name}`;
  }, [index, total, station.name]);

  return (
    <div>
      <p className="sr-only" aria-live="polite" ref={liveRef} />
      <p className="sr-only">
        First-person walkthrough. Use the previous and next buttons, the left and right arrow keys, or the station rail to move.
      </p>

      {/* Perspective room */}
      <div
        role="group"
        aria-label="First-person lab walkthrough"
        className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950"
        style={{ perspective: '1100px' }}
      >
        {/* Floor + ambient accent glow (decorative) */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 origin-bottom" style={FLOOR} />
        <div aria-hidden="true" className={`pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${accent.glow}`} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,6,23,0.85)_100%)]" />

        {/* Station kiosk (the screen ahead) — re-fades on each step */}
        <div key={index} className="absolute inset-0 flex items-center justify-center px-6 motion-safe:animate-fade-in">
          <StationKiosk station={station} personalization={personalization} align="center" />
        </div>

        {/* Step controls */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous station"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-white backdrop-blur transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next station"
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-white backdrop-blur transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>

        {/* Position label */}
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-medium text-slate-300">
          Station {index + 1} / {total}
        </div>
      </div>

      {/* Station rail (jump to any room) */}
      <StationRail index={index} onSelect={setIndex} />
    </div>
  );
}
