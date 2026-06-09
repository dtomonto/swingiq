'use client';

// AdminShell — the unified admin chrome: fixed sidebar (desktop) +
// slide-in drawer (mobile), sticky topbar, global search, and the main
// content slot. Wraps every /admin/* route from app/admin/layout.tsx.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { GlobalSearch } from './GlobalSearch';
import { roleHasPermission, type RoleId, type Permission } from '@/lib/admin/rbac';
import { activeNavItem } from '@/lib/admin/nav';
import { pushRecent } from '@/lib/admin/nav-prefs';

export interface AdminShellProps {
  email: string | null;
  role: RoleId;
  /** Count of items awaiting review (Action Center) — shows a topbar badge. */
  actionCount?: number;
  children: React.ReactNode;
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-4 py-3">
      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-sm">
        SV
      </span>
      <span className="text-sm font-semibold text-gray-100">Admin</span>
    </Link>
  );
}

export function AdminShell({ email, role, actionCount = 0, children }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on route change.
  useEffect(() => setDrawerOpen(false), [pathname]);

  // Record the visited section for the sidebar "Recent" shortcuts.
  useEffect(() => {
    const item = activeNavItem(pathname || '/admin');
    if (item) pushRecent(item.id);
  }, [pathname]);

  // ⌘K / Ctrl+K (and "/") open global search, unless typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (cmdK) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const can = (p: Permission) => roleHasPermission(role, p);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-800 bg-gray-900 lg:flex">
        <Brand />
        <div className="min-h-0 flex-1">
          <AdminSidebar role={role} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="tap-target mr-3 rounded-md text-gray-400 hover:bg-gray-800"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <AdminSidebar role={role} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          email={email}
          role={role}
          actionCount={actionCount}
          onOpenSidebar={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} can={can} />
    </div>
  );
}
