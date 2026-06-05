'use client';

// ============================================================
// SwingVantage — "How to record the best video" guide
// ------------------------------------------------------------
// Sport-aware capture tips shown near the upload area BEFORE the
// user picks a file. Better footage = a more confident, more useful
// AI review, so this guidance directly improves analysis quality.
// Rendered as a native <details> for keyboard accessibility.
// ============================================================

import { Camera, Sun, Move, Maximize2, Video as VideoIcon } from 'lucide-react';
import type { VisualSport } from '@swingiq/core';
import { cn } from '@/lib/utils';

interface SportRecordingTips {
  headline: string;
  /** Sport-specific framing/angle guidance. */
  angle: string[];
}

const SPORT_TIPS: Record<VisualSport, SportRecordingTips> = {
  golf: {
    headline: 'Golf swings read best from a clean down-the-line or face-on angle.',
    angle: [
      'Film down-the-line (behind you, toward the target) or face-on (directly to your side).',
      'Keep your full body and the whole club in frame from address to finish.',
      'Avoid heavy zoom — give yourself a little space around the swing.',
    ],
  },
  tennis: {
    headline: 'Capture the whole stroke — preparation, contact, and follow-through.',
    angle: [
      'Use a side angle for groundstrokes, or film from behind for serves.',
      'Keep your full body and the racquet in frame the entire time.',
      'Include the prep, the contact point, and the full follow-through.',
    ],
  },
  baseball: {
    headline: 'Hitting reads best from the side or a slightly open front angle.',
    angle: [
      'Film from the side, or slightly open toward the front of the hitter.',
      'Keep the full body and the whole bat in frame.',
      'Capture the full sequence: stance, load, stride, contact zone, and finish.',
    ],
  },
  softball_slow: {
    headline: 'Slow-pitch reads best from the side or a slightly open front angle.',
    angle: [
      'Film from the side, or slightly open toward the front of the hitter.',
      'Keep the full body and the whole bat in frame.',
      'Capture the full sequence: stance, load, stride, contact zone, and finish.',
    ],
  },
  softball_fast: {
    headline: 'Fast-pitch reads best from the side or a slightly open front angle.',
    angle: [
      'Film from the side, or slightly open toward the front of the hitter.',
      'Keep the full body and the whole bat in frame.',
      'Capture the full sequence: stance, load, stride, contact zone, and finish.',
    ],
  },
};

const UNIVERSAL_TIPS: { icon: React.ReactNode; text: string }[] = [
  { icon: <Move className="w-4 h-4" />, text: 'Steady the camera — a tripod or a propped-up phone beats handheld.' },
  { icon: <Sun className="w-4 h-4" />, text: 'Good, even lighting. Avoid filming into the sun or a bright window.' },
  { icon: <Maximize2 className="w-4 h-4" />, text: 'Keep your whole body and equipment in frame for the entire motion.' },
  { icon: <VideoIcon className="w-4 h-4" />, text: 'A few seconds is plenty — a single clean swing is better than a long clip.' },
];

export function RecordingGuide({
  sport,
  defaultOpen = false,
  className,
}: {
  sport: VisualSport;
  defaultOpen?: boolean;
  className?: string;
}) {
  const tips = SPORT_TIPS[sport] ?? SPORT_TIPS.golf;

  return (
    <details
      open={defaultOpen}
      className={cn('rounded-xl border border-border bg-card', className)}
    >
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 select-none">
        <Camera className="w-4 h-4 text-accent-secondary shrink-0" />
        <span className="text-sm font-semibold text-foreground">How to record the best video</span>
        <span className="ml-auto text-xs text-muted-foreground">Tap to expand</span>
      </summary>

      <div className="px-4 pb-4 space-y-4">
        <p className="text-sm text-muted-foreground">{tips.headline}</p>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            For your sport
          </p>
          <ul className="space-y-2">
            {tips.angle.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary font-bold mt-0.5 shrink-0">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Every sport
          </p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {UNIVERSAL_TIPS.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground rounded-lg bg-muted border border-border p-2.5"
              >
                <span className="text-accent-secondary shrink-0 mt-0.5">{tip.icon}</span>
                {tip.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          The clearer your footage, the more confident the AI review can be. If the angle or lighting
          is limited, SwingVantage will tell you honestly and lower its confidence rather than guess.
        </p>
      </div>
    </details>
  );
}
