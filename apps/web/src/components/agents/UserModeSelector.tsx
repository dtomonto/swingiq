'use client';

// ============================================================
// SwingVantage — UserModeSelector (compact)
// ------------------------------------------------------------
// A small, inline "who's using SwingVantage" switcher for prominent
// surfaces like the dashboard. It is intentionally a COMPACT
// companion to the full CoachingToneSelector in Settings — both
// read and write the SAME store field (settings.coaching_tone),
// so there is one source of truth, not a parallel mode system.
// Switching here re-frames the experience live (e.g. Parent mode
// reveals the parent summary on the dashboard).
// ============================================================

import { cn } from '@/lib/utils';
import { useSwingVantageStore } from '@/store';
import { COACHING_TONES, getTone } from '@/lib/coaching/tones';

export function UserModeSelector({ className }: { className?: string }) {
  const tone = useSwingVantageStore((s) => s.settings.coaching_tone);
  const updateSettings = useSwingVantageStore((s) => s.updateSettings);
  const current = getTone(tone).id;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-xs font-medium text-muted-foreground">Using SwingVantage as:</span>
      <div role="radiogroup" aria-label="Who's using SwingVantage" className="flex flex-wrap gap-1.5">
        {COACHING_TONES.map((t) => {
          const selected = current === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={t.description}
              onClick={() => updateSettings({ coaching_tone: t.id })}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                selected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
