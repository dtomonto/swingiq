'use client';

// ============================================================
// SwingIQ — Coaching Tone (Mode) Selector
// ------------------------------------------------------------
// Store-connected radiogroup for picking the audience tone:
// Beginner / Parent / Competitive / Coach. Persists to
// settings.coaching_tone. Reused in Settings (and anywhere the
// user should be able to change how SwingIQ talks to them).
// ============================================================

import { cn } from '@/lib/utils';
import { useSwingIQStore } from '@/store';
import { COACHING_TONES, getTone } from '@/lib/coaching/tones';

export function CoachingToneSelector({ className }: { className?: string }) {
  const tone = useSwingIQStore((s) => s.settings.coaching_tone);
  const updateSettings = useSwingIQStore((s) => s.updateSettings);
  const current = getTone(tone).id;

  return (
    <fieldset className={className}>
      <legend className="text-sm font-medium text-gray-700 mb-1">Coaching Mode</legend>
      <p className="text-xs text-gray-500 mb-2">
        Changes how SwingIQ talks to you — wording, detail, and safety reminders. Saved on this device.
      </p>
      <div role="radiogroup" aria-label="Coaching mode" className="grid gap-2 sm:grid-cols-2">
        {COACHING_TONES.map((t) => {
          const selected = current === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => updateSettings({ coaching_tone: t.id })}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1',
                selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300',
              )}
            >
              <span className={cn('text-sm font-semibold', selected ? 'text-green-800' : 'text-gray-800')}>
                {t.label}
              </span>
              <span className="text-xs text-gray-500">{t.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
