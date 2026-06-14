// ============================================================
// SwingVantage — SwingLab 2.0: Station card
// ------------------------------------------------------------
// One selectable "space" in the future lab. Presentational + server
// component (no client state). Resolves the icon/accent string keys
// from the content model into concrete lucide icons and Tailwind
// classes. Built on a self-contained dark "lab" surface so contrast
// is guaranteed regardless of the active app theme.
//
// Tailwind note: accent classes are stored as full literal strings in
// ACCENTS so the JIT compiler can see them — never build them
// dynamically (e.g. `bg-${accent}-500`), which would be purged.
// ============================================================

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LabStation } from '@/content/swinglab';
import { STATION_ACCENTS, STATION_ICONS } from './stationVisuals';

export function StationCard({ station, index }: { station: LabStation; index: number }) {
  const Icon = STATION_ICONS[station.icon];
  const accent = STATION_ACCENTS[station.accent];
  const headingId = `station-${station.id}`;

  return (
    <article
      id={station.id}
      aria-labelledby={headingId}
      className={`group relative flex h-full scroll-mt-24 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] ${accent.hoverBorder}`}
    >
      {/* Floor-plan index */}
      <span aria-hidden="true" className="absolute right-4 top-4 font-mono text-xs font-medium text-stage-muted">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Icon tile with soft glow */}
      <div className="relative mb-4 w-fit">
        <div aria-hidden="true" className={`absolute inset-0 rounded-xl blur-lg ${accent.glow} opacity-60 transition-opacity group-hover:opacity-100`} />
        <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accent.tile}`}>
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </div>
      </div>

      <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${accent.text}`}>{station.systemRole}</p>
      <h3 id={headingId} className="mt-1 text-lg font-bold text-white">{station.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stage-foreground">{station.blurb}</p>

      {/* Future functions */}
      <ul className="mt-4 space-y-1.5">
        {station.functions.map((fn) => (
          <li key={fn} className="flex items-start gap-2 text-sm text-stage-muted">
            <span aria-hidden="true" className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${accent.text} bg-current`} />
            {fn}
          </li>
        ))}
      </ul>

      {/* What it connects */}
      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-stage-muted">Connects</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {station.connects.map((c) => (
            <span key={c} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-stage-foreground">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Live-today link (honest: the station is planned, the tool is live) */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        {station.liveHref ? (
          <Link
            href={station.liveHref}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold ${accent.text} transition-colors hover:text-white focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-stage`}
          >
            {station.liveLabel ?? 'Available now'}
            <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span className="text-sm font-medium text-stage-muted">Planned</span>
        )}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stage-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
          Lab station planned
        </span>
      </div>
    </article>
  );
}
