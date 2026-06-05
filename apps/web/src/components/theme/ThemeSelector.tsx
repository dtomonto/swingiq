'use client';

import { Check, Info } from 'lucide-react';
import { useSwingVantageStore } from '@/store';
import { cn } from '@/lib/utils';
import { THEMES, normalizeThemeId, type ThemeId } from '@/lib/theme/themes';

/**
 * Curated theme picker. Each card renders a live mini-preview by scoping
 * `data-theme` to the preview panel, so the swatch reflects the theme's real
 * token palette (and pattern) via the CSS cascade — no hardcoded duplicates.
 * Switching is instant and only changes appearance, never data or coaching.
 */
export function ThemeSelector() {
  const active = useSwingVantageStore((s) => normalizeThemeId(s.settings.colorTheme));
  const updateSettings = useSwingVantageStore((s) => s.updateSettings);

  const select = (id: ThemeId) => updateSettings({ colorTheme: id });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span id="theme-selector-label" className="text-sm font-medium text-foreground">App Theme</span>
        <span className="text-xs text-muted-foreground">{THEMES.length} themes</span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="theme-selector-label"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {THEMES.map((theme) => {
          const selected = theme.id === active;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => select(theme.id)}
              className={cn(
                'group relative text-left rounded-xl border-2 overflow-hidden transition-colors',
                'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-primary shadow-sm'
                  : 'border-border hover:border-muted-foreground/40',
              )}
            >
              {/* Live mini-preview rendered in the target theme's palette */}
              <div data-theme={theme.id} className="border-b border-black/5">
                <div className="bg-background bg-theme-pattern p-3">
                  <div className="bg-card rounded-md p-2.5 shadow-sm space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                      <span className="h-1.5 flex-1 rounded-full bg-foreground/80" />
                    </div>
                    <span className="block h-1.5 w-2/3 rounded-full bg-muted-foreground/40" />
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="inline-flex h-4 items-center rounded bg-primary px-2 text-[8px] font-bold text-primary-foreground">
                        A
                      </span>
                      <span className="h-2.5 w-2.5 rounded-full bg-accent-secondary shrink-0" />
                      <span className="h-1.5 flex-1 rounded-full bg-border" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="p-3 bg-card">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-card-foreground leading-tight">
                    {theme.name}
                  </h3>
                  {selected && (
                    <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                      <Check size={13} strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  {theme.tagline}
                </p>
              </div>

              {selected && <span className="sr-only">(selected)</span>}
            </button>
          );
        })}
      </div>

      {/* Reminder: themes are cosmetic only */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5">
        <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Themes change the look only. Your coaching results, drills, scores, and
          data never change — pick whatever feels right.
        </p>
      </div>
    </div>
  );
}
