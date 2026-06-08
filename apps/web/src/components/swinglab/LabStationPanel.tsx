'use client';

// ============================================================
// SwingVantage — SwingLab 2.0: Station detail panel (Phase 2)
// ------------------------------------------------------------
// Controlled drawer (right side on desktop, bottom sheet on mobile)
// that opens when a station is selected on the interactive map. Keeps
// the user inside the "lab" frame instead of navigating away. Accessible
// dialog: role=dialog + aria-modal, Esc to close, focus moves in on open
// and returns to the trigger on close (handled by the parent map).
// ============================================================

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import type { LabStation } from '@/content/swinglab';
import type { StationStatus } from '@/lib/swinglab/types';
import { STATION_ACCENTS, STATION_ICONS } from './stationVisuals';
import { STATUS_CHIP } from './labStatusStyles';

export function LabStationPanel({
  station,
  status,
  onClose,
}: {
  station: LabStation | null;
  status?: StationStatus;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = station !== null;

  // Move focus into the panel on open; close on Escape.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!station) return null;

  const Icon = STATION_ICONS[station.icon];
  const accent = STATION_ACCENTS[station.accent];
  const chip = status && status.kind !== 'neutral' ? STATUS_CHIP[status.kind] : null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="lab-panel-title">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close station details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/70 backdrop-blur-sm motion-safe:animate-[fadeIn_0.15s_ease-out]"
      />

      {/* Panel — right drawer on >=sm, bottom sheet on mobile */}
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-900 p-6 shadow-2xl motion-safe:animate-[slideUp_0.2s_ease-out] sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[24rem] sm:rounded-t-none sm:rounded-l-3xl sm:border-l sm:border-t-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accent.tile}`}>
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${accent.text}`}>{station.systemRole}</p>
              <h2 id="lab-panel-title" className="text-lg font-bold text-white">{station.name}</h2>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {chip && (
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${chip.className}`}>
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
              {status?.label}
            </span>
          </div>
        )}

        <p className="mt-4 text-sm leading-relaxed text-slate-300">{station.blurb}</p>

        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Inside this station</p>
          <ul className="mt-2 space-y-1.5">
            {station.functions.map((fn) => (
              <li key={fn} className="flex items-start gap-2 text-sm text-slate-400">
                <span aria-hidden="true" className={`mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current ${accent.text}`} />
                {fn}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Connects</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {station.connects.map((c) => (
              <span key={c} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-slate-300">
                {c}
              </span>
            ))}
          </div>
        </div>

        {station.liveHref && (
          <Link
            href={station.liveHref}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {station.liveLabel ?? 'Open the tool'} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-500">
          The tool is live today · the immersive station is in development
        </p>
      </div>
    </div>
  );
}
