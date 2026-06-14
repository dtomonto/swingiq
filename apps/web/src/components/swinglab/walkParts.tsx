'use client';

// ============================================================
// SwingVantage — SwingLab 2.0: shared walk overlay parts
// ------------------------------------------------------------
// Presentational pieces shared by both walk renderers:
//   • FirstPersonLab — the CSS-3D fallback (no WebGL)
//   • WebGLLab       — the true-WebGL first-person world
// The 3D backdrop differs, but the *accessible* layer (the station
// info card, the jump-to rail, arrow-key nav) is identical, so it
// lives here once. The info card is real DOM in both — the canvas is
// decorative — which keeps the experience keyboard- and SR-accessible.
// ============================================================

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LAB_STATIONS, type LabStation } from '@/content/swinglab';
import type { LabPersonalization } from '@/lib/swinglab/types';
import { STATION_ACCENTS, STATION_ICONS } from './stationVisuals';
import { STATUS_CHIP } from './labStatusStyles';

/**
 * Left/right arrow keys step between stations while a walk is mounted.
 * Ignored when the user is typing in a field — it's an additive shortcut
 * on top of the visible Prev/Next buttons and the station rail.
 */
export function useArrowKeyNav(go: (delta: number) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);
}

/**
 * The station info card: icon, status chip, role, name, blurb, the
 * features it connects, and the live "enter the tool" CTA.
 *   • align="center" — the focal card centred in the CSS room.
 *   • align="left"   — a compact HUD card docked over the WebGL world.
 */
export function StationKiosk({
  station,
  personalization,
  align = 'center',
}: {
  station: LabStation;
  personalization: LabPersonalization;
  align?: 'center' | 'left';
}) {
  const Icon = STATION_ICONS[station.icon];
  const accent = STATION_ACCENTS[station.accent];
  const status = personalization.statusById[station.id];
  const isRecommended = personalization.recommendedStationId === station.id;
  const chip = isRecommended
    ? STATUS_CHIP.recommended
    : status && status.kind !== 'neutral'
      ? STATUS_CHIP[status.kind]
      : null;
  const chipLabel = isRecommended ? 'Start here' : status?.label;
  const centered = align === 'center';

  return (
    <div className={centered ? 'w-full max-w-md text-center' : 'w-full max-w-sm text-left'}>
      <div className={`relative w-fit ${centered ? 'mx-auto mb-5' : 'mb-3'}`}>
        <div aria-hidden="true" className={`absolute inset-0 rounded-2xl blur-xl ${accent.glow}`} />
        <div
          className={`relative flex items-center justify-center rounded-2xl ring-1 ${accent.tile} ${
            centered ? 'h-20 w-20' : 'h-14 w-14'
          }`}
        >
          <Icon size={centered ? 40 : 28} strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>

      {chip && (
        <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${chip.className}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
          {chipLabel}
        </span>
      )}

      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${accent.text}`}>{station.systemRole}</p>
      <h3 className={`mt-1 font-black text-white ${centered ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{station.name}</h3>
      <p className={`text-sm leading-relaxed text-slate-300 ${centered ? 'mx-auto mt-3 max-w-sm' : 'mt-2'}`}>{station.blurb}</p>

      <div className={`mt-4 flex flex-wrap gap-1.5 ${centered ? 'justify-center' : ''}`}>
        {station.connects.slice(0, 4).map((c) => (
          <span key={c} className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-2xs font-medium text-slate-300">
            {c}
          </span>
        ))}
      </div>

      {station.liveHref && (
        <Link
          href={station.liveHref}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {station.liveLabel ?? 'Enter the tool'} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** The dot rail: jump straight to any station. */
export function StationRail({ index, onSelect }: { index: number; onSelect: (i: number) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Jump to station">
      {LAB_STATIONS.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={s.name}
          onClick={() => onSelect(i)}
          className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            i === index ? 'w-6 bg-emerald-400' : 'w-2.5 bg-white/20 hover:bg-white/40'
          }`}
        />
      ))}
    </div>
  );
}
