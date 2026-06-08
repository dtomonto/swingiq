'use client';

// ============================================================
// Preferred Coaching Style — user-facing selector (§6)
// ------------------------------------------------------------
// Lets an athlete choose HOW they want to be coached. Every option is
// an ORIGINAL SwingVantage teaching voice (no coach names — those stay
// admin-only). The choice persists locally and immediately biases the
// Curated Swing Drills recommendation below it.
// ============================================================

import { Check, SlidersHorizontal } from 'lucide-react';
import { USER_COACHING_STYLES } from '@/lib/central-intelligence/coach-mix/user-styles';
import { useUserCoachingStyle } from '@/lib/central-intelligence/coach-mix/user-preferences';

export interface CoachingStylePreferenceProps {
  /** Compact heading variant when embedded under another card. */
  className?: string;
}

export function CoachingStylePreference({ className }: CoachingStylePreferenceProps) {
  const { styleId, setStyleId } = useUserCoachingStyle();
  // No explicit choice yet → the default is the effective selection.
  const selected = styleId ?? 'default';

  return (
    <section className={`rounded-2xl border border-border bg-card p-5 ${className ?? ''}`}>
      <header className="mb-1 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-violet-500" />
        <h2 className="text-base font-bold text-foreground">Preferred Coaching Style</h2>
      </header>
      <p className="mb-3 text-xs text-muted-foreground">
        Choose how you want SwingVantage to coach you. You can change this anytime — it shapes the
        drills and explanations below.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {USER_COACHING_STYLES.map((style) => {
          const isSelected = selected === style.id;
          return (
            <button
              key={style.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setStyleId(style.id)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-violet-400 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10'
                  : 'border-border bg-background hover:border-violet-300 dark:hover:border-violet-500/30'
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{style.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />}
              </span>
              <span className="mt-0.5 text-xs leading-snug text-muted-foreground">{style.blurb}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        These are SwingVantage&apos;s own teaching voices. Coach-inspired styles are reviewed and
        kept admin-only — they are never shown here unless an official partnership is documented.
      </p>
    </section>
  );
}
