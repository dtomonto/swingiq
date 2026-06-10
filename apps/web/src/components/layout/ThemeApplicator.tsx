'use client';

import { useEffect, useState } from 'react';
import { useSwingVantageStore } from '@/store';
import { DEFAULT_THEME_ID, isDarkTheme, normalizeThemeId } from '@/lib/theme/themes';
import {
  resolveThemeForUser,
  activeRunningExperiment,
  getThemeAnonId,
  readExperiments,
  readSegmentDefaults,
  segmentForUsageCategory,
  EXPERIMENTS_CHANGE_EVENT,
  type ThemeExperimentConfig,
} from '@/lib/theme-lab';
import {
  DEFAULT_CONTROL,
  effectiveForcedTheme,
  readThemeLabControl,
  THEME_LAB_CHANGE_EVENT,
  type ThemeLabControl,
} from '@/lib/theme-lab/control';

/**
 * Applies the *resolved* curated theme to <html>. Instead of reading the user's
 * saved choice directly, it runs the Theme Lab resolver (#3) so the live theme
 * respects the full hierarchy: an operator pin / kill-switch wins, a running
 * experiment buckets users who are still on the default, an active saved
 * preference is honored, a segment default and (opt-in) seasonal theme can
 * apply, and a retired theme gracefully falls back.
 *
 * Safety: an EXPLICIT user choice is never overridden by an experiment. We only
 * enroll users who are still on the brand default (no explicit pick) — for them
 * we pass no preference so the experiment / segment / seasonal tiers can apply.
 *
 * It sets `data-theme` (token palette in globals.css) and toggles `.dark` for
 * the dark family. A pre-paint script in layout.tsx applies the force/preference
 * before hydration to avoid a flash.
 */
export function ThemeApplicator() {
  const savedPreference = useSwingVantageStore((s) => normalizeThemeId(s.settings.colorTheme));
  const themeSource = useSwingVantageStore((s) => s.settings.colorThemeSource);
  const usageCategory = useSwingVantageStore((s) => s.settings.usage_category);

  const [control, setControl] = useState<ThemeLabControl>(DEFAULT_CONTROL);
  const [experiments, setExperiments] = useState<ThemeExperimentConfig[]>([]);

  // Subscribe to operator/user control + experiment-config changes.
  useEffect(() => {
    const sync = () => {
      setControl(readThemeLabControl());
      setExperiments(readExperiments());
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(THEME_LAB_CHANGE_EVENT, sync);
    window.addEventListener(EXPERIMENTS_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(THEME_LAB_CHANGE_EVENT, sync);
      window.removeEventListener(EXPERIMENTS_CHANGE_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    // A non-default saved theme without the flag is treated as an explicit pick
    // (back-compat for users who chose before the flag existed).
    const explicit =
      themeSource === 'user' || (themeSource == null && savedPreference !== DEFAULT_THEME_ID);

    const segment = segmentForUsageCategory(usageCategory);
    const segmentDefault = segment ? readSegmentDefaults()[segment] ?? null : null;

    const { themeId } = resolveThemeForUser({
      forcedThemeId: effectiveForcedTheme(control),
      // Only enroll non-explicit users in experiments (never override a pick).
      experiment: explicit ? null : activeRunningExperiment(experiments),
      userId: getThemeAnonId(),
      userPreferenceThemeId: explicit ? savedPreference : null,
      segmentDefaultThemeId: segmentDefault,
      allowSeasonal: control.allowSeasonal,
    });

    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    root.classList.toggle('dark', isDarkTheme(themeId));
  }, [savedPreference, themeSource, usageCategory, control, experiments]);

  return null;
}
