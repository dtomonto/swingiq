'use client';

// AdminSidebar — grouped navigation from the nav model, filtered by role.
// UX: collapsible groups (persisted) that auto-expand the active section,
// pinned Favorites + Recently-visited shortcuts, optional subgroup headers,
// per-item star to pin, and scroll-the-active-item-into-view on load.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, Star, Clock, Pin } from 'lucide-react';
import {
  NAV_GROUPS, NAV_ITEMS, groupNavItems, activeNavItem, findNavItem, type NavItem,
} from '@/lib/admin/nav';
import { roleHasPermission, type RoleId } from '@/lib/admin/rbac';
import {
  getFavorites, toggleFavorite, getRecent, getCollapsedGroups, toggleGroupCollapsed,
} from '@/lib/admin/nav-prefs';

export interface AdminSidebarProps {
  role: RoleId;
  onNavigate?: () => void;
}

export function AdminSidebar({ role, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname() || '/admin';
  const visible = useMemo(
    () => NAV_ITEMS.filter((i) => !i.permission || roleHasPermission(role, i.permission)),
    [role],
  );
  const groups = useMemo(() => groupNavItems(visible), [visible]);

  const activeId = activeNavItem(pathname)?.id;
  const activeGroup = activeNavItem(pathname)?.group;

  // Prefs load client-side (avoid SSR/localStorage hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  useEffect(() => {
    setMounted(true);
    setFavorites(getFavorites());
    setRecent(getRecent());
    setCollapsed(getCollapsedGroups());
  }, []);

  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [pathname, mounted]);

  const isActive = (item: NavItem) =>
    pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));

  const canRender = (id: string) => visible.some((i) => i.id === id);
  const favoriteItems = mounted
    ? favorites.map(findNavItem).filter((i): i is NavItem => !!i && i.built && canRender(i.id))
    : [];
  const recentItems = mounted
    ? recent
        .map(findNavItem)
        .filter((i): i is NavItem => !!i && i.built && canRender(i.id) && i.id !== activeId)
        .slice(0, 5)
    : [];

  const renderItem = (item: NavItem, keyPrefix = '') => {
    const Icon = item.icon;
    const active = isActive(item);
    const base = 'group/item flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors';
    if (!item.built) {
      return (
        <li key={`${keyPrefix}${item.id}`}>
          <span title={item.blurb} className={`${base} cursor-default text-gray-600`}>
            <Icon className="h-4 w-4 shrink-0 opacity-50" />
            <span className="flex-1 truncate">{item.label}</span>
            <span className="rounded bg-gray-800 px-1 text-[9px] uppercase text-gray-500">Soon</span>
          </span>
        </li>
      );
    }
    const pinned = favorites.includes(item.id);
    return (
      <li key={`${keyPrefix}${item.id}`} className="relative">
        <Link
          ref={active ? activeRef : undefined}
          href={item.href}
          title={item.blurb}
          onClick={onNavigate}
          className={`${base} ${active ? 'bg-amber-500/10 text-amber-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'}`}
        >
          <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-amber-400' : ''}`} />
          <span className="flex-1 truncate pr-5">{item.label}</span>
          {item.external && <ArrowUpRight className="h-3 w-3 text-gray-600" />}
        </Link>
        {mounted && (
          <button
            type="button"
            onClick={() => setFavorites(toggleFavorite(item.id))}
            aria-label={pinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
            className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-gray-600 hover:text-amber-400 ${pinned ? '' : 'hidden group-hover/item:block'}`}
          >
            <Star className={`h-3 w-3 ${pinned ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        )}
      </li>
    );
  };

  // Within a group, render items without a subgroup first, then subgroup blocks.
  const renderGroupBody = (items: NavItem[]) => {
    const noSub = items.filter((i) => !i.subgroup);
    const subgroups = Array.from(new Set(items.map((i) => i.subgroup).filter((s): s is string => !!s)));
    return (
      <>
        {noSub.length > 0 && <ul className="space-y-0.5">{noSub.map((i) => renderItem(i))}</ul>}
        {subgroups.map((sg) => (
          <div key={sg} className="mt-1.5">
            <p className="px-2 pb-0.5 text-[9px] font-medium uppercase tracking-wider text-gray-700">{sg}</p>
            <ul className="space-y-0.5">{items.filter((i) => i.subgroup === sg).map((i) => renderItem(i))}</ul>
          </div>
        ))}
      </>
    );
  };

  return (
    <nav className="flex h-full flex-col gap-3 overflow-y-auto px-3 py-4">
      {favoriteItems.length > 0 && (
        <div>
          <p className="flex items-center gap-1 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            <Pin className="h-3 w-3" /> Pinned
          </p>
          <ul className="space-y-0.5">{favoriteItems.map((i) => renderItem(i, 'fav-'))}</ul>
        </div>
      )}
      {recentItems.length > 0 && (
        <div>
          <p className="flex items-center gap-1 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            <Clock className="h-3 w-3" /> Recent
          </p>
          <ul className="space-y-0.5">{recentItems.map((i) => renderItem(i, 'recent-'))}</ul>
        </div>
      )}

      {groups.map(({ group, items }) => {
        const isCollapsed = mounted && collapsed.includes(group.id) && group.id !== activeGroup;
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => setCollapsed(toggleGroupCollapsed(group.id))}
              className="flex w-full items-center justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-400"
            >
              <span>{NAV_GROUPS.find((g) => g.id === group.id)?.label}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>
            {!isCollapsed && renderGroupBody(items)}
          </div>
        );
      })}
    </nav>
  );
}
