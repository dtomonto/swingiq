// HealthTabs — the shared tab strip that turns the four operational surfaces
// (System Health, Reliability, QA, Data Quality) plus the overview into one
// Product Health section. Server-safe. Each tab is a real route, so deep links
// and the back button keep working; the strip just makes them feel like one.

import Link from 'next/link';

export type HealthTab = 'overview' | 'services' | 'reliability' | 'qa' | 'data';

const TABS: { key: HealthTab; label: string; href: string }[] = [
  { key: 'overview', label: 'Overview', href: '/admin/health' },
  { key: 'services', label: 'System Health', href: '/admin/system-health' },
  { key: 'reliability', label: 'Reliability', href: '/admin/reliability' },
  { key: 'qa', label: 'QA & Testing', href: '/admin/qa' },
  { key: 'data', label: 'Data Quality', href: '/admin/data-quality' },
];

export function HealthTabs({ active }: { active: HealthTab }) {
  return (
    <nav aria-label="Product Health" className="-mt-2 flex flex-wrap gap-1 overflow-x-auto border-b border-border">
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              on ? 'border-primary text-link' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
