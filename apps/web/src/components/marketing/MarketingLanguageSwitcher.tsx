'use client';

// ============================================================
// SwingVantage — Marketing language switcher
// URL-based (not an in-place store swap) so each language is a real,
// crawlable page. Only offers locales in which THIS page is fully
// translated, plus English. Records the choice in a cookie so the
// auto-detection redirect respects it on future visits.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { LANGUAGE_CONFIG } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/i18n';
import { currentLocalesFor } from '@/lib/marketing-i18n/expose';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { LANG_COOKIE } from '@/lib/marketing-i18n/constants';
import { cn } from '@/lib/utils';

interface Props {
  /** The page's base (English) path, e.g. '/' or '/how-it-works'. */
  basePath: string;
  /** The currently displayed locale. */
  locale: LanguageCode;
}

export function MarketingLanguageSwitcher({ basePath, locale }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // English is always available; add any locale this page is translated into.
  const options: LanguageCode[] = ['en', ...currentLocalesFor(basePath)];

  // With only English available there is nothing to switch to — hide entirely.
  if (options.length <= 1) return null;

  function remember(code: LanguageCode) {
    // 1-year, lax cookie so the detection redirect honors an explicit choice.
    document.cookie = `${LANG_COOKIE}=${code};path=/;max-age=31536000;samesite=lax`;
    setOpen(false);
  }

  const current = LANGUAGE_CONFIG[locale];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${current.nativeName}`}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
      >
        <Globe size={16} aria-hidden="true" />
        <span className="hidden sm:inline">{current.nativeName}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose language"
          className="absolute right-0 top-full z-50 mt-1 w-44 overflow-auto rounded-xl border border-border bg-card py-1 shadow-xl"
        >
          {options.map((code) => (
            <Link
              key={code}
              role="option"
              aria-selected={code === locale}
              href={localizedHref(basePath, code)}
              onClick={() => remember(code)}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-start text-sm transition-colors',
                code === locale ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted',
              )}
            >
              <span className="flex-1">{LANGUAGE_CONFIG[code].nativeName}</span>
              {code === locale && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
