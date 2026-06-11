'use client';

// Breadcrumbs — derived from the pathname, labelled via the nav model
// where possible and otherwise titleized.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/admin/nav';
import { titleize } from '@/lib/admin/format';

function labelFor(href: string, segment: string): string {
  const item = NAV_ITEMS.find((i) => i.href === href);
  if (item) return item.label;
  if (segment === 'admin') return 'Admin';
  return titleize(segment);
}

export function Breadcrumbs() {
  const pathname = usePathname() || '/admin';
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    return { href, label: labelFor(href, seg), isLast: i === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-1">
          {c.isLast ? (
            <span className="text-foreground">{c.label}</span>
          ) : (
            <>
              <Link href={c.href} className="hover:text-foreground">
                {c.label}
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            </>
          )}
        </span>
      ))}
    </nav>
  );
}
