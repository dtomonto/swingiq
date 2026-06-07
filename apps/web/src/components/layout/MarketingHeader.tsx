'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingDict } from '@/lib/marketing-i18n/dict';
import { localizedHref, localeFromPathname } from '@/lib/marketing-i18n/href';
import { MarketingLanguageSwitcher } from '@/components/marketing/MarketingLanguageSwitcher';

// Single source of truth for the public top-nav links. Labels come from the
// marketing dictionary (per locale); hrefs are English base paths and get
// localized per locale by localizedHref().
const NAV_LINKS = [
  { key: 'howItWorks', href: '/how-it-works' },
  { key: 'features', href: '/features' },
  { key: 'pricing', href: '/pricing' },
  { key: 'freeTools', href: '/tools' },
  { key: 'blog', href: '/blog' },
] as const;

/**
 * Persistent marketing navigation rendered by the (marketing) group layout and
 * the localized app/[lang] layout. `locale` decides the language of the labels
 * and which links resolve to localized URLs (audit finding IA-3).
 */
export function MarketingHeader({ locale = 'en' }: { locale?: LanguageCode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dict = getMarketingDict(locale);
  const nav = dict.nav;

  // Compare against the locale-stripped base path so active state works under /es.
  const { basePath } = localeFromPathname(pathname || '/');
  const isActive = (href: string) => basePath === href || basePath.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/80 no-print">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo → home */}
        <Link href={localizedHref('/', locale)} className="flex items-center gap-2" aria-label={nav.homeAria}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-golf-fairway shrink-0">
            <span className="text-sm font-black text-white">SV</span>
          </div>
          <span className="text-lg font-bold text-foreground">SwingVantage</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label={nav.primaryNavAria}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={localizedHref(l.href, locale)}
              className={cn(
                'text-sm font-medium transition-colors',
                isActive(l.href) ? 'text-foreground' : 'text-foreground/70 hover:text-foreground',
              )}
            >
              {nav[l.key]}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <MarketingLanguageSwitcher basePath={basePath} locale={locale} />
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            {nav.logIn}
          </Link>
          <Link
            href={localizedHref('/start', locale)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {nav.startFree}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label={open ? nav.closeMenu : nav.openMenu}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <nav className="border-t border-border bg-secondary md:hidden" aria-label={nav.mobileNavAria}>
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={localizedHref(l.href, locale)}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                {nav[l.key]}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <div className="px-1 py-1">
                <MarketingLanguageSwitcher basePath={basePath} locale={locale} />
              </div>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {nav.logIn}
              </Link>
              <Link
                href={localizedHref('/start', locale)}
                onClick={() => setOpen(false)}
                className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                {nav.startFree}
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
