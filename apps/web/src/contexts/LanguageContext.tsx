'use client';

// ============================================================
// SwingVantage — Language Context
// Provides t() translation function throughout the app.
// Reads/writes language from the Zustand store.
// Applies document direction and lang attribute for RTL support.
// ============================================================

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSwingVantageStore } from '@/store';
import { buildTranslator, detectBrowserLanguage, LANGUAGE_CONFIG, RTL_LANGUAGES } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/i18n';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRTL: boolean;
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSwingVantageStore();
  const language: LanguageCode = (settings.language as LanguageCode) ?? 'en';

  // Initialize language from browser on first load if no preference set
  useEffect(() => {
    if (!settings.language) {
      const detected = detectBrowserLanguage();
      updateSettings({ language: detected });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply document attributes for RTL and accessibility
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isRTL = RTL_LANGUAGES.has(language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = LANGUAGE_CONFIG[language]?.locale?.split('-')[0] ?? language;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    updateSettings({ language: lang });
  };

  const t = useMemo(() => buildTranslator(language), [language]);
  const isRTL = RTL_LANGUAGES.has(language);
  const locale = LANGUAGE_CONFIG[language]?.locale ?? 'en-US';

  const value = useMemo(
    () => ({ language, setLanguage, t, isRTL, locale }),
    [language, t, isRTL, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback outside of provider (e.g., during SSR or testing)
    return {
      language: 'en',
      setLanguage: () => undefined,
      t: buildTranslator('en'),
      isRTL: false,
      locale: 'en-US',
    };
  }
  return ctx;
}
