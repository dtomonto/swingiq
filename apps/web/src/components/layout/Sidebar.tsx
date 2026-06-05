'use client';

import { useState } from 'react';
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
  Users,
  Database,
  Award,
  Package,
  Compass,
  RotateCcw,
  ChevronDown,
  BarChart3,
  PersonStanding,
  Sparkles,
  Route,
  FlaskConical,
  GraduationCap,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react';
import { SportPillDropdown } from '@/components/sport/SportSelector';
import { useSport } from '@/contexts/SportContext';
import { useSwingVantageStore } from '@/store';
import { LanguageToggle } from '@/components/language/LanguageToggle';
import { ContextualHelpButton } from '@/components/tutorial/ContextualHelpButton';

interface SidebarProps {
  onClose?: () => void;
}

// A single navigable link.
interface NavLeaf {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show the practice-streak flame indicator on this row. */
  showStreak?: boolean;
}

// A journey bucket. If it has children it is expandable; the header still
// links to `href` (the bucket's home page).
interface NavSection extends NavLeaf {
  children?: NavLeaf[];
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { training } = useSwingVantageStore();
  const { activeSport, sportEmoji, sportTagline, sportLabels, isGolf } = useSport();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // ── The core journey: one clear path, not a feature inventory. ──
  // Today → Analyze → Practice → Progress → Share. Advanced tools live as
  // children that reveal on demand (progressive disclosure).
  const journey: NavSection[] = [
    { href: '/dashboard', label: 'Today', icon: LayoutDashboard },
    {
      href: '/diagnose',
      label: 'Analyze',
      icon: Target,
      children: [
        { href: '/diagnose', label: isGolf ? 'Diagnose' : 'Analyze Swing', icon: Target },
        { href: '/motion-lab', label: 'Motion Lab (3D)', icon: FlaskConical },
        { href: '/agi', label: 'Athlete GI', icon: BrainCircuit },
        { href: '/coach', label: 'Coach & Team', icon: Users },
        { href: '/video', label: 'Video Analysis', icon: Video },
        { href: '/avatar', label: '3D Swing Avatar', icon: PersonStanding },
        { href: '/ai-coach', label: 'AI Coach', icon: MessageSquare },
        { href: '/sessions/import', label: isGolf ? 'Import Data' : 'Log Session', icon: Upload },
      ],
    },
    {
      href: '/training',
      label: 'Practice',
      icon: Dumbbell,
      children: [
        { href: '/training', label: 'Training', icon: Dumbbell, showStreak: true },
        { href: '/fix', label: 'Fix Stack', icon: Sparkles },
        { href: '/drills', label: isGolf ? 'Drill Library' : 'Drills', icon: BookOpen },
        { href: '/practice', label: 'Practice Schedule', icon: CalendarDays },
        { href: '/pre-round', label: isGolf ? 'Pre-Round' : 'Pre-Game Warm-Up', icon: Sun },
      ],
    },
    {
      href: '/progress',
      label: 'Progress',
      icon: TrendingUp,
      children: [
        { href: '/progress', label: 'Progress', icon: TrendingUp },
        { href: '/arc', label: 'Player Arc', icon: Route },
        { href: '/sessions', label: sportLabels.sessions, icon: Activity },
        { href: '/retest', label: 'Retest', icon: RotateCcw },
        { href: '/milestones', label: 'Milestones', icon: Trophy },
        { href: '/labs', label: 'SwingVantage Labs', icon: FlaskConical },
        { href: '/compare', label: 'Compare & References', icon: GitCompareArrows },
        { href: '/benchmarks', label: 'Benchmarks', icon: BarChart3 },
      ],
    },
    { href: '/reports', label: 'Share & Coach', icon: FileText },
  ];

  const accountItems: NavLeaf[] = [
    { href: '/profile', label: sportLabels.profile_short, icon: User },
    {
      href: isGolf ? '/equipment/golf' : '/equipment',
      label: isGolf ? 'Equipment' : sportLabels.equipment_short,
      icon: isGolf ? ShoppingBag : Package,
    },
  ];

  const communityItems: NavLeaf[] = [
    { href: '/community', label: 'Community', icon: Users },
    { href: '/community/badges', label: 'Badges', icon: Award },
    { href: '/data', label: 'Data Center', icon: Database },
  ];

  // A journey section starts expanded when the user is somewhere inside it,
  // so the active tool is always visible without manual digging.
  const initialExpanded = () => {
    const set = new Set<string>();
    for (const s of journey) {
      if (s.children && (isActive(s.href) || s.children.some((c) => isActive(c.href)))) {
        set.add(s.href);
      }
    }
    return set;
  };
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  const toggle = (href: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });

  // Sport accent colors for active state
  const accentColors: Record<string, string> = {
    golf: 'bg-green-700',
    tennis: 'bg-yellow-600',
    baseball: 'bg-red-700',
    softball_slow: 'bg-orange-600',
    softball_fast: 'bg-pink-600',
  };
  const activeClass = accentColors[activeSport] ?? 'bg-green-700';

  const rowClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
      active ? `${activeClass} text-white` : 'text-foreground/75 hover:bg-muted hover:text-foreground',
    );

  const streakBadge = (
    <span
      className="flex items-center gap-0.5 text-xs text-warning"
      aria-label={`${training.streak_days} day streak`}
    >
      <Flame size={11} aria-hidden="true" />
      {training.streak_days}
    </span>
  );

  return (
    <aside className="w-64 bg-secondary text-secondary-foreground border-r border-border flex flex-col h-full">
      {/* Logo + close button (close only visible on mobile) */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-golf-fairway rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">SV</span>
          </div>
          <div>
            <span className="text-foreground font-bold text-lg">SwingVantage</span>
            <p className="text-primary text-xs flex items-center gap-1">
              <span>{sportEmoji}</span>
              <span>{sportTagline}</span>
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-muted-foreground hover:text-foreground p-1 rounded-sm transition-colors lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {/* New-user on-ramp */}
        <Link href="/start" onClick={onClose} className={rowClass(isActive('/start'))}>
          <Compass size={18} className="shrink-0" aria-hidden="true" />
          <span className="flex-1">Start Here</span>
        </Link>

        {/* Video tutorials — guided learning for every kind of user */}
        <Link href="/tutorial" onClick={onClose} className={rowClass(isActive('/tutorial'))}>
          <GraduationCap size={18} className="shrink-0" aria-hidden="true" />
          <span className="flex-1">Tutorials</span>
        </Link>

        {/* Journey */}
        <p className="text-xs text-muted-foreground font-medium px-3 pt-3 pb-1 uppercase tracking-wide">
          Your Journey
        </p>
        {journey.map((section) => {
          const Icon = section.icon;
          const sectionActive = isActive(section.href);
          const isOpen = expanded.has(section.href);
          const hasChildren = !!section.children?.length;

          return (
            <div key={section.href}>
              <div className={cn('flex items-center', rowClass(sectionActive), 'pr-1')}>
                <Link
                  href={section.href}
                  onClick={onClose}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <Icon size={18} className="shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{section.label}</span>
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggle(section.href)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${section.label}`}
                    className="shrink-0 p-1 rounded-md hover:bg-black/10"
                  >
                    <ChevronDown
                      size={15}
                      aria-hidden="true"
                      className={cn('transition-transform', isOpen ? 'rotate-180' : '')}
                    />
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <div className="mt-1 mb-1 ms-4 ps-2 border-s border-border space-y-1">
                  {section.children!.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={rowClass(isActive(child.href))}
                      >
                        <ChildIcon size={16} className="shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{child.label}</span>
                        {child.showStreak && training.streak_days > 1 && streakBadge}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Account */}
        <p className="text-xs text-muted-foreground font-medium px-3 pt-3 pb-1 uppercase tracking-wide">
          Account
        </p>
        {accountItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onClose} className={rowClass(isActive(href))}>
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">{label}</span>
          </Link>
        ))}

        {/* Community */}
        <p className="text-xs text-muted-foreground font-medium px-3 pt-3 pb-1 uppercase tracking-wide">
          Community
        </p>
        {communityItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onClose} className={rowClass(isActive(href))}>
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Sport Switcher */}
      <div className="px-3 pb-3">
        <p className="text-xs text-muted-foreground font-medium mb-1.5 px-1">Active Sport</p>
        <SportPillDropdown onClose={onClose} />
        <Link
          href="/sports"
          onClick={onClose}
          className="mt-1.5 block px-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          View all sports →
        </Link>
      </div>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        {/* Language toggle */}
        <div className="px-1 pb-1">
          <LanguageToggle variant="sidebar" onClose={onClose} />
        </div>
        {/* Help guide button */}
        <div className="px-1 pb-1">
          <ContextualHelpButton
            variant="inline"
            className="w-full justify-start gap-3 px-2 py-2 text-foreground/75 bg-transparent border-transparent hover:bg-muted hover:text-foreground"
          />
        </div>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/75 hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings size={18} aria-hidden="true" />
          Settings
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/75 hover:bg-error/15 hover:text-error transition-colors">
          <LogOut size={18} aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
