'use client';

import { useEffect } from 'react';
import { useSwingVantageStore } from '@/store';
import { isDarkTheme, normalizeThemeId } from '@/lib/theme/themes';

/**
 * Applies the active curated theme to <html> by setting `data-theme`
 * (which selects the token palette in globals.css) and toggling the
 * `.dark` class for the dark theme family so any `dark:` utilities keep
 * working. A matching pre-paint inline script in layout.tsx applies the
 * same attributes before React hydrates to avoid a flash of the default
 * theme.
 */
export function ThemeApplicator() {
  const colorTheme = useSwingVantageStore((s) => normalizeThemeId(s.settings.colorTheme));

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', colorTheme);
    root.classList.toggle('dark', isDarkTheme(colorTheme));
  }, [colorTheme]);

  return null;
}
