'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Single source of truth for the public top-nav links.
const NAV_LINKS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Free Tools', href: '/tools' },
  { label: 'Blog', href: '/blog' },
] as const;

/**
 * Persistent marketing navigation rendered by the (marketing) group layout.
 * Gives every public page a consistent way to reach the key marketing
 * destinations and the primary "Start Free" CTA (audit finding IA-3).
 */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/80 no-print">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo → home */}
        <Link href="/" className="flex items-center gap-2" aria-label="SwingIQ home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-golf-fairway shrink-0">
            <span className="text-sm font-black text-white">SQ</span>
          </div>
          <span className="text-lg font-bold text-foreground">SwingIQ</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors',
                isActive(l.href) ? 'text-foreground' : 'text-foreground/70 hover:text-foreground',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/start"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <nav className="border-t border-border bg-secondary md:hidden" aria-label="Mobile">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/start"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                Start Free
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
