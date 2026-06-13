'use client';

// Sub-navigation tabs shared across the Intelligence OS pages.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/intelligence-os', label: 'Overview' },
  { href: '/admin/intelligence-os/ai-activity', label: 'AI Activity' },
  { href: '/admin/intelligence-os/knowledge', label: 'Knowledge' },
  { href: '/admin/intelligence-os/canonical-answers', label: 'Canonical Answers' },
  { href: '/admin/intelligence-os/patterns', label: 'Patterns' },
  { href: '/admin/intelligence-os/tasks', label: 'Tasks' },
  { href: '/admin/intelligence-os/token-savings', label: 'Token Savings' },
  { href: '/admin/intelligence-os/evaluations', label: 'Evaluations' },
  { href: '/admin/intelligence-os/settings', label: 'Settings' },
];

export function IntelligenceTabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-1.5 border-b border-border pb-3" aria-label="Intelligence OS sections">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-primary/10 text-link' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
