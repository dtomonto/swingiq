'use client';

// SwingVantage Academy — top navigation.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin/academy', label: 'Home', exact: true },
  { href: '/admin/academy/dashboard', label: 'My Learning' },
  { href: '/admin/academy/catalog', label: 'Catalog' },
  { href: '/admin/academy/badges', label: 'Badges' },
  { href: '/admin/academy/certifications', label: 'Certifications' },
  { href: '/admin/academy/advisor', label: 'Advisor' },
  { href: '/admin/academy/cms', label: 'CMS' },
];

export function AcademyNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/admin/academy" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">SV</span>
          <span className="font-bold text-foreground">Academy</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 transition-colors',
                  active ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
