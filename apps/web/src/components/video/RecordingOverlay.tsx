'use client';

// ============================================================
// SwingVantage — "Where to stand" recording overlay
// ------------------------------------------------------------
// A purely presentational guide drawn over the live camera preview
// so the user (or whoever they're filming) knows how to frame the
// shot: a safe-frame box, a ground line, and a body silhouette that
// fills the frame the way the AI review needs. Sport- and angle-aware.
//
// It never mirrors (text + figure stay readable even when the live
// selfie preview is mirrored) and never intercepts pointer events.
// ============================================================

import type { VisualSport } from '@swingiq/core';
import { cn } from '@/lib/utils';

export type OverlayAngle = 'down_the_line' | 'face_on' | 'unknown';

interface RecordingOverlayProps {
  sport: VisualSport;
  /** Only meaningful for golf; ignored for other sports. */
  angle?: OverlayAngle;
  className?: string;
}

/** Short, friendly "stand here" hint shown at the bottom of the frame. */
function hintFor(sport: VisualSport, angle: OverlayAngle): string {
  if (sport === 'golf') {
    if (angle === 'down_the_line')
      return 'Camera behind you, pointing down the target line. Keep your whole body and club inside the lines.';
    if (angle === 'face_on')
      return 'Stand side-on to the camera. Keep your whole body and club inside the lines.';
    return 'Keep your whole body and the club inside the lines, from address to finish.';
  }
  if (sport === 'tennis') return 'Keep your whole body and the racquet inside the lines through the whole stroke.';
  return 'Keep your whole body and the bat inside the lines through the whole swing.';
}

export function RecordingOverlay({ sport, angle = 'unknown', className }: RecordingOverlayProps) {
  const isGolf = sport === 'golf';
  const showClub = sport === 'golf';
  const showTarget = isGolf && angle === 'down_the_line';

  return (
    <div className={cn('pointer-events-none absolute inset-0', className)} aria-hidden="true">
      <svg
        viewBox="0 0 160 90"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* Safe-frame box — keep everything inside this */}
        <rect
          x="5"
          y="4"
          width="150"
          height="82"
          rx="4"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Corner brackets for a clearer "frame" feel */}
        <g stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M10 14 V9 H15" />
          <path d="M150 14 V9 H145" />
          <path d="M10 76 V81 H15" />
          <path d="M150 76 V81 H145" />
        </g>

        {/* Ground line the feet should sit on */}
        <line
          x1="22"
          y1="81"
          x2="138"
          y2="81"
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* ── Body silhouette (chunky rounded mannequin) ── */}
        <g
          stroke="#ffffff"
          strokeOpacity="0.9"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* spine + shoulders + hips */}
          <path d="M80 23 V52" />
          <path d="M70 31 H90" />
          <path d="M73 52 H87" />
          {/* arms — golf brings the hands together in front; others rest at the sides */}
          {showClub ? (
            <>
              <path d="M70 31 L80 47" />
              <path d="M90 31 L80 47" />
            </>
          ) : (
            <>
              <path d="M70 31 L65 49" />
              <path d="M90 31 L95 49" />
            </>
          )}
          {/* legs */}
          <path d="M73 52 L70 80" />
          <path d="M87 52 L90 80" />
        </g>

        {/* head */}
        <circle cx="80" cy="16" r="6" fill="#ffffff" fillOpacity="0.9" />

        {/* golf club + ball */}
        {showClub && (
          <>
            <line x1="80" y1="47" x2="98" y2="79" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <circle cx="99" cy="80" r="2.4" fill="#fbbf24" />
          </>
        )}

        {/* down-the-line target marker */}
        {showTarget && (
          <g stroke="#fbbf24" strokeWidth="1.6" fill="#fbbf24" strokeLinecap="round">
            <line x1="116" y1="80" x2="140" y2="64" />
            <path d="M140 64 l-6 0.5 l3.5 4.8 z" stroke="none" />
          </g>
        )}
      </svg>

      {/* Bottom hint chip */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center px-3">
        <p className="max-w-[90%] rounded-full bg-black/60 px-3 py-1.5 text-center text-[11px] font-medium leading-tight text-white backdrop-blur-sm">
          {hintFor(sport, angle)}
        </p>
      </div>
    </div>
  );
}
