'use client';

import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';

export interface GuidanceCaptionProps {
  text: string | null;
  muted: boolean;
  className?: string;
}

/**
 * Always-on caption for the spoken coach line. Renders regardless of voice
 * mode so accessibility (and muted sessions) get identical guidance. High
 * contrast for outdoor readability.
 */
export function GuidanceCaption({ text, muted, className }: GuidanceCaptionProps) {
  if (!text) return null;
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-white shadow-lg backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="assertive"
    >
      {muted ? (
        <VolumeX className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
      ) : (
        <Volume2 className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
      )}
      <span className="text-sm font-semibold text-balance">{text}</span>
    </div>
  );
}
