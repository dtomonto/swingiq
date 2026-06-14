'use client';

// ============================================================
// SwingVantage — Setup / Stance Overlay ("where to stand")
// ------------------------------------------------------------
// A literal, on-screen framing guide drawn OVER the live camera
// preview: a safe-area box, a body outline, and a one-line caption
// telling the user where to stand and what to keep in frame.
//
// Pure SVG + a caption pill. `pointer-events-none` everywhere, so
// it never blocks the camera controls underneath. The copy adapts
// to the active sport (club / bat / racquet).
// ============================================================

import type { SportId } from '@swingiq/core';
import { useSport } from '@/contexts/SportContext';
import { cn } from '@/lib/utils';

interface SetupStanceOverlayProps {
  /** Override the active sport (defaults to the global active sport). */
  sport?: SportId;
  /** Fade the guide back (e.g. while actively recording). */
  dim?: boolean;
  className?: string;
}

function equipmentWord(sport: SportId): string {
  switch (sport) {
    case 'golf':
      return 'club';
    case 'tennis':
    case 'padel':
      return 'racquet';
    case 'pickleball':
      return 'paddle';
    case 'baseball':
    case 'softball_slow':
    case 'softball_fast':
      return 'bat';
    default:
      return 'equipment';
  }
}

export function SetupStanceOverlay({ sport, dim = false, className }: SetupStanceOverlayProps) {
  const { activeSport } = useSport();
  const resolved = sport ?? activeSport;
  const gear = equipmentWord(resolved);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 transition-opacity duration-300',
        dim ? 'opacity-30' : 'opacity-100',
        className,
      )}
      aria-hidden="true"
    >
      {/* Framing box + body outline. viewBox is 16:9 to match the preview. */}
      <svg viewBox="0 0 160 90" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Safe-area frame */}
        <rect
          x="20"
          y="8"
          width="120"
          height="74"
          rx="6"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.6"
          strokeWidth="1.1"
          strokeDasharray="4 3"
        />
        {/* Bright corner ticks */}
        <g stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M20 16 L20 8 L28 8" />
          <path d="M132 8 L140 8 L140 16" />
          <path d="M20 74 L20 82 L28 82" />
          <path d="M132 82 L140 82 L140 74" />
        </g>

        {/* Body outline — stand here */}
        <g stroke="#ffffff" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* head */}
          <circle cx="80" cy="28" r="6" />
          {/* spine */}
          <path d="M80 34 L80 56" />
          {/* arms toward the hands out front */}
          <path d="M80 40 L73 52" />
          <path d="M80 40 L87 52" />
          {/* legs / athletic stance */}
          <path d="M80 56 L72 74" />
          <path d="M80 56 L88 74" />
          {/* implement (club / bat / racquet) angled to the ground */}
          <path d="M80 52 L99 75" strokeOpacity="0.65" />
        </g>
        {/* ball / contact point */}
        <circle cx="100" cy="76" r="1.8" fill="#facc15" />
        {/* ground line */}
        <path d="M30 78 L130 78" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="2 3" />
      </svg>

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center px-3">
        <span className="rounded-full bg-black/60 text-white text-2xs sm:text-xs font-medium px-3 py-1 text-center leading-snug max-w-[90%]">
          Stand inside the frame — keep your whole body and {gear} in view
        </span>
      </div>
    </div>
  );
}
