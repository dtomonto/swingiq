'use client';

// ============================================================
// Recruiting — section sub-navigation
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, UserCog, Film, BarChart3, Clapperboard,
  FileDown, Mail, LineChart, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/recruiting', label: 'Overview', icon: LayoutGrid, exact: true },
  { href: '/recruiting/profile-builder', label: 'Profile', icon: UserCog },
  { href: '/recruiting/film-library', label: 'Film', icon: Film },
  { href: '/recruiting/data-dashboard', label: 'Data', icon: BarChart3 },
  { href: '/recruiting/highlight-builder', label: 'Reels', icon: Clapperboard },
  { href: '/recruiting/packet-generator', label: 'Packet', icon: FileDown },
  { href: '/recruiting/outreach', label: 'Outreach', icon: Mail },
  { href: '/recruiting/analytics', label: 'Analytics', icon: LineChart },
  { href: '/recruiting/settings', label: 'Privacy', icon: Settings },
];

export function RecruitingNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Recruiting sections">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
