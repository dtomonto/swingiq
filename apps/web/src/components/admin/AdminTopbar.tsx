'use client';

// AdminTopbar — breadcrumbs, global-search trigger, help, and the
// admin profile menu (email + role + back to app).

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, HelpCircle, ChevronDown, LogOut, UserCircle2, Bell, Sun, Moon } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { ROLES, type RoleId } from '@/lib/admin/rbac';
import { activeNavItem } from '@/lib/admin/nav';

/** A single system-pulse entry shown in the strip below the topbar. */
export interface SystemStatusEntry {
  name: string;
  value: string;
  state: 'ok' | 'warn' | 'crit';
}

export interface AdminTopbarProps {
  email: string | null;
  role: RoleId;
  /** Items awaiting review (Action Center) — renders a badge when > 0. */
  actionCount?: number;
  /** Optional system-pulse strip rendered as a hairline row below the topbar. */
  systemStatus?: SystemStatusEntry[];
  /** Current admin theme, and whether the dark-mode toggle is available (flag). */
  theme?: 'coach-mode' | 'coach-night';
  canToggleTheme?: boolean;
  onToggleTheme?: () => void;
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

export function AdminTopbar({
  email, role, actionCount = 0, systemStatus, theme, canToggleTheme, onToggleTheme, onOpenSidebar, onOpenSearch,
}: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() || '/admin';
  const sectionLabel = activeNavItem(pathname)?.label ?? 'Admin';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-2.5">
      <button
        onClick={onOpenSidebar}
        className="tap-target rounded-md text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 flex-1 lg:block">
        <Breadcrumbs />
      </div>
      {/* Mobile: show the current section so users always know where they are. */}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground lg:hidden">
        {sectionLabel}
      </span>

      <button
        onClick={onOpenSearch}
        className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search admin…</span>
        <kbd className="hidden rounded bg-muted px-1 text-[10px] sm:inline">⌘K</kbd>
      </button>

      {/* Action Center alert badge — visible from every page. */}
      <Link
        href="/admin/approvals"
        className="relative rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        title={actionCount > 0 ? `${actionCount} item${actionCount === 1 ? '' : 's'} need review` : 'Action Center — nothing pending'}
        aria-label={actionCount > 0 ? `${actionCount} items need review` : 'Action Center'}
      >
        <Bell className="h-5 w-5" />
        {actionCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-foreground">
            {actionCount > 99 ? '99+' : actionCount}
          </span>
        )}
      </Link>

      <Link
        href="/admin/learning"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        title="Admin Academy & help"
      >
        <HelpCircle className="h-5 w-5" />
      </Link>

      {/* Profile menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm text-foreground hover:bg-muted"
        >
          <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        {menuOpen && (
          <>
            <button
              aria-label="Close menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-border bg-card p-1 shadow-xl">
              <div className="px-3 py-2">
                <p className="truncate text-sm text-foreground">{email ?? 'Admin (secret header)'}</p>
                <p className="text-xs text-link">{ROLES[role]?.label ?? role}</p>
              </div>
              <div className="my-1 border-t border-border" />
              {canToggleTheme && onToggleTheme && (
                <button
                  onClick={() => { onToggleTheme(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                >
                  {theme === 'coach-night' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {theme === 'coach-night' ? 'Light mode (Coach Mode)' : 'Dark mode (Coach Night)'}
                </button>
              )}
              <Link
                href="/admin/learning"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
              >
                Admin Academy
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" /> Back to app
              </Link>
            </div>
          </>
        )}
      </div>
      </div>
      {systemStatus && systemStatus.length > 0 && (
        <div className="flex gap-4 overflow-x-auto border-t border-border px-4 py-1.5">
          {systemStatus.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  s.state === 'crit' ? 'bg-error' : s.state === 'warn' ? 'bg-warning' : 'bg-success'
                }`}
              />
              <strong className="font-semibold text-foreground">{s.name}</strong>
              <span className="font-mono text-[11px]">{s.value}</span>
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
