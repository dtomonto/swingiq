'use client';

// Sub-navigation for the First-Party Intelligence OS. Tab strip shared by every
// OS page so the sections (Overview, AI Activity, Knowledge, …) stay one click
// apart. Mobile-friendly: horizontally scrollable, no wrap-crush.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS: Array<{ href: string; label: string }> = [
  { href: '/admin/intelligence-os', label: 'Overview' },
  { href: '/admin/intelligence-os/ai-activity', label: 'AI Activity' },
  { href: '/admin/intelligence-os/knowledge', label: 'Knowledge' },
  { href: '/admin/intelligence-os/canonical-answers', label: 'Canonical' },
  { href: '/admin/intelligence-os/patterns', label: 'Patterns' },
  { href: '/admin/intelligence-os/tasks', label: 'Tasks' },
  { href: '/admin/intelligence-os/token-savings', label: 'Token Savings' },
  { href: '/admin/intelligence-os/settings', label: 'Settings' },
];

export function IntelNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-5 -mx-1 overflow-x-auto" aria-label="Intelligence OS sections">
      <ul className="flex min-w-max items-center gap-1 px-1 text-sm">
        {TABS.map((t) => {
          const active = t.href === '/admin/intelligence-os'
            ? pathname === t.href
            : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-link ring-1 ring-primary/30'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
