'use client';

import { useEffect, useState } from 'react';
import { useSwingVantageStore } from '@/store';
import { isDarkTheme, normalizeThemeId } from '@/lib/theme/themes';
import { resolveThemeForUser } from '@/lib/theme-lab';
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
 * respects the full hierarchy: an operator pin / kill-switch wins, an active
 * saved preference is honored, a retired theme gracefully falls back, and
 * (when opted in) a seasonal theme can take over inside its window.
 *
 * It sets `data-theme` (which selects the token palette in globals.css) and
 * toggles the `.dark` class for the dark theme family so any `dark:` utilities
 * keep working. A matching pre-paint inline script in layout.tsx applies the
 * same resolution (force → saved preference) before React hydrates to avoid a
 * flash of the wrong theme.
 */
export function ThemeApplicator() {
  const savedPreference = useSwingVantageStore((s) => normalizeThemeId(s.settings.colorTheme));
  const [control, setControl] = useState<ThemeLabControl>(DEFAULT_CONTROL);

  // Subscribe to operator/user control changes (this tab and others).
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

  useEffect(() => {
    const { themeId } = resolveThemeForUser({
      forcedThemeId: effectiveForcedTheme(control),
      userPreferenceThemeId: savedPreference,
      allowSeasonal: control.allowSeasonal,
    });
    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    root.classList.toggle('dark', isDarkTheme(themeId));
  }, [savedPreference, control]);

  return null;
}
