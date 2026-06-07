'use client';

// AdminTopbar — breadcrumbs, global-search trigger, help, and the
// admin profile menu (email + role + back to app).

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, HelpCircle, ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { ROLES, type RoleId } from '@/lib/admin/rbac';

export interface AdminTopbarProps {
  email: string | null;
  role: RoleId;
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

export function AdminTopbar({ email, role, onOpenSidebar, onOpenSearch }: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-800 bg-gray-900/95 px-4 py-2.5 backdrop-blur">
      <button
        onClick={onOpenSidebar}
        className="tap-target rounded-md text-gray-400 hover:bg-gray-800 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 flex-1 lg:block">
        <Breadcrumbs />
      </div>

      <button
        onClick={onOpenSearch}
        className="ml-auto flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-600 hover:text-gray-300"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search admin…</span>
        <kbd className="hidden rounded bg-gray-800 px-1 text-[10px] sm:inline">/</kbd>
      </button>

      <Link
        href="/admin/learning"
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800"
        title="Admin Academy & help"
      >
        <HelpCircle className="h-5 w-5" />
      </Link>

      {/* Profile menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm text-gray-300 hover:bg-gray-800"
        >
          <UserCircle2 className="h-5 w-5 text-gray-400" />
          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
        </button>
        {menuOpen && (
          <>
            <button
              aria-label="Close menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-gray-700 bg-gray-900 p-1 shadow-xl">
              <div className="px-3 py-2">
                <p className="truncate text-sm text-gray-200">{email ?? 'Admin (secret header)'}</p>
                <p className="text-xs text-amber-400">{ROLES[role]?.label ?? role}</p>
              </div>
              <div className="my-1 border-t border-gray-800" />
              <Link
                href="/admin/learning"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
              >
                Admin Academy
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" /> Back to app
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
