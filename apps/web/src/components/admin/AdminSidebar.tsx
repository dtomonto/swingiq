'use client';

// AdminSidebar — grouped navigation from the nav model, filtered by the
// admin's role. Built routes link; unbuilt ones render disabled with a
// "Soon" chip; pre-existing tools get an external marker.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import {
  NAV_GROUPS, NAV_ITEMS, groupNavItems, type NavItem,
} from '@/lib/admin/nav';
import { roleHasPermission, type RoleId } from '@/lib/admin/rbac';

export interface AdminSidebarProps {
  role: RoleId;
  /** Called when a nav link is clicked (used to close the mobile drawer). */
  onNavigate?: () => void;
}

export function AdminSidebar({ role, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname() || '/admin';
  const visible = NAV_ITEMS.filter((i) => !i.permission || roleHasPermission(role, i.permission));
  const groups = groupNavItems(visible);

  const isActive = (item: NavItem) =>
    pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));

  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4">
      {groups.map(({ group, items }) => (
        <div key={group.id}>
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            {NAV_GROUPS.find((g) => g.id === group.id)?.label}
          </p>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const base =
                'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors';
              if (!item.built) {
                return (
                  <li key={item.id}>
                    <span
                      title={item.blurb}
                      className={`${base} cursor-default text-gray-600`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-50" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="rounded bg-gray-800 px-1 text-[9px] uppercase text-gray-500">
                        Soon
                      </span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    title={item.blurb}
                    onClick={onNavigate}
                    className={`${base} ${
                      active
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-amber-400' : ''}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.external && <ArrowUpRight className="h-3 w-3 text-gray-600" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
