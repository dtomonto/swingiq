'use client';

// ============================================================
// SwingVantage — Language Toggle Component
// Accessible language selector with 20 languages.
// Available in nav, settings, onboarding, and mobile menu.
//
// The `compact` and `sidebar` dropdowns are built on the shared <DropdownMenu>
// primitive (Radix), so open/close, ESC, outside-click, arrow-key navigation
// and focus-return are handled for us. The `full` variant stays an inline
// radiogroup grid (it's a settings control, not a dropdown).
// ============================================================

import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG, ALL_LANGUAGE_CODES, RTL_LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface LanguageToggleProps {
  variant?: 'compact' | 'full' | 'sidebar';
  onClose?: () => void;
}

export function LanguageToggle({ variant = 'compact', onClose }: LanguageToggleProps) {
  const { language, setLanguage, t } = useLanguage();
  const currentConfig = LANGUAGE_CONFIG[language];

  function handleSelect(code: string) {
    setLanguage(code as typeof language);
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

  // Shared dropdown content for the compact + sidebar triggers.
  const menu = (
    <DropdownMenuContent
      side={variant === 'sidebar' ? 'top' : 'bottom'}
      align={variant === 'sidebar' ? 'start' : 'end'}
      aria-label={t('language.change')}
      className="max-h-72 w-56 overflow-auto"
    >
      <DropdownMenuRadioGroup value={language} onValueChange={handleSelect}>
        {ALL_LANGUAGE_CODES.map((code) => {
          const config = LANGUAGE_CONFIG[code];
          const isRTL = RTL_LANGUAGES.has(code);
          return (
            <DropdownMenuRadioItem key={code} value={code} dir={isRTL ? 'rtl' : 'ltr'}>
              {config.nativeName}
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={`${t('language.change')}: ${currentConfig.nativeName}`}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-foreground/90 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Globe size={18} className="shrink-0" aria-hidden="true" />
            <span
              className="flex-1 truncate text-start"
              dir={RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr'}
            >
              {currentConfig.nativeName}
            </span>
          </button>
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    );
  }

  // Compact dropdown (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`${t('language.change')}: ${currentConfig.nativeName}`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Globe size={16} aria-hidden="true" />
          <span className="hidden sm:inline" dir={RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr'}>
            {currentConfig.nativeName}
          </span>
          <span className="sm:hidden">{language.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      {menu}
    </DropdownMenu>
  );
}
