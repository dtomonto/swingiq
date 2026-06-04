'use client';

// ============================================================
// GrowthOS — Navigation shell
// ------------------------------------------------------------
// Premium sidebar + mobile drawer that renders straight from GROWTH_NAV.
// Active state via usePathname. A quick-filter narrows the 28 sections.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GROWTH_NAV, activeNavItem } from '@/lib/growth/nav';

export function GrowthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const active = activeNavItem(pathname);

  const groups = useMemo(() => {
    if (!filter.trim()) return GROWTH_NAV;
    const q = filter.toLowerCase();
    return GROWTH_NAV.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [filter]);

  return (
    <div className="flex min-h-[calc(100vh-49px)]">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-gray-800 bg-gray-950">
        <SidebarContent groups={groups} pathname={pathname} filter={filter} setFilter={setFilter} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-gray-950 border-r border-gray-800 flex flex-col">
            <SidebarContent
              groups={groups}
              pathname={pathname}
              filter={filter}
              setFilter={setFilter}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* GrowthOS sub-header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/60 sticky top-0 z-30 backdrop-blur">
          <button
            className="lg:hidden text-gray-400 hover:text-gray-200"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-200">GrowthOS</span>
            {active ? (
              <>
                <span className="text-gray-700">/</span>
                <span className="text-sm text-gray-400 truncate">{active.label}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  );
}

function SidebarContent({
  groups, pathname, filter, setFilter, onNavigate,
}: {
  groups: typeof GROWTH_NAV;
  pathname: string;
  filter: string;
  setFilter: (v: string) => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-green-400/10 border border-green-400/20 p-1.5">
            <Sparkles className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-100 leading-none">GrowthOS</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Marketing operating system</p>
          </div>
        </div>
        {onNavigate ? (
          <button onClick={onNavigate} className="text-gray-500 hover:text-gray-300" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Jump to…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-green-600/15 text-green-300 border border-green-600/30'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent',
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-green-400' : 'text-gray-500')} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
