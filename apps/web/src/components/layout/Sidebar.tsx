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
  FileText,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  Dumbbell,
  X,
  BookOpen,
  Sun,
  Flame,
  CalendarDays,
  Trophy,
  GitCompareArrows,
  Package,
} from 'lucide-react';
import { SportPillDropdown } from '@/components/sport/SportSelector';
import { useSport } from '@/contexts/SportContext';
import { useSwingIQStore } from '@/store';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { training } = useSwingIQStore();
  const { activeSport, sportEmoji, sportTagline, sportLabels, isGolf } = useSport();

  // Sport-aware nav items — core items change labels by sport
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: sportLabels.profile_short, icon: User },
    // Only show Equipment tab for golf (clubs) or for all sports with equipment
    { href: isGolf ? '/bag' : '/equipment', label: isGolf ? 'Equipment' : sportLabels.equipment_short, icon: isGolf ? ShoppingBag : Package },
    { href: '/sessions', label: sportLabels.sessions, icon: Activity },
    { href: '/sessions/import', label: isGolf ? 'Import Data' : 'Log Session', icon: Upload },
    { href: '/diagnose', label: isGolf ? 'Diagnose' : 'Analyze Swing', icon: Target },
    { href: '/training', label: 'Training', icon: Dumbbell },
    { href: '/practice', label: 'Practice Schedule', icon: CalendarDays },
    { href: '/pre-round', label: isGolf ? 'Pre-Round' : 'Pre-Game Warm-Up', icon: Sun },
    { href: '/video', label: 'Video Analysis', icon: Video },
    { href: '/drills', label: isGolf ? 'Drill Library' : 'Drills', icon: BookOpen },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
    { href: '/milestones', label: 'Milestones', icon: Trophy },
    { href: '/compare', label: 'Compare & References', icon: GitCompareArrows },
    { href: '/ai-coach', label: 'AI Coach', icon: MessageSquare },
    { href: '/reports', label: 'Reports', icon: FileText },
  ] as const;

  // Sport accent colors for active state
  const accentColors: Record<string, string> = {
    golf: 'bg-green-700',
    tennis: 'bg-yellow-600',
    baseball: 'bg-red-700',
    softball_slow: 'bg-orange-600',
    softball_fast: 'bg-pink-600',
  };
  const activeClass = accentColors[activeSport] ?? 'bg-green-700';

  return (
    <aside className="w-64 bg-golf-dark flex flex-col h-full">
      {/* Logo + close button (close only visible on mobile) */}
      <div className="px-6 py-5 border-b border-green-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-golf-fairway rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">SQ</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">SwingIQ</span>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span>{sportEmoji}</span>
              <span>{sportTagline}</span>
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-green-300 hover:text-white p-1 rounded transition-colors lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? `${activeClass} text-white`
                  : 'text-green-200 hover:bg-green-800 hover:text-white',
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {href === '/training' && training.streak_days > 1 && (
                <span className="flex items-center gap-0.5 text-xs text-orange-400">
                  <Flame size={11} />{training.streak_days}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sport Switcher */}
      <div className="px-3 pb-3">
        <p className="text-xs text-green-500 font-medium mb-1.5 px-1">Active Sport</p>
        <SportPillDropdown onClose={onClose} />
      </div>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-green-800 space-y-1">
        <Link
          href="/settings"
          onClick={onClose}
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

// Keep navItems export for legacy references
export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/bag', label: 'Equipment', icon: ShoppingBag },
  { href: '/sessions', label: 'Sessions', icon: Activity },
  { href: '/sessions/import', label: 'Import Data', icon: Upload },
  { href: '/diagnose', label: 'Diagnose', icon: Target },
  { href: '/training', label: 'Training', icon: Dumbbell },
  { href: '/practice', label: 'Practice Schedule', icon: CalendarDays },
  { href: '/pre-round', label: 'Pre-Round', icon: Sun },
  { href: '/video', label: 'Video Analysis', icon: Video },
  { href: '/drills', label: 'Drill Library', icon: BookOpen },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/milestones', label: 'Milestones', icon: Trophy },
  { href: '/compare', label: 'Compare Sessions', icon: GitCompareArrows },
  { href: '/ai-coach', label: 'AI Coach', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: FileText },
];
