'use client';

import { cn } from '@/lib/utils';

export interface RecordingCountdownProps {
  value: number | null;
  className?: string;
}

/** Full-bleed countdown number shown over the preview before recording. */
export function RecordingCountdown({ value, className }: RecordingCountdownProps) {
  if (value == null) return null;
  return (
    <div
      className={cn('absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px]', className)}
      role="status"
      aria-live="assertive"
      aria-label={value > 0 ? `Recording in ${value}` : 'Recording'}
    >
      <span
        key={value}
        className="animate-in zoom-in-50 fade-in text-[28vw] font-black leading-none text-white drop-shadow-lg sm:text-[180px]"
      >
        {value > 0 ? value : 'GO'}
      </span>
    </div>
  );
}
