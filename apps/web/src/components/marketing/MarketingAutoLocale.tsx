'use client';

// ============================================================
// SwingVantage — Marketing auto-language redirect (humans only)
//
// Runs on English marketing pages. If the page is available in the
// visitor's preferred language (cookie choice first, then browser
// languages) it redirects to the localized URL. Deliberately
// client-side: crawlers still receive the server-rendered English with
// correct canonical + hreflang, so SEO signals are untouched. Respects
// an explicit English choice and never loops (localized pages use a
// different layout that doesn't mount this).
// ============================================================

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { LanguageCode } from '@/lib/i18n';
import { currentLocalesFor } from '@/lib/marketing-i18n/expose';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { LANG_COOKIE } from '@/lib/marketing-i18n/constants';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function MarketingAutoLocale() {
  const pathname = usePathname();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !pathname) return;
    done.current = true;

    const available = currentLocalesFor(pathname) as string[]; // non-English locales for this page
    if (available.length === 0) return;

    const choice = readCookie(LANG_COOKIE);
    if (choice === 'en') return; // visitor explicitly prefers English

    let target: LanguageCode | null = null;
    if (choice && available.includes(choice)) {
      target = choice as LanguageCode;
    } else if (!choice && typeof navigator !== 'undefined') {
      const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
      for (const tag of tags) {
        const base = tag?.split('-')[0]?.toLowerCase();
        if (base && available.includes(base)) {
          target = base as LanguageCode;
          break;
        }
      }
    }

    if (target) {
      const href = localizedHref(pathname, target);
      if (href !== pathname) router.replace(href);
    }
  }, [pathname, router]);

  return null;
}
