'use client';

// ============================================================
// SwingVantage — Language Toggle Component
// Accessible language selector with 20 languages.
// Available in nav, settings, onboarding, and mobile menu.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG, ALL_LANGUAGE_CODES, RTL_LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  variant?: 'compact' | 'full' | 'sidebar';
  onClose?: () => void;
}

export function LanguageToggle({ variant = 'compact', onClose }: LanguageToggleProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const currentConfig = LANGUAGE_CONFIG[language];

  function handleSelect(code: typeof language) {
    setLanguage(code);
    setOpen(false);
    onClose?.();
  }

  if (variant === 'full') {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground" id="language-select-label">
          {t('language.setting')}
        </label>
        <p className="text-xs text-muted-foreground">{t('language.helperText')}</p>
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          role="radiogroup"
          aria-labelledby="language-select-label"
        >
          {ALL_LANGUAGE_CODES.map((code) => {
            const config = LANGUAGE_CONFIG[code];
            const isRTL = RTL_LANGUAGES.has(code);
            return (
              <button
                key={code}
                role="radio"
                aria-checked={language === code}
                onClick={() => handleSelect(code)}
                dir={isRTL ? 'rtl' : 'ltr'}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-start',
                  language === code
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-border hover:bg-muted'
                )}
              >
                <span className="flex-1 truncate" dir={isRTL ? 'rtl' : 'ltr'}>{config.nativeName}</span>
                {language === code && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`${t('language.change')}: ${currentConfig.nativeName}`}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/90 hover:bg-primary hover:text-white transition-colors"
        >
          <Globe size={18} className="shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate" dir={RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr'}>
            {currentConfig.nativeName}
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            aria-label={t('language.change')}
            className="absolute bottom-full left-0 mb-1 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-auto max-h-72 py-1"
          >
            {ALL_LANGUAGE_CODES.map((code) => {
              const config = LANGUAGE_CONFIG[code];
              const isRTL = RTL_LANGUAGES.has(code);
              return (
                <button
                  key={code}
                  role="option"
                  aria-selected={language === code}
                  onClick={() => handleSelect(code)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 text-sm text-start transition-colors',
                    language === code
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <span className="flex-1">{config.nativeName}</span>
                  {language === code && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Compact dropdown (default)
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t('language.change')}: ${currentConfig.nativeName}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Globe size={16} aria-hidden="true" />
        <span className="hidden sm:inline" dir={RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr'}>
          {currentConfig.nativeName}
        </span>
        <span className="sm:hidden">{language.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('language.change')}
          className="absolute top-full inset-e-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-auto max-h-72 py-1"
        >
          {ALL_LANGUAGE_CODES.map((code) => {
            const config = LANGUAGE_CONFIG[code];
            const isRTL = RTL_LANGUAGES.has(code);
            return (
              <button
                key={code}
                role="option"
                aria-selected={language === code}
                onClick={() => handleSelect(code)}
                dir={isRTL ? 'rtl' : 'ltr'}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm text-start transition-colors',
                  language === code
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <span className="flex-1">{config.nativeName}</span>
                {language === code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
