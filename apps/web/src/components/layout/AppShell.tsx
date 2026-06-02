'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar, BOTTOM_NAV_ITEMS } from './Sidebar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/language/LanguageToggle';
import { ContextualHelpButton } from '@/components/tutorial/ContextualHelpButton';

interface AppShellProps {
  children: React.ReactNode;
}

// The 4 most important nav items shown in the bottom bar on mobile.
// Sourced from the single canonical list in Sidebar.
const BOTTOM_NAV = BOTTOM_NAV_ITEMS;

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Skip-to-content link (screen readers / keyboard users) ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:bg-card focus:text-foreground focus:font-semibold focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-hidden focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:shrink-0 no-print">
        <div className="w-64 flex flex-col min-h-screen sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={closeDrawer}
        />
      )}

      {/* ── Mobile slide-out drawer ── */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 transform transition-transform duration-300 ease-in-out lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <Sidebar onClose={closeDrawer} />
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-secondary border-b border-border lg:hidden shadow-xs no-print">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-golf-fairway rounded-md flex items-center justify-center">
              <span className="text-white font-black text-xs">SQ</span>
            </div>
            <span className="text-foreground font-bold text-base">SwingIQ</span>
          </div>
          {/* Help + Language toggles on right */}
          <div className="flex items-center gap-1">
            <ContextualHelpButton className="text-muted-foreground hover:text-foreground hover:bg-muted" />
            <LanguageToggle variant="compact" />
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* ── Mobile bottom navigation bar ── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex lg:hidden safe-area-inset-bottom no-print"
          aria-label="Bottom navigation"
        >
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="leading-tight">{label}</span>
              </Link>
            );
          })}
          {/* "More" button opens the full drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="More navigation options"
          >
            <Menu size={20} className="text-muted-foreground" />
            <span className="leading-tight">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
