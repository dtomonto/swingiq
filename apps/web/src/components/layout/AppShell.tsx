'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar, navItems } from './Sidebar';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

// The 4 most important nav items shown in the bottom bar on mobile.
const BOTTOM_NAV = navItems.filter((item) =>
  ['/dashboard', '/sessions/import', '/diagnose', '/training'].includes(item.href),
);

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
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
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
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-golf-dark lg:hidden shadow-md">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-green-200 hover:bg-green-800 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-golf-fairway rounded-md flex items-center justify-center">
              <span className="text-white font-black text-xs">SQ</span>
            </div>
            <span className="text-white font-bold text-base">SwingIQ</span>
          </div>
          {/* Right spacer so logo stays centered */}
          <div className="w-10" aria-hidden="true" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* ── Mobile bottom navigation bar ── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex lg:hidden safe-area-inset-bottom"
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
                    ? 'text-green-700'
                    : 'text-gray-500 hover:text-gray-900',
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    isActive ? 'text-green-700' : 'text-gray-400',
                  )}
                />
                <span className="leading-tight">{label}</span>
              </Link>
            );
          })}
          {/* "More" button opens the full drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="More navigation options"
          >
            <Menu size={20} className="text-gray-400" />
            <span className="leading-tight">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
