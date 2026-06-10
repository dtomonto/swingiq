'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Info, Lock, Moon, Sparkles, Sun } from 'lucide-react';
import Link from 'next/link';
import type { SportId } from '@swingiq/core';
import { useSwingVantageStore } from '@/store';
import { useAuth } from '@/lib/auth/useAuth';
import { cn } from '@/lib/utils';
import { THEMES, normalizeThemeId, type ThemeDef, type ThemeId } from '@/lib/theme/themes';
import { recommendTheme, type ThemeRecommendation } from '@/lib/theme-lab';
import {
  DEFAULT_CONTROL,
  readThemeLabControl,
  writeThemeLabControl,
  THEME_LAB_CHANGE_EVENT,
  type ThemeLabControl,
} from '@/lib/theme-lab/control';

/**
 * Premium theme picker. Each card renders a live, miniature "app" in the
 * target theme by scoping `data-theme` to the preview, so every swatch shows
 * that theme's real surfaces, depth, gradient CTA, chart colors, and pattern
 * via the CSS cascade — no hardcoded duplicates. Switching is instant and only
 * changes appearance, never data or coaching.
 *
 * Accessibility: a proper radiogroup with roving tabindex + arrow-key
 * navigation (WAI-ARIA radio pattern). Selection is also obvious without
 * color alone (ring + check badge + "Selected" text).
 */
export function ThemeSelector({ activeSport = null }: { activeSport?: SportId | null } = {}) {
  const active = useSwingVantageStore((s) => normalizeThemeId(s.settings.colorTheme));
  const prefersDark = useSwingVantageStore((s) => s.settings.theme === 'dark');
  const updateSettings = useSwingVantageStore((s) => s.updateSettings);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Themes are an account feature: only a registered user (cloud or local
  // account) may pick or use a theme. Anonymous visitors stay on the brand
  // default and see a sign-up prompt instead of a working picker.
  const { status } = useAuth();
  const canUseThemes = status === 'authenticated';
  const showSignupGate = status === 'anonymous';

  // Theme Lab per-device opt-ins (seasonal + suggestions). Subscribe so toggles
  // here and elsewhere stay in sync without a reload.
  const [control, setControl] = useState<ThemeLabControl>(DEFAULT_CONTROL);
  useEffect(() => {
    const sync = () => setControl(readThemeLabControl());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(THEME_LAB_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(THEME_LAB_CHANGE_EVENT, sync);
    };
  }, []);

  // Mark the choice as explicit so Theme Lab experiments / seasonal never
  // override what the user deliberately picked. Gated to registered accounts.
  const select = (id: ThemeId) => {
    if (!canUseThemes) return;
    updateSettings({ colorTheme: id, colorThemeSource: 'user' });
  };

  // A gentle, privacy-safe suggestion derived from the active sport / dark
  // leaning. Only shown to registered users who keep suggestions on.
  const recommendation: ThemeRecommendation | null =
    canUseThemes && control.allowRecommended
      ? recommendTheme({ sport: activeSport, prefersDark, currentThemeId: active })
      : null;

  // Roving focus + selection for the radio pattern (Arrow / Home / End).
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = THEMES.length - 1;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = index === last ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = index === 0 ? last : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    const theme = THEMES[next];
    select(theme.id);
    btnRefs.current[next]?.focus();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span id="theme-selector-label" className="text-sm font-medium text-foreground">
          App Theme
        </span>
        <span className="text-xs text-muted-foreground">{THEMES.length} art directions</span>
      </div>

      {showSignupGate && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
          <Lock size={16} className="shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Themes are a free account feature</p>
            <p className="text-xs text-muted-foreground">
              Create a free account to pick and use any theme. Previews below.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/signup"
              className="rounded-lg btn-theme-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Sign up free
            </Link>
            <Link href="/login" className="text-xs font-semibold text-link">
              Sign in
            </Link>
          </div>
        </div>
      )}

      {recommendation && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
          <Sparkles size={16} className="shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Recommended: {THEMES.find((t) => t.id === recommendation.themeId)?.name}
            </p>
            <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
          </div>
          <button
            type="button"
            onClick={() => select(recommendation.themeId)}
            disabled={!canUseThemes}
            className="shrink-0 rounded-lg btn-theme-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      <div
        role="radiogroup"
        aria-labelledby="theme-selector-label"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {THEMES.map((theme, i) => {
          const selected = theme.id === active;
          const recommended = recommendation?.themeId === theme.id;
          return (
            <button
              key={theme.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!canUseThemes}
              tabIndex={selected || (!THEMES.some((t) => t.id === active) && i === 0) ? 0 : -1}
              onClick={() => select(theme.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'group relative text-left rounded-xl border-2 overflow-hidden bg-card',
                'transition-[transform,box-shadow,border-color] duration-200',
                canUseThemes ? 'hover:-translate-y-0.5' : 'cursor-not-allowed opacity-60',
                'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-primary ring-glow shadow-theme-lg'
                  : 'border-border hover:border-muted-foreground/40 shadow-theme',
              )}
            >
              <ThemePreviewTile theme={theme} />

              {/* Label */}
              <div className="p-3 bg-card">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex min-w-0 items-center gap-1 font-semibold text-sm text-card-foreground leading-tight">
                    <span className="truncate">{theme.name}</span>
                    {recommended && !selected && (
                      <Sparkles size={12} className="shrink-0 text-primary" aria-hidden="true" />
                    )}
                  </h3>
                  {selected ? (
                    <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                      <Check size={13} strokeWidth={3} aria-hidden="true" />
                    </span>
                  ) : (
                    <span
                      className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground"
                      aria-hidden="true"
                    >
                      {theme.category === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{theme.tagline}</p>
              </div>

              <span className="sr-only">
                {theme.category === 'dark' ? 'Dark theme. ' : 'Light theme. '}
                {selected ? '(Selected)' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Theme Lab opt-ins (per-device) — registered users only. */}
      {canUseThemes && (
        <div className="mt-3 space-y-2 rounded-lg border border-border px-3 py-2.5">
          <ToggleRow
            label="Theme suggestions"
            hint="Show a recommended theme based on your sport."
            checked={control.allowRecommended}
            onChange={(v) => setControl(writeThemeLabControl({ allowRecommended: v }))}
          />
          <ToggleRow
            label="Seasonal themes"
            hint="Let limited-time seasonal themes appear in their window."
            checked={control.allowSeasonal}
            onChange={(v) => setControl(writeThemeLabControl({ allowSeasonal: v }))}
          />
        </div>
      )}

      {/* Reminder: themes are cosmetic only */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5">
        <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Themes change the look only. Your coaching results, drills, scores, and data never
          change — pick whatever feels right.
        </p>
      </div>
    </div>
  );
}

/** Compact, accessible opt-in switch used for the Theme Lab preferences. */
function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

/**
 * The live mini-app preview, rendered entirely in the target theme's palette
 * by scoping `data-theme`. Uses the same semantic token utilities the real app
 * uses, so each preview reflects that theme's surfaces, depth, gradient CTA,
 * chart colors, and decorative pattern.
 */
function ThemePreviewTile({ theme }: { theme: ThemeDef }) {
  return (
    <div data-theme={theme.id} className="border-b border-black/5">
      <div className="relative bg-background p-3">
        {/* Atmospheric wash + (where applicable) decorative pattern */}
        <div className="absolute inset-0 bg-theme-hero" aria-hidden="true" />
        {theme.hasPattern && (
          <div className="absolute inset-0 bg-theme-pattern opacity-80" aria-hidden="true" />
        )}

        {/* Mini analysis card */}
        <div className="relative bg-card text-card-foreground rounded-theme shadow-theme p-2.5 space-y-2">
          {/* Header: brand dot + title + grade badge */}
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full btn-theme-primary shrink-0" />
            <span className="h-2 flex-1 rounded-full bg-foreground/80" />
            <span className="inline-flex h-3.5 items-center rounded-full bg-success/15 px-1.5 text-[7px] font-bold text-success">
              A
            </span>
          </div>

          {/* Body copy lines */}
          <span className="block h-1.5 w-3/4 rounded-full bg-muted-foreground/40" />
          <span className="block h-1.5 w-1/2 rounded-full bg-muted-foreground/30" />

          {/* Mini chart */}
          <div className="flex items-end gap-1 h-7">
            <span className="flex-1 rounded-sm bg-chart-1" style={{ height: '55%' }} />
            <span className="flex-1 rounded-sm bg-chart-2" style={{ height: '85%' }} />
            <span className="flex-1 rounded-sm bg-chart-3" style={{ height: '40%' }} />
            <span className="flex-1 rounded-sm bg-chart-4" style={{ height: '70%' }} />
            <span className="flex-1 rounded-sm bg-accent-secondary" style={{ height: '50%' }} />
          </div>

          {/* Footer: gradient CTA + accent + input line */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="inline-flex h-4 items-center rounded-md btn-theme-primary px-2 text-[7px] font-bold text-primary-foreground">
              Analyze
            </span>
            <span className="h-3 w-3 rounded-full bg-accent-secondary shrink-0" />
            <span className="h-1.5 flex-1 rounded-full bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
