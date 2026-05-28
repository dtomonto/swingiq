'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  Upload,
  Activity,
  Target,
  Video,
  Box,
  FileText,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  Dumbbell,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/bag', label: 'Golf Bag', icon: ShoppingBag },
  { href: '/sessions', label: 'Sessions', icon: Activity },
  { href: '/sessions/import', label: 'Import Data', icon: Upload },
  { href: '/diagnose', label: 'Diagnose', icon: Target },
  { href: '/training', label: 'Training', icon: Dumbbell },
  { href: '/video', label: 'Video Analysis', icon: Video },
  { href: '/avatar', label: '3D Avatar', icon: Box },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/ai-coach', label: 'AI Coach', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-golf-dark min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-green-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-golf-fairway rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">SQ</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">SwingIQ</span>
            <p className="text-green-400 text-xs">Golf Performance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-green-200 hover:bg-green-800 hover:text-white',
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-green-800 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-200 hover:bg-green-800 hover:text-white transition-colors"
        >
          <Settings size={18} />
          Settings
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-200 hover:bg-red-800 hover:text-white transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
