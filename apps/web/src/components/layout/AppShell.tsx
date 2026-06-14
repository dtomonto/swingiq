'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LayoutDashboard, Target, Dumbbell, TrendingUp, RotateCcw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/language/LanguageToggle';
import { ContextualHelpButton } from '@/components/tutorial/ContextualHelpButton';
import { TutorialWelcomePrompt } from '@/components/tutorial/TutorialWelcomePrompt';
import { OfflineBanner } from './OfflineBanner';
import { CelebrationHost } from '@/components/celebrations/CelebrationHost';
import { FeatureHelp } from '@/components/feature-education/FeatureHelp';

interface AppShellProps {
  children: React.ReactNode;
}

// The core journey, mirrored in the mobile bottom bar: Today → Analyze →
// Practice → Progress → Retest — the loop closing on "did it actually
// change?". "More" opens the full drawer for everything else.
const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Today', icon: LayoutDashboard },
  { href: '/diagnose', label: 'Analyze', icon: Target },
  { href: '/training', label: 'Practice', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/retest', label: 'Retest', icon: RotateCcw },
] as const;

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
    <div className="flex min-h-screen app-canvas">
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
        {/* Mobile top bar — pins below the status bar in an installed PWA */}
        <header
          className="sticky z-30 flex items-center justify-between px-4 py-3 bg-nav border-b border-border lg:hidden shadow-xs no-print"
          style={{ top: 'env(safe-area-inset-top, 0px)' }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="tap-target rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-golf-fairway rounded-md flex items-center justify-center">
              <span className="text-white font-black text-xs">SV</span>
            </div>
            <span className="text-foreground font-bold text-base">SwingVantage</span>
          </div>
          {/* Help + Language toggles on right */}
          <div className="flex items-center gap-1">
            <ContextualHelpButton className="text-muted-foreground hover:text-foreground hover:bg-muted" />
            <LanguageToggle variant="compact" />
          </div>
        </header>

        {/* Page content — reserve room for the floating nav + home indicator */}
        <main
          id="main-content"
          className="flex-1 overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
        >
          <OfflineBanner />
          {/* Contextual in-app help published by the Feature Education Engine
              for the current route. Renders nothing until an admin publishes
              help for this exact path, so it's safe to mount app-wide. The
              wrapper classes only apply when a banner is actually shown
              (FeatureHelp returns null otherwise), so no empty gutter appears. */}
          <FeatureHelp route={pathname} className="mx-auto w-full max-w-5xl space-y-2 px-4 pt-4 sm:px-6" />
          {children}
        </main>

        {/* ── Mobile bottom navigation — Liquid Glass ──
            A frosted, blurred navigator that floats above the home indicator.
            The glass surface extends to the screen edge while the safe-area
            inset keeps the tappable row clear of the iOS home bar. */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex lg:hidden no-print"
          aria-label="Bottom navigation"
        >
          <div
            className="liquid-glass-nav mx-auto flex w-full max-w-md items-stretch gap-0.5 rounded-t-3xl px-2 pt-1.5"
            style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 min-h-[3.25rem] text-2xs font-medium transition-colors',
                    isActive ? 'text-bottom-nav-active' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {/* "Liquid" selection blob behind the active tab */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-1 inset-y-0.5 rounded-2xl bg-primary/12 ring-1 ring-inset ring-primary/25"
                    />
                  )}
                  <Icon size={23} className="relative z-10 transition-transform duration-200 group-active:scale-90" />
                  <span className="relative z-10 leading-none">{label}</span>
                </Link>
              );
            })}
            {/* "More" button opens the full drawer */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 min-h-[3.25rem] text-2xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              aria-label="More navigation options"
            >
              <Menu size={23} className="relative z-10 transition-transform duration-200 group-active:scale-90" />
              <span className="relative z-10 leading-none">More</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Earn-moment celebrations (fixed overlay; app-wide) */}
      <CelebrationHost />

      {/* First-run nudge toward the video Tutorial Center (dismissible / skippable) */}
      <TutorialWelcomePrompt />
    </div>
  );
}
