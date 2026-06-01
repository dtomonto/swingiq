import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { breadcrumbListSchema, buildGraph, type Breadcrumb } from '@/lib/seo/jsonLd';
import { JsonLd } from './JsonLd';

/**
 * Accessible breadcrumb trail with matching BreadcrumbList JSON-LD.
 * Pass an ordered list from the site root to the current page.
 * The last item is rendered as the current page (no link).
 */
export function Breadcrumbs({
  items,
  className = '',
}: {
  items: Breadcrumb[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1">
                {isLast ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="hover:text-primary hover:underline">
                      {item.name}
                    </Link>
                    <ChevronRight size={14} className="text-muted-foreground" aria-hidden="true" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={buildGraph(breadcrumbListSchema(items))} />
    </>
  );
}
