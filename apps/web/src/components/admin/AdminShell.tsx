'use client';

// AdminShell — the unified admin chrome: fixed sidebar (desktop) +
// slide-in drawer (mobile), sticky topbar, global search, and the main
// content slot. Wraps every /admin/* route from app/admin/layout.tsx.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar, type SystemStatusEntry } from './AdminTopbar';
import { GlobalSearch } from './GlobalSearch';
import { roleHasPermission, type RoleId, type Permission } from '@/lib/admin/rbac';
import { activeNavItem } from '@/lib/admin/nav';
import { pushRecent } from '@/lib/admin/nav-prefs';

export interface AdminShellProps {
  email: string | null;
  role: RoleId;
  /** Count of items awaiting review (Action Center) — shows a topbar badge. */
  actionCount?: number;
  /** Optional system-pulse entries for the hairline strip below the topbar. */
  systemStatus?: SystemStatusEntry[];
  children: React.ReactNode;
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-4 py-3">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-extrabold tracking-tight text-white"
        style={{ background: 'linear-gradient(135deg, #2d5a40, #14532d)' }}
      >
        sV
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-bold text-foreground">SwingVantage</span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-link">Admin OS</span>
      </span>
    </Link>
  );
}

export function AdminShell({ email, role, actionCount = 0, systemStatus, children }: AdminShellProps) {
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
    <div data-theme="coach-mode" className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
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
            className="absolute inset-0 bg-foreground/60"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="tap-target mr-3 rounded-md text-muted-foreground hover:bg-muted"
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
          systemStatus={systemStatus}
          onOpenSidebar={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} can={can} />
    </div>
  );
}
