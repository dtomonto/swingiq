'use client';

// ============================================================
// SwingVantage — Live Kinematic Panel
//
// The animated "Kinematic tracking active" visual on the home hero (and
// reused on /demo). A greyed athlete silhouette swings on a loop while an
// accent-coloured skeleton overlays joint markers, a pose scan-line sweeps,
// and real motion-lab metric names + the active swing phase update live —
// cycling through all 7 sports (golf → … → fast-pitch).
//
// Pure CSS keyframes drive the motion (GPU transforms; respects
// prefers-reduced-motion); a single interval cycles sports + phases and
// jitters the metric read-outs so it reads as a live capture. No assets.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { KINEMATIC_SPORTS, type KinematicMetric } from '@/lib/demo/kinematic-sports';

const TICK_MS = 850;
const TICKS_PER_SPORT = 6; // ~5s per sport

function formatMetric(m: KinematicMetric, tick: number, i: number): string {
  const [lo, hi] = m.range;
  const mid = (lo + hi) / 2;
  const amp = (hi - lo) / 2;
  const v = mid + amp * Math.sin(tick * 0.9 + i * 1.7) * 0.75;
  const decimals = m.unit === ':1' ? 1 : 0;
  return v.toFixed(decimals);
}

export function LiveKinematicPanel({ className = '' }: { className?: string }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const sportIdx = Math.floor(tick / TICKS_PER_SPORT) % KINEMATIC_SPORTS.length;
  const sport = KINEMATIC_SPORTS[sportIdx];
  const phase = sport.phases[tick % sport.phases.length];
  const shownMetrics = useMemo(() => sport.metrics.slice(0, 3), [sport]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-background ${className}`}
      style={{ ['--svq-accent' as string]: sport.accent }}
      aria-hidden="true"
    >
      <style>{KEYFRAMES}</style>

      {/* accent wash + grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] transition-colors duration-700"
        style={{ background: `radial-gradient(120% 90% at 50% 0%, ${sport.accent}, transparent 60%)` }}
      />
      <div className="svq-grid pointer-events-none absolute inset-0 opacity-[0.07]" />

      {/* top chrome: live badge + sport badge */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-foreground/80">
          <span className="svq-live h-1.5 w-1.5 rounded-full" style={{ background: sport.accent }} />
          Tracking active
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-500"
          style={{ borderColor: `${sport.accent}66`, color: sport.accent, background: `${sport.accent}14` }}
        >
          <span className="text-[11px] leading-none">{sport.emoji}</span>
          {sport.name}
        </span>
      </div>

      {/* the figure */}
      <svg viewBox="0 0 240 200" className="relative z-0 block h-full w-full">
        {/* scan line */}
        <line className="svq-scan" x1="14" x2="226" y1="0" y2="0" stroke={sport.accent} strokeWidth="1.5" opacity="0.45" />

        {/* greyed silhouette (static body) */}
        <g stroke="hsl(var(--muted-foreground))" strokeOpacity="0.32" strokeLinecap="round" fill="none">
          <circle cx="118" cy="40" r="12" fill="hsl(var(--muted-foreground))" fillOpacity="0.22" stroke="none" />
          {/* spine */}
          <line x1="120" y1="54" x2="120" y2="112" strokeWidth="10" />
          {/* legs */}
          <path d="M120 112 L104 150 L99 184" strokeWidth="9" />
          <path d="M120 112 L138 150 L145 184" strokeWidth="9" />
          {/* trail arm (static, tucked) */}
          <path d="M120 64 L138 84 L150 96" strokeWidth="7" />
        </g>

        {/* accent skeleton bones (static) */}
        <g stroke="var(--svq-accent)" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" className="transition-[stroke] duration-700">
          <line x1="106" y1="60" x2="134" y2="60" />
          <line x1="120" y1="60" x2="120" y2="110" />
          <line x1="110" y1="110" x2="130" y2="110" />
          <line x1="110" y1="110" x2="104" y2="150" />
          <line x1="130" y1="110" x2="138" y2="150" />
        </g>

        {/* swinging lead arm + implement (animated) */}
        <g className="svq-swing" style={{ transformBox: 'view-box', transformOrigin: '120px 60px' } as React.CSSProperties}>
          <line x1="120" y1="60" x2="176" y2="60" stroke="var(--svq-accent)" strokeWidth="2.4" strokeLinecap="round" />
          {/* implement */}
          <line x1="176" y1="60" x2="216" y2="60" stroke="var(--svq-accent)" strokeWidth="3.4" strokeLinecap="round" opacity="0.95" />
          <circle cx="176" cy="60" r="3.6" fill="var(--svq-accent)" />
        </g>

        {/* joint markers (pulse) */}
        <g fill="var(--svq-accent)" className="transition-[fill] duration-700">
          {[
            [120, 40], [106, 60], [134, 60], [120, 60], [120, 110],
            [110, 110], [130, 110], [104, 150], [138, 150],
          ].map(([cx, cy], i) => (
            <circle key={i} className="svq-joint" cx={cx} cy={cy} r="2.6" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </g>
      </svg>

      {/* metric chips */}
      <div className="absolute right-2.5 top-9 z-10 flex flex-col items-end gap-1.5">
        {shownMetrics.map((m, i) => (
          <div
            key={m.label}
            className="rounded-md border border-border bg-card/80 px-2 py-1 text-right shadow-sm backdrop-blur-sm"
          >
            <div className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</div>
            <div className="font-heading text-[11px] font-bold leading-tight" style={{ color: sport.accent }}>
              {formatMetric(m, tick, i)}
              <span className="ml-0.5 text-[8px] font-medium text-muted-foreground">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* phase chip + reach caption */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-3 py-2">
        <span
          className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
          style={{ background: `${sport.accent}1f`, color: sport.accent }}
        >
          {phase}
        </span>
        <span className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
          Live for every {sport.noun.replace(/s$/, '')}
        </span>
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes svq-swing { 0% { transform: rotate(-96deg); } 48% { transform: rotate(34deg); } 60% { transform: rotate(40deg); } 100% { transform: rotate(-96deg); } }
@keyframes svq-pulse { 0%, 100% { opacity: 0.35; r: 2.2px; } 50% { opacity: 1; r: 3.1px; } }
@keyframes svq-scan { 0% { transform: translateY(6px); opacity: 0; } 12% { opacity: 0.5; } 88% { opacity: 0.4; } 100% { transform: translateY(196px); opacity: 0; } }
@keyframes svq-live { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
.svq-swing { animation: svq-swing 3.1s cubic-bezier(.5,0,.5,1) infinite; }
.svq-joint { animation: svq-pulse 1.8s ease-in-out infinite; }
.svq-scan { animation: svq-scan 2.6s linear infinite; }
.svq-live { animation: svq-live 1.4s ease-in-out infinite; }
.svq-grid { background-image: linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px); background-size: 20px 20px; }
@media (prefers-reduced-motion: reduce) { .svq-swing, .svq-scan, .svq-joint, .svq-live { animation: none !important; } .svq-swing { transform: rotate(-20deg); } }
`;
